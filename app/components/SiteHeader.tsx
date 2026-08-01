"use client";

import Link from "next/link";
import { useState } from "react";
import { platforms } from "../lib/platforms";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return <header className="site-header"><div className="shell header-inner">
    <Link className="brand" href="/" aria-label="클립착 홈"><span className="brand-play" aria-hidden="true" /><span>클립<strong>착</strong></span></Link>
    <nav className={open ? "main-nav open" : "main-nav"} aria-label="주요 메뉴">
      {platforms.slice(0, 4).map((item) => <Link href={`/${item.slug}`} key={item.key} onClick={() => setOpen(false)}>{item.name}</Link>)}
      <Link className="nav-all" href="/#platforms" onClick={() => setOpen(false)}>전체 플랫폼</Link>
    </nav>
    <button className="menu-button" type="button" aria-label="메뉴 열기" aria-expanded={open} onClick={() => setOpen((value) => !value)}><span /><span /></button>
  </div></header>;
}
