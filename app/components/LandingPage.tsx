import Link from "next/link";
import { Downloader } from "./Downloader";
import { platforms, type Platform } from "../lib/platforms";

export function LandingPage({ platform }: { platform?: Platform }) {
  const title = platform?.title || "영상 주소 하나면,\n저장은 가볍게.";
  const description = platform?.description || "유튜브, 틱톡, 스레드, 링크드인, 인스타그램의 공개 링크를 한곳에서 확인하세요. 가입도 설치도 필요 없습니다.";
  const faq = platform?.faq || [
    { q: "어떤 링크를 사용할 수 있나요?", a: "로그인 없이 열리는 공개 게시물과 직접 미디어 주소를 확인할 수 있습니다. 비공개 계정이나 유료 콘텐츠는 지원하지 않습니다." },
    { q: "영상 파일을 서버에 저장하나요?", a: "클립착은 결과 파일을 장기간 보관하지 않는 구조를 기준으로 설계했습니다. 직접 미디어 주소는 브라우저에서 바로 열립니다." },
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
      <div className="platform-grid">{platforms.map((item, index) => <Link className="platform-card" href={`/${item.slug}`} key={item.key}><span className={`platform-mark ${item.accent}`}>{item.short}</span><div><small>0{index + 1}</small><h3>{item.name} 영상 다운로드</h3><p>{item.description}</p></div><b aria-hidden="true">↗</b></Link>)}</div>
    </div></section>

    <section className="how-section"><div className="shell"><div className="section-title"><span>HOW TO USE</span><div><h2>복사하고, 붙여넣고, 확인</h2><p>불필요한 선택창을 줄이고 세 단계만 남겼습니다.</p></div></div><ol>
      {(platform?.guide || ["원하는 영상이나 게시물에서 공유 링크를 복사합니다.", "클립착 입력창에 주소를 그대로 붙여넣습니다.", "공개 여부와 저장 옵션을 확인한 뒤 내 기기에 저장합니다."]).map((step, index) => <li key={step}><b>0{index + 1}</b><p>{step}</p></li>)}
    </ol></div></section>

    <aside className="ad-reserve shell" aria-label="광고 영역"><span>AD</span><p>콘텐츠를 가리지 않는 광고 자리</p><small>서비스 안정화 후 적용 예정</small></aside>

    <section className="principles"><div className="shell principles-grid"><div><span className="overline light">OPERATING PRINCIPLES</span><h2>저장보다 먼저<br />지켜야 할 기준.</h2></div><ul><li><b>01</b><span><strong>공개 콘텐츠만</strong>로그인·비공개 계정·접근 제한을 우회하지 않습니다.</span></li><li><b>02</b><span><strong>권리 있는 콘텐츠만</strong>본인 영상이나 제작자가 저장을 허용한 콘텐츠에 사용합니다.</span></li><li><b>03</b><span><strong>짧게 처리</strong>URL과 결과 파일을 불필요하게 쌓아두지 않는 구조를 사용합니다.</span></li></ul></div></section>

    <section className="faq-section shell"><div className="section-title"><span>FAQ</span><div><h2>{platform ? `${platform.name} 다운로드 질문` : "자주 묻는 질문"}</h2><p>사용 전에 꼭 확인할 내용만 모았습니다.</p></div></div><div className="faq-list">{faq.map((item) => <details key={item.q}><summary>{item.q}<b>+</b></summary><p>{item.a}</p></details>)}</div></section>
  </main>;
}
