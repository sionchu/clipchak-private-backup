"use client";

import { FormEvent, useMemo, useState } from "react";
import { detectPlatform, getPlatform, type Platform } from "../lib/platforms";
import { VideoCompressor } from "./VideoCompressor";

type MediaItem = {
  url: string;
  label: string;
  format?: string;
  quality?: string;
  kind?: "video" | "image" | "audio";
  thumbnail?: string;
  delivery?: "direct" | "resolver";
  width?: number;
  height?: number;
  fps?: number;
  filesize?: number;
  filesizeApprox?: boolean;
  duration?: number;
  hasAudio?: boolean;
  videoCodec?: string;
  audioCodec?: string;
  formatId?: string;
};
type ResolveResult = { platform?: string; title?: string; message?: string; items?: MediaItem[]; direct?: boolean };

export function Downloader({ selected }: { selected?: Platform }) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<ResolveResult | null>(null);
  const [qualityFilter, setQualityFilter] = useState("all");
  const [soundFilter, setSoundFilter] = useState("all");
  const detected = useMemo(() => detectPlatform(url), [url]);
  const items = useMemo(() => result?.items || [], [result?.items]);
  const qualities = useMemo(() => Array.from(new Set(items.filter((item) => item.kind !== "audio" && item.quality).map((item) => item.quality as string))).sort((a, b) => Number(b.replace(/\D/g, "")) - Number(a.replace(/\D/g, ""))), [items]);
  const visibleItems = items.filter((item) => {
    if (qualityFilter !== "all" && item.quality !== qualityFilter) return false;
    if (soundFilter === "with" && item.hasAudio !== true) return false;
    if (soundFilter === "without" && item.hasAudio !== false) return false;
    return true;
  });

  const paste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setUrl(text.trim());
    } catch {
      setMessage("주소창이나 공유 메뉴에서 복사한 링크를 직접 붙여넣어 주세요.");
    }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setMessage("");
    setResult(null);
    setQualityFilter("all");
    setSoundFilter("all");
    let parsed: URL;
    try { parsed = new URL(url.trim()); } catch { setMessage("https://로 시작하는 올바른 게시물 주소를 입력해 주세요."); return; }
    if (!/^https?:$/.test(parsed.protocol)) { setMessage("웹 주소만 확인할 수 있습니다."); return; }
    setLoading(true);
    try {
      const response = await fetch("/api/resolve", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ url: parsed.toString() }) });
      const data = await response.json() as ResolveResult;
      if (!response.ok && response.status !== 503) throw new Error(data.message || "링크를 확인하지 못했습니다.");
      setResult(data);
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "링크를 확인하지 못했습니다.");
    } finally { setLoading(false); }
  };

  const current = detected || (result?.platform ? getPlatformByKey(result.platform) : undefined) || selected;
  return <div className="download-console">
    <div className="console-top"><span>URL INPUT</span><span className="status-dot"><i /> 공개 링크만</span></div>
    <form onSubmit={submit}>
      <label htmlFor="media-url">영상·사진 게시물 주소</label>
      <div className="url-field"><input id="media-url" type="url" inputMode="url" autoComplete="off" value={url} onChange={(event) => setUrl(event.target.value)} placeholder={selected?.placeholder || "유튜브·틱톡·스레드·링크드인·인스타 URL 붙여넣기"} /><button type="button" className="paste-button" onClick={paste}>붙여넣기</button></div>
      <div className="detected-row"><span>{current ? <><b className={`mini-platform ${current.accent}`}>{current.short}</b>{current.name} 링크 {detected ? "인식됨" : "선택"}</> : "주소를 붙여넣으면 플랫폼을 자동으로 찾습니다."}</span><small>비공개·로그인 링크 제외</small></div>
      <button className="analyze-button" type="submit" disabled={loading || !url.trim()}>{loading ? "링크 확인 중…" : "영상·사진 링크 확인"}<b aria-hidden="true">↗</b></button>
      <p className="rights-note">계속하면 본인이 소유했거나 저장 허가를 받은 공개 콘텐츠임을 확인합니다.</p>
    </form>
    {message && <p className="console-message error" role="alert">{message}</p>}
    {result && <div className={`resolve-result ${result.items?.length ? "ready" : "pending"}`} aria-live="polite">
      <span>{result.items?.length ? "저장 옵션" : "링크 확인 완료"}</span><h3>{result.title || `${current?.name || "미디어"} 공개 링크`}</h3><p>{result.message}</p>
      {!!result.items?.length && <>
        <p className="delivery-note">{result.items.some((item) => item.delivery === "resolver") ? "유튜브·쇼츠는 접근 금지를 막기 위해 제한 중계하고, 다른 플랫폼은 원본 CDN에서 사용자 기기로 직접 연결합니다." : "원본 링크는 클립착 서버를 거치지 않고 이 브라우저에서 직접 열립니다. 새 화면이 열리면 기기의 저장 메뉴를 이용하세요."}</p>
        {result.platform === "youtube" && <p className="youtube-direct-warning"><b>유튜브·쇼츠 실사용 모드</b> 소리를 합친 MP4를 최대 720p·10분·150MB까지 준비합니다. 동시 1건으로 제한해 서버 트래픽과 비용 폭주를 막습니다.</p>}
        <div className="media-filters">
          <label><span>해상도</span><select value={qualityFilter} onChange={(event) => setQualityFilter(event.target.value)}><option value="all">모든 해상도</option>{qualities.map((quality) => <option value={quality} key={quality}>{quality}</option>)}</select></label>
          <label><span>소리</span><select value={soundFilter} onChange={(event) => setSoundFilter(event.target.value)}><option value="all">전체</option><option value="with">소리 있음</option><option value="without">소리 없음</option></select></label>
          <small>{visibleItems.length}개 옵션</small>
        </div>
        <div className="media-options">{visibleItems.map((item, index) => {
          const kind = item.kind || "video";
          const preview = item.thumbnail || (kind === "image" ? item.url : undefined);
          return <a href={item.url} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer" key={`${item.url}-${item.label}-${index}`}>
            {preview && <img src={preview} alt="" loading="lazy" referrerPolicy="no-referrer" />}
            <span><i className={`media-kind ${kind}`}>{kind === "image" ? "사진" : kind === "audio" ? "음원" : "영상"}</i>{item.label}</span>
            <div className="media-badges">
              {kind === "video" && <i className={item.hasAudio === true ? "has-audio" : item.hasAudio === false ? "no-audio" : "unknown-audio"}>{item.hasAudio === true ? "🔊 소리 있음" : item.hasAudio === false ? "🔇 소리 없음" : "소리 확인 불가"}</i>}
              {!!item.filesize && <i>{item.filesizeApprox ? "약 " : ""}{formatBytes(item.filesize)}</i>}
              {item.width && item.height && <i>{item.width}×{item.height}{item.fps ? ` · ${item.fps}fps` : ""}</i>}
            </div>
            <small>{[item.quality, item.format, item.videoCodec, item.audioCodec, item.delivery === "resolver" ? "클립착 제한 중계" : "원본 직접 연결"].filter(Boolean).join(" · ")}</small><b>{item.delivery === "resolver" ? "준비해서 저장 ↓" : "열어 저장 ↗"}</b>
          </a>;
        })}</div>
        {!visibleItems.length && <p className="no-media-filter">선택한 조건에 맞는 저장 옵션이 없습니다.</p>}
      </>}
    </div>}
    {!!result?.items?.some((item) => item.kind === "video" || item.kind === "audio") && <VideoCompressor />}
  </div>;
}

function getPlatformByKey(key: string) {
  return ["youtube", "tiktok", "threads", "linkedin", "instagram"].includes(key)
    ? getPlatform(`${key}-video-download`)
    : undefined;
}

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "확인 불가";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** index;
  return `${value >= 100 || index === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[index]}`;
}
