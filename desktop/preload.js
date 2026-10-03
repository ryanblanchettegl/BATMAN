const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('gpSteam', {
  unlock: (id) => ipcRenderer.send('gp-unlock', id),
  workshopUpload: (pkg) => ipcRenderer.invoke('gp-workshop-upload', pkg),
  workshopWorlds: () => ipcRenderer.invoke('gp-workshop-worlds')
});
