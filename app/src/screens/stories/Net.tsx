/* The Net: the fan message board. Its mood nudges ticket demand, and the threads react to your shows. Read-only. */
import { E } from '../../engine';
import { G, me, plural } from '../../store';
import { Head, Panel, Meter, Empty, Txt } from '../../kit';

function moodNote(mood: number): string {
  if (mood >= 75) return 'They love you right now. Ticket demand is up a little.';
  if (mood >= 45) return 'The usual grumbling.';
  return 'They have turned on the product. Ticket demand is down a little.';
}

function Thread(p: { t: any }) {
  const t = p.t;
  return <Panel cls="mb2" title={t.sub}>
    <p class="eyebrow">{E.cal(t.w).label} {'·'} {t.posts.length} {plural(t.posts.length, 'post')}</p>
    {t.posts.map((x: any) => <p class="post"><span class="u">{'<' + x.u + '>'}</span> <Txt>{x.t}</Txt></p>)}
  </Panel>;
}

export function Net() {
  const S = G.S, P = me(), N = S.net || { mood: 60, threads: [] };
  return <>
    <Head eyebrow={'alt.wrestling.' + P.name.toLowerCase().replace(/[^a-z0-9]/g, '')} title="The Net" />
    <Panel cls="mb3">
      <p>Mood of the board <Meter v={N.mood} kind={N.mood < 40 ? 'hot' : 'cool'} /> <span class="num">{Math.round(N.mood)}</span> <span class="muted">{moodNote(N.mood)}</span></p>
    </Panel>
    {N.threads.length ? N.threads.map((t: any) => <Thread t={t} />)
      : <Panel><Empty>Nobody has posted yet. Run a show on Booking and they will have opinions.</Empty></Panel>}
  </>;
}
