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

// The World Editor calls window.gpSteam.workshopUpload(pkg) to share a world, and window.gpSteam.workshopWorlds()
// to read the worlds the player has subscribed to. UNTESTED like the rest of this file: the steamworks.js calls
// (workshop.createItem, updateItem, getSubscribedItems, installInfo) are written from its documentation and have not been run.
const fs = require('fs'), os = require('os');
ipcMain.handle('gp-workshop-upload', async (_event, pkg) => {
  if (!steam) return { ok: false, msg: 'Steam is not running' };
  try {
    const man = (pkg && pkg.manifest) || {}, dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ewf-world-'));
    fs.writeFileSync(path.join(dir, 'universe.json'), JSON.stringify(pkg));
    const made = await steam.workshop.createItem();
    if (made.needsToAcceptAgreement) return { ok: false, msg: 'Accept the Steam Workshop agreement in Steam first' };
    await steam.workshop.updateItem(made.itemId, { title: String(man.name || 'EWF Wrestling Manager world'), description: String(man.description || '') + (man.author ? '\nBy ' + man.author : ''), contentPath: dir, tags: ['World'], changeNote: 'Version ' + String(man.version || '1.0') });
    return { ok: true, id: String(made.itemId) };
  } catch (e) { return { ok: false, msg: e.message }; }
});
ipcMain.handle('gp-workshop-worlds', async () => {
  if (!steam) return [];
  try {
    return steam.workshop.getSubscribedItems().map(id => {
      const info = steam.workshop.installInfo(id); if (!info || !info.folder) return null;
      try { return JSON.parse(fs.readFileSync(path.join(info.folder, 'universe.json'), 'utf8')); } catch (e) { return null; }
    }).filter(Boolean);
  } catch (e) { console.warn(e.message); return []; }
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
