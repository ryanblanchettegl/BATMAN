/* The frame around every page: one grey menu bar, the row of page buttons, the message line, and the bottom line:
   the numbers and how they moved on the left, three small keys (Help, Options, Music), and the SPACE key at the right end. */
import { E } from '../engine';
import { G, ui, me, cash, view, openModal, PLATFORM, redraw, onReset } from '../store';
import { SECTIONS, sectionOf, go, weekDone, pending } from '../nav';
import { NAV, onBack } from '../input';
import { abandonGame } from '../flow';
import { Btn, Tabs, Logo } from '../kit';
import { SFX } from '../sfx';
import { AdvanceKey } from './Advance';

/** The Music button, at the right-hand end of the top bar. The soundtrack add-on (app/addons/soundtrack.js) opens its
    Jukebox for any click on an element marked data-jk="open", so this button needs no handler of its own. */
// Back on a remote or gamepad closes the Jukebox first
onBack(() => { const c = document.querySelector('.jk [data-jk="close"]') as HTMLElement | null; if (!c) return false; c.click(); return true; });
export function MusicBtn(p: { cap?: string }) { return <button type="button" class={p.cap != null ? 'nk mus' : 'f1 mus'} data-t="music" data-jk="open" aria-label="Music jukebox">{p.cap ? <i aria-hidden="true">{p.cap}</i> : null}{p.cap != null ? <em>{'♫'} Music</em> : <>{'♫'}<span class="mw"> Music</span></>}</button>; }

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
    <span class="ttl"><Logo of={P} size="chip" t="menu-logo" />{E.cal(S.week).label}</span>
  </nav>;
}

/** The page buttons of the current section. Sections with one page show nothing. */
export function SubNav() {
  const sec = sectionOf(ui.page);
  if (sec.pages.length < 2) return null;
  return <Tabs label={sec.n + ' pages'} value={ui.page} onPick={go} items={sec.pages.map(p => ({ id: p[0], t: 'page', d: { v: p[0] }, label: p[1] }))} />;
}

/** A figure on the bottom line, and how it has moved. Selecting it opens the Company overview, where the figures are explained. */
const stat = (k: string, label: string, v: string | number, cls?: string, mv?: { dir: number; t: string; say: string } | null) => <button type="button" class={cls} data-t="stat" data-v={k} aria-label={label + ' ' + v + (mv ? ', ' + mv.say : '') + '. Open the company overview.'} onClick={() => go('overview')}><b>{label}</b> {v}{mv ? <em class={'mv ' + (mv.dir > 0 ? 'up' : (mv.dir < 0 ? 'dn' : 'fl'))} data-t="moved" data-v={mv.dir}>{mv.t}</em> : null}</button>;
/** How one number moved, in the few characters the bottom line has room for. */
function mv(m: { d: number; dir: number } | undefined, fmt: (n: number) => string, since: string): { dir: number; t: string; say: string } | null {
  if (!m) return null;
  if (!m.dir) return { dir: 0, t: 'steady', say: 'steady ' + since };
  return { dir: m.dir, t: (m.dir > 0 ? '▲ ' : '▼ ') + fmt(Math.abs(m.d)), say: (m.dir > 0 ? 'up ' : 'down ') + fmt(Math.abs(m.d)) + ' ' + since };
}
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
  const S = G.S, P = me(), M = E.moved(S), since = M ? M.since : '';
  const tablet = document.documentElement.getAttribute('data-screen') === 'tablet', caps = !tablet && !NAV.tv;
  return <footer class="status">
    {stat('bp', 'BP', S.bp)}{stat('ap', 'AP', S.ap == null ? 0 : S.ap)}
    {stat('cash', 'Cash', cash(P.cash), undefined, M ? mv(M.cash, cash, since) : null)}
    {stat('pop', 'Pop', P.image.toFixed(1), undefined, M ? mv(M.image, n => n.toFixed(1), since) : null)}
    {!S.owner.me && stat('owner', 'Owner', Math.round(S.owner.trust), 'opt', M ? mv(M.trust, n => n % 1 ? n.toFixed(1) : String(n), since) : null)}
    {nowPlaying && nowPlaying.until > Date.now() ? <span class="np">{'♫'} {nowPlaying.n}</span> : null}
    {NAV.pad ? <span class="pads"><i /><span><b>A</b> select</span><span><b>B</b> back</span><span><b>LB RB</b> sections</span></span>
      : (NAV.on ? <span class="pads"><i /><span><b>OK</b> select</span><span><b>Back</b> back</span></span> : <span class="sp" />)}
    <span class="tools">
      <button type="button" class="nk" data-t="help" onClick={() => openModal({ kind: 'help' })}>{caps || NAV.pad ? <i aria-hidden="true">{NAV.pad ? 'X' : 'F1'}</i> : null}<em>Help</em></button>
      <button type="button" class="nk" data-t="options" onClick={() => openModal({ kind: 'options' })}>{caps && !NAV.pad ? <i aria-hidden="true">F2</i> : null}<em>Options</em></button>
      <MusicBtn cap={NAV.pad ? 'Y' : (caps ? 'F3' : '')} />
    </span>
    <AdvanceKey />
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
