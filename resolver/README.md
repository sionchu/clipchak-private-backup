# ClipChak direct-media resolver

공개 게시물에서 원본 플랫폼/CDN 주소만 찾아 반환하는 메타데이터 서비스입니다. 영상·사진 파일을 저장하거나 사용자에게 중계하지 않습니다.

## 특징

- 운영 검증을 통과한 8개 플랫폼 키와 허용 도메인 화이트리스트
- yt-dlp + gallery-dl + Open Graph 순차 분석
- Bearer 인증과 메모리 기반 요청 제한
- 최대 30개 결과, 짧은 프로세스 타임아웃
- 프록시·터널·다운로드 엔드포인트 없음

## 실행

```bash
pip install -r requirements.txt
set RESOLVER_TOKEN=충분히-긴-임의-문자열
python server.py
```

상태 확인은 `GET /health`, 분석은 Bearer 인증이 포함된 `POST /` 요청을 사용합니다.

```json
{
  "url": "https://www.instagram.com/reel/example",
  "platform": "instagram",
  "media": ["video", "image"],
  "mode": "metadata-only",
  "allowProxy": false
}
```

직접 주소를 제공하지 않거나 인증이 필요한 게시물은 오류 코드 또는 빈 결과로 끝납니다.
