"use client";

import { useAnalytics } from "@/lib/hooks/useAnalytics";

export default function TrackingWrapper({ slug }: { slug: string }) {
  useAnalytics(slug);
  return null;
}
