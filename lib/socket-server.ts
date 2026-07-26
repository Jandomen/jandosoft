import { Server as SocketIOServer } from "socket.io";

declare global {
  var __io: SocketIOServer | undefined;
}

export function getIO(): SocketIOServer | null {
  return globalThis.__io || null;
}

function emit(room: string, event: string, data: any) {
  const io = getIO();
  if (io) {
    io.to(room).emit(event, data);
  }
}

export function emitAffiliateEvent(event: string, data: any) {
  emit("admin", event, data);
}

export function emitOrderEvent(storeId: string, event: string, data: any) {
  emit(`store:${storeId}`, event, data);
}

export function emitWaiterCallEvent(storeId: string, event: string, data: any) {
  emit(`store:${storeId}`, event, data);
}

export function emitWhatsAppEvent(storeId: string, event: string, data: any) {
  emit(`store:${storeId}`, event, data);
}

export function emitMessageEvent(identifier: string, event: string, data: any) {
  emit(`user:${identifier}`, event, data);
}

export function emitUserEvent(identifier: string, event: string, data: any) {
  emit(`user:${identifier}`, event, data);
}
