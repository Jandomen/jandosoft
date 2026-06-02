"use client";

import { useEffect, useRef, useCallback } from "react";

export function useSSE(
  conversationId: string | null,
  onMessage: (data: any) => void,
  onError?: (err: any) => void
) {
  const eventSourceRef = useRef<EventSource | null>(null);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  const cleanup = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!conversationId) {
      cleanup();
      return;
    }

    const url = `/api/conversations/${conversationId}/stream`;
    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessageRef.current(data);
      } catch {}
    };

    es.onerror = () => {
      es.close();
      eventSourceRef.current = null;
      onError?.(new Error("SSE connection failed"));
    };

    return cleanup;
  }, [conversationId, cleanup, onError]);
}
