import { EventEmitter } from "events";

export const messageEvents = new EventEmitter();
messageEvents.setMaxListeners(100);

export const MESSAGE_NEW = "message:new";
export const MESSAGE_READ = "message:read";
export const CONVERSATION_NEW = "conversation:new";

export type SSEEvent = {
  type: string;
  payload: any;
  timestamp: number;
};
