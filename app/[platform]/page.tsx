import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LandingPage } from "../components/LandingPage";
import { getPlatform, platformPages } from "../lib/platforms";

type Props = { params: Promise<{ platform: string }> };

export function generateStaticParams() { return platformPages.map((platform) => ({ platform: platform.slug })); }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { platform: slug } = await params;
  const platform = getPlatform(slug);
  if (!platform) return {};
  return {
    title: platform.title,
    description: `${platform.description} 본인이 소유했거나 저장 허가를 받은 공개 콘텐츠만 이용하세요.`,
    keywords: [...platform.keywords, `${platform.name} 링크 다운로드`, "온라인 미디어 다운로드"],
    alternates: { canonical: `/${platform.slug}` },
    openGraph: { type: "website", locale: "ko_KR", title: `${platform.title} | 클립착`, description: platform.description, url: `/${platform.slug}`, images: ["/og.png"] },
  };
}

export default async function PlatformPage({ params }: Props) {
  const { platform: slug } = await params;
  const platform = getPlatform(slug);
  if (!platform) notFound();
  return <LandingPage platform={platform} />;
}
