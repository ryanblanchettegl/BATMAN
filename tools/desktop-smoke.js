// Desktop smoke test: starts desktop/main.js in a real Electron and checks the game reaches the title screen with the Steam bridge and no console errors.
// Run (after node build.js): EWF_ROOT=$PWD xvfb-run -a node_modules/electron/dist/electron --no-sandbox --disable-gpu tools/desktop-smoke.js
const ROOT = process.env.EWF_ROOT;
app.commandLine.appendSwitch('no-sandbox');
const t = setTimeout(() => { console.log('SMOKE timeout'); app.exit(2); }, 60000);
app.on('browser-window-created', (_e, win) => {
  const errs = [];
  win.webContents.on('console-message', (_ev, lvl, msg) => { if (lvl >= 3) errs.push(msg); });
  win.webContents.on('did-finish-load', async () => {
    await new Promise(r => setTimeout(r, 4000));
    const info = await win.webContents.executeJavaScript('JSON.stringify({title:document.title,hasBridge:typeof window.gpSteam,engine:typeof window.GP,bodyText:document.body.innerText.slice(0,80)})');
    console.log('SMOKE', info, 'errors:', JSON.stringify(errs.slice(0, 3)));
    clearTimeout(t); app.exit(errs.length ? 1 : 0);
  });
});
require(path.join(ROOT, 'desktop', 'main.js'));
