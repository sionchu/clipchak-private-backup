import type { Metadata, Viewport } from "next";
import { SiteFooter } from "./components/SiteFooter";
import { SiteHeader } from "./components/SiteHeader";
import "./globals.css";

const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://clipchak.kr";

export const metadata: Metadata = {
  metadataBase: new URL(configuredUrl),
  title: { default: "클립착 - 영상 링크 저장 도구", template: "%s | 클립착" },
  description: "복잡한 설치 없이 공개 영상 링크를 확인하고 저장 옵션을 찾는 URL 기반 영상 도구입니다.",
  applicationName: "클립착",
  category: "utilities",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: "클립착",
    title: "클립착 - 링크 붙여넣고 영상 저장",
    description: "유튜브·틱톡·스레드·링크드인·인스타그램 공개 링크를 한곳에서 확인하세요.",
    url: configuredUrl,
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "클립착 영상 링크 저장 도구" }],
  },
  twitter: { card: "summary_large_image", title: "클립착", description: "링크 붙여넣고 영상 저장 옵션 확인", images: ["/og.png"] },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#1647ff" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko"><body><SiteHeader />{children}<SiteFooter /></body></html>;
}
