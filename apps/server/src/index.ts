import type { ServerEvent } from "@board-game-hub/shared";

const bootEvent: ServerEvent = {
  type: "server_ready",
  payload: {
    service: "board-game-hub-server"
  }
};

console.log(JSON.stringify(bootEvent));
