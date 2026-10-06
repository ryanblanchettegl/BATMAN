/* The pane beside the run sheet. It shows whatever is selected on the sheet (a match with its editor, or a promo or
   an angle), and when nothing is selected, one of the booking notes: what stands in the way and what the office
   thinks, the running order, the clock, the opening promo, the storylines in play, what you have promised.
   Everything here is sized to fit the pane: long lists turn pages instead of scrolling. */
import { ComponentChildren } from 'preact';
import { E } from '../../engine';
import { G, act, say, view, slice, openModal } from '../../store';
import { book } from '../../flow';
import { go } from '../../nav';
import { Panel, Tabs, Sel, Field, Tag, Name, Meter, CheckLine, Empty, Btn, Txt, Opt } from '../../kit';
import { Match, pickSide, setPlan, sel, pickMatch, pickSeg, moveMatch, removeMatch, run } from './run';
import { Shape } from './Shape';
import { Editor } from './Editor';
import { hm, openSeg, CATN, TopTag } from './Segments';
import { matchMeta } from './Card';

type OnCard = Record<number, 1>;
const DOT = ' · ';

/** A list that turns pages inside its box. `per` is how many items one page holds. */
function Paged<T>(p: { id: string; items: T[]; per: number; row: (x: T, i: number) => ComponentChildren; cls?: string }) {
  const st = slice<{ p: number }>('pg-' + p.id, () => ({ p: 0 })), pages = Math.max(1, Math.ceil(p.items.length / p.per));
  if (st.p >= pages) st.p = pages - 1;
  const turn = (d: number) => view(() => { st.p = Math.max(0, Math.min(pages - 1, st.p + d)); });
  return <>
    <ul class={p.cls || 'list'}>{p.items.slice(st.p * p.per, st.p * p.per + p.per).map((x, i) => p.row(x, st.p * p.per + i))}</ul>
    {pages > 1 ? <div class="row pgr" data-t={'pg-' + p.id}><Btn kind="sm" t="pg-prev" d={{ v: p.id }} disabled={st.p === 0} onClick={() => turn(-1)}>{'↑'}</Btn><span class="num muted">Page {st.p + 1} of {pages}</span><Btn kind="sm" t="pg-next" d={{ v: p.id }} disabled={st.p >= pages - 1} onClick={() => turn(1)}>{'↓'}</Btn></div> : null}
  </>;
}

/* ---------- what is selected on the sheet ---------- */
function MatchPane(p: { i: number; ck: any }) {
  const S = G.S, i = p.i, m: Match = S.card[i], n = S.card.length, it = p.ck.items.find((x: any) => x.t === 'match' && x.i === i), rd = E.agentReads(S)[i];
  const meta = matchMeta(m, i, n, it);
  return <Panel title={'Match ' + (i + 1) + ' of ' + n} cls="d1">
    <p class="meta d1-meta">{meta.map((x, k) => <span key={x[0]}>{k ? DOT : null}{x[1]}</span>)}</p>
    {rd ? <div class="agentsay" data-t="agent-say" data-v={i}>{rd.lines.map((l: any, k: number) => <p key={k} class={l.s > 0 ? 'good' : (l.s < 0 ? 'bad' : 'muted')} data-src={l.src}><span class="ag">{rd.who}{rd.own ? ', on this match' : ''}:</span> {'“'}{l.t}{'”'}</p>)}</div> : null}
    <Editor m={m} i={i} />
    <div class="row d1-btns">
      <Btn kind="sm" t="up" d={{ v: i }} label={'Move match ' + (i + 1) + ' earlier'} disabled={i === 0} onClick={() => moveMatch(i, -1)}>{'↑'} Earlier</Btn>
      <Btn kind="sm" t="down" d={{ v: i }} label={'Move match ' + (i + 1) + ' later'} disabled={i === n - 1} onClick={() => moveMatch(i, 1)}>{'↓'} Later</Btn>
      <Btn kind="sm" t="rm" d={{ v: i }} onClick={() => removeMatch(i)}>Remove</Btn>
      <Btn kind="sm" t="done" d={{ v: i }} onClick={() => pickMatch(i)}>Done</Btn>
    </div>
  </Panel>;
}
function SegPane(p: { slot: number; ck: any }) {
  const S = G.S, x = E.segInfo(S).list[p.slot], it = p.ck.items.find((q: any) => q.t === 'seg' && q.slot === p.slot);
  if (!x) return null;
  return <Panel title={x.t === 'any' ? E.SEGK[x.k].n : CATN[x.t] + ': ' + E.SEGK[x.k].n} cls="d1">
    <p class="who">{x.why ? <span class="bad">{x.why}</span> : (x.who.length ? x.who.map((id: number, q: number) => <>{q ? ', ' : null}<Name w={S.w[id]} /></>) : 'The writers decide')}</p>
    <p class="meta">{it ? 'On at ' + hm(it.at) + DOT : ''}{E.SEGLENN[x.len]}, {x.mins} minutes{it && it.top ? <>{DOT}<TopTag top={it.top} /></> : null}</p>
    <p class="muted mt1">{E.SEGK[x.k].d}</p>
    {x.look && x.look.read && x.k !== 'writers' ? <div class="agentsay" data-t="seg-read"><p class={x.look.read.k === 'good' ? 'good' : (x.look.read.k === 'bad' ? 'bad' : 'muted')}>{x.look.read.t}</p></div> : null}
    {x.look && x.look.notes && x.look.notes.length && x.k !== 'writers' ? <p class="muted">{x.look.notes.map((y: any, q: number) => <span key={q} class={y[0] > 0 ? 'good' : (y[0] < 0 ? 'bad' : undefined)}>{q ? DOT : ''}{y[0] > 0 ? '▲' : (y[0] < 0 ? '▼' : '')} {y[1]}</span>)}</p> : null}
    <div class="row d1-btns">
      <Btn kind="sm" t="seg-change" d={{ v: p.slot }} onClick={() => openSeg(p.slot)}>Change</Btn>
      <Btn kind="sm" t="seg-rm" d={{ v: p.slot }} onClick={() => act(() => { const r = E.setSeg(S, p.slot, null); sel().seg = -1; say(r.msg); })}>Remove</Btn>
      <Btn kind="sm" t="seg-done" d={{ v: p.slot }} onClick={() => pickSeg(p.slot)}>Done</Btn>
    </div>
  </Panel>;
}
/** Something happened before the bell and it needs an answer before the show can run. */
function PreShow(p: { pre: any }) {
  return <Panel title="Before the show" cls="d1">
    <p>{p.pre.text}</p>
    <div class="row mt2">{p.pre.choices.map((c: string, i: number) => <Btn kind="go" t="pre" d={{ c: i, home: i ? null : '' }} onClick={() => run('pre', i)}>{c}</Btn>)}</div>
  </Panel>;
}

/* ---------- the booking notes ---------- */
/** What stands in the way of the show, then what the writers and the announcers think of the card. */
function Notes() {
  const S = G.S, b = book(), v = E.validate(S, S.card), g = E.taskGate(S, 'show');
  const errs = b.tried ? v.errors : [], A = E.advice(S, S.card).filter((a: any) => a.tips.length), F = E.fogInfo(S);
  const tips: { who: string; t: string }[] = []; A.forEach((a: any) => a.tips.forEach((t: string) => tips.push({ who: a.who, t })));
  // how many notes a page holds: fewer on a tablet's shorter lines, and one fewer when a warning is showing above them
  const small = document.documentElement.dataset.screen === 'tablet', warn = S.card.length > 0 && v.warnings.length > 0 && !errs.length;
  return <Panel title="Staff notes">
    {!g.ok ? <div class="flash err" data-t="gate-note"><b>On your desk before this show can run</b><ul>{g.left.slice(0, 4).map((x: string) => <li><Txt>{x}</Txt></li>)}</ul>
      <div class="row mt1"><Btn kind="sm" t="gate-desk" onClick={() => go('desk')}>Go to the desk</Btn></div></div> : null}
    {errs.length ? <div class="flash err"><b>Fix before the show can run</b><ul>{errs.slice(0, 4).map((e: string) => <li>{e}</li>)}</ul></div> : null}
    {S.card.length > 0 && v.warnings.length > 0 && !errs.length ? <div class="flash">{v.warnings.slice(0, small ? 1 : 2).map((w: string, k: number) => <>{k ? <br /> : null}{w}</>)}</div> : null}
    {!S.card.length ? <Empty>Put a card together and your staff will look it over.</Empty>
      : (tips.length ? <Paged id="tips" items={tips} per={errs.length || !g.ok ? 1 : Math.max(1, (small ? 2 : 3) - (warn ? 1 : 0))} cls="tips" row={(x, k) => <li key={k}><span class="eyebrow">{x.who}</span><br />{'“'}{x.t}{'”'}</li>} />
        : <p class="good">The writers and the announcers have no complaint about this card.</p>)}
    <p class="muted mt1" data-t="fog-note">{F.head} comments on every match on the sheet: select one to read it. {F.pairs} {F.pairs === 1 ? 'pairing' : 'pairings'} seen so far.</p>
  </Panel>;
}
/** The clock: how the show opens, what is on the air at the top of each hour, and the time each kind takes. */
function Clock(p: { ck: any }) {
  const c = p.ck;
  return <Panel title="The top of the hour">
    <p><b>{c.open.n}.</b> <span class="muted">{c.open.d}</span></p>
    {c.tops.length ? <ul class="clocklist mt1" data-t="tops">{c.tops.map((t: any) => <li key={t.hour}><span class="gold num">{hm(t.at)}</span> {t.hour === 1 ? 'The show opens on' : 'Hour ' + t.hour + ' opens on'} <b>{c.items[t.k].label}</b></li>)}</ul> : <p class="mt1">Nothing is booked yet.</p>}
    <p class="muted mt1">Whatever is on when an hour starts is what people tuning in see. Put something strong there.</p>
    <div class="row mt1"><Btn kind="sm" t="open-guide2" onClick={() => openModal({ kind: 'openguide' })}>Ways to open a show</Btn>
      <Btn kind="sm" t="seg-suggest" onClick={() => act(() => { const r = E.segSuggest(G.S); say(r.msg, { err: !r.ok }); })}>Suggest a promo or an angle</Btn></div>
  </Panel>;
}
function Promo() {
  const S = G.S, L = E.promoBrief(S), pl = S.plan, o = pl ? E.promoOdds(S, pl) : null, x = E.xfState(S);
  return <Panel title="Opening promo">
    <div class="promo">
      <Field label="Who opens?"><Sel id="plan-sp" t="plan" d={{ k: 'sp' }} value={pl ? pl.sp : ''} onChange={v => setPlan('sp', v)}
        options={[['', 'Nobody: no scripted opening promo'], ...L.map((w: any) => [w.id, w.name + ' · mic ' + w.mic] as Opt)]} /></Field>
      {pl && <Field label="What kind?"><Sel id="plan-kind" t="plan" d={{ k: 'kind' }} value={pl.kind || 'interview'} onChange={v => setPlan('kind', v)} options={Object.keys(E.PKIND).map(k => [k, E.PKIND[k].n] as Opt)} /></Field>}
      {pl && <Field label="About what?"><Sel id="plan-topic" t="plan" d={{ k: 'topic' }} value={pl.topic} onChange={v => setPlan('topic', v)} options={Object.keys(E.TOPIC).map(k => [k, E.TOPIC[k].n] as Opt)} /></Field>}
      {pl && <Field label="How?"><Sel id="plan-del" t="plan" d={{ k: 'del' }} value={pl.del} onChange={v => setPlan('del', v)} options={Object.keys(E.DELIV).map(k => [k, E.DELIV[k].n] as Opt)} /></Field>}
    </div>
    {pl && o ? <>
      <p class="muted mt1 clamp2">{E.PKIND[pl.kind || 'interview'].d} {E.DELIV[pl.del].d} {o.why}.</p>
      <CheckLine label={'Delivery (up to ' + o.cap + ' of 10)'} ck={o.ck} />
      <p>Content <b>{o.content}</b> {'·'} Character <b>{o.character}</b> {'·'} Crowd <b>{o.crowd}</b> <span class="muted">out of 10</span></p>
    </> : <p class="muted mt1">Pick someone and you choose the subject and how tightly it is scripted. It goes on first and takes ten minutes off the clock.</p>}
    {x && <p class="note mt1 clamp2"><span>{x.kind === 'war' ? 'War with ' : 'Supershow with '}{S.promos[x.with].name}: {x.sc[0]}{'–'}{x.sc[1]}. Their wrestlers are marked {'“'}visiting{'”'} in the match editor{x.kind === 'war' ? '' : ' at the big event'}.</span></p>}
  </Panel>;
}

/** Rivalries in your company, hottest first. With `on`, each says whether both sides are booked tonight. `per` turns it into pages. */
export function Feuds(p: { on?: OnCard; per?: number }) {
  const S = G.S, fs = E.activeFeuds(S).filter((f: any) => f.promo === S.player).sort((a: any, b: any) => b.heat - a.heat);
  if (!fs.length) return <Empty>No rivalries yet. They start on their own once you run shows, or put two wrestlers with a grudge on the same card.</Empty>;
  const row = (f: any) => {
    const ids: number[] = f.a.concat(f.b), booked = p.on ? ids.filter(id => p.on![id]).length : -1, out = ids.filter(id => S.w[id].inj > 0).length;
    const meta = E.feudStage(f) + (f.kind === 'dream' ? ' · dream match' : '') + (out ? ' · injury' : '') + (booked >= 0 ? ' · ' + (booked === ids.length ? 'all booked tonight' : (booked ? 'partly booked tonight' : 'not booked tonight')) : '');
    return <li><span><b>{E.feudLabel(S, f)}</b><br /><span class="muted">{meta}</span></span><span class="row"><Meter v={f.heat} kind="hot" /><span class="num">{Math.round(f.heat)}</span></span></li>;
  };
  return p.per ? <Paged id="feuds" items={fs} per={p.per} row={row} /> : <ul class="list">{fs.map(row)}</ul>;
}

/** Tournament matches still owed, and whether tonight's card runs them. */
function TournOwed(p: { on: OnCard }) {
  const S = G.S, T = E.tournActive(S); if (!T || !T.pend.length) return <Empty>No tournament is running.</Empty>;
  const booked = (a: number, b: number) => !!p.on[a] && !!p.on[b] && S.card.some((m: any) => m.mt === '1v1' && ((m.sides[0][0] === a && m.sides[1][0] === b) || (m.sides[0][0] === b && m.sides[1][0] === a)));
  return <Panel title={T.name}>
    <Paged id="tourn" items={T.pend} per={5} row={(q: number[]) => { const on = booked(q[0], q[1]); return <li><span><Name w={S.w[q[0]]} /> <span class="muted">vs</span> <Name w={S.w[q[1]]} /></span><Tag kind={on ? 'good' : undefined}>{on ? 'On tonight' : 'Still to run'}</Tag></li>; }} />
    <p class="muted mt1 clamp2">Book these as singles matches. A disqualification or count-out in a knockout match means it has to be run again.</p>
  </Panel>;
}
function Targets() {
  const S = G.S;
  if (!S.quests.length) return <Panel title="Promises and targets"><Empty>Nothing promised yet. Wrestlers and the network will ask soon enough; answer them from the inbox on the desk.</Empty></Panel>;
  return <Panel title="Promises and targets"><Paged id="quests" items={S.quests} per={5} row={(q: any) => { const left = q.due - S.week; return <li><span><Txt>{q.text}</Txt></span><Tag kind={left <= 0 ? 'warn' : undefined}>{left <= 0 ? 'This week' : left + ' wk left'}</Tag></li>; }} /></Panel>;
}

export function Side(p: { on: OnCard; ck: any }) {
  const S = G.S, b = book(), s = sel(), show = S.queue[S.qi], T = E.tournActive(S);
  const pre = S.pre && !S.pre.done && S.pre.key === S.week + ':' + show.id ? S.pre : null;
  const k = b.side || 'advice', picked = b.edit >= 0 && b.edit < S.card.length ? 'm' : (s.seg >= 0 && s.seg < E.segInfo(S).booked ? 's' : '');
  const tabs = [['advice', 'Notes'], ['order', 'Order'], ['clock', 'Clock'], ['promo', 'Promo'], ['feuds', 'Stories'], ['targets', 'Targets']];
  if (T && T.pend.length) tabs.push(['tourn', 'Cup']);
  return <div class="b1-side">
    <Tabs label="Booking notes" value={pre || picked ? '' : k} onPick={pickSide} items={tabs.map(t => ({ id: t[0], label: t[1], t: 'bk', d: { v: t[0] } }))} />
    <div class="b1-pane" data-t="pane" data-v={pre ? 'pre' : (picked === 'm' ? 'match' : (picked === 's' ? 'seg' : k))}>
      {pre ? <PreShow pre={pre} />
        : picked === 'm' ? <MatchPane i={b.edit} ck={p.ck} />
        : picked === 's' ? <SegPane slot={s.seg} ck={p.ck} />
        : k === 'promo' ? <Promo />
        : k === 'order' ? <Panel title="Running order"><Shape /></Panel>
        : k === 'clock' ? <Clock ck={p.ck} />
        : k === 'feuds' ? <Panel title="Storylines in play"><Feuds on={p.on} per={4} /></Panel>
        : k === 'targets' ? <Targets />
        : k === 'tourn' ? <TournOwed on={p.on} />
        : <Notes />}
    </div>
  </div>;
}
