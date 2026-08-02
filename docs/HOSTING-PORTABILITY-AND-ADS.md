# 클립착 호스팅 이전·비용·광고 운영 기준

확인일: 2026-08-02

## 결론

초기에는 **Sites 화면 + 별도 분석 서버 + 원본 CDN 직접 전달**을 유지한다. 사진과 비유튜브 영상은 파일 바이트가 클립착 호스팅을 지나가지 않으므로 트래픽이 늘어도 비용 증가가 작다. YouTube처럼 서버 중계가 필요한 경로만 횟수·길이·용량을 제한하고, 실제 수요가 확인되면 Cloudflare Container/R2 실험 또는 사용자 기기에서 받는 확장 프로그램·앱으로 분리한다.

현재 코드의 이전 경계는 다음과 같다.

```text
브라우저 UI (Next.js)
    │ 같은 출처 POST /api/resolve
    ▼
호스팅의 API Route (주소 검증·응답 정규화·토큰 보호)
    │ MEDIA_RESOLVER_ENDPOINT / TOKEN
    ▼
교체 가능한 분석 서버 (Docker, yt-dlp, gallery-dl)
    │
    ├─ 사진·비유튜브 영상: 원본/CDN URL만 반환
    └─ YouTube 예외: 제한된 서명 중계 URL
```

사이트 화면은 분석 서버의 공급자 SDK를 사용하지 않는다. `/api/resolve`의 요청·응답 계약과 환경변수만 유지하면 Sites, Cloudflare, Vercel, Netlify, Render 사이에서 화면을 다시 만들지 않고 옮길 수 있다.

## 사진도 같은 원칙인가

그렇다. Instagram·Threads·TikTok 등의 공개 사진·캐러셀은 분석 서버가 원본 JPG/PNG 주소만 찾아서 반환하고, 브라우저가 플랫폼 CDN에서 직접 연다. 클립착이 사진 파일을 저장하거나 재전송하지 않는다.

다만 일반 모바일 웹에서는 다음 제약이 있다.

- 외부 출처 URL의 `download` 속성은 강제 저장을 보장하지 않는다.
- CDN이 CORS를 허용하지 않으면 브라우저에서 파일을 가져와 ZIP으로 묶을 수 없다.
- 여러 새 창을 동시에 여는 방식은 팝업 차단에 걸릴 수 있다.
- 서명된 CDN 주소는 일정 시간이 지나면 만료될 수 있다.

따라서 현재 제품은 여러 장 미리보기, 이전·다음 이동, 개별 원본 열기, 기기 공유, 전체 링크 복사를 제공한다. 진짜 일괄 저장은 추후 브라우저 확장 또는 모바일 앱에서 구현하는 것이 비용과 성공률 모두 낫다.

## 호스팅 선택 비교

가격은 공식 공개 가격의 대표 구간이며 환율·세금·지역·사용 패턴에 따라 달라질 수 있다.

| 선택지 | 공개 비용 구조 | 장점 | 클립착에서의 판단 |
| --- | --- | --- | --- |
| Sites 유지 | 현재 프로젝트 배포·버전 관리 사용. 프로젝트별 실제 청구는 계정 화면에서 확인 | 관리가 가장 적고 지금 코드와 배포가 일치 | 초기 화면·SEO 운영 1순위. 비용 데이터가 쌓일 때까지 유지 |
| Cloudflare Workers/Containers/R2 | Workers Paid 최소 $5/월. Containers 포함량 이후 한국 권역 egress $0.05/GB. R2 표준 저장 $0.015/GB-month, 인터넷 egress 무료 | 에지 API와 임시 객체 전달 비용이 유리 | 트래픽이 확인된 뒤 서버 중계 실험 1순위. YouTube 데이터센터 IP 차단은 별도 검증 필요 |
| Vercel | Hobby는 개인·비상업용. Pro $20/월부터, Fast Data Transfer 포함량 이후 과금 | Next.js 운영 경험이 가장 단순 | 상업 운영에는 Pro가 필요. UI/API에는 좋지만 대용량 중계용으로는 비추천 |
| Netlify | Free/Personal/Pro가 크레딧 기반이며 대역폭도 크레딧 차감 | 정적 사이트·일반 웹 배포가 편함 | 다운로드 트래픽이 예상보다 커지면 비용 예측이 어려워 우선순위 낮음 |
| Render | 새 Hobby는 5GB 포함 후 $0.15/GB, 무료 서비스는 유휴 시 중지 | 현재 Docker 분석 서버를 가장 쉽게 유지 | 분석·시험용으로 적합. 미디어 바이트 중계가 커지면 손익 악화 |
| Railway | 기본 요금과 사용량 과금, 네트워크 egress $0.05/GB | Docker 이전이 쉽고 운영이 간단 | Render 대체 분석 서버 후보. 대용량 중계는 여전히 제한 필요 |
| Fly.io | 지역별 사용량 과금, 아시아·태평양 인터넷 egress $0.04/GB | 컨테이너 지역 배치 선택 가능 | 기술 운영 부담을 감수할 때 분석 서버 후보 |
| DigitalOcean VPS | Droplet $4/월부터, 최소 구간에 월 500GiB outbound 포함 | 고정비와 전송량 예측이 쉬움 | 저비용 후보지만 패치·보안·모니터링을 직접 해야 하고 한 IP 차단 위험이 큼 |

공식 참고: [Cloudflare Workers 가격](https://developers.cloudflare.com/workers/platform/pricing/), [Cloudflare Containers 가격](https://developers.cloudflare.com/containers/pricing/), [Cloudflare R2 가격](https://developers.cloudflare.com/r2/pricing/), [Vercel 가격](https://vercel.com/pricing), [Netlify 가격](https://www.netlify.com/pricing/), [Render 신규 요금제](https://render.com/docs/new-workspace-plans), [Render 무료 서비스 제한](https://render.com/docs/free), [Railway 가격](https://docs.railway.com/pricing), [Fly.io 가격](https://fly.io/docs/about/pricing/), [DigitalOcean 가격](https://www.digitalocean.com/pricing), [DigitalOcean 대역폭](https://docs.digitalocean.com/platform/billing/bandwidth/).

## 트래픽 비용 시나리오

사진과 비유튜브 영상이 직접 CDN 경로이면 아래 미디어 전송량은 클립착 호스팅 비용에 잡히지 않는다. YouTube 제한 중계가 평균 50MB라고 가정할 때만 계산한다.

| 월 중계 다운로드 | 미디어 전송량 | Render Hobby의 단순 egress 추정 | Cloudflare Container 한국 권역 단순 egress 추정 |
| ---: | ---: | ---: | ---: |
| 1,000건 | 50GB | 약 $6.75 + 컴퓨트 | 포함량 안, $0 + 컴퓨트 |
| 10,000건 | 500GB | 약 $74.25 + 컴퓨트 | 포함량 안, $0 + 컴퓨트 |
| 100,000건 | 5TB | 약 $749.25 + 컴퓨트 | 약 $225 + 컴퓨트 |

계산은 Render 월 5GB 포함 후 $0.15/GB, Cloudflare 한국 권역 월 500GB 포함 후 $0.05/GB를 단순 적용했다. Container에서 R2로 넘기는 내부 바이트가 실제 사용량에 어떻게 집계되는지는 소규모 파일럿에서 청구 화면으로 검증해야 한다. R2의 인터넷 egress가 무료여도 YouTube에서 Container로 수신하고 처리하는 컴퓨트·네트워크 비용과 IP 차단 위험은 사라지지 않는다.

## 광고 수익 시나리오

광고 수익은 보장할 수 없으므로 페이지 RPM을 가정해 계산한다. Google이 설명하는 RPM 공식은 `예상 수익 ÷ 페이지뷰 × 1,000`이다.

| 월 페이지뷰 | 낮음: RPM 500원 | 기준: RPM 1,500원 | 높음: RPM 3,000원 |
| ---: | ---: | ---: | ---: |
| 10,000 | 5,000원 | 15,000원 | 30,000원 |
| 50,000 | 25,000원 | 75,000원 | 150,000원 |
| 100,000 | 50,000원 | 150,000원 | 300,000원 |
| 500,000 | 250,000원 | 750,000원 | 1,500,000원 |

손익분기 페이지뷰 공식은 `월 고정비 ÷ 페이지 RPM × 1,000`이다. 예를 들어 월 운영비 15,000원, 실제 RPM 1,500원이면 약 10,000 페이지뷰가 손익분기다. 월 운영비가 25,000원이면 약 16,700 페이지뷰다.

참고: [Google AdSense RPM 계산 방식](https://support.google.com/adsense/answer/190515?hl=ko), [AdSense 수익 배분 설명](https://support.google.com/adsense/answer/180195?hl=ko).

## 광고는 많이 넣는 것이 유리한가

다운로드 사이트의 많은 광고는 높은 서버 전송비를 만회하려는 경우가 있지만, 광고 수를 늘린다고 수익이 선형으로 늘지는 않는다. 저장 버튼과 혼동되는 광고, 전면 팝업, 팝언더는 오클릭·이탈·검색 노출·광고 승인에 불리하다.

초기 배치는 최대 세 자리로 제한한다.

1. URL 입력 영역 아래가 아니라 **결과 설명 아래**의 반응형 배너 1개
2. 저장 옵션 목록이 끝난 뒤 콘텐츠형 또는 배너 1개
3. 모바일 하단 앵커 1개(콘텐츠와 저장 버튼을 가리지 않을 때만)

광고와 `열어 저장`, `준비해서 저장`, `공유` 버튼 사이에 명확한 여백과 `광고` 표시를 둔다. 팝업·팝언더·가짜 다운로드 버튼은 사용하지 않는다. 한국 방문자는 AdFit을 먼저 시험하고, 콘텐츠·정책 페이지·유입이 안정된 뒤 AdSense를 함께 비교한다. 같은 자리에 두 광고사를 동시에 겹쳐 표시하지 않고 A/B 기간별로 실제 RPM과 이탈률을 비교한다.

정책 참고: [AdSense 광고 게재위치 정책](https://support.google.com/adsense/answer/1346295?hl=ko), [AdSense 프로그램 정책](https://support.google.com/adsense/answer/48182?hl=ko), [Google 검색의 방해가 되는 전면 광고 안내](https://developers.google.com/search/docs/appearance/avoid-intrusive-interstitials?hl=ko), [카카오 AdFit 매체 안내](https://adfit.kakao.com/info).

## 이전과 백업 체크리스트

- GitHub 개인 저장소를 원본으로 두고 배포본을 유일한 원본으로 사용하지 않는다.
- `.openai/hosting.json`, `render.yaml`, `resolver/Dockerfile`, `pnpm-lock.yaml`, 환경변수 이름을 함께 백업한다.
- 비밀값은 Git에 넣지 않고 호스팅별 환경변수로 다시 등록한다.
- 화면은 계속 같은 출처의 `/api/resolve`를 호출한다. 호스팅을 바꿀 때 이 Route가 분석 서버로 프록시하도록 설정한다.
- 도메인 DNS는 Cloudflare에서 관리하고, 이전 시 레코드만 새 배포 대상으로 바꾼다. TTL을 미리 낮추고 기존 배포는 48시간 유지한다.
- 이전 전 `pnpm test`, 분석 서버 `/health`, 공개 사진 캐러셀, 비유튜브 영상 직접 URL, YouTube 제한 중계를 각각 확인한다.
- 새 호스팅에서 응답 성공률·평균 처리시간·중계 GB·광고 RPM을 7일간 나란히 측정한 후 완전히 전환한다.
- 공급자 전용 DB나 객체 저장소를 도입할 때는 정기 내보내기와 삭제 정책을 문서화한다. 현재 클립착 핵심 기능은 DB/R2에 의존하지 않는다.

## 단계별 권장안

1. **지금:** Sites + Render 분석 서버, 사진·비유튜브 직접 CDN, YouTube 강한 제한. 월 비용·성공률·광고 RPM 수집.
2. **월 5만 PV 전후:** AdFit/AdSense 자리를 기간별 비교하고, YouTube 중계 다운로드당 광고수익과 실제 GB 비용을 분리 계산.
3. **YouTube 중계 5,000건/월 전후:** Cloudflare Containers/R2 파일럿 300건으로 성공률·IP 차단·실제 청구를 검증.
4. **중계비가 광고수익을 넘으면:** 데스크톱 확장 프로그램과 모바일 앱의 사용자 기기 직접 수신을 기본값으로 전환하고 서버 중계는 일일 제한 보조 경로로만 유지.
