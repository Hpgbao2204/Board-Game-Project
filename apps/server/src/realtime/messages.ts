import type { ClientEvent, ServerEvent } from "@board-game-hub/shared";

export function parseClientEvent(raw: string): ClientEvent | null {
  try {
    const message = JSON.parse(raw) as Partial<ClientEvent>;

    if (!message || typeof message.type !== "string") {
      return null;
    }

    return message as ClientEvent;
  } catch {
    return null;
  }
}

export function errorEvent(code: string, message: string): ServerEvent {
  return {
    type: "error",
    payload: {
      code,
      message
    }
  };
}
