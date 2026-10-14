/* The boards: the fan message board. Its mood nudges ticket demand, and the threads react to your shows. Read-only. */
import { E } from '../../engine';
import { G, me, plural, slice, view } from '../../store';
import { Meter, Empty, Txt, Name, Btn } from '../../kit';

function moodNote(mood: number): string {
  if (mood >= 75) return 'They love you right now. Ticket demand is up a little.';
  if (mood >= 45) return 'The usual grumbling.';
  return 'They have turned on the product. Ticket demand is down a little.';
}

/** Up and down votes for a post: steady for the same post, kinder to posts that liked the show. */
function votes(t: any, x: any, i: number): string { let h = 0; const k = t.w + ':' + x.u + ':' + i; for (let q = 0; q < k.length; q++) h = (h * 31 + k.charCodeAt(q)) % 997; const v = 4 + (h % 60) + (x.s > 0 ? 25 : (x.s < 0 ? -8 : 0)); return (v >= 0 ? '+' : '') + v; }

function Thread(p: { t: any }) {
  const t = p.t;
  return <div class="thread mb2">
    <p><b>{t.sub}</b></p>
    <p class="eyebrow">{E.cal(t.w).label} {'·'} {t.posts.length} {plural(t.posts.length, 'post')}</p>
    {t.posts.map((x: any, i: number) => <p class="post"><span class="u">{'<' + x.u + '>'}</span> <Txt>{x.t}</Txt> <span class="muted num votes">{votes(t, x, i)}</span></p>)}
  </div>;
}

export function Boards() {
  const S = G.S, P = me(), N = S.net || { mood: 60, threads: [] };
  return <>
    <p class="eyebrow">{'alt.wrestling.' + P.name.toLowerCase().replace(/[^a-z0-9]/g, '')}</p>
    <div class="mb2">
      <p>Mood of the board <Meter v={N.mood} kind={N.mood < 40 ? 'hot' : 'cool'} /> <span class="num">{Math.round(N.mood)}</span> <span class="muted">{moodNote(N.mood)}</span></p>
      {(() => { const C = E.criticList(S); return C.rows.length ? <>
        <p class="eyebrow mt2">{C.name}{'’'}s list: the best in the world right now</p>
        <ul class="list">{C.rows.map((r: any) => <li><span><span class="num">{r.rank}.</span> <Name w={r.w} /> <span class={r.mine ? 'good' : 'muted'}>{r.mine ? '(yours)' : ''}</span></span><span class="muted num">{r.score}{r.move ? (r.move > 0 ? ' · up ' + r.move : ' · down ' + (-r.move)) : (r.move === 0 ? '' : ' · new')}</span></li>)}</ul>
        <p class="muted mt1">Wrestlers read it. A place in his top ten lifts their mood, and the top spot more.</p>
      </> : null; })()}
    </div>
    {N.threads.length ? (() => { const PER = 2, pages = Math.ceil(N.threads.length / PER), bp = slice<{ pg: number }>('boards', () => ({ pg: 0 })), pg = Math.min(bp.pg, pages - 1);
      return <>{N.threads.slice(pg * PER, pg * PER + PER).map((t: any) => <Thread t={t} />)}
        {pages > 1 ? <div class="row mt1"><Btn kind="sm" t="boards-newer" disabled={pg === 0} onClick={() => view(() => { bp.pg = pg - 1; })}>Newer threads</Btn><span class="muted">Page {pg + 1} of {pages}</span>
          <Btn kind="sm" t="boards-older" disabled={pg >= pages - 1} onClick={() => view(() => { bp.pg = pg + 1; })}>Older threads</Btn></div> : null}</>; })()
      : <Empty>Nobody has posted yet. Run a show on Booking and they will have opinions.</Empty>}
  </>;
}
