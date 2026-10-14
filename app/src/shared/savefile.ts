/* Offering a file to the player. At a desk or in the Steam wrapper the browser downloads it. Inside the published
   artifact the page sits in a frame that cannot download by itself, so the viewer's downloads capability offers the
   file instead (the viewer is asked first). */
let viewerDl: any = null;
try { const c = (globalThis as any).claude; if (c && typeof c.use === 'function') Promise.resolve(c.use('downloads')).then((d: any) => { viewerDl = d; }, () => {}); } catch (e) { /* not in the viewer */ }
const atTop = (): boolean => { try { return window.self === window.top; } catch (e) { return false; } };
/** Can this page offer a file at all? */
export function canSaveFile(): boolean { return atTop() || !!viewerDl; }
/** Offer `text` as a file called `name`. Resolves 'saved', 'declined' or 'failed'. */
export function saveFile(name: string, text: string): Promise<'saved' | 'declined' | 'failed'> {
  if (!atTop() && viewerDl) return Promise.resolve(viewerDl.save({ filename: name, data: text })).then(() => 'saved' as const, (e: any) => (e && e.code === 'declined' ? 'declined' as const : 'failed' as const));
  try { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' })); a.download = name; document.body.appendChild(a); a.click(); a.remove(); return Promise.resolve('saved'); }
  catch (e) { return Promise.resolve('failed'); }
}
