// Ultraviolet (still fine)
importScripts("/uv/uv.bundle.js");
importScripts("/uv/uv.config.js");
importScripts("/uv/uv.sw.js");

// Scramjet (new layout)
importScripts("/scram/scramjet.all.js");

const uv = new UVServiceWorker();
const { ScramjetServiceWorker } = $scramjetLoadWorker();
const scramjet = new ScramjetServiceWorker({
  files: {
    wasm: "/scram/scramjet.wasm.wasm",
    worker: "/scram/scramjet.bundle.js",
    sync: "/scram/scramjet.sync.js"
  }
});

let secretedata; // def not ripped out of sj

self.addEventListener("message", ({ data }) => {
  if (data.type === "secretedata") secretedata = data;
});

async function handleRequest(event) {
  if (uv.route(event)) return await uv.fetch(event);

  await scramjet.loadConfig();
  if (scramjet.route(event)) return await scramjet.fetch(event);

  return await fetch(event.request);
}

self.addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event));
});
