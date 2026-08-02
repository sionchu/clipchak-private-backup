import type { Metadata } from "next";
import { LandingPage } from "./components/LandingPage";

export const metadata: Metadata = {
  title: "클립착 - 영상·사진 링크 저장 도구",
  description: "틱톡, 인스타그램, 스레드, X, 페이스북 등 주요 플랫폼의 공개 영상·사진 링크를 확인하고 원본 저장 옵션을 찾는 웹 도구입니다.",
  alternates: { canonical: "/" },
};

export default function Home() {
  return <LandingPage />;
}
