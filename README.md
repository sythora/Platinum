# 🔷 Platinum.JS

A flexible web proxy framework to make your skid dream a reality.
## ✨ Features

- 🔄 **Proxy Support**: Switch between Ultraviolet and Scramjet through the server file (maybe have a switcher??)
- 🚀 **Multiple Transports**: Epoxy and Libcurl transport options
- 🔧 **Easy Configuration**: Setup in less than 10 minutes.
- 📦 **Modular Design**: Clean separation of client and server code

## 📦 Installation

```bash
npm install @sythora/platinum.js
```

## 🚀 Quick Start

### Server Setup

```javascript
import { create_platinum_server } from './server.js'

const { app, server } = create_platinum_server({
  staticDir: 'public',        // your static files directory
  port: 8080,                 // server port
  proxy: 'ultraviolet',       // 'ultraviolet' or 'scramjet'
  transport: 'epoxy'          // 'epoxy' or 'libcurl'
})

server.listen(8080, () => {
  console.log('Platinum server running on http://localhost:8080')
})
```

### Client Setup

```javascript
import { init_platinum, navigate } from './client.js'

// Initialize Platinum
await init_platinum({
  searchEngine: 'google',  // 'google' or 'duckduckgo'
  onReady: () => {
    console.log('Platinum is ready!')
  }
})

// Navigate to a URL
navigate('example.com')
navigate('search query')
```

## ⚙️ Configuration

### Server Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `staticDir` | string | `'public'` | Directory for static files |
| `port` | number | `8080` | Server port |
| `proxy` | string | `'ultraviolet'` | Proxy type: `'ultraviolet'` or `'scramjet'` |
| `transport` | string | `'epoxy'` | Transport type: `'epoxy'` or `'libcurl'` |

### Client Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `searchEngine` | string | `'google'` | Search engine: `'google'` or `'duckduckgo'` |
| `onReady` | function | `null` | Callback when initialization completes |




## 🔍 Usage Examples

### Navigate to a URL
```javascript
navigate('google.com')
navigate('https://example.com')
```

### Perform a search
```javascript
navigate('web proxies')  // Uses configured search engine
```

### Check current config
```javascript
console.log(window.__PLATINUM_CONFIG__)
// { proxy: "ultraviolet", transport: "epoxy" }
```

### Switch proxy types
Simply restart the server with different options:
```javascript
const { app, server } = create_platinum_server({
  proxy: 'scramjet',  // Changed from ultraviolet
  transport: 'libcurl'
})
```

## 🐛 Troubleshooting

### Config not loading
- Check browser console for `[platinum] config loaded from server`
- Ensure HTML has `<head>` tag for cfg injection

### Proxy not working
- Check if service worker registered: `navigator.serviceWorker.controller`
- Verify proxy files are accessible (check Network tab)
- Look for initialization errors in console

### Transport issues
- Ensure BareMux worker is accessible at `/baremux/worker.js`
- Check WISP connection in browser DevTools
- Verify transport files are served correctly


## 📄 License

MIT (probably, idk check with the original authors of UV/Scramjet/BareMux)
---