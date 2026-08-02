import os
import subprocess
import time
import unittest

os.environ.setdefault("RESOLVER_TOKEN", "test-resolver-token-with-enough-entropy")

from server import (  # noqa: E402
    app,
    decode_ticket,
    encode_ticket,
    media_kind,
    platform_for_url,
    tool_failure_code,
    youtube_relay_items,
)


class ResolverSecurityTests(unittest.TestCase):
    def test_platform_allowlist(self):
        self.assertEqual(platform_for_url("https://www.youtube.com/shorts/abc"), "youtube")
        self.assertIsNone(platform_for_url("https://youtube.com.attacker.example/watch?v=abc"))
        self.assertIsNone(platform_for_url("file:///etc/passwd"))

    def test_ticket_signature_and_expiry(self):
        ticket = encode_ticket({"url": "https://youtu.be/abc", "height": 720, "exp": int(time.time()) + 60})
        self.assertEqual(decode_ticket(ticket)["height"], 720)
        payload, signature = ticket.split(".", 1)
        tampered_signature = ("A" if signature[0] != "A" else "B") + signature[1:]
        self.assertIsNone(decode_ticket(f"{payload}.{tampered_signature}"))
        expired = encode_ticket({"url": "https://youtu.be/abc", "height": 360, "exp": int(time.time()) - 1})
        self.assertIsNone(decode_ticket(expired))

    def test_youtube_items_are_capped_and_signed(self):
        source = "https://www.youtube.com/shorts/abc"
        items = [
            {"kind": "video", "height": 360, "filesize": 1_000_000, "hasAudio": True},
            {"kind": "video", "height": 1080, "filesize": 8_000_000, "hasAudio": False},
            {"kind": "audio", "filesize": 700_000, "hasAudio": True},
        ]
        with app.test_request_context("/", base_url="https://resolver.example"):
            output = youtube_relay_items(source, items)
        self.assertEqual([item["height"] for item in output], [360, 720])
        self.assertTrue(all(item["delivery"] == "resolver" for item in output))
        self.assertTrue(all(item["hasAudio"] is True for item in output))
        self.assertTrue(all(str(item["url"]).startswith("https://resolver.example/download?ticket=") for item in output))

    def test_tiktok_signed_video_url_is_not_misclassified_as_photo(self):
        url = "https://v16-webapp-prime.tiktok.com/video/tos/file/?mime_type=video_mp4&signature=test"
        self.assertEqual(media_kind(url, "image"), "video")

    def test_known_upstream_failures_have_actionable_codes(self):
        youtube = subprocess.CompletedProcess([], 1, "", "Sign in to confirm you're not a bot")
        instagram = subprocess.CompletedProcess([], 1, "", "Instagram sent an empty media response")
        unavailable = subprocess.CompletedProcess([], 1, "", "ERROR: Video unavailable")
        self.assertEqual(tool_failure_code(youtube), "upstream_verification_required")
        self.assertEqual(tool_failure_code(instagram), "upstream_auth_required")
        self.assertEqual(tool_failure_code(unavailable), "media_unavailable")


if __name__ == "__main__":
    unittest.main()
