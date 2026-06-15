"use client";

import { MonitorPlay } from "lucide-react";

export function ExplainerVideo({
  url,
  label = "Watch the short explainer",
}: {
  url?: string;
  label?: string;
}) {
  const embedUrl = getEmbeddableVideoUrl(url || "");

  return (
    <div className="overflow-hidden rounded-xl border border-black/[0.06]">
      <div className="flex items-center gap-2 border-b border-black/[0.06] bg-[#f5f5f7] px-4 py-2.5 text-[13px] font-semibold text-[#1d1d1f]">
        <MonitorPlay className="h-4 w-4 text-[#86868b]" />
        {label}
      </div>
      <div className="aspect-video bg-[#1d1d1f]">
        {embedUrl ? (
          <iframe
            src={embedUrl}
            title={label}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="h-full w-full"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center text-white">
            <MonitorPlay className="h-8 w-8 text-white/60" />
            <p className="text-[13px] font-medium">Explainer video coming soon</p>
            <p className="max-w-sm text-[12px] leading-5 text-white/55">
              Prefer watching over reading? A short walkthrough of this task
              will play here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function getEmbeddableVideoUrl(value: string) {
  if (!value) return "";

  try {
    const url = new URL(value);

    if (url.hostname.includes("youtube.com")) {
      const videoId = url.searchParams.get("v");
      return videoId ? `https://www.youtube.com/embed/${videoId}` : value;
    }

    if (url.hostname.includes("youtu.be")) {
      const videoId = url.pathname.replace("/", "");
      return videoId ? `https://www.youtube.com/embed/${videoId}` : value;
    }

    if (url.hostname.includes("vimeo.com")) {
      const videoId = url.pathname.split("/").filter(Boolean).at(0);
      return videoId ? `https://player.vimeo.com/video/${videoId}` : value;
    }

    if (url.hostname.includes("loom.com")) {
      const videoId = url.pathname.split("/").filter(Boolean).at(-1);
      return videoId ? `https://www.loom.com/embed/${videoId}` : value;
    }

    return value;
  } catch {
    return "";
  }
}
