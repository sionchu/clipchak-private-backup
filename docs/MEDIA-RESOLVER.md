# 미디어 분석 서버 운영안

## 데이터 경로

```text
사용자 URL → Sites API → 분석 서버(메타데이터만) → 원본/CDN URL
사용자 브라우저 → 원본 플랫폼/CDN → 사용자 기기
```

대용량 영상·사진 파일은 분석 서버와 Sites 호스팅을 통과하지 않는다. 서버는 URL 검증, 추출기 실행, 결과 정규화만 담당한다.

## 지원 방식

1. TikTok, Instagram, Threads, X, Facebook, Reddit, Pinterest, Bluesky는 gallery-dl을 먼저 시도한다.
2. 모든 지원 플랫폼에서 yt-dlp 메타데이터 추출을 시도한다.
3. 실패하면 허용 도메인 안에서 Open Graph 미디어 메타데이터를 확인한다.
4. 원본/CDN 직접 주소만 반환한다. 서버 중계가 필요한 결과는 버린다.

## 보안

- 입력 URL은 HTTP/HTTPS와 허용 도메인만 통과
- 비표준 포트, 사용자정보 포함 URL, 외부 도메인 리다이렉트 차단
- Bearer 토큰 인증과 요청 제한
- 결과 최대 30개, 메타데이터 8MB, HTML 1MB 제한
- `proxy`, `tunnel` 경로가 포함된 결과 차단
- 로그인 쿠키와 개인 계정 세션을 서버에 저장하지 않음

## 실패 의미

- `upstream_auth_required`: 로그인 또는 쿠키가 필요한 게시물
- `upstream_verification_required`: 플랫폼이 자동 분석을 일시 차단
- `media_unavailable`: 삭제·비공개·지역 제한 등으로 접근 불가
- `direct_media_unavailable`: 서버 중계 없이 열 수 있는 원본 주소 없음

지원 목록에 있는 플랫폼도 외부 사이트 변경으로 일시 실패할 수 있으므로, 배포 전과 정기 점검 때 공개 샘플 URL을 다시 검사한다.
