const { contextBridge } = require('electron')
contextBridge.exposeInMainWorld('elara', { version: '1.0.0' })
