/* After the show: where a show ends. The grade and the verdict, the matter the night left that needs an answer, and
   everything else it left behind (injuries, the locker room, the gate, television, the writers, the dirt sheet).
   A list on the left, whatever is picked on the right. From here the player goes to the Office, where Before the
   show is the first thing on the desk. The Office has a button that comes back here. */
import { E } from '../../engine';
import { G, act, view, slice } from '../../store';
import { Head, Panel, Btn, Tag, Txt, CheckLine } from '../../kit';
import { nightFull } from './run';

export function After() {
  const S = G.S, A = E.afterShow(S); if (!A) return null;
  const st = slice<{ k: string; key: string }>('after', () => ({ k: '', key: '' }));
  if (st.key !== A.key) { st.key = A.key; st.k = A.items[0] ? A.items[0].k : ''; }
  const it = A.items.find((x: any) => x.k === st.k) || A.items[0];
  const ev = A.matter ? S.inbox.find((e: any) => e.id === A.matter.id) : null;
  return <div data-t="after-screen">
    <Head eyebrow="After the show" title={A.name} />
    <Panel cls="mb2">
      <p data-t="after-verdict"><b class="gold big" data-t="after-grade">{A.grade}</b> {'·'} <b>{A.head}.</b> <span class="muted">{A.line}</span></p>
    </Panel>
    {ev ? <Panel title={ev.done ? 'What the night left you: answered' : 'What the night left you: it needs an answer'} cls="mb2">
      <div data-t="after-matter" data-done={ev.done ? '1' : '0'}>
        <p class={ev.done ? 'muted' : undefined}><Txt>{ev.text}</Txt></p>
        {ev.done ? <p class={ev.roll ? (ev.roll.ok ? 'good' : 'bad') : 'good'}><Txt>{ev.result}</Txt></p> : <>
          {ev.checks ? Object.keys(ev.checks).map(k => <CheckLine label={ev.choices[k]} ck={ev.checks[k]} />) : null}
          <div class="row mt1">{ev.choices.map((c: string, i: number) => <Btn kind="sm" t="after-answer" d={{ c: i }} onClick={() => act(() => { E.resolveEvent(S, ev.id, i); })}>{c}</Btn>)}</div>
          <p class="muted mt1">It can wait until you are at your desk. The week cannot end until it is answered.</p></>}
      </div>
    </Panel> : null}
    <div class="cols">
      <Panel title="The night">
        <ul class="list" data-t="after-list">{A.items.map((x: any) => <li key={x.k} data-t="after-item" data-v={x.k} class={it && it.k === x.k ? 'on' : undefined}>
          <span><b>{x.n}</b> <span class={x.tone === 'bad' ? 'bad' : (x.tone === 'good' ? 'good' : 'muted')}><Txt>{x.line}</Txt></span></span>
          <Btn kind="sm" t="after-look" d={{ v: x.k }} on={it && it.k === x.k} onClick={() => view(() => { st.k = x.k; })}>{it && it.k === x.k ? 'Showing' : 'More'}</Btn></li>)}</ul>
      </Panel>
      {it ? <Panel title={it.n}>
        <div data-t="night-detail" data-v={it.k}>{it.detail.map((x: string) => <p class="mb1"><Txt>{x}</Txt></p>)}</div>
        {it.tone === 'bad' ? <p class="mt1"><Tag kind="bad">Trouble</Tag></p> : null}
      </Panel> : null}
    </div>
    <div class="row mt3">
      <Btn kind="sm" t="after-full" onClick={nightFull}>Match by match</Btn>
      <span class="muted">The yellow button: on to the Office. {A.left > 0 ? 'The next show is waiting on your desk.' : 'Every show this week has run.'}</span>
    </div>
  </div>;
}
