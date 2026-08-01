"use client";

import { FormEvent, useMemo, useState } from "react";
import { detectPlatform, getPlatform, type Platform } from "../lib/platforms";

type MediaItem = { url: string; label: string; format?: string; quality?: string };
type ResolveResult = { platform?: string; title?: string; message?: string; items?: MediaItem[]; direct?: boolean };

export function Downloader({ selected }: { selected?: Platform }) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<ResolveResult | null>(null);
  const detected = useMemo(() => detectPlatform(url), [url]);

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
    let parsed: URL;
    try { parsed = new URL(url.trim()); } catch { setMessage("https://로 시작하는 올바른 영상 주소를 입력해 주세요."); return; }
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
      <label htmlFor="video-url">영상 또는 게시물 주소</label>
      <div className="url-field"><input id="video-url" type="url" inputMode="url" autoComplete="off" value={url} onChange={(event) => setUrl(event.target.value)} placeholder={selected?.placeholder || "유튜브·틱톡·스레드·링크드인 URL 붙여넣기"} /><button type="button" className="paste-button" onClick={paste}>붙여넣기</button></div>
      <div className="detected-row"><span>{current ? <><b className={`mini-platform ${current.accent}`}>{current.short}</b>{current.name} 링크 {detected ? "인식됨" : "선택"}</> : "주소를 붙여넣으면 플랫폼을 자동으로 찾습니다."}</span><small>비공개·로그인 링크 제외</small></div>
      <button className="analyze-button" type="submit" disabled={loading || !url.trim()}>{loading ? "링크 확인 중…" : "영상 링크 확인"}<b aria-hidden="true">↗</b></button>
      <p className="rights-note">계속하면 본인이 소유했거나 저장 허가를 받은 공개 콘텐츠임을 확인합니다.</p>
    </form>
    {message && <p className="console-message error" role="alert">{message}</p>}
    {result && <div className={`resolve-result ${result.items?.length ? "ready" : "pending"}`} aria-live="polite">
      <span>{result.items?.length ? "저장 옵션" : "링크 확인 완료"}</span><h3>{result.title || `${current?.name || "영상"} 공개 링크`}</h3><p>{result.message}</p>
      {!!result.items?.length && <div className="media-options">{result.items.map((item) => <a href={item.url} target="_blank" rel="noreferrer" key={`${item.url}-${item.label}`}>{item.label}<small>{[item.quality, item.format].filter(Boolean).join(" · ")}</small><b>저장 ↘</b></a>)}</div>}
    </div>}
  </div>;
}

function getPlatformByKey(key: string) {
  return ["youtube", "tiktok", "threads", "linkedin", "instagram"].includes(key)
    ? getPlatform(`${key}-video-download`)
    : undefined;
}
