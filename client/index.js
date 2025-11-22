// platinum client (actually works now)
const { ScramjetController } = $scramjetLoadController() // pls dont break

// SET LOCALSTORAGE FROM SERVER CONFIG ON PAGE LOAD
if (window.__PLATINUM_CONFIG__) {
  localStorage.setItem("proxy", window.__PLATINUM_CONFIG__.proxy)
  localStorage.setItem("transport", window.__PLATINUM_CONFIG__.transport)
  console.log("[platinum] config loaded from server:", window.__PLATINUM_CONFIG__)
}

// helper to load scripts dynamically
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = src
    script.onload = resolve
    script.onerror = reject
    document.head.appendChild(script)
  })
}

// init the thing
export async function init_platinum(cfg = {}) {
  const search_engine = cfg.searchEngine || "google"
  const on_ready = cfg.onReady || null

  // now it actually checks what proxy you want
  const proxy = window.__PLATINUM_CONFIG__?.proxy || "scramjet"
  const transport = window.__PLATINUM_CONFIG__?.transport || "epoxy"

  // save stuff so we remember what we're doing later
  localStorage.setItem("proxy", proxy)
  localStorage.setItem("transport", transport)
  localStorage.setItem("engine", search_engine)

  try {
    // setup baremux transport (pls connect and not get baremux port thing)
    const conn = new BareMux.BareMuxConnection("/baremux/worker.js")
    const wisp_url = (location.protocol === "https:" ? "wss" : "ws") + "://" + location.host + "/wisp/"
    await conn.setTransport(`/${transport}/index.mjs`, [{ wisp: wisp_url }])
    console.log(`[platinum] using ${transport} transport (${wisp_url})`)
  } catch (err) {
    console.error("[platinum] transport init went boom:", err)
  }

  // FIXED: only init scramjet if we actually want scramjet
  if (proxy === "scramjet") {
    try {
      const scramjet = new ScramjetController({
        files: {
          wasm: "/scram/scramjet.wasm.wasm", // wasm.wasm because scramjet devs drink white monster
          all: "/scram/scramjet.all.js",
          sync: "/scram/scramjet.sync.js",
        },
        flags: {
          rewriterLogs: false,
          scramitize: false, // ???????????
          cleanErrors: true,
          sourcemaps: true,
        },
      })
      window.sj = scramjet
      await scramjet.init()
      console.log("[platinum] scramjet actually started first try")
    } catch (err) {
      console.error("[platinum] scramjet died:", err)
    }
  }

  // FIXED: actually load UV if we want UV
  if (proxy === "ultraviolet") {
    try {
      // load UV bundle and config
      await loadScript("/uv.bundle.js")
      await loadScript("/uv.config.js")
      console.log("[platinum] ultraviolet loaded and ready")
    } catch (err) {
      console.error("[platinum] uv failed to load:", err)
    }
  }

  try {
    // register the lil service worker
    await navigator.serviceWorker.register("/sw.js", { scope: "/" })
    console.log("[platinum] sw registered (somehow)")
  } catch (err) {
    console.error("[platinum] sw failed lol:", err)
  }

  if (on_ready) on_ready()
}

// go somewhere on the internet
export async function navigate(input) {
  const proxy = localStorage.getItem("proxy") || "scramjet"
  const engine = localStorage.getItem("engine") || "google"

  let val = input.trim()

  // figure out if it's a url or just a search
  if (!is_url(val)) {
    val =
      engine === "google"
        ? `https://www.google.com/search?q=${encodeURIComponent(val)}`
        : `https://duckduckgo.com/?q=${encodeURIComponent(val)}`
  } else if (!val.startsWith("http")) {
    val = "https://" + val
  }

  // scramjet mode
  if (proxy === "scramjet") {
    if (!window.sj) {
      console.error("[platinum] bro scramjet not ready yet chill")
      return
    }

    const frame = window.sj.createFrame()
    document.getElementById("container")?.classList.add("browsing")
    document.getElementById("container")?.appendChild(frame.frame)
    await frame.go(val)
    return
  }

  // uv mode (NOW IT ACTUALLY WORKS)
  if (proxy === "ultraviolet") {
    if (typeof __uv$config === 'undefined') {
      console.error("[platinum] uv not loaded yet, did init fail?")
      return
    }
    val = __uv$config.prefix + __uv$config.encodeUrl(val)
  }

  // fallback to iframe or whatever works
  const iframe = document.getElementById("proxyFrame")
  const container = document.getElementById("container")
  if (iframe && container) {
    iframe.src = val
    container.classList.add("browsing")
  } else {
    window.open(val, "_blank")
  }
}

// checks if its a url or some random junk
export function is_url(v = "") {
  return /^http(s?):\/\//.test(v) || (v.includes(".") && v[0] !== " ")
}