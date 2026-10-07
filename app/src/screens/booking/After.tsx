/* After the show: where a show ends. The grade and the verdict, the matter the night left that needs an answer, and
   everything else it left behind (injuries, the locker room, the gate, television, the writers, the dirt sheet).
   A list on the left, whatever is picked on the right. From here the player goes to the Office, where Before the
   show is the first thing on the desk. The Office has a button that comes back here. */
import { E } from '../../engine';
import { G, act, view, slice } from '../../store';
import { Head, Panel, Btn, Txt, CheckLine } from '../../kit';
import { nightFull } from './run';

export function After() {
  const S = G.S, A = E.afterShow(S); if (!A) return null;
  const st = slice<{ k: string; key: string; p: number; lp: number }>('after', () => ({ k: '', key: '', p: 0, lp: 0 }));
  if (st.key !== A.key) { st.key = A.key; st.k = A.items[0] ? A.items[0].k : ''; st.p = 0; st.lp = 0; }
  const it = A.items.find((x: any) => x.k === st.k) || A.items[0];
  const ev = A.matter ? S.inbox.find((e: any) => e.id === A.matter.id) : null;
  // the pane turns pages when the night left more than fits beside an open matter; it never scrolls
  const per = ev && !ev.done ? 3 : 6, pages = it ? Math.max(1, Math.ceil(it.detail.length / per)) : 1, pg = Math.min(st.p || 0, pages - 1);
  const lper = ev && !ev.done ? 4 : 8, lpages = Math.max(1, Math.ceil(A.items.length / lper)), lp = Math.min(st.lp || 0, lpages - 1);
  return <div class="onescreen after1" data-t="after-screen">
    <Head eyebrow="After the show" title={A.name}>
      <p data-t="after-verdict"><b class="gold" data-t="after-grade">{A.grade}</b> {'·'} <b>{A.head}.</b> <span class="muted">{A.line}</span></p>
    </Head>
    {ev ? <Panel title={ev.done ? 'What the night left you: answered' : 'What the night left you: it needs an answer'}>
      <div data-t="after-matter" data-done={ev.done ? '1' : '0'}>
        <p class={ev.done ? 'muted' : undefined}><Txt>{ev.text}</Txt></p>
        {ev.done ? <p class={ev.roll ? (ev.roll.ok ? 'good' : 'bad') : 'good'}><Txt>{ev.result}</Txt></p> : <>
          {ev.checks ? Object.keys(ev.checks).map(k => <CheckLine label={ev.choices[k]} ck={ev.checks[k]} />) : null}
          <div class="row">{ev.choices.map((c: string, i: number) => <Btn kind="sm" t="after-answer" d={{ c: i }} onClick={() => act(() => { E.resolveEvent(S, ev.id, i); })}>{c}</Btn>)}
            <span class="muted">Or answer it at your desk. The week cannot end until you do.</span></div></>}
      </div>
    </Panel> : null}
    <div class="a1">
      <div class="a1-list" data-t="after-list"><p class="eyebrow">What the night left</p>
        {A.items.slice(lp * lper, lp * lper + lper).map((x: any) => <div key={x.k} data-t="after-item" data-v={x.k} class={'a1-r' + (it && it.k === x.k ? ' on' : '')}>
          <button type="button" data-t="after-look" data-v={x.k} aria-pressed={!!it && it.k === x.k} onClick={() => view(() => { st.k = x.k; st.p = 0; })}>
            <b>{x.n}</b><span class={x.tone === 'bad' ? 'bad' : (x.tone === 'good' ? 'good' : (x.tone === 'warn' ? 'warn' : 'muted'))}>{x.line}</span></button></div>)}
        {lpages > 1 ? <div class="row pgr" data-t="after-lpg"><Btn kind="sm" t="pg-prev" d={{ v: 'afterl' }} disabled={lp === 0} onClick={() => view(() => { st.lp = lp - 1; })}>{'↑'}</Btn><span class="num muted">Page {lp + 1} of {lpages}</span><Btn kind="sm" t="pg-next" d={{ v: 'afterl' }} disabled={lp >= lpages - 1} onClick={() => view(() => { st.lp = lp + 1; })}>{'↓'}</Btn></div> : null}
      </div>
      <div class="a1-pane">{it ? <><p class="eyebrow">{it.n}</p><div data-t="night-detail" data-v={it.k}>{it.detail.slice(pg * per, pg * per + per).map((x: string) => <p><Txt>{x}</Txt></p>)}</div>
        {pages > 1 ? <div class="row pgr" data-t="after-pg"><Btn kind="sm" t="pg-prev" d={{ v: 'after' }} disabled={pg === 0} onClick={() => view(() => { st.p = pg - 1; })}>{'↑'}</Btn><span class="num muted">Page {pg + 1} of {pages}</span><Btn kind="sm" t="pg-next" d={{ v: 'after' }} disabled={pg >= pages - 1} onClick={() => view(() => { st.p = pg + 1; })}>{'↓'}</Btn></div> : null}</> : null}</div>
    </div>
    <div class="row">
      <Btn kind="sm" t="after-full" onClick={nightFull}>Match by match</Btn>
      <span class="muted">The yellow button: on to the Office. {A.left > 0 ? 'The next show is waiting on your desk.' : 'Every show this week has run.'}</span>
    </div>
  </div>;
}
