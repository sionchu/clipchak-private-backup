# ClipChak hybrid media resolver

기본적으로 공개 게시물 HTML과 추출기 메타데이터만 읽고 원본 플랫폼/CDN 주소를 반환합니다. 단, 원격 서버에서 얻은 CDN URL이 다른 IP에서 403을 내는 YouTube·Shorts만 서명된 10분짜리 저장 링크로 제한 중계합니다.

- yt-dlp: `--dump-single-json --skip-download`
- gallery-dl: `--resolve-urls` (다운로드 대신 URL 출력)
- 공개 HTML: Open Graph 미디어 주소를 최대 1MB까지만 읽어 보조 추출
- 허용 도메인: YouTube, TikTok, Threads, LinkedIn, Instagram
- YouTube 제한 중계: 최대 720p, 10분, 150MB, 동시 1건
- 비공개/로그인/쿠키 입력: 지원하지 않음

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

YouTube 외 플랫폼은 직접 주소가 없거나 서버 중계가 필요하면 404 또는 빈 항목으로 끝납니다. YouTube 저장 링크는 HMAC 서명과 만료 시간으로 보호하며 원본 파일을 장기 보관하지 않습니다.

yt-dlp는 Unlicense, gallery-dl은 GPL-2.0 라이선스로 배포됩니다. 각 프로젝트의 라이선스와 플랫폼 이용약관을 함께 준수해야 합니다.
