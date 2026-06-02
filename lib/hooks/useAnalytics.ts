"use client";

import { useEffect, useRef } from "react";

function getVisitorId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem("jandosoft_visitor_id");
  if (!id) {
    id = crypto.randomUUID?.() || Math.random().toString(36).substring(2) + Date.now().toString(36);
    localStorage.setItem("jandosoft_visitor_id", id);
  }
  return id;
}

export function useAnalytics(slug?: string | null) {
  const tracked = useRef(false);

  useEffect(() => {
    if (!slug || tracked.current) return;
    tracked.current = true;

    const visitorId = getVisitorId();
    const path = window.location.pathname.replace(`/s/${slug}`, "") || "/";

    fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug,
        path,
        referrer: document.referrer || "",
        visitorId,
      }),
    }).catch(() => {});
  }, [slug]);
}
