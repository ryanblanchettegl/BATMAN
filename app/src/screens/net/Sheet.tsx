/* The dirt sheet: one issue a week. What happened on your shows, around the other companies, in the business,
   and what people are whispering. The issue for the week in progress fills in as the week goes. */
import { E } from '../../engine';
import { G, me, slice, view } from '../../store';
import { Head, Panel, Tabs, Tag, Empty, Txt, PromoName, grade, stars } from '../../kit';

const LVL_KIND: Record<string, 'good' | 'warn' | 'bad'> = { sure: 'good', likely: 'warn', thin: 'bad' };

function Issue(p: { s: any; live: boolean }) {
  const s = p.s, P = me();
  return <>
    <Panel cls="mb3 lead">
      <p class="eyebrow">{s.label}{p.live ? ' · so far' : ''}</p>
      <h2 class="sheet-head">{s.lead.head}</h2>
      <p><Txt>{s.lead.text}</Txt></p>
    </Panel>
    <div class="cols">
      <div class="stack">
        <Panel title={P.name + ' this week'}>
          {s.yours.length ? s.yours.map((y: any) => <div class="sheet-show" key={y.show}>
            <p><b>{y.show}</b> <b class="gold">{E.repGrade(y)}</b>{y.exp != null ? <span class="muted"> {E.showVerdict(y.rating, y.exp).line}</span> : null}</p>
            {y.lines.length ? <ul class="sheet-lines">{y.lines.map((l: string, i: number) => <li key={i}><Txt>{l}</Txt></li>)}</ul> : null}
          </div>) : <Empty>No shows yet this week. Run one on Booking and the sheet will have a view.</Empty>}
          <p class="mt2"><b>The verdict:</b> {s.review}</p>
        </Panel>
        {s.best ? <Panel title="Match of the week"><p><b><Txt>{s.best.label}</Txt></b></p><p class="muted">{s.best.show} {'·'} <span class="gold">{stars(s.best.ov)}</span></p></Panel> : null}
        {s.next.length ? <Panel title="Coming up"><ul class="sheet-lines">{s.next.map((l: string, i: number) => <li key={i}><Txt>{l}</Txt></li>)}</ul></Panel> : null}
      </div>
      <div class="stack">
        <Panel title="Around the companies">
          {s.world.length ? <ul class="list">{s.world.map((w: any) => <li class="col" key={w.id}><span><PromoName id={w.id} /></span>
            <span>{w.lines.map((l: string, i: number) => <span key={i}>{i ? <br /> : null}<Txt>{l}</Txt></span>)}</span></li>)}</ul> : <Empty>Nothing from the other companies yet this week.</Empty>}
        </Panel>
        {s.business.length ? <Panel title="Business"><ul class="sheet-lines">{s.business.map((l: string, i: number) => <li key={i}><Txt>{l}</Txt></li>)}</ul></Panel> : null}
        <Panel title="Rumours">
          {s.rumours.length ? <ul class="list">{s.rumours.map((r: any, i: number) => <li key={i}><span><Txt>{r.t}</Txt></span><Tag kind={LVL_KIND[r.lvl]}>{E.NET_LVL[r.lvl]}</Tag></li>)}</ul> : <Empty>The rumour mill is quiet.</Empty>}
          <p class="muted mt2">Sure is on the record. Likely is what people in the business expect. Thin is talk, and talk is often wrong.</p>
        </Panel>
      </div>
    </div>
  </>;
}

export function Sheet() {
  const S = G.S, I = E.sheetInfo(S), st = slice<{ k: string }>('sheet', () => ({ k: '' }));
  // open on the week in progress once it has a show in it; before that, on last week's finished issue
  const def = I.now.yours.length || !I.past.length ? 'now' : 'p0', cur = st.k && (st.k === 'now' || I.past[+st.k.slice(1)]) ? st.k : def;
  const issue = cur === 'now' ? I.now : I.past[+cur.slice(1)];
  const tabs = [{ id: 'now', label: 'This week', t: 'sheet-tab', d: { v: 'now' } }].concat(I.past.map((x: any, i: number) => ({ id: 'p' + i, label: i === 0 ? 'Last week' : x.label.replace(/, \d+$/, ''), t: 'sheet-tab', d: { v: 'p' + i } })));
  return <>
    <Head eyebrow={issue.by} title="Dirt sheet" />
    <Tabs label="Issues" items={tabs} value={cur} onPick={id => view(() => { st.k = id; })} cls="mb3" />
    <Issue s={issue} live={cur === 'now'} />
  </>;
}
