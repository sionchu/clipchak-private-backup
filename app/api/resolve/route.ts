import { detectPlatform } from "../../lib/platforms";

type MediaKind = "video" | "image" | "audio";
type ResolverItem = {
  url: string;
  label: string;
  format?: string;
  quality?: string;
  kind?: MediaKind;
  thumbnail?: string;
  delivery?: "direct" | "resolver";
};

type CobaltResponse = {
  status?: "tunnel" | "redirect" | "picker" | "local-processing" | "error";
  url?: string;
  filename?: string;
  picker?: { type?: "photo" | "video" | "gif"; url?: string; thumb?: string }[];
  error?: { code?: string };
};

export async function POST(request: Request) {
  let input = "";
  try { input = String((await request.json() as { url?: unknown }).url || "").trim(); } catch { return json({ message: "주소를 읽지 못했습니다." }, 400); }
  let url: URL;
  try { url = new URL(input); } catch { return json({ message: "올바른 웹 주소를 입력해 주세요." }, 400); }
  if (!/^https?:$/.test(url.protocol)) return json({ message: "http 또는 https 주소만 사용할 수 있습니다." }, 400);

  const directKind = inferKind(url.href);
  if (directKind) {
    const noun = directKind === "image" ? "사진" : directKind === "audio" ? "음원" : "영상";
    return json({ direct: true, title: `직접 ${noun} 링크`, message: "파일은 클립착 서버를 거치지 않고 원본 주소에서 사용자의 기기로 직접 열립니다.", items: [{ url: url.href, label: `원본 ${noun} 열기`, kind: directKind, delivery: "direct", format: extensionOf(url.href) }] });
  }

  const platform = detectPlatform(url.href);
  if (!platform) return json({ message: "현재 지원하는 플랫폼 주소가 아닙니다. 유튜브, 틱톡, 스레드, 링크드인, 인스타그램 링크를 확인해 주세요." }, 400);

  const endpoint = process.env.MEDIA_RESOLVER_ENDPOINT?.trim() || process.env.VIDEO_RESOLVER_ENDPOINT?.trim();
  if (!endpoint) return json({ platform: platform.key, title: `${platform.name} 공개 링크`, message: "주소 형식은 정상입니다. 미디어 분석 서버를 연결하면 영상·사진 저장 옵션이 이곳에 표시됩니다." }, 503);

  try {
    if ((process.env.MEDIA_RESOLVER_DRIVER || "generic").toLowerCase() === "cobalt") {
      return await resolveWithCobalt(endpoint, url.href, platform.key);
    }
    const response = await fetch(endpoint, {
      method: "POST",
      headers: resolverHeaders(),
      body: JSON.stringify({ url: url.href, platform: platform.key, media: ["video", "image"], mode: "metadata-only", allowProxy: false }),
    });
    if (!response.ok) return json({ platform: platform.key, message: response.status === 404 ? "공개 미디어를 찾지 못했습니다. 게시물 공개 여부와 주소를 확인해 주세요." : "현재 미디어 정보를 불러오지 못했습니다. 잠시 뒤 다시 시도해 주세요." }, response.status === 404 ? 404 : 502);
    const data = await response.json() as { title?: string; items?: ResolverItem[] };
    const items = normalizeItems(data.items || []);
    return json({ platform: platform.key, title: data.title || `${platform.name} 공개 미디어`, message: items.length ? "영상과 사진을 원본 주소에서 직접 열어 저장하세요." : "저장 가능한 공개 미디어를 찾지 못했습니다.", items });
  } catch { return json({ platform: platform.key, message: "미디어 분석 서버에 연결하지 못했습니다." }, 502); }
}

async function resolveWithCobalt(endpoint: string, sourceUrl: string, platform: string) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: resolverHeaders(),
    body: JSON.stringify({ url: sourceUrl, alwaysProxy: false, localProcessing: "disabled" }),
  });
  const data = await response.json() as CobaltResponse;
  if (!response.ok || data.status === "error") return json({ platform, message: `공개 미디어를 확인하지 못했습니다${data.error?.code ? ` (${data.error.code})` : ""}.` }, response.status === 404 ? 404 : 502);

  if (data.status === "redirect" && data.url) {
    return json({ platform, title: "원본 미디어", message: "원본 서비스 주소로 직접 연결합니다.", items: normalizeItems([{ url: data.url, label: data.filename || "원본 미디어 열기", delivery: "direct" }]) });
  }
  if (data.status === "picker") {
    const items = normalizeItems((data.picker || []).map((item, index) => ({
      url: item.url || "",
      thumbnail: item.thumb,
      label: `${item.type === "photo" ? "사진" : item.type === "gif" ? "GIF" : "영상"} ${index + 1}`,
      kind: item.type === "photo" ? "image" : "video",
      delivery: "direct",
    })));
    return json({ platform, title: "게시물 미디어", message: "여러 장 게시물을 항목별로 표시했습니다.", items });
  }
  if (data.status === "tunnel" && data.url) {
    if (process.env.MEDIA_ALLOW_PROXY !== "true") return json({ platform, message: "이 게시물은 원본 직접 연결을 제공하지 않아 중계를 중단했습니다. 서버 트래픽을 쓰지 않는 설정이 적용되어 있습니다." }, 409);
    return json({ platform, title: "외부 처리 미디어", message: "이 항목은 별도 미디어 서버를 통해 전송됩니다.", items: normalizeItems([{ url: data.url, label: data.filename || "처리된 미디어 열기", delivery: "resolver" }]) });
  }
  return json({ platform, message: "브라우저 직접 저장으로 처리할 수 없는 형식입니다." }, 409);
}

function resolverHeaders() {
  const token = process.env.MEDIA_RESOLVER_TOKEN || process.env.VIDEO_RESOLVER_TOKEN;
  const scheme = process.env.MEDIA_RESOLVER_AUTH_SCHEME || "Bearer";
  return { accept: "application/json", "content-type": "application/json", ...(token ? { authorization: `${scheme} ${token}` } : {}) };
}

function normalizeItems(items: ResolverItem[]) {
  return items.flatMap((item, index) => {
    if (typeof item.url !== "string" || !/^https?:\/\//i.test(item.url)) return [];
    const delivery = item.delivery === "resolver" ? "resolver" : "direct";
    if (delivery === "resolver" && process.env.MEDIA_ALLOW_PROXY !== "true") return [];
    const kind = item.kind || inferKind(item.url) || inferKind(item.format || "") || "video";
    return [{ ...item, label: item.label || `${kind === "image" ? "사진" : kind === "audio" ? "음원" : "영상"} ${index + 1}`, kind, delivery }];
  }).slice(0, 30);
}

function inferKind(value: string): MediaKind | undefined {
  if (/\.(jpg|jpeg|png|webp|gif|avif|heic)(?:$|[?#])/i.test(value)) return "image";
  if (/\.(mp3|m4a|aac|wav|ogg|opus)(?:$|[?#])/i.test(value)) return "audio";
  if (/\.(mp4|webm|mov|mkv|m4v)(?:$|[?#])/i.test(value)) return "video";
  return undefined;
}

function extensionOf(value: string) {
  const match = value.match(/\.([a-z0-9]{2,5})(?:$|[?#])/i);
  return match?.[1]?.toUpperCase();
}

function json(body: object, status = 200) { return Response.json(body, { status, headers: { "cache-control": "no-store", "x-content-type-options": "nosniff" } }); }
