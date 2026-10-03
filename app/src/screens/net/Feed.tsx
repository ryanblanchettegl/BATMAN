/* The feed: short posts from wrestlers, companies, the press and fans, newest first. Read-only. */
import { E } from '../../engine';
import { G, slice, view } from '../../store';
import { Head, Panel, Tabs, Empty, Txt } from '../../kit';

const KINDS: [string, string][] = [['', 'Everyone'], ['w', 'Wrestlers'], ['p', 'Press'], ['c', 'Companies'], ['f', 'Fans']];
const WHO: Record<string, string> = { w: 'wrestler', p: 'press', c: 'company', f: 'fan' };
function likes(n: number): string { return n >= 10000 ? Math.round(n / 1000) + 'K' : (n >= 1000 ? (n / 1000).toFixed(1) + 'K' : String(n)); }

export function Feed() {
  const S = G.S, st = slice<{ k: string; n: number }>('feed', () => ({ k: '', n: 20 })), all: any[] = E.feed(S), L = all.filter(p => !st.k || p.k === st.k);
  return <>
    <Head eyebrow="What they are saying" title="The feed" />
    <Tabs label="Who" items={KINDS.map(k => ({ id: k[0], label: k[1], t: 'feed-tab', d: { v: k[0] || 'all' } }))} value={st.k} onPick={id => view(() => { st.k = id; st.n = 20; })} cls="mb3" />
    {L.length ? <Panel>
      <ul class="feed">{L.slice(0, st.n).map((p: any, i: number) => <li key={p.w + p.u + i} class={'fp ' + (WHO[p.k] || '')}>
        <p class="fh"><b>{p.n}</b> <span class="muted">{p.u} {'·'} {E.cal(p.w).label.replace(/, \d+$/, '')}</span></p>
        <p class="ft"><Txt>{p.t}</Txt></p>
        <p class="muted num fl">{likes(p.l)} likes</p>
      </li>)}</ul>
      {L.length > st.n ? <div class="row mt2"><button type="button" class="btn sm" data-t="feed-more" onClick={() => view(() => { st.n += 20; })}>Show older posts</button></div> : null}
    </Panel> : <Panel><Empty>{all.length ? 'Nothing from them yet.' : 'Nobody has posted yet. Run a show on Booking and the feed fills up.'}</Empty></Panel>}
  </>;
}
