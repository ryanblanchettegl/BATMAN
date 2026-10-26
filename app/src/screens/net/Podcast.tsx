/* The podcast window on the Web page (Bill, 21 October: it replaces the chat room). The newest episode as a big tile,
   what is in it, and the three before it. Each opens the player (PodPlayer.tsx) as a pop-up. Read only: the engine
   writes the episodes at the end of every week (src/99-zpodcast.js). */
import { E } from '../../engine';
import { G, openModal } from '../../store';
import { Btn, Empty } from '../../kit';

export function Podcast() {
  const S = G.S, I = E.podcast(S), ep = I.eps[0];
  const open = (n: number) => openModal({ kind: 'podcast', n });
  if (!ep) return <div class="podcast" data-t="podcast"><Empty>No episodes yet. {I.show} comes out at the end of every week.</Empty></div>;
  return <div class="podcast" data-t="podcast">
    <div class="pod-top"><b>{I.show}</b><span>{I.hosts.map((h: any) => h.name + ' (' + h.role.toLowerCase() + ')').join(' and ')}</span></div>
    <button type="button" class="pod-new" data-t="pod-play" data-v={ep.n} data-home onClick={() => open(ep.n)}>
      <span class="pod-when">Newest episode {'·'} {ep.label}</span>
      <b class="pod-title">{ep.title}</b>
      <span class="pod-len">{ep.mins} {ep.mins === 1 ? 'minute' : 'minutes'} {'·'} {ep.segs.length} segments {'·'} captions on</span>
      <span class="pod-go" aria-hidden="true">{'▶'} Watch</span>
    </button>
    <ol class="pod-segs" aria-label="In this episode">{ep.segs.map((s: string, i: number) => <li key={i}>{s}</li>)}</ol>
    {I.eps.length > 1 && <>
      <h3 class="pod-h">Earlier episodes</h3>
      <ul class="pod-old">{I.eps.slice(1).map((e: any) => <li key={e.n}><Btn kind="sm" t="pod-play" d={{ v: e.n }} onClick={() => open(e.n)}>{e.title}</Btn><span class="muted">{e.label} {'·'} {e.mins} min</span></li>)}</ul>
    </>}
    {I.rec.r + I.rec.x > 0 && <p class="pod-foot">{I.hosts[0].name}’s picks: {I.rec.r} right, {I.rec.x} wrong.</p>}
  </div>;
}
