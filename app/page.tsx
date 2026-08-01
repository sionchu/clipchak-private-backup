import type { Metadata } from "next";
import { LandingPage } from "./components/LandingPage";

export const metadata: Metadata = {
  title: "클립착 - 영상 링크 저장 도구",
  description: "유튜브, 틱톡, 스레드, 링크드인, 인스타그램의 공개 영상 링크를 확인하고 저장 옵션을 찾는 간단한 웹 도구입니다.",
  alternates: { canonical: "/" },
};

export default function Home() {
  return <LandingPage />;
}
