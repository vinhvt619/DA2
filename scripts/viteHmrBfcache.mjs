import { relative } from "node:path";

export function createHmrPageLifecycle({ window, document, disconnect, reconnect, onError }) {
  const retiredSockets = new WeakSet();
  let socket;
  let suspended = false;
  let disconnecting = Promise.resolve();
  const suspend = () => {
    if (suspended) return;
    suspended = true;
    if (socket) retiredSockets.add(socket);
    disconnecting = Promise.resolve(disconnect());
  };
  const restore = () => {
    if (!suspended) return;
    suspended = false;
    disconnecting.then(reconnect).catch(onError);
  };
  const onPageHide = (event) => { if (event.persisted) suspend(); };
  const onPageShow = (event) => { if (event.persisted) restore(); };
  window.addEventListener("pagehide", onPageHide);
  window.addEventListener("pageshow", onPageShow);
  document.addEventListener("freeze", suspend);
  document.addEventListener("resume", restore);
  return {
    rememberSocket: (value) => { socket = value; },
    ignoresDisconnect: (value) => retiredSockets.has(value),
    dispose() {
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("pageshow", onPageShow);
      document.removeEventListener("freeze", suspend);
      document.removeEventListener("resume", restore);
    },
  };
}

const connectMarker = "transport.connect(createHMRHandler(handleMessage));";
const customMarker = 'case "custom":';

export function adaptViteClientForBfcache(code) {
  // This compatibility adapter is deliberately limited to Vite's dev client.
  // Fail visibly on an incompatible upgrade instead of silently disabling HMR.
  if (code.split(connectMarker).length !== 2 || code.split(customMarker).length !== 2) {
    throw new Error("RabbitCV: Vite client changed; update the BFCache HMR adapter before using this Vite version.");
  }
  const lifecycle = `
let rabbitcvHmrRevision;
const rabbitcvHmrLifecycle = (${createHmrPageLifecycle.toString()})({
  window, document,
  disconnect: () => transport.disconnect(),
  reconnect: () => transport.connect(createHMRHandler(handleMessage)),
  onError: (error) => console.warn('[RabbitCV HMR] Reconnect failed:', error),
});
${connectMarker}`;
  const handling = `${customMarker}
  if (payload.event === 'vite:ws:connect') rabbitcvHmrLifecycle.rememberSocket(payload.data.webSocket);
  if (payload.event === 'vite:ws:disconnect' && rabbitcvHmrLifecycle.ignoresDisconnect(payload.data.webSocket)) break;
  if (payload.event === 'rabbitcv:hmr-revision') {
    if (rabbitcvHmrRevision && rabbitcvHmrRevision !== payload.data) location.reload();
    rabbitcvHmrRevision = payload.data;
  }`;
  return code.replace(connectMarker, lifecycle).replace(customMarker, handling);
}

export function viteHmrBfcache() {
  return {
    name: "rabbitcv-hmr-bfcache",
    apply: "serve",
    enforce: "post",
    transform(code, id) {
      if (!id.replaceAll("\\", "/").split("?")[0].endsWith("/vite/dist/client/client.mjs")) return;
      return { code: adaptViteClientForBfcache(code), map: null };
    },
    configureServer(server) {
      const epoch = Date.now();
      let revision = 0;
      const onChange = (file) => {
        const path = relative(server.config.root, file).replaceAll("\\", "/");
        if (path.startsWith("src/") || path.startsWith("shared/") || path === "index.html") revision += 1;
      };
      server.watcher.on("change", onChange);
      server.ws.on("connection", (socket) => {
        socket.send(JSON.stringify({ type: "custom", event: "rabbitcv:hmr-revision", data: `${epoch}:${revision}` }));
      });
      server.httpServer?.once("close", () => server.watcher.off("change", onChange));
    },
  };
}
