const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('gpSteam', { unlock: (id) => ipcRenderer.send('gp-unlock', id) });
