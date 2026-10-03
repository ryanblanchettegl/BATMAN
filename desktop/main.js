// Desktop wrapper for Steam. UNTESTED scaffold: it has not been run against Electron or the Steam client yet.
// Set STEAM_APP_ID to your app id (480 is Valve's public test app).
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let steam = null;
try {
  const steamworks = require('steamworks.js');
  steam = steamworks.init(Number(process.env.STEAM_APP_ID) || 480);
  steamworks.electronEnableSteamOverlay();
} catch (e) {
  console.warn('Steam not available, achievements stay local:', e.message);
}

// The game calls window.gpSteam.unlock('ACH_...') for every achievement it awards.
ipcMain.on('gp-unlock', (_event, id) => {
  try { if (steam && !steam.achievement.isActivated(id)) steam.achievement.activate(id); } catch (e) { console.warn(e.message); }
});

function createWindow() {
  const win = new BrowserWindow({
    width: 1360, height: 900, backgroundColor: '#121419',
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true }
  });
  win.setMenuBarVisibility(false);
  win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
}
app.whenReady().then(createWindow);
app.on('window-all-closed', () => app.quit());
