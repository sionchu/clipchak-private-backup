"use client";

import type { FFmpeg } from "@ffmpeg/ffmpeg";
import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";

const CORE_BASE_URL = "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/esm";
const MAX_LOCAL_FILE_SIZE = 300 * 1024 * 1024;

type VideoInfo = {
  width: number;
  height: number;
  duration: number;
};

type OutputFile = {
  url: string;
  name: string;
  size: number;
};

export function VideoCompressor() {
  const ffmpegRef = useRef<FFmpeg | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [resolution, setResolution] = useState("720");
  const [quality, setQuality] = useState("28");
  const [keepAudio, setKeepAudio] = useState(true);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");
  const [output, setOutput] = useState<OutputFile | null>(null);

  const previewUrl = useMemo(() => videoFile ? URL.createObjectURL(videoFile) : "", [videoFile]);

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  useEffect(() => () => {
    if (output?.url) URL.revokeObjectURL(output.url);
  }, [output]);

  const selectVideo = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setOutput((previous) => {
      if (previous?.url) URL.revokeObjectURL(previous.url);
      return null;
    });
    setVideoInfo(null);
    setStatus("");
    if (file && file.size > MAX_LOCAL_FILE_SIZE) {
      setVideoFile(null);
      setStatus("브라우저 메모리 보호를 위해 300MB 이하 파일만 처리할 수 있습니다.");
      event.target.value = "";
      return;
    }
    setVideoFile(file);
  };

  const ensureFfmpeg = async () => {
    if (ffmpegRef.current) return ffmpegRef.current;
    setStatus("영상 처리 엔진을 처음 한 번 불러오는 중입니다. 약 31MB를 사용합니다.");
    const [{ FFmpeg }, { toBlobURL }] = await Promise.all([
      import("@ffmpeg/ffmpeg"),
      import("@ffmpeg/util"),
    ]);
    const ffmpeg = new FFmpeg();
    ffmpeg.on("progress", ({ progress: value }) => {
      if (Number.isFinite(value)) setProgress(Math.max(0, Math.min(99, Math.round(value * 100))));
    });
    await ffmpeg.load({
      coreURL: await toBlobURL(`${CORE_BASE_URL}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(`${CORE_BASE_URL}/ffmpeg-core.wasm`, "application/wasm"),
    });
    ffmpegRef.current = ffmpeg;
    return ffmpeg;
  };

  const convert = async () => {
    if (!videoFile || loading) return;
    setLoading(true);
    setProgress(0);
    setStatus("준비 중입니다.");
    setOutput((previous) => {
      if (previous?.url) URL.revokeObjectURL(previous.url);
      return null;
    });

    const inputExtension = extensionOf(videoFile.name) || "mp4";
    const audioExtension = audioFile ? extensionOf(audioFile.name) || "m4a" : "";
    const inputName = `input.${inputExtension}`;
    const audioName = audioFile ? `audio.${audioExtension}` : "";
    const outputName = `${safeBaseName(videoFile.name)}-${resolution === "original" ? "original" : `${resolution}p`}-${qualityName(quality)}.mp4`;

    try {
      const [{ fetchFile }, ffmpeg] = await Promise.all([import("@ffmpeg/util"), ensureFfmpeg()]);
      setStatus("사용자 기기에서 영상을 변환하는 중입니다. 이 창을 닫지 마세요.");
      await ffmpeg.writeFile(inputName, await fetchFile(videoFile));
      if (audioFile && audioName) await ffmpeg.writeFile(audioName, await fetchFile(audioFile));

      const args = ["-i", inputName];
      if (audioFile && audioName) args.push("-i", audioName);
      args.push("-map", "0:v:0");
      if (audioFile) args.push("-map", "1:a:0", "-shortest");
      else if (keepAudio) args.push("-map", "0:a?");
      else args.push("-an");

      if (resolution !== "original") {
        const target = Math.min(Number(resolution), shortSide(videoInfo));
        const filter = videoInfo && videoInfo.height > videoInfo.width
          ? `scale=${target}:-2:force_original_aspect_ratio=decrease`
          : `scale=-2:${target}:force_original_aspect_ratio=decrease`;
        args.push("-vf", filter);
      }

      args.push("-c:v", "libx264", "-preset", "veryfast", "-crf", quality);
      if (audioFile || keepAudio) args.push("-c:a", "aac", "-b:a", quality === "32" ? "96k" : "128k");
      args.push("-movflags", "+faststart", outputName);

      const exitCode = await ffmpeg.exec(args);
      if (exitCode !== 0) throw new Error(`영상 변환이 중단되었습니다. (code ${exitCode})`);
      const data = await ffmpeg.readFile(outputName);
      const bytes = data instanceof Uint8Array ? data : new TextEncoder().encode(data);
      const blob = new Blob([bytes], { type: "video/mp4" });
      setProgress(100);
      setOutput({ url: URL.createObjectURL(blob), name: outputName, size: blob.size });
      setStatus("변환이 끝났습니다. 전후 용량을 확인한 뒤 저장하세요.");

      await Promise.allSettled([
        ffmpeg.deleteFile(inputName),
        ...(audioName ? [ffmpeg.deleteFile(audioName)] : []),
        ffmpeg.deleteFile(outputName),
      ]);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "이 브라우저에서 영상 변환을 완료하지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const reduction = output && videoFile ? Math.round((1 - output.size / videoFile.size) * 100) : null;

  return <section className="local-video-tool" aria-labelledby="local-video-title">
    <div className="local-tool-heading">
      <div><span>LOCAL VIDEO</span><h3 id="local-video-title">영상 용량 줄이기 · 오디오 합치기</h3></div>
      <b>서버 업로드 없음</b>
    </div>
    <p className="local-tool-copy">위에서 영상을 저장한 뒤 파일을 선택하세요. 해상도와 화질 변환은 이 브라우저 안에서 실행되어 클립착 영상 트래픽을 사용하지 않습니다.</p>

    <div className="local-file-grid">
      <label className="local-file-picker"><span>1. 영상 파일</span><input type="file" accept="video/*,.mp4,.webm,.mov,.m4v,.mkv" onChange={selectVideo} /><b>{videoFile ? videoFile.name : "영상 선택"}</b><small>{videoFile ? formatBytes(videoFile.size) : "최대 300MB"}</small></label>
      <label className="local-file-picker optional"><span>선택: 별도 오디오</span><input type="file" accept="audio/*,.m4a,.mp3,.aac,.wav,.ogg,.opus" onChange={(event) => setAudioFile(event.target.files?.[0] || null)} /><b>{audioFile ? audioFile.name : "오디오 합치기"}</b><small>{audioFile ? formatBytes(audioFile.size) : "고화질 무음 영상용"}</small></label>
    </div>

    {previewUrl && <video className="local-video-preview" src={previewUrl} controls preload="metadata" onLoadedMetadata={(event) => {
      const element = event.currentTarget;
      setVideoInfo({ width: element.videoWidth, height: element.videoHeight, duration: element.duration });
    }} />}

    <div className="local-video-settings">
      <label><span>출력 해상도</span><select value={resolution} onChange={(event) => setResolution(event.target.value)}><option value="1080">1080p</option><option value="720">720p</option><option value="480">480p</option><option value="360">360p</option><option value="original">원본 크기</option></select></label>
      <label><span>저장 화질</span><select value={quality} onChange={(event) => setQuality(event.target.value)}><option value="24">고화질 · 용량 큼</option><option value="28">균형 · 추천</option><option value="32">작은 용량</option></select></label>
      <label className="audio-check"><input type="checkbox" checked={keepAudio} disabled={!!audioFile} onChange={(event) => setKeepAudio(event.target.checked)} /><span>{audioFile ? "선택한 오디오 합치기" : "원본 소리 유지"}</span></label>
    </div>

    {videoFile && <div className="local-size-row"><span>변환 전 <b>{formatBytes(videoFile.size)}</b>{videoInfo && <small>{videoInfo.width}×{videoInfo.height} · {formatDuration(videoInfo.duration)}</small>}</span><i aria-hidden="true">→</i><span>변환 후 <b>{output ? formatBytes(output.size) : "계산 전"}</b>{reduction !== null && <small className={reduction >= 0 ? "saved" : "larger"}>{reduction >= 0 ? `${reduction}% 감소` : `${Math.abs(reduction)}% 증가`}</small>}</span></div>}

    {loading && <div className="local-progress" aria-label={`변환 진행률 ${progress}%`}><i style={{ width: `${progress}%` }} /></div>}
    {status && <p className="local-status" aria-live="polite">{status}</p>}
    <div className="local-actions"><button type="button" onClick={convert} disabled={!videoFile || loading}>{loading ? `변환 중 ${progress}%` : "내 기기에서 용량 줄이기"}</button>{output && <a href={output.url} download={output.name}>변환 영상 저장</a>}</div>
    <small className="local-limit-note">모바일에서는 긴 영상이 메모리 부족으로 중단될 수 있습니다. 원본보다 결과가 커지면 더 낮은 해상도나 ‘작은 용량’을 선택하세요.</small>
  </section>;
}

function extensionOf(name: string) {
  return name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "";
}

function safeBaseName(name: string) {
  return name.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9가-힣_-]+/g, "-").replace(/^-+|-+$/g, "") || "clipchak-video";
}

function qualityName(value: string) {
  return value === "24" ? "high" : value === "32" ? "small" : "balanced";
}

function shortSide(info: VideoInfo | null) {
  if (!info?.width || !info.height) return 2160;
  return Math.min(info.width, info.height);
}

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "확인 불가";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** index;
  return `${value >= 100 || index === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[index]}`;
}

function formatDuration(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return "재생시간 확인 불가";
  const minutes = Math.floor(seconds / 60);
  const rest = Math.round(seconds % 60);
  return `${minutes}:${String(rest).padStart(2, "0")}`;
}
