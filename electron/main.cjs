const { app, BrowserWindow } = require('electron')
const { spawn } = require('child_process')
const path = require('path')
const http = require('http')

function backendPath() {
  return app.isPackaged
    ? path.join(process.resourcesPath, 'backend', 'server.js')
    : path.resolve(__dirname, '..', '..', 'elarabackend', 'server.js')
}

function startBackend() {
  const node = process.execPath
  const child = spawn(node, [backendPath()], {
    env: { ...process.env, PORT: '3000' },
    stdio: 'inherit'
  })
  child.on('exit', code => console.log('Backend exited', code))
}

function waitFor(url, tries = 60) {
  return new Promise((resolve, reject) => {
    const timer = setInterval(() => {
      http.get(url, res => {
        if (res.statusCode === 200) { clearInterval(timer); resolve() }
      }).on('error', () => {})
      if (--tries === 0) { clearInterval(timer); reject(new Error('backend not responding')) }
    }, 500)
  })
}

async function createWindow() {
  startBackend()
  try { await waitFor('http://localhost:3000/health') } catch {}
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    backgroundColor: '#0f0f23',
    webPreferences: { contextIsolation: true, preload: path.join(__dirname, 'preload.cjs') }
  })
  const dev = process.env.VITE_DEV_SERVER_URL
  if (dev) win.loadURL(dev)
  else win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
}

app.whenReady().then(createWindow)
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow() })
