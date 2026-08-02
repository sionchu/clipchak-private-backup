# 클립착

공개 게시물 URL에서 영상·사진 저장 옵션을 확인하는 한국어 웹 도구입니다. 웹 UI는 OpenAI Sites에서 실행하고, 외부 분석 서비스는 원본 URL 목록만 돌려주는 것을 기본으로 하되 YouTube·Shorts의 IP 제한에 한해 용량 제한 중계를 사용합니다.

## 로컬 실행

```bash
pnpm install --frozen-lockfile
pnpm dev
pnpm test
```

## 분석 API 연결

`.env.example`을 참고해 `MEDIA_RESOLVER_ENDPOINT`를 지정합니다. 기본 `generic` 드라이버의 응답 형식은 다음과 같습니다.

```json
{
  "title": "게시물 제목",
  "items": [
    {
      "url": "https://origin-cdn.example/photo.jpg",
      "label": "사진 1",
      "kind": "image",
      "format": "JPG",
      "delivery": "direct"
    }
  ]
}
```

요청에는 `mode: "metadata-only"`, `allowProxy: false`, `media: ["video", "image"]`가 포함됩니다. 클립착 API 자체는 미디어 본문을 내려받지 않습니다. 일반적인 `delivery: "resolver"`와 `/tunnel`·`/proxy` 경로는 제거하고, YouTube에만 분석 서버의 `/download` 경로와 서명된 티켓을 엄격하게 허용합니다.

저장소의 `resolver/`는 yt-dlp와 gallery-dl을 사용하는 자체 분석 서버입니다. Render 같은 별도 호스팅에 배포하고 `MEDIA_RESOLVER_DRIVER=generic`으로 연결할 수 있습니다. 일반 플랫폼은 만료 가능한 원본/CDN 주소만 반환하고, YouTube는 최대 720p·10분·150MB·동시 1건으로 오디오/영상을 합쳐 전달합니다.

self-hosted cobalt API를 연결할 때는 `MEDIA_RESOLVER_DRIVER=cobalt`로 설정할 수 있습니다. 공식 공개 cobalt API는 다른 프로젝트에서 임의로 사용하는 용도가 아니므로 반드시 자체 인스턴스 또는 사용 허가를 받은 인스턴스를 사용해야 합니다. cobalt가 `tunnel` 또는 `local-processing`을 반환하면 클립착은 성공 처리하지 않습니다.

자세한 구조와 오픈소스 검토는 [docs/MEDIA-RESOLVER.md](docs/MEDIA-RESOLVER.md)를 참고하세요.

## 운영 원칙

- 공개 게시물과 사용 권한이 있는 콘텐츠만 처리
- 비공개·로그인·유료 콘텐츠 및 보호장치 우회 금지
- 입력 URL과 결과 파일 장기 보관 금지
- 원본 직접 연결 우선, YouTube만 서명·시간·용량·동시성 제한 중계
- 플랫폼 약관이나 권리자의 다운로드 제한이 우선

## 배포

`.openai/hosting.json`의 Sites 프로젝트로 배포합니다. 실제 토큰은 저장소에 커밋하지 않고 배포 환경 변수에만 보관합니다.
