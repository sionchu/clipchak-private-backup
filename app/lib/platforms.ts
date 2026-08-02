export type PlatformKey =
  | "threads"
  | "linkedin"
  | "instagram"
  | "x"
  | "facebook"
  | "pinterest"
  | "naver"
  | "bluesky";

export type Platform = {
  slug: string;
  key: PlatformKey;
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

const rightsFaq = { q: "모든 게시물을 저장할 수 있나요?", a: "아니요. 로그인 없이 열리는 공개 게시물 중 본인이 소유했거나 저장 허가를 받은 콘텐츠만 이용해야 합니다." };

export const platforms: Platform[] = [
  {
    slug: "instagram-video-download", key: "instagram", name: "인스타그램", short: "IG", accent: "purple",
    title: "인스타그램 릴스·사진 다운로드", description: "인스타그램 공개 릴스, 사진과 여러 장 캐러셀의 저장 가능한 항목을 확인합니다.",
    placeholder: "https://www.instagram.com/reel/...", domains: ["instagram.com", "www.instagram.com"], mediaLabel: "릴스·영상·사진",
    keywords: ["인스타그램 릴스 다운로드", "인스타그램 사진 다운로드", "인스타 캐러셀 저장"],
    aliases: [{ slug: "instagram-photo-download", title: "인스타그램 사진·캐러셀 다운로드", description: "인스타그램 공개 사진과 캐러셀을 순서대로 확인하고 원본 주소에서 저장하세요.", keywords: ["인스타그램 사진 다운로드", "인스타 사진 저장", "인스타 캐러셀 다운로드"] }],
    guide: ["릴스 또는 사진 게시물에서 공유를 누릅니다.", "링크 복사를 선택합니다.", "클립착에 붙여넣고 결과를 확인합니다."], faq: [{ q: "사진 여러 장도 되나요?", a: "네. 공개 캐러셀은 사진별 결과로 표시합니다." }, rightsFaq],
  },
  {
    slug: "threads-video-download", key: "threads", name: "스레드", short: "TH", accent: "black",
    title: "스레드 영상·사진 다운로드", description: "Threads 공개 게시물의 영상·사진·캐러셀을 확인합니다.",
    placeholder: "https://www.threads.com/@username/post/...", domains: ["threads.com", "www.threads.com", "threads.net", "www.threads.net"], mediaLabel: "영상·사진·캐러셀",
    keywords: ["스레드 영상 다운로드", "스레드 사진 다운로드", "Threads 이미지 저장"],
    aliases: [{ slug: "threads-photo-download", title: "스레드 사진·캐러셀 다운로드", description: "Threads 공개 게시물의 사진과 캐러셀을 순서대로 확인하세요.", keywords: ["스레드 사진 다운로드", "Threads 이미지 다운로드", "스레드 캐러셀 저장"] }],
    guide: ["스레드 게시물의 공유 아이콘을 누릅니다.", "링크 복사를 선택합니다.", "주소를 붙여넣고 결과를 확인합니다."], faq: [{ q: "비공개 계정도 되나요?", a: "아니요. 로그인이나 접근 권한을 우회하지 않습니다." }, rightsFaq],
  },
  {
    slug: "linkedin-video-download", key: "linkedin", name: "링크드인", short: "in", accent: "blue",
    title: "링크드인 영상·이미지 다운로드", description: "LinkedIn 공개 게시물의 영상과 첨부 이미지 저장 가능 여부를 확인합니다.",
    placeholder: "https://www.linkedin.com/posts/...", domains: ["linkedin.com", "www.linkedin.com", "lnkd.in"], mediaLabel: "영상·게시물 이미지",
    keywords: ["링크드인 영상 다운로드", "링크드인 이미지 다운로드", "LinkedIn 사진 저장"],
    aliases: [{ slug: "linkedin-image-download", title: "링크드인 이미지 다운로드", description: "LinkedIn 공개 게시물에 첨부된 이미지를 원본 주소에서 확인하세요.", keywords: ["링크드인 이미지 다운로드", "LinkedIn 사진 저장", "링크드인 게시물 이미지"] }],
    guide: ["공개 게시물의 메뉴를 누릅니다.", "게시물 링크 복사를 선택합니다.", "주소를 붙여넣고 미디어를 확인합니다."], faq: [{ q: "LinkedIn Learning도 되나요?", a: "아니요. 유료 강의와 로그인 전용 영상은 지원하지 않습니다." }, rightsFaq],
  },
  {
    slug: "x-video-download", key: "x", name: "X(트위터)", short: "X", accent: "black",
    title: "X 트위터 영상·사진 다운로드", description: "X의 공개 게시물에 포함된 영상과 사진을 원본 링크별로 확인합니다.",
    placeholder: "https://x.com/username/status/...", domains: ["x.com", "www.x.com", "twitter.com", "www.twitter.com", "mobile.twitter.com", "t.co"], mediaLabel: "영상·사진",
    keywords: ["트위터 영상 다운로드", "X 영상 저장", "트위터 사진 다운로드"],
    aliases: [{ slug: "x-photo-download", title: "X 트위터 사진 다운로드", description: "X 공개 게시물의 사진 여러 장을 원본 링크별로 확인하세요.", keywords: ["트위터 사진 다운로드", "X 이미지 저장", "트위터 사진 저장"] }],
    guide: ["X 게시물의 공유 버튼을 누릅니다.", "링크 복사를 선택합니다.", "주소를 붙여넣고 결과를 확인합니다."], faq: [{ q: "twitter.com 주소도 되나요?", a: "네. x.com, twitter.com, t.co 공유 주소를 인식합니다." }, rightsFaq],
  },
  {
    slug: "facebook-video-download", key: "facebook", name: "페이스북", short: "f", accent: "blue",
    title: "페이스북 영상·릴스 다운로드", description: "로그인 없이 열리는 Facebook 공개 영상과 릴스 링크를 확인합니다.",
    placeholder: "https://www.facebook.com/reel/...", domains: ["facebook.com", "www.facebook.com", "m.facebook.com", "web.facebook.com", "fb.watch"], mediaLabel: "영상·릴스·사진",
    keywords: ["페이스북 영상 다운로드", "페이스북 릴스 다운로드", "Facebook 영상 저장"],
    guide: ["공개 영상 또는 릴스에서 공유를 누릅니다.", "링크 복사를 선택합니다.", "주소를 붙여넣고 저장 옵션을 확인합니다."], faq: [{ q: "그룹 영상도 되나요?", a: "로그인이 필요한 그룹·친구 공개 콘텐츠는 지원하지 않습니다." }, rightsFaq],
  },
  {
    slug: "pinterest-video-download", key: "pinterest", name: "핀터레스트", short: "P", accent: "red",
    title: "핀터레스트 영상·이미지 다운로드", description: "Pinterest 공개 핀의 영상과 이미지를 원본 링크로 확인합니다.",
    placeholder: "https://www.pinterest.com/pin/...", domains: ["pinterest.com", "www.pinterest.com", "kr.pinterest.com", "pin.it"], mediaLabel: "핀 영상·이미지",
    keywords: ["핀터레스트 영상 다운로드", "핀터레스트 이미지 저장", "Pinterest 핀 다운로드"],
    guide: ["핀의 공유 버튼을 누릅니다.", "링크 복사를 선택합니다.", "주소를 붙여넣고 원본을 확인합니다."], faq: [{ q: "pin.it 주소도 되나요?", a: "네. 공개 핀으로 연결되는 짧은 공유 주소도 인식합니다." }, rightsFaq],
  },
  {
    slug: "naver-video-download", key: "naver", name: "네이버TV", short: "N", accent: "green",
    title: "네이버TV 영상 다운로드 링크 확인", description: "네이버TV 공개 영상 주소에서 제공되는 저장 가능한 원본 옵션을 확인합니다.",
    placeholder: "https://tv.naver.com/v/...", domains: ["tv.naver.com", "m.tv.naver.com"], mediaLabel: "공개 영상",
    keywords: ["네이버TV 영상 다운로드", "네이버 동영상 저장", "네이버TV 링크 저장"],
    guide: ["네이버TV 영상에서 공유를 누릅니다.", "URL 복사를 선택합니다.", "주소를 붙여넣고 결과를 확인합니다."], faq: [{ q: "네이버 블로그 영상도 되나요?", a: "현재는 네이버TV 공개 영상 주소를 우선 지원합니다." }, rightsFaq],
  },
  {
    slug: "bluesky-video-download", key: "bluesky", name: "Bluesky", short: "BS", accent: "cyan",
    title: "Bluesky 영상·사진 다운로드", description: "Bluesky 공개 게시물의 영상과 사진 원본 링크를 확인합니다.",
    placeholder: "https://bsky.app/profile/.../post/...", domains: ["bsky.app", "www.bsky.app"], mediaLabel: "영상·사진",
    keywords: ["Bluesky 영상 다운로드", "블루스카이 사진 저장", "Bluesky 이미지 다운로드"],
    guide: ["Bluesky 게시물의 공유 메뉴를 엽니다.", "링크를 복사합니다.", "주소를 붙여넣고 결과를 확인합니다."], faq: [{ q: "앱 공유 링크도 되나요?", a: "bsky.app의 공개 게시물 주소라면 인식합니다." }, rightsFaq],
  },
];

export const platformPages: Platform[] = platforms.flatMap((platform) => [
  platform,
  ...(platform.aliases || []).map((alias) => ({ ...platform, ...alias, aliases: [] })),
]);

export function getPlatform(slug?: string) {
  return platformPages.find((platform) => platform.slug === slug);
}

export function getPlatformByKey(key?: string) {
  return platforms.find((platform) => platform.key === key);
}

export function detectPlatform(input: string) {
  try {
    const hostname = new URL(input).hostname.toLowerCase();
    return platforms.find((platform) => platform.domains.includes(hostname));
  } catch {
    return undefined;
  }
}
