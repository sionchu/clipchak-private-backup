# 클립착

공개 게시물 URL에서 영상·사진 저장 옵션을 확인하는 한국어 웹 도구입니다. 웹 UI는 OpenAI Sites에서 실행하고, 별도 분석 서비스는 원본 플랫폼/CDN 주소만 반환합니다. 실제 미디어 바이트는 클립착 서버를 통과하지 않습니다.

## 지원 플랫폼

- TikTok, Instagram, Threads, LinkedIn
- X, Facebook, Reddit, Pinterest, Bluesky
- 네이버TV, Vimeo, Dailymotion, Twitch 공개 클립

공개 게시물이라도 플랫폼의 로그인 요구, 지역·연령 제한, 저장 금지 설정, 일시적인 차단 또는 원본 주소 정책에 따라 결과가 없을 수 있습니다.

## 개발

```bash
pnpm install
pnpm dev
pnpm test
```

## 분석 서버

`resolver/`는 yt-dlp와 gallery-dl을 메타데이터 전용으로 사용합니다. `/download`, `/proxy`, `/tunnel` 같은 미디어 중계 경로는 제공하지 않습니다.

환경 변수:

- `MEDIA_RESOLVER_ENDPOINT`: 분석 서버 POST 주소
- `MEDIA_RESOLVER_TOKEN`: Bearer 인증 토큰
- `MEDIA_RESOLVER_DRIVER`: 기본값 `generic`
- `NEXT_PUBLIC_SITE_URL`: 운영 사이트 주소

요청에는 `mode: "metadata-only"`, `allowProxy: false`, `media: ["video", "image"]`가 포함됩니다. API는 `delivery: "direct"` 결과만 브라우저에 전달합니다.

## 운영 원칙

- 로그인 없는 공개 게시물만 분석
- 본인 소유 또는 저장 허가 콘텐츠만 이용
- 미디어 파일 저장·중계 없음
- 허용 도메인 화이트리스트와 리다이렉트 검증
- API 인증, 요청 제한, 응답 개수·시간 제한

자세한 내용은 `docs/MEDIA-RESOLVER.md`와 `docs/HOSTING-PORTABILITY-AND-ADS.md`를 참고하세요.
