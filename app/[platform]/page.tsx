import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LandingPage } from "../components/LandingPage";
import { getPlatform, platforms } from "../lib/platforms";

type Props = { params: Promise<{ platform: string }> };

export function generateStaticParams() { return platforms.map((platform) => ({ platform: platform.slug })); }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { platform: slug } = await params;
  const platform = getPlatform(slug);
  if (!platform) return {};
  return {
    title: platform.title,
    description: `${platform.description} 공개 콘텐츠와 권한 있는 영상만 이용하세요.`,
    keywords: [`${platform.name} 영상 다운로드`, `${platform.name} 동영상 저장`, `${platform.name} 링크 다운로드`, "온라인 영상 다운로드"],
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
