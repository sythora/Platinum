import express from "express"
import { createServer } from "node:http"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import fs from "node:fs"
import { load } from "cheerio"
// cheerio for  the config actually working


// imports 
import { baremuxPath } from "@mercuryworkshop/bare-mux/node"
import { epoxyPath } from "@mercuryworkshop/epoxy-transport"
import { libcurlPath } from "@mercuryworkshop/libcurl-transport"
import { server as wisp } from "@mercuryworkshop/wisp-js/server"
import { uvPath } from "@titaniumnetwork-dev/ultraviolet"

// setup basic stuff cuz node is not sigma
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// main function i guess
export function create_platinum_server(opts = {}) {
  // defaults cuz idk anyone that passes args correctly
  const static_dir = opts.staticDir || "public"
  const port = opts.port || 8080
  const proxy = opts.proxy || "ultraviolet"
  const transport = opts.transport || "epoxy"

  // figure out where u even are
  const cwd = process.cwd()
  let static_path
  if (static_dir.startsWith("/") || static_dir.includes(":")) {
    static_path = static_dir // absolute path i guess
  } else {
    static_path = join(cwd, static_dir) // make it absolute anyway
  }

  // scramjet folder (pls exist)
  const scramjet_path = join(__dirname, "scramjet")

  // client files (pray these r there and not get a serviceworker error)
  const client_path = join(__dirname, "..", "client")

  // express bc its skid free
  const app = express()
  const server = createServer(app)

  // baremux my beloved
  app.use("/baremux/", express.static(baremuxPath))
  app.use("/client/", express.static(client_path))

  // transport logic nobody even knows how to use
  if (transport === "epoxy") app.use("/epoxy/", express.static(epoxyPath))
  else if (transport === "libcurl") app.use("/libcurl/", express.static(libcurlPath))

  // this is the most scuffed part of client cuz sw are EXtREMLY WEIRD
  app.get("/sw.js", (req, res) => {
    res.setHeader("Service-Worker-Allowed", "/")
    res.sendFile(join(__dirname, "client", "../../client/sw.js"))
  })

  // proxy stuff  honestly confusing but it works (dont touch)
  if (proxy === "ultraviolet") {

    
    app.use("/", express.static(uvPath))
    app.use("/scram/", express.static(scramjet_path))
  } else if (proxy === "scramjet") {
    if (fs.existsSync(scramjet_path)) {
      app.use("/scram/", express.static(scramjet_path))
      app.use("/uv/", express.static(uvPath))
    } else {
      console.error("[err] scramjet path not found:", scramjet_path)
    }
  } else {
    console.warn("[warn] unknown proxy:", proxy)
  }

  // helper function to inject config using cheerio (actually works now)
  function injectConfig(html) {
    try {
      const $ = load(html)
      const configScript = `window.__PLATINUM_CONFIG__={proxy:"${proxy}",transport:"${transport}"};`
      
      // try to inject into head, fallback to prepending to body
      if ($('head').length) {
        $('head').prepend(`<script>${configScript}</script>`)
      } else if ($('body').length) {
        $('body').prepend(`<script>${configScript}</script>`)
      } else {
        // no head or body? just prepend to entire document lol
        return `<script>${configScript}</script>${html}`
      }
      
      console.log("[platinum] config injected with cheerio")
      return $.html()
    } catch (err) {
      console.error("[platinum] cheerio injection failed:", err)
      return html
    }
  }

  // intercept HTML files and inject config
  app.use((req, res, next) => {
    // only intercept HTML requests
    if (req.path.endsWith('.html') || req.path === '/' || (!req.path.includes('.') && req.method === 'GET')) {
      const filePath = req.path === '/' 
        ? join(static_path, 'index.html')
        : join(static_path, req.path)
      
      // check if file exists and is HTML
      if (fs.existsSync(filePath) && filePath.endsWith('.html')) {
        try {
          let html = fs.readFileSync(filePath, 'utf8')
          html = injectConfig(html)
          return res.send(html)
        } catch (err) {
          console.error("[platinum] failed to read/inject file:", err)
        }
      }
    }
    next()
  })

  // chatgpt ui files go here (aka luis and jayce final boss)
  app.use(express.static(static_path))

  // main route, shows index if found or just shows json that was totally not copied from som stackoverflow thing
  app.get("/", (req, res) => {
    const index_path = join(static_path, "index.html")
    if (fs.existsSync(index_path)) {
      try {
        let html = fs.readFileSync(index_path, 'utf8')
        html = injectConfig(html)
        return res.send(html)
      } catch (err) {
        console.error("[platinum] failed to serve index:", err)
      }
    }
    res.json({
      msg: "platinum server running ",
      proxy,
      transport,
      staticDir: static_path,
      scramjetPath: scramjet_path
    })
  })

  // handle websocket upgrades cuz wisp said so
  server.on("upgrade", (req, sock, head) => {
    if (req.headers["upgrade"] !== "websocket") return sock.destroy()
    wisp.routeRequest(req, sock, head)
  })

  // return this duo like a proper sigma
  return { app, server }
}