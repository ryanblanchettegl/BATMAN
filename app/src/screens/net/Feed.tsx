/* The feed as a 90s chat room about wrestling (Ryan, 14 October): screen names and what they type, oldest at the top,
   the newest line at the bottom, and who is in the room down the side. Wrestlers, the press, companies and fans all
   drop in. Read-only: the booker lurks. */
import { useLayoutEffect, useRef } from 'preact/hooks';
import { E } from '../../engine';
import { G } from '../../store';
import { Empty, Txt } from '../../kit';

const WHO: Record<string, string> = { w: 'wrestler', p: 'press', c: 'company', f: 'fan' };
/** A screen name from a handle: no @, no spaces. */
function sn(p: any): string { return String(p.u || p.n || 'Guest').replace(/^@/, '').replace(/\s+/g, ''); }

export function Feed() {
  const S = G.S, all: any[] = E.feed(S), L = all.slice(0, 60).reverse(), box = useRef<HTMLDivElement>(null);
  // a chat room opens on the newest line
  useLayoutEffect(() => { const b = box.current; if (b) b.scrollTop = b.scrollHeight; });
  if (!all.length) return <Empty>The room is empty. Run a show on Booking and people come in to talk about it.</Empty>;
  const here: Record<string, string> = {}; L.slice(-25).forEach(p => { here[sn(p)] = p.k; });
  const lines: any[] = []; let wk = -1;
  L.forEach((p, i) => {
    if (p.w !== wk) { wk = p.w; lines.push(<p key={'w' + i} class="cr-sys">*** {E.cal(p.w).label} ***</p>); }
    lines.push(<p key={i} class={'cr-ln fp ' + (WHO[p.k] || '')}><b class={'cr-sn k-' + p.k}>{sn(p)}:</b> <Txt>{p.t}</Txt></p>);
  });
  return <div class="chatroom" data-t="chatroom">
    <div class="cr-top"><b>Wrestling Talk</b> <span>{Object.keys(here).length} people here</span></div>
    <div class="cr-body">
      <div class="cr-log feed feedbox" ref={box} tabIndex={0} role="log" aria-label="The chat room, newest at the bottom" data-t="feed-scroll">{lines}</div>
      <ul class="cr-who" aria-label="People here">{Object.keys(here).map(n => <li key={n} class={'k-' + here[n]}>{n}</li>)}</ul>
    </div>
    <p class="cr-foot">You are lurking. The booker does not post.</p>
  </div>;
}
