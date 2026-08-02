export type Platform = {
  slug: string;
  key: "youtube" | "tiktok" | "threads" | "linkedin" | "instagram";
  name: string;
  short: string;
  title: string;
  description: string;
  placeholder: string;
  accent: string;
  domains: string[];
  mediaLabel: string;
  keywords: string[];
  guide: [string, string, string];
  faq: { q: string; a: string }[];
  aliases?: { slug: string; title: string; description: string; keywords: string[] }[];
};

export const platforms: Platform[] = [
  {
    slug: "youtube-video-download", key: "youtube", name: "유튜브", short: "YT", accent: "red",
    title: "유튜브 영상 다운로드 링크 확인",
    description: "유튜브 영상·쇼츠 주소를 붙여넣고 공개 여부와 사용 가능한 저장 방식을 확인하세요.",
    placeholder: "https://www.youtube.com/watch?v=... 또는 shorts 주소",
    domains: ["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be"],
    mediaLabel: "영상·쇼츠",
    keywords: ["유튜브 영상 다운로드", "유튜브 쇼츠 다운로드", "유튜브 링크 저장"],
    guide: ["유튜브 영상에서 공유를 누릅니다.", "링크 복사를 선택해 주소를 가져옵니다.", "주소를 붙여넣고 분석 결과를 확인합니다."],
    faq: [
      { q: "유튜브 쇼츠 주소도 확인할 수 있나요?", a: "네. youtube.com/shorts 형식과 youtu.be 공유 주소를 자동으로 구분합니다." },
      { q: "모든 영상을 저장할 수 있나요?", a: "아니요. 본인이 소유했거나 저장 허가를 받은 콘텐츠, 또는 플랫폼이 다운로드를 허용한 콘텐츠만 이용해야 합니다." },
    ],
  },
  {
    slug: "tiktok-video-download", key: "tiktok", name: "틱톡", short: "TT", accent: "black",
    title: "틱톡 영상·사진 다운로드 링크 확인",
    description: "틱톡 공개 영상과 사진 슬라이드 링크를 인식하고 저장 가능한 항목을 한 장씩 확인합니다.",
    placeholder: "https://www.tiktok.com/@username/video/...",
    domains: ["tiktok.com", "www.tiktok.com", "m.tiktok.com", "vm.tiktok.com", "vt.tiktok.com"],
    mediaLabel: "영상·사진 슬라이드",
    keywords: ["틱톡 영상 다운로드", "틱톡 사진 다운로드", "틱톡 슬라이드 저장"],
    aliases: [{ slug: "tiktok-photo-download", title: "틱톡 사진·슬라이드 다운로드", description: "틱톡 사진 모드와 여러 장 슬라이드의 공개 링크에서 저장 가능한 사진을 순서대로 확인하세요.", keywords: ["틱톡 사진 다운로드", "틱톡 슬라이드 다운로드", "틱톡 사진 저장"] }],
    guide: ["틱톡 영상 또는 사진 게시물의 공유 버튼을 누릅니다.", "링크 복사를 선택합니다.", "주소를 붙여넣고 영상·사진 저장 옵션을 확인합니다."],
    faq: [
      { q: "짧은 공유 링크도 되나요?", a: "vm.tiktok.com과 vt.tiktok.com 형식도 틱톡 링크로 인식합니다." },
      { q: "틱톡 사진 여러 장도 되나요?", a: "네. 분석 서버가 연결되면 사진 슬라이드를 각각 순서대로 표시하도록 설계했습니다." },
      { q: "저장 버튼이 없는 게시물은 왜 안 되나요?", a: "제작자가 저장을 허용하지 않았거나 비공개·연령 제한 콘텐츠인 경우 처리할 수 없습니다." },
    ],
  },
  {
    slug: "threads-video-download", key: "threads", name: "스레드", short: "TH", accent: "black",
    title: "스레드 영상·사진 다운로드",
    description: "Threads 공개 게시물의 영상·사진·캐러셀 링크를 붙여넣어 저장 가능한 미디어를 확인하세요.",
    placeholder: "https://www.threads.com/@username/post/...",
    domains: ["threads.com", "www.threads.com", "threads.net", "www.threads.net"],
    mediaLabel: "영상·사진·캐러셀",
    keywords: ["스레드 영상 다운로드", "스레드 사진 다운로드", "Threads 이미지 저장"],
    aliases: [{ slug: "threads-photo-download", title: "스레드 사진·캐러셀 다운로드", description: "Threads 공개 게시물의 사진 한 장과 여러 장 캐러셀을 순서대로 확인하고 원본 주소에서 저장하세요.", keywords: ["스레드 사진 다운로드", "Threads 이미지 다운로드", "스레드 캐러셀 저장"] }],
    guide: ["스레드 게시물의 공유 아이콘을 누릅니다.", "링크 복사를 선택합니다.", "주소를 붙여넣고 영상 또는 사진 결과를 확인합니다."],
    faq: [
      { q: "스레드 사진도 지원하나요?", a: "공개 게시물에 포함된 사진과 여러 장의 캐러셀도 분석 서버 연결 후 지원할 수 있도록 설계했습니다." },
      { q: "비공개 계정 게시물도 되나요?", a: "아니요. 로그인이나 접근 권한을 우회하지 않으며 공개 게시물만 대상으로 합니다." },
    ],
  },
  {
    slug: "linkedin-video-download", key: "linkedin", name: "링크드인", short: "in", accent: "blue",
    title: "링크드인 영상·이미지 다운로드",
    description: "LinkedIn 공개 게시물 주소를 붙여넣고 영상과 첨부 이미지의 저장 가능 여부를 확인하세요.",
    placeholder: "https://www.linkedin.com/posts/...",
    domains: ["linkedin.com", "www.linkedin.com", "lnkd.in"],
    mediaLabel: "영상·게시물 이미지",
    keywords: ["링크드인 영상 다운로드", "링크드인 이미지 다운로드", "LinkedIn 사진 저장"],
    aliases: [{ slug: "linkedin-image-download", title: "링크드인 이미지 다운로드", description: "LinkedIn 공개 게시물에 첨부된 이미지를 확인하고 원본 미디어 주소에서 저장하세요.", keywords: ["링크드인 이미지 다운로드", "LinkedIn 사진 저장", "링크드인 게시물 이미지"] }],
    guide: ["링크드인 게시물 오른쪽 위 메뉴를 누릅니다.", "게시물 링크 복사를 선택합니다.", "클립착에 붙여넣고 공개 영상·이미지를 확인합니다."],
    faq: [
      { q: "링크드인 러닝 강의도 받을 수 있나요?", a: "아니요. 유료 강의, 로그인 전용 영상, 비공개 게시물은 지원하지 않습니다." },
      { q: "회사 페이지 사진도 가능한가요?", a: "누구나 볼 수 있는 공개 게시물이고 콘텐츠 권한을 보유한 경우 영상과 이미지를 확인할 수 있습니다." },
    ],
  },
  {
    slug: "instagram-video-download", key: "instagram", name: "인스타그램", short: "IG", accent: "purple",
    title: "인스타그램 릴스·사진 다운로드",
    description: "인스타그램 공개 릴스, 사진과 여러 장 캐러셀을 구분하고 저장 가능한 항목을 확인합니다.",
    placeholder: "https://www.instagram.com/reel/...",
    domains: ["instagram.com", "www.instagram.com"],
    mediaLabel: "릴스·영상·사진",
    keywords: ["인스타그램 릴스 다운로드", "인스타그램 사진 다운로드", "인스타 캐러셀 저장"],
    aliases: [{ slug: "instagram-photo-download", title: "인스타그램 사진·캐러셀 다운로드", description: "인스타그램 공개 사진 게시물과 여러 장 캐러셀을 순서대로 확인하고 원본 미디어 주소에서 저장하세요.", keywords: ["인스타그램 사진 다운로드", "인스타 사진 저장", "인스타 캐러셀 다운로드"] }],
    guide: ["릴스 또는 사진 게시물의 공유 버튼을 누릅니다.", "링크 복사를 선택합니다.", "주소를 붙여넣고 영상·사진 결과를 확인합니다."],
    faq: [
      { q: "인스타그램 사진 여러 장도 되나요?", a: "네. /reel/과 /p/ 형식을 구분하고 캐러셀은 항목별로 표시하도록 설계했습니다." },
      { q: "스토리도 받을 수 있나요?", a: "로그인이 필요한 스토리와 비공개 계정 콘텐츠는 지원하지 않습니다." },
    ],
  },
];

export const platformPages: Platform[] = platforms.flatMap((platform) => [
  platform,
  ...(platform.aliases || []).map((alias) => ({ ...platform, ...alias, aliases: [] })),
]);

export function getPlatform(slug?: string) {
  return platformPages.find((platform) => platform.slug === slug);
}

export function detectPlatform(input: string) {
  try {
    const hostname = new URL(input).hostname.toLowerCase();
    return platforms.find((platform) => platform.domains.includes(hostname));
  } catch {
    return undefined;
  }
}
