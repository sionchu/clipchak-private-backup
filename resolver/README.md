# ClipChak direct-only resolver

이 서비스는 공개 게시물 HTML과 추출기 메타데이터만 읽고, 영상·사진 본문은 다운로드하지 않습니다. 결과도 원본 플랫폼/CDN의 HTTP(S) URL만 반환합니다.

- yt-dlp: `--dump-single-json --skip-download`
- gallery-dl: `--resolve-urls` (다운로드 대신 URL 출력)
- 공개 HTML: Open Graph 미디어 주소를 최대 1MB까지만 읽어 보조 추출
- 허용 도메인: YouTube, TikTok, Threads, LinkedIn, Instagram
- 비공개/로그인/쿠키 입력 및 파일 프록시: 지원하지 않음

## 환경 변수

- `RESOLVER_TOKEN`: 필수. ClipChak API와 공유하는 임의의 긴 비밀값
- `RATE_LIMIT_MAX`: 기본 60회
- `RATE_LIMIT_WINDOW`: 기본 60초
- `PORT`: 기본 10000

ClipChak에는 다음을 설정합니다.

```text
MEDIA_RESOLVER_DRIVER=generic
MEDIA_RESOLVER_ENDPOINT=https://<resolver-host>/
MEDIA_RESOLVER_TOKEN=<RESOLVER_TOKEN과 같은 값>
MEDIA_RESOLVER_AUTH_SCHEME=Bearer
```

직접 주소가 없거나 오디오/영상 병합에 서버 중계가 필요한 결과는 404 또는 빈 항목으로 끝납니다. 이는 비용 방어를 위한 의도된 동작입니다.

yt-dlp는 Unlicense, gallery-dl은 GPL-2.0 라이선스로 배포됩니다. 각 프로젝트의 라이선스와 플랫폼 이용약관을 함께 준수해야 합니다.
