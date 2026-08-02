import os
import subprocess
import unittest
from unittest.mock import patch

os.environ.setdefault("RESOLVER_TOKEN", "test-resolver-token-with-enough-entropy")

from server import (  # noqa: E402
    app,
    media_kind,
    platform_for_url,
    threads_document_items,
    threads_result,
    tool_failure_code,
)


class ResolverSecurityTests(unittest.TestCase):
    def test_platform_allowlist(self):
        self.assertEqual(platform_for_url("https://x.com/owner/status/123"), "x")
        self.assertEqual(platform_for_url("https://tv.naver.com/v/123"), "naver")
        self.assertIsNone(platform_for_url("https://www.tiktok.com/@owner/video/123"))
        self.assertIsNone(platform_for_url("https://clips.twitch.tv/TestClip"))
        self.assertIsNone(platform_for_url("https://tiktok.com.attacker.example/watch/123"))
        self.assertIsNone(platform_for_url("https://www.youtube.com/shorts/abc"))
        self.assertIsNone(platform_for_url("file:///etc/passwd"))

    def test_health_reports_direct_only_platforms(self):
        response = app.test_client().get("/health")
        data = response.get_json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(data["mode"], "direct-metadata-only")
        self.assertNotIn("youtube", data["platforms"])
        self.assertIn("instagram", data["platforms"])
        self.assertIn("naver", data["platforms"])

    def test_tiktok_signed_video_url_is_not_misclassified_as_photo(self):
        url = "https://v16-webapp-prime.tiktok.com/video/tos/file/?mime_type=video_mp4&signature=test"
        self.assertEqual(media_kind(url, "image"), "video")

    def test_encoded_video_mime_is_not_misclassified_as_photo(self):
        url = "https://cdn.example/media?id=1&content_type=video%2Fmp4"
        self.assertEqual(media_kind(url, "image"), "video")

    def test_threads_structured_video_wins_over_poster_image(self):
        document = """
            <meta property="og:title" content="Threads test">
            <meta property="og:image" content="https://cdn.example/poster.jpg">
            <script type="application/json">
              {"result":{"data":{"media":{"code":"test","media_type":2,"original_width":720,"original_height":1280,"has_audio":true,"video_versions":[{"type":101,"url":"https://cdn.example/clip.mp4?mime=video%2Fmp4"}],"image_versions2":{"candidates":[{"url":"https://cdn.example/poster.jpg","width":720,"height":1280}]}}}}}
            </script>
        """
        title, items = threads_document_items("https://www.threads.net/@owner/post/test", document)
        self.assertEqual(title, "Threads test")
        self.assertEqual(len(items), 1)
        self.assertEqual(items[0]["kind"], "video")
        self.assertIn("clip.mp4", items[0]["url"])
        self.assertTrue(items[0]["hasAudio"])

    def test_threads_mixed_carousel_keeps_each_real_media_type(self):
        document = """
            <script type="application/json">
              {"media":{"code":"mixed","media_type":8,"carousel_media":[{"media_type":2,"video_versions":[{"url":"https://cdn.example/first.mp4"}],"image_versions2":{"candidates":[{"url":"https://cdn.example/first-poster.jpg","width":640,"height":360}]}},{"media_type":1,"image_versions2":{"candidates":[{"url":"https://cdn.example/second.jpg","width":1080,"height":1080}]}}]}}
            </script>
        """
        _, items = threads_document_items("https://www.threads.com/@owner/post/mixed", document)
        self.assertEqual([item["kind"] for item in items], ["video", "image"])
        self.assertNotIn("first-poster.jpg", [item["url"] for item in items])

    def test_threads_checks_extractor_before_accepting_image_fallback(self):
        poster = [{"url": "https://cdn.example/poster.jpg", "kind": "image"}]
        video = [{"url": "https://cdn.example/clip.mp4", "kind": "video"}]
        with (
            patch("server.browser_threads_items", return_value=(None, [])),
            patch("server.metadata_items", return_value=("Threads post", poster)),
            patch("server.yt_dlp_result", return_value=("Threads post", video, None)),
            patch("server.gallery_items") as gallery,
        ):
            title, items, error = threads_result("https://www.threads.net/@owner/post/test")
        self.assertEqual(title, "Threads post")
        self.assertEqual(items, video)
        self.assertIsNone(error)
        gallery.assert_not_called()

    def test_known_upstream_failures_have_actionable_codes(self):
        verification = subprocess.CompletedProcess([], 1, "", "upstream verification required")
        blocked_ip = subprocess.CompletedProcess([], 1, "", "Your IP address is blocked from accessing this post")
        instagram = subprocess.CompletedProcess([], 1, "", "Instagram sent an empty media response")
        unavailable = subprocess.CompletedProcess([], 1, "", "ERROR: Video unavailable")
        self.assertEqual(tool_failure_code(verification), "upstream_verification_required")
        self.assertEqual(tool_failure_code(blocked_ip), "upstream_verification_required")
        self.assertEqual(tool_failure_code(instagram), "upstream_auth_required")
        self.assertEqual(tool_failure_code(unavailable), "media_unavailable")


if __name__ == "__main__":
    unittest.main()
