import { detectPlatform } from "../../lib/platforms";

type ResolverItem = { url: string; label: string; format?: string; quality?: string };

export async function POST(request: Request) {
  let input = "";
  try { input = String((await request.json() as { url?: unknown }).url || "").trim(); } catch { return json({ message: "주소를 읽지 못했습니다." }, 400); }
  let url: URL;
  try { url = new URL(input); } catch { return json({ message: "올바른 웹 주소를 입력해 주세요." }, 400); }
  if (!/^https?:$/.test(url.protocol)) return json({ message: "http 또는 https 주소만 사용할 수 있습니다." }, 400);

  if (/\.(mp4|webm|mov)(?:$|\?)/i.test(url.href)) {
    return json({ direct: true, title: "직접 영상 링크", message: "브라우저에서 원본 주소를 열어 저장할 수 있습니다.", items: [{ url: url.href, label: "원본 영상 열기", format: url.pathname.split(".").pop()?.toUpperCase() || "VIDEO" }] });
  }

  const platform = detectPlatform(url.href);
  if (!platform) return json({ message: "현재 지원하는 플랫폼 주소가 아닙니다. 유튜브, 틱톡, 스레드, 링크드인, 인스타그램 링크를 확인해 주세요." }, 400);

  const endpoint = process.env.VIDEO_RESOLVER_ENDPOINT?.trim();
  if (!endpoint) return json({ platform: platform.key, title: `${platform.name} 공개 링크`, message: "주소 형식은 정상입니다. 영상 분석 서버를 연결하면 품질별 저장 옵션이 이곳에 표시됩니다." }, 503);

  try {
    const response = await fetch(endpoint, { method: "POST", headers: { "content-type": "application/json", ...(process.env.VIDEO_RESOLVER_TOKEN ? { authorization: `Bearer ${process.env.VIDEO_RESOLVER_TOKEN}` } : {}) }, body: JSON.stringify({ url: url.href, platform: platform.key }) });
    if (!response.ok) return json({ platform: platform.key, message: response.status === 404 ? "공개 영상을 찾지 못했습니다. 게시물 공개 여부와 주소를 확인해 주세요." : "현재 영상 정보를 불러오지 못했습니다. 잠시 뒤 다시 시도해 주세요." }, response.status === 404 ? 404 : 502);
    const data = await response.json() as { title?: string; items?: ResolverItem[] };
    const items = (data.items || []).filter((item) => typeof item.url === "string" && /^https?:\/\//i.test(item.url)).slice(0, 12);
    return json({ platform: platform.key, title: data.title || `${platform.name} 영상`, message: items.length ? "원하는 품질을 선택해 저장하세요." : "저장 가능한 공개 미디어를 찾지 못했습니다.", items });
  } catch { return json({ platform: platform.key, message: "영상 분석 서버에 연결하지 못했습니다." }, 502); }
}

function json(body: object, status = 200) { return Response.json(body, { status, headers: { "cache-control": "no-store", "x-content-type-options": "nosniff" } }); }
