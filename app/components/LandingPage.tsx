import Link from "next/link";
import { Downloader } from "./Downloader";
import { platforms, type Platform } from "../lib/platforms";

export function LandingPage({ platform }: { platform?: Platform }) {
  const title = platform?.title || "영상도 사진도,\n링크 하나로.";
  const description = platform?.description || "유튜브 영상부터 틱톡 사진 슬라이드, 스레드·링크드인·인스타그램 게시물까지 공개 링크를 한곳에서 확인하세요.";
  const faq = platform?.faq || [
    { q: "어떤 링크를 사용할 수 있나요?", a: "로그인 없이 열리는 공개 게시물과 직접 미디어 주소를 확인할 수 있습니다. 비공개 계정이나 유료 콘텐츠는 지원하지 않습니다." },
    { q: "영상·사진이 클립착 서버를 지나가나요?", a: "기본 모드는 분석 서버가 원본 주소만 찾고, 실제 파일은 플랫폼 CDN에서 사용자의 브라우저로 직접 연결합니다. 원본 직접 연결이 불가능한 게시물은 중계하지 않습니다." },
    { q: "사진 여러 장도 받을 수 있나요?", a: "틱톡 사진 모드와 인스타그램·스레드 캐러셀처럼 여러 장인 게시물은 결과를 사진별로 나누어 표시하도록 설계했습니다." },
    { q: "휴대폰에서도 사용할 수 있나요?", a: "네. 모바일 공유 메뉴에서 링크를 복사해 붙여넣으면 됩니다. 결과 저장 방식은 브라우저와 기기에 따라 달라질 수 있습니다." },
  ];
  const schema = {
    "@context": "https://schema.org", "@type": "WebApplication", name: platform?.title || "클립착", applicationCategory: "MultimediaApplication", operatingSystem: "Any", isAccessibleForFree: true,
    description,
  };

  return <main><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
    <section className="hero"><div className="shell hero-grid">
      <div className="hero-copy"><span className="overline">PUBLIC MEDIA LINK TOOL <b>01</b></span><h1>{title.split("\n").map((line, index) => <span key={line}>{index ? <em>{line}</em> : line}</span>)}</h1><p>{description}</p><div className="trust-row"><span>회원가입 없음</span><span>앱 설치 없음</span><span>모바일 지원</span></div></div>
      <Downloader selected={platform} />
    </div></section>

    <section className="platform-section" id="platforms"><div className="shell">
      <div className="section-title"><span>PLATFORM INDEX</span><div><h2>사이트별로 바로 시작</h2><p>주소 형식과 사용법이 달라 각 플랫폼 전용 페이지에서 더 정확하게 안내합니다.</p></div></div>
      <div className="platform-grid">{platforms.map((item, index) => <Link className="platform-card" href={`/${item.slug}`} key={item.key}><span className={`platform-mark ${item.accent}`}>{item.short}</span><div><small>0{index + 1}</small><h3>{item.name} {item.mediaLabel}</h3><p>{item.description}</p></div><b aria-hidden="true">↗</b></Link>)}</div>
    </div></section>

    <section className="how-section"><div className="shell"><div className="section-title"><span>HOW TO USE</span><div><h2>복사하고, 붙여넣고, 확인</h2><p>불필요한 선택창을 줄이고 세 단계만 남겼습니다.</p></div></div><ol>
      {(platform?.guide || ["원하는 영상·사진 게시물에서 공유 링크를 복사합니다.", "클립착 입력창에 주소를 그대로 붙여넣습니다.", "결과를 원본 주소에서 열어 내 기기에 저장합니다."]).map((step, index) => <li key={step}><b>0{index + 1}</b><p>{step}</p></li>)}
    </ol></div></section>

    <aside className="ad-reserve shell" aria-label="광고 영역"><span>AD</span><p>콘텐츠를 가리지 않는 광고 자리</p><small>서비스 안정화 후 적용 예정</small></aside>

    <section className="principles"><div className="shell principles-grid"><div><span className="overline light">OPERATING PRINCIPLES</span><h2>저장보다 먼저<br />지켜야 할 기준.</h2></div><ul><li><b>01</b><span><strong>공개 콘텐츠만</strong>로그인·비공개 계정·접근 제한을 우회하지 않습니다.</span></li><li><b>02</b><span><strong>권리 있는 콘텐츠만</strong>본인 콘텐츠나 제작자가 저장을 허용한 콘텐츠에 사용합니다.</span></li><li><b>03</b><span><strong>파일 중계 최소화</strong>분석은 주소 중심으로 처리하고 원본 파일은 사용자 브라우저로 직접 연결합니다.</span></li></ul></div></section>

    <section className="faq-section shell"><div className="section-title"><span>FAQ</span><div><h2>{platform ? `${platform.name} 다운로드 질문` : "자주 묻는 질문"}</h2><p>사용 전에 꼭 확인할 내용만 모았습니다.</p></div></div><div className="faq-list">{faq.map((item) => <details key={item.q}><summary>{item.q}<b>+</b></summary><p>{item.a}</p></details>)}</div></section>
  </main>;
}
