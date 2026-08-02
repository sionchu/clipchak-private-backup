import os
import subprocess
import unittest

os.environ.setdefault("RESOLVER_TOKEN", "test-resolver-token-with-enough-entropy")

from server import (  # noqa: E402
    app,
    media_kind,
    platform_for_url,
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
