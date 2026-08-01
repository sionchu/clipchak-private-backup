import Link from "next/link";
import { platforms } from "../lib/platforms";

export function SiteFooter() {
  return <footer className="site-footer"><div className="shell footer-grid">
    <div><Link className="brand footer-brand" href="/"><span className="brand-play" aria-hidden="true" /><span>클립<strong>착</strong></span></Link><p>필요한 영상 링크만 확인하고<br />내 기기에 바로 저장하는 도구.</p></div>
    <div><strong>다운로드 도구</strong>{platforms.map((item) => <Link href={`/${item.slug}`} key={item.key}>{item.name} 영상</Link>)}</div>
    <div><strong>안내</strong><Link href="/about">서비스 소개</Link><Link href="/privacy">개인정보처리방침</Link><Link href="/terms">이용약관</Link><a href="https://github.com/sionchu/clipchak-private-backup/issues">문의하기</a></div>
  </div><div className="shell footer-bottom"><span>© 2026 ClipChak · Chakworks</span><span>각 플랫폼과 제휴하거나 보증받은 서비스가 아닙니다.</span></div></footer>;
}
