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
    <div
      className="max-w-md overflow-hidden border"
      style={{ borderColor: "var(--line-light)", borderRadius: "var(--r-2)" }}
    >
      <div
        className="flex items-center gap-2 px-4 py-2.5 text-[13px] font-semibold text-[var(--ink-900)]"
        style={{
          borderBottom: "1px solid var(--line-light)",
          background: "var(--sky-50)",
        }}
      >
        <MonitorPlay className="h-4 w-4 text-[var(--sky-500)]" />
        {label}
      </div>
      <div className="aspect-video bg-[var(--ink-900)]">
        {embedUrl ? (
          <iframe
            src={embedUrl}
            title={label}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="h-full w-full"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-5 text-center text-white">
            <MonitorPlay className="h-7 w-7 text-[var(--sky-400)]" />
            <p className="text-[13px] font-medium text-[var(--sky-100)]">
              Explainer coming soon
            </p>
            <p className="text-[12px] leading-5 text-[var(--sky-100)]/70">
              Prefer watching? A short walkthrough plays here.
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
