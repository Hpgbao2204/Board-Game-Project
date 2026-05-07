import { startWebSocketServer } from "./realtime/websocketServer";

const port = Number(process.env.PORT ?? 8787);

startWebSocketServer({
  port
});
