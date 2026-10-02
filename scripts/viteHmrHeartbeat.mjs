export function viteHmrHeartbeat(intervalMs = 10_000) {
  return {
    name: "rabbitcv-hmr-heartbeat",
    apply: "serve",
    configureServer(server) {
      // WebSocket control pings do not rely on background-tab JS timers.
      const timer = setInterval(() => {
        for (const client of server.ws.clients) {
          if (client.socket.readyState === 1) client.socket.ping();
        }
      }, intervalMs);
      timer.unref();
      server.httpServer?.once("close", () => clearInterval(timer));
    },
  };
}
