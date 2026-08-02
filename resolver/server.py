from __future__ import annotations

import hmac
import html
import json
import os
import subprocess
import sys
import threading
import time
from collections import deque
from html.parser import HTMLParser
from urllib.error import HTTPError, URLError
from urllib.parse import unquote, urljoin, urlparse
from urllib.request import HTTPRedirectHandler, Request, build_opener

from flask import Flask, jsonify, request


app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 4096

ALLOWED_DOMAINS = {
    "tiktok.com": "tiktok",
    "threads.com": "threads",
    "threads.net": "threads",
    "linkedin.com": "linkedin",
    "lnkd.in": "linkedin",
    "instagram.com": "instagram",
    "x.com": "x",
    "twitter.com": "x",
    "t.co": "x",
    "facebook.com": "facebook",
    "fb.watch": "facebook",
    "reddit.com": "reddit",
    "redd.it": "reddit",
    "v.redd.it": "reddit",
    "pinterest.com": "pinterest",
    "pin.it": "pinterest",
    "tv.naver.com": "naver",
    "vimeo.com": "vimeo",
    "dailymotion.com": "dailymotion",
    "dai.ly": "dailymotion",
    "twitch.tv": "twitch",
    "bsky.app": "bluesky",
}
GALLERY_PLATFORMS = {"tiktok", "threads", "instagram", "x", "facebook", "reddit", "pinterest", "bluesky"}
VIDEO_EXTENSIONS = {"mp4", "webm", "mov", "m4v"}
IMAGE_EXTENSIONS = {"jpg", "jpeg", "png", "webp", "gif", "avif"}
BLOCKED_RESULT_SEGMENTS = {"tunnel", "proxy"}
MAX_ITEMS = 30
PROCESS_TIMEOUT_SECONDS = 18
rate_window: deque[float] = deque()
rate_lock = threading.Lock()


def platform_for_url(value: str) -> str | None:
    try:
        parsed = urlparse(value)
    except ValueError:
        return None
    hostname = (parsed.hostname or "").lower().rstrip(".")
    try:
        invalid_port = parsed.port not in {None, 80, 443}
    except ValueError:
        return None
    if parsed.scheme not in {"http", "https"} or not hostname or parsed.username or parsed.password or invalid_port:
        return None
    for domain, platform in ALLOWED_DOMAINS.items():
        if hostname == domain or hostname.endswith(f".{domain}"):
            return platform
    return None


def direct_result_url(value: str) -> bool:
    try:
        parsed = urlparse(value)
    except ValueError:
        return False
    if parsed.scheme not in {"http", "https"} or not parsed.hostname:
        return False
    try:
        path = unquote(parsed.path)
    except ValueError:
        return False
    segments = {segment.lower() for segment in path.split("/") if segment}
    return not segments.intersection(BLOCKED_RESULT_SEGMENTS)


def extension_of(value: str) -> str:
    name = urlparse(value).path.rsplit("/", 1)[-1]
    if "." not in name:
        return ""
    return name.rsplit(".", 1)[-1].lower()


def media_kind(value: str, default: str = "video") -> str:
    parsed = urlparse(value)
    query = parsed.query.lower()
    path = parsed.path.lower()
    if "mime_type=video" in query or "/video/" in path:
        return "video"
    if "mime_type=audio" in query or "/audio/" in path:
        return "audio"
    extension = extension_of(value)
    if extension in IMAGE_EXTENSIONS:
        return "image"
    if extension in VIDEO_EXTENSIONS:
        return "video"
    return default


def run_command(arguments: list[str]) -> subprocess.CompletedProcess[str] | None:
    try:
        return subprocess.run(
            arguments,
            capture_output=True,
            check=False,
            text=True,
            timeout=PROCESS_TIMEOUT_SECONDS,
            env={**os.environ, "PYTHONIOENCODING": "utf-8"},
        )
    except (OSError, subprocess.TimeoutExpired):
        return None


def tool_failure_code(completed: subprocess.CompletedProcess[str] | None) -> str:
    if completed is None:
        return "extractor_timeout"
    detail = f"{completed.stderr}\n{completed.stdout}".lower()
    if any(message in detail for message in (
        "sign in to confirm you're not a bot",
        "sign in to confirm you’re not a bot",
        "upstream verification required",
        "po token",
        "ip address is blocked",
        "automated requests",
    )):
        return "upstream_verification_required"
    if any(message in detail for message in (
        "instagram sent an empty media response",
        "redirect to login page",
        "login required",
        "cookies for the authentication",
    )):
        return "upstream_auth_required"
    if any(message in detail for message in (
        "video unavailable",
        "this video is unavailable",
        "private video",
        "content is not available",
    )):
        return "media_unavailable"
    return "extractor_failed"


def log_tool_failure(tool: str, completed: subprocess.CompletedProcess[str] | None, source_url: str) -> None:
    if completed is None:
        print(f"{tool} failed: unavailable or timed out", file=sys.stderr, flush=True)
        return
    detail = (completed.stderr or completed.stdout or "").replace(source_url, "[url]")
    if tool_failure_code(completed) == "upstream_verification_required":
        print(f"{tool} failed ({completed.returncode}): upstream verification required", file=sys.stderr, flush=True)
        return
    detail = " ".join(detail.split())[-1200:]
    print(f"{tool} failed ({completed.returncode}): {detail or 'no diagnostic output'}", file=sys.stderr, flush=True)


def gallery_items(source_url: str) -> list[dict[str, str]]:
    completed = run_command([
        sys.executable,
        "-m",
        "gallery_dl",
        "--resolve-urls",
        "--range",
        f"1-{MAX_ITEMS}",
        "--http-timeout",
        "8",
        "--retries",
        "1",
        "--no-input",
        "--no-colors",
        source_url,
    ])
    if not completed or completed.returncode != 0:
        log_tool_failure("gallery-dl", completed, source_url)
        return []

    items: list[dict[str, str]] = []
    seen: set[str] = set()
    for line in completed.stdout.splitlines():
        value = line.strip()
        if value in seen or not direct_result_url(value):
            continue
        kind = media_kind(value, "image")
        seen.add(value)
        items.append({
            "url": value,
            "label": f"{'사진' if kind == 'image' else '영상'} {len(items) + 1}",
            "kind": kind,
            "format": extension_of(value).upper() or None,
            "delivery": "direct",
        })
        if len(items) >= MAX_ITEMS:
            break
    return items


def yt_dlp_result(source_url: str) -> tuple[str | None, list[dict[str, object]], str | None]:
    completed = run_command([
        sys.executable,
        "-m",
        "yt_dlp",
        "--dump-single-json",
        "--skip-download",
        "--no-playlist",
        "--ignore-errors",
        "--socket-timeout",
        "8",
        "--extractor-retries",
        "1",
        "--retries",
        "1",
        source_url,
    ])
    if not completed:
        log_tool_failure("yt-dlp", completed, source_url)
        return None, [], tool_failure_code(completed)
    if len(completed.stdout) > 8_000_000:
        print("yt-dlp failed: metadata response too large", file=sys.stderr, flush=True)
        return None, [], "metadata_too_large"
    try:
        data = json.loads(completed.stdout)
    except (json.JSONDecodeError, TypeError):
        if completed.returncode != 0:
            log_tool_failure("yt-dlp", completed, source_url)
            return None, [], tool_failure_code(completed)
        return None, [], "invalid_extractor_response"
    if not isinstance(data, dict):
        if completed.returncode != 0:
            log_tool_failure("yt-dlp", completed, source_url)
            return None, [], tool_failure_code(completed)
        return None, [], "invalid_extractor_response"

    entries = [entry for entry in (data.get("entries") or [data]) if isinstance(entry, dict)]
    title = data.get("title") if isinstance(data.get("title"), str) else None
    items: list[dict[str, object]] = []
    seen: set[str] = set()
    for entry in entries[:MAX_ITEMS]:
        candidates = video_candidates(entry)
        for candidate in choose_qualities(candidates):
            value = candidate.get("url")
            if not isinstance(value, str) or value in seen or not direct_result_url(value):
                continue
            height = safe_int(candidate.get("height"))
            width = safe_int(candidate.get("width"))
            fps = safe_float(candidate.get("fps"))
            duration = safe_float(candidate.get("duration")) or safe_float(entry.get("duration"))
            extension = str(candidate.get("ext") or extension_of(value) or "").upper()
            quality = f"{height}p" if height else None
            has_audio = str(candidate.get("acodec") or "none").lower() != "none"
            file_size, approximate = candidate_file_size(candidate, duration)
            sound_label = "소리 있음" if has_audio else "소리 없음"
            seen.add(value)
            items.append({
                "url": value,
                "label": " · ".join(filter(None, [quality, extension, sound_label])) or f"영상 {len(items) + 1}",
                "kind": "video",
                "quality": quality,
                "format": extension or None,
                "width": width,
                "height": height,
                "fps": fps,
                "filesize": file_size,
                "filesizeApprox": approximate,
                "duration": duration,
                "hasAudio": has_audio,
                "videoCodec": clean_codec(candidate.get("vcodec")),
                "audioCodec": clean_codec(candidate.get("acodec")),
                "formatId": str(candidate.get("format_id") or "") or None,
                "delivery": "direct",
            })
            if len(items) >= MAX_ITEMS:
                return title, items, None

        audio = best_audio_candidate(entry)
        if audio:
            value = audio.get("url")
            if isinstance(value, str) and value not in seen and direct_result_url(value):
                extension = str(audio.get("ext") or extension_of(value) or "").upper()
                duration = safe_float(audio.get("duration")) or safe_float(entry.get("duration"))
                file_size, approximate = candidate_file_size(audio, duration)
                seen.add(value)
                items.append({
                    "url": value,
                    "label": f"오디오 원본 · {extension or 'AUDIO'}",
                    "kind": "audio",
                    "format": extension or None,
                    "filesize": file_size,
                    "filesizeApprox": approximate,
                    "duration": duration,
                    "hasAudio": True,
                    "audioCodec": clean_codec(audio.get("acodec")),
                    "formatId": str(audio.get("format_id") or "") or None,
                    "delivery": "direct",
                })
                if len(items) >= MAX_ITEMS:
                    return title, items, None
    if items:
        return title, items, None
    if completed.returncode != 0:
        log_tool_failure("yt-dlp", completed, source_url)
        return title, [], tool_failure_code(completed)
    return title, [], None


def safe_int(value: object) -> int | None:
    try:
        number = int(value)  # type: ignore[arg-type]
    except (TypeError, ValueError, OverflowError):
        return None
    return number if number > 0 else None


def safe_float(value: object) -> float | None:
    try:
        number = float(value)  # type: ignore[arg-type]
    except (TypeError, ValueError, OverflowError):
        return None
    return round(number, 2) if number > 0 else None


def clean_codec(value: object) -> str | None:
    codec = str(value or "").strip()
    return codec if codec and codec.lower() != "none" else None


def candidate_file_size(candidate: dict, duration: float | None) -> tuple[int | None, bool]:
    exact = safe_int(candidate.get("filesize"))
    if exact:
        return exact, False
    approximate = safe_int(candidate.get("filesize_approx"))
    if approximate:
        return approximate, True
    bitrate = safe_float(candidate.get("tbr"))
    if bitrate and duration:
        return int(bitrate * 1000 * duration / 8), True
    return None, True


def downloadable_format(item: dict) -> bool:
    value = str(item.get("url") or "")
    if not direct_result_url(value):
        return False
    protocol = str(item.get("protocol") or "").lower()
    return "m3u8" not in protocol and "dash" not in protocol


def video_candidates(entry: dict) -> list[dict]:
    formats = entry.get("formats") if isinstance(entry.get("formats"), list) else []
    candidates = []
    for item in formats:
        if not isinstance(item, dict) or not downloadable_format(item):
            continue
        if str(item.get("vcodec") or "none").lower() == "none":
            continue
        candidates.append(item)

    if not candidates and direct_result_url(str(entry.get("url") or "")):
        candidates.append(entry)
    return sorted(candidates, key=candidate_rank)


def candidate_rank(item: dict) -> tuple[int, int, int, float]:
    height = safe_int(item.get("height")) or 0
    has_audio = 1 if str(item.get("acodec") or "none").lower() != "none" else 0
    preferred_container = 1 if str(item.get("ext") or "").lower() in {"mp4", "m4v"} else 0
    bitrate = safe_float(item.get("tbr")) or 0
    return height, has_audio, preferred_container, bitrate


def best_audio_candidate(entry: dict) -> dict | None:
    formats = entry.get("formats") if isinstance(entry.get("formats"), list) else []
    candidates = [
        item for item in formats
        if isinstance(item, dict)
        and downloadable_format(item)
        and str(item.get("vcodec") or "none").lower() == "none"
        and str(item.get("acodec") or "none").lower() != "none"
    ]
    if not candidates:
        return None
    return max(candidates, key=lambda item: (
        1 if str(item.get("ext") or "").lower() in {"m4a", "mp4"} else 0,
        safe_float(item.get("abr")) or safe_float(item.get("tbr")) or 0,
    ))


def choose_qualities(candidates: list[dict]) -> list[dict]:
    if not candidates:
        return []
    chosen: list[dict] = []
    for target in (360, 480, 720, 1080, 1440, 2160):
        eligible = [item for item in candidates if (safe_int(item.get("height")) or 0) <= target]
        item = max(eligible or candidates[:1], key=candidate_rank)
        if item not in chosen:
            chosen.append(item)
    return chosen


class MetadataParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.title: str | None = None
        self.values: list[tuple[str, str]] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag.lower() != "meta":
            return
        attributes = {key.lower(): value for key, value in attrs if value}
        key = (attributes.get("property") or attributes.get("name") or "").lower()
        content = attributes.get("content")
        if not content:
            return
        if key in {"og:title", "twitter:title"} and not self.title:
            self.title = html.unescape(content).strip()
        if key in {"og:video", "og:video:url", "og:video:secure_url", "og:image", "og:image:url", "og:image:secure_url", "twitter:player:stream", "twitter:image"}:
            self.values.append((key, html.unescape(content).strip()))


class SafeRedirectHandler(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):  # noqa: ANN001
        if not platform_for_url(newurl):
            raise HTTPError(newurl, 403, "redirect blocked", headers, fp)
        return super().redirect_request(req, fp, code, msg, headers, newurl)


def metadata_items(source_url: str) -> tuple[str | None, list[dict[str, str]]]:
    opener = build_opener(SafeRedirectHandler())
    page_request = Request(source_url, headers={"User-Agent": "Mozilla/5.0 (compatible; ClipChak/1.0)"})
    try:
        with opener.open(page_request, timeout=8) as response:
            content_type = response.headers.get_content_type()
            if content_type not in {"text/html", "application/xhtml+xml"}:
                return None, []
            payload = response.read(1_000_001)
            if len(payload) > 1_000_000:
                return None, []
            charset = response.headers.get_content_charset() or "utf-8"
            document = payload.decode(charset, errors="replace")
    except (HTTPError, URLError, TimeoutError, ValueError):
        return None, []

    parser = MetadataParser()
    parser.feed(document)
    items: list[dict[str, str]] = []
    seen: set[str] = set()
    for key, raw_value in parser.values:
        value = urljoin(source_url, raw_value)
        if value in seen or not direct_result_url(value):
            continue
        kind = "video" if "video" in key or "player:stream" in key else "image"
        seen.add(value)
        items.append({
            "url": value,
            "label": f"{'영상' if kind == 'video' else '사진'} {len(items) + 1}",
            "kind": kind,
            "format": extension_of(value).upper() or None,
            "delivery": "direct",
        })
        if len(items) >= MAX_ITEMS:
            break
    return parser.title, items


def rate_limit_available() -> bool:
    maximum = max(1, int(os.environ.get("RATE_LIMIT_MAX", "60")))
    window = max(1, int(os.environ.get("RATE_LIMIT_WINDOW", "60")))
    now = time.monotonic()
    with rate_lock:
        while rate_window and rate_window[0] <= now - window:
            rate_window.popleft()
        if len(rate_window) >= maximum:
            return False
        rate_window.append(now)
    return True


def authorized() -> bool:
    expected = os.environ.get("RESOLVER_TOKEN", "")
    supplied = request.headers.get("Authorization", "")
    return bool(expected) and hmac.compare_digest(supplied, f"Bearer {expected}")


@app.after_request
def secure_headers(response):  # noqa: ANN001
    response.headers["Cache-Control"] = "no-store"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Resolver-Mode"] = "direct-metadata-only"
    return response


@app.get("/health")
def health():
    return jsonify({"ok": True, "mode": "direct-metadata-only", "platforms": sorted(set(ALLOWED_DOMAINS.values()))})


@app.post("/")
def resolve():
    if not authorized():
        return jsonify({"message": "unauthorized"}), 401
    if not rate_limit_available():
        return jsonify({"message": "rate limit exceeded"}), 429

    payload = request.get_json(silent=True) or {}
    source_url = str(payload.get("url") or "").strip()
    if len(source_url) > 2048:
        return jsonify({"message": "invalid url"}), 400
    platform = platform_for_url(source_url)
    if not platform:
        return jsonify({"message": "unsupported url"}), 400

    title: str | None = None
    items: list[dict[str, object]] = []
    extractor_error: str | None = None
    if platform in GALLERY_PLATFORMS:
        items = gallery_items(source_url)
    if not items:
        title, items, extractor_error = yt_dlp_result(source_url)
    if not items:
        metadata_title, items = metadata_items(source_url)
        title = title or metadata_title
    if not items:
        status = 422 if extractor_error in {"upstream_verification_required", "upstream_auth_required"} else 404
        return jsonify({
            "title": title,
            "code": extractor_error or "direct_media_unavailable",
            "message": "direct media url unavailable",
            "items": [],
        }), status

    return jsonify({
        "title": title or "공개 게시물 미디어",
        "message": "원본/CDN 직접 주소만 반환했습니다.",
        "items": items[:MAX_ITEMS],
    })


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", "10000")))
