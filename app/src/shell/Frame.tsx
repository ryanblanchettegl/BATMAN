/* The frame around every page: one grey menu bar, the row of page buttons, the message line, one grey status bar. */
import { E } from '../engine';
import { G, ui, me, cash, view, openModal, PLATFORM, redraw, onReset } from '../store';
import { SECTIONS, sectionOf, go, weekDone, pending } from '../nav';
import { NAV, onBack } from '../input';
import { abandonGame } from '../flow';
import { Btn, Tabs } from '../kit';
import { SFX } from '../sfx';

/** The Music button, at the right-hand end of the top bar. The soundtrack add-on (app/addons/soundtrack.js) opens its
    Jukebox for any click on an element marked data-jk="open", so this button needs no handler of its own. */
// Back on a remote or gamepad closes the Jukebox first
onBack(() => { const c = document.querySelector('.jk [data-jk="close"]') as HTMLElement | null; if (!c) return false; c.click(); return true; });
export function MusicBtn() { return <button type="button" class="f1 mus" data-t="music" data-jk="open" aria-label="Music jukebox">{'♫'}<span class="mw"> Music</span></button>; }

/** Manage: sponsor offers waiting, plus one if the house style still has to be set. */
function manageBadge(): number { const S = G.S; return (S.sponsors.length < 3 ? S.spOffers.length : 0) + (S.owner.pending ? 1 : 0); }
/** Roster: contracts of your wrestlers that end within four weeks. */
function endingSoon(): number { const S = G.S; return S.w.filter((w: any) => w.promo === S.player && !w.nw && w.con <= 4).length; }
export function MenuBar() {
  const S = G.S, P = me(), cur = sectionOf(ui.page), n = pending();
  return <nav class="menu" aria-label="Sections">
    {SECTIONS.map(s => {
      const badge = s.id === 'office' && n ? n : (s.id === 'booking' && !weekDone() ? S.queue.length - S.qi : (s.id === 'manage' ? manageBadge() : (s.id === 'roster' ? endingSoon() : 0)));
      return <button type="button" data-t="tab" data-v={s.id} aria-current={cur === s ? 'page' : undefined} onClick={() => go(s.id)}><u>{s.n.charAt(0)}</u>{s.n.slice(1)}{badge ? <span class="badge"> ({badge})</span> : null}</button>;
    })}
    <span class="ttl">{P.name} {'·'} {E.cal(S.week).label}</span>
  </nav>;
}

/** The page buttons of the current section. Sections with one page show nothing. */
export function SubNav() {
  const sec = sectionOf(ui.page);
  if (sec.pages.length < 2) return null;
  return <Tabs label={sec.n + ' pages'} value={ui.page} onPick={go} items={sec.pages.map(p => ({ id: p[0], t: 'page', d: { v: p[0] }, label: p[1] }))} />;
}

/** A figure in the status bar. Selecting it opens the Company overview, where the figures are explained. */
const stat = (k: string, label: string, v: string | number, cls?: string) => <button type="button" class={cls} data-t="stat" data-v={k} aria-label={label + ' ' + v + '. Open the company overview.'} onClick={() => go('overview')}><b>{label}</b> {v}</button>;
/** The name of the track that just started, shown in the status bar for three seconds. */
let nowPlaying: { n: string; until: number } | null = null;
window.addEventListener('ewf-track', (e: any) => {
  if (!G.S || !MP_ON()) return;
  nowPlaying = { n: String(e.detail && e.detail.name), until: Date.now() + 3000 }; redraw(); setTimeout(redraw, 3100);
});
function MP_ON() { return document.documentElement.getAttribute('data-music') !== 'off'; }
/** The notification bar, at the top of the screen under the menu: what changed because of what you just did, and
    achievements. One at a time; press it to move on. */
export function NoteBar() {
  const a = toastNow(); if (!a) return null;
  const next = () => { clearTimeout(timer); nextToast(); };
  if (a.note) return <button type="button" class={'toast note' + (a.k ? ' ' + a.k : '')} role="status" data-t="toast" data-v="note" onClick={next}>
    <span class="tn"><b>{a.h}</b></span><span class="td">{a.t}</span><span class="sp" />{queue.length > 1 && <span class="opt">+{queue.length - 1} more</span>}
  </button>;
  return <button type="button" class="toast" role="status" data-t="toast" onClick={next}>
    <span><b>{a.ms ? 'Milestone' : 'Achievement unlocked'}</b></span><span class="tn">{a.name}</span><span class="opt td">{a.desc}</span><span class="sp" />{queue.length > 1 && <span class="opt">+{queue.length - 1} more</span>}
  </button>;
}
export function StatusBar() {
  const S = G.S, P = me();
  return <footer class="status">
    {stat('bp', 'BP', S.bp)}{stat('ap', 'AP', S.ap == null ? 0 : S.ap)}{stat('cash', 'Cash', cash(P.cash))}{stat('pop', 'Pop', P.image.toFixed(1))}
    {!S.owner.me && stat('owner', 'Owner', Math.round(S.owner.trust), 'opt')}
    {nowPlaying && nowPlaying.until > Date.now() ? <span class="np">{'♫'} {nowPlaying.n}</span> : null}
    <span class="sp" />
    {NAV.pad ? <><span class="opt"><b>A</b> select</span><span class="opt"><b>B</b> back</span><span class="opt"><b>LB RB</b> sections</span><span class="opt"><b>X</b> help</span><span class="opt"><b>Y</b> music</span></> : (NAV.on ? <><span class="opt"><b>OK</b> select</span><span class="opt"><b>Back</b> back</span></> : null)}
    <span class="tools"><button type="button" data-t="options" onClick={() => openModal({ kind: 'options' })}>Options</button><button type="button" data-t="help" onClick={() => openModal({ kind: 'help' })}>Help</button><MusicBtn /></span>
  </footer>;
}

/** The one-line result of the last thing the player did, and the "start over?" bar. */
export function FlashBar() {
  return <>
    {ui.confirm === 'new' && <div class="flash err"><div class="row"><span>Start over? Your current game will be erased.</span>
      <Btn kind="danger" t="newgame-yes" onClick={abandonGame}>Yes, new game</Btn><Btn t="cancel" onClick={() => view(() => { ui.confirm = null; })}>Keep playing</Btn></div></div>}
    {ui.flash && <div class={'flash' + (ui.flash.err ? ' err' : '')} role="status">{ui.flash.text}</div>}
  </>;
}

/* The notification bar. The engine queues things in S.toasts: an achievement id, or a note {h, t, k} about something
   that changed because of what the player just did ("King Arthur will remember that"). Each one takes over the status
   bar for a few seconds, one at a time, so nothing ever covers the page. */
const queue: any[] = []; let timer: any = null;
function nextToast() { timer = null; queue.shift(); if (queue.length) timer = setTimeout(nextToast, 4200); redraw(); }
export function drainToasts() {
  const S = G.S; if (!S || !S.toasts.length) return;
  let added = false;
  let ach = false;
  while (S.toasts.length) {
    const id = S.toasts.shift();
    if (id && typeof id === 'object') { if (id.h) { queue.push({ note: true, h: String(id.h), t: String(id.t || ''), k: id.k === 'good' || id.k === 'bad' ? id.k : '' }); added = true; } continue; }
    if (!E.ACH.some((a: any) => a.id === id)) continue; { const a = E.ACH.find((q: any) => q.id === id); if (!a.ms) PLATFORM.unlock(id); } queue.push(id); added = true; ach = true;
  }
  if (!added) return;
  if (ach) SFX.ach();
  while (queue.length > 4) queue.splice(1, 1);
  if (!timer) timer = setTimeout(nextToast, 4200);
  redraw();
}
export function clearToasts() { queue.length = 0; if (timer) { clearTimeout(timer); timer = null; } }
onReset(clearToasts);
/** The achievement being announced, if any. */
export function toastNow(): any { return !queue.length ? null : (typeof queue[0] === 'object' ? queue[0] : E.ACH.find((q: any) => q.id === queue[0])); }
