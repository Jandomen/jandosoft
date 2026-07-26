"use client";

import { useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

function getSocket(): Socket {
  if (!socket) {
    socket = io(typeof window !== "undefined" ? window.location.origin : "", {
      path: "/api/socketio",
      transports: ["websocket", "polling"],
    });
  }
  return socket;
}

export function useAdminSocket(onEvent: (event: string, data: any) => void) {
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    const s = getSocket();
    s.emit("join-admin");

    const handler = (event: string, data: any) => onEventRef.current(event, data);

    const events = ["affiliate-updated", "commission-created", "payout-completed", "affiliate-created"];
    events.forEach((e) => s.on(e, (data) => handler(e, data)));

    return () => events.forEach((e) => s.off(e));
  }, []);
}

export function useStoreSocket(storeId: string | null, onEvent: (event: string, data: any) => void) {
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    if (!storeId) return;
    const s = getSocket();
    const room = `store:${storeId}`;
    s.emit("join-store", storeId);

    const handler = (event: string, data: any) => onEventRef.current(event, data);

    const events = [
      "new-order",
      "order-updated",
      "new-waiter-call",
      "waiter-call-updated",
      "new-whatsapp-message",
      "whatsapp-conversation-updated",
    ];
    events.forEach((e) => s.on(e, (data) => handler(e, data)));

    return () => {
      events.forEach((e) => s.off(e));
      s.emit("leave-room", room);
    };
  }, [storeId]);
}

export function useUserSocket(identifier: string | null, onEvent: (event: string, data: any) => void) {
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    if (!identifier) return;
    const s = getSocket();
    s.emit("join-user", identifier);

    const handler = (event: string, data: any) => onEventRef.current(event, data);

    const events = ["unread-update", "user-updated", "new-message"];
    events.forEach((e) => s.on(e, (data) => handler(e, data)));

    return () => events.forEach((e) => s.off(e));
  }, [identifier]);
}
