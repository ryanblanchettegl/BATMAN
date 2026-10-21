/* The pane beside the run sheet. It shows whatever is selected on the sheet (a match with its editor, or a promo or
   an angle), and when nothing is selected, one of the booking notes: what stands in the way and what the office
   thinks, the running order, the clock, the opening promo, the storylines in play, what you have promised.
   Everything here is sized to fit the pane: long lists turn pages instead of scrolling. */
import { ComponentChildren } from 'preact';
import { E } from '../../engine';
import { G, act, say, view, slice, openModal, closeModal, Modal } from '../../store';
import { book } from '../../flow';
import { go } from '../../nav';
import { Window, Panel, Tabs, Sel, Field, Tag, Name, Meter, CheckLine, Empty, Btn, Txt, Opt, Group, LightPic } from '../../kit';
import { Match, pickSide, setPlan, sel, pickMatch, pickSeg, moveMatch, removeMatch, run, lockMatch, suggest } from './run';
import { Shape } from './Shape';
import { Editor } from './Editor';
import { hm, openSeg, CATN, TopTag } from './Segments';
import { matchMeta } from './Card';
import { SegPic } from '../../shared/moment';

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
/** A match between two in a feud can be its ending: the blow-off (docs/plans/living-storylines.md). */
function FeudEnd(p: { m: Match; i: number }) {
  const S = G.S, f = E.matchFeud(S, p.m);
  if (!f) return null;
  const pl = E.feudPlan(S, f);
  return <p class="row d1-end" data-t="feud-line"><Btn kind="sm" on={!!p.m.end} t="match-end" d={{ v: p.i }} onClick={() => act(() => { E.setMatchEnd(S, p.i, !p.m.end); })}>{p.m.end ? '● Ends the story' : 'End the story here'}</Btn>
    <span class="muted">{pl.pn}, heat {pl.heat}{pl.ripe ? ', ripe' : ''}</span></p>;
}
function MatchPane(p: { i: number; ck: any }) {
  const S = G.S, i = p.i, m: Match = S.card[i], n = S.card.length, it = p.ck.items.find((x: any) => x.t === 'match' && x.i === i), rd = E.agentReads(S)[i];
  const meta = matchMeta(m, i, n, it);
  return <Panel title={'Match ' + (i + 1) + ' of ' + n} cls="d1">
    <p class="meta d1-meta">{meta.map((x, k) => <span key={x[0]}>{k ? DOT : null}{x[1]}</span>)}</p>
    {rd ? <div class="agentsay" data-t="agent-say" data-v={i}>{rd.lines.map((l: any, k: number) => <p key={k} class={l.s > 0 ? 'good' : (l.s < 0 ? 'bad' : 'muted')} data-src={l.src}><span class="ag">{rd.who}{rd.own ? ', on this match' : ''}:</span> {'“'}{l.t}{'”'}</p>)}</div> : null}
    <Editor m={m} i={i} />
    <FeudEnd m={m} i={i} />
    <div class="row d1-btns">
      <Btn kind="sm" t="up" d={{ v: i }} label={'Move match ' + (i + 1) + ' earlier'} disabled={i === 0} onClick={() => moveMatch(i, -1)}>{'↑'} Earlier</Btn>
      <Btn kind="sm" t="down" d={{ v: i }} label={'Move match ' + (i + 1) + ' later'} disabled={i === n - 1} onClick={() => moveMatch(i, 1)}>{'↓'} Later</Btn>
      <Btn kind="sm" t="rm" d={{ v: i }} onClick={() => removeMatch(i)}>Remove</Btn>
      <Btn kind="sm" t="match-pop" d={{ v: i }} onClick={() => openModal({ kind: 'matchwin', i })}>Pop-up</Btn>
      <Btn kind="sm" t="done" d={{ v: i }} onClick={() => pickMatch(i)}>Done</Btn>
    </div>
  </Panel>;
}
/** The match pop-up (roadmap 5): everything about one match in one window, the road agent's read at the bottom. */
export function MatchWindow(p: { m: Modal }) {
  const S = G.S, i = p.m.i as number, m: Match = S.card[i], n = S.card.length;
  if (!m) return <Window title="Match" ok="Close"><p class="muted">That match is no longer on the card.</p></Window>;
  const rd = E.agentReads(S)[i], it = E.clock(S).items.find((x: any) => x.t === 'match' && x.i === i), meta = matchMeta(m, i, n, it);
  return <Window title={'Match ' + (i + 1) + ' of ' + n} wide ok="Done"
    footer={<><Btn t="mw-up" disabled={i === 0} onClick={() => { if (!m.lock && !(S.card[i - 1] || {}).lock) p.m.i = i - 1; moveMatch(i, -1); }}>{'↑'} Earlier</Btn>
      <Btn t="mw-down" disabled={i === n - 1} onClick={() => { if (!m.lock && !(S.card[i + 1] || {}).lock) p.m.i = i + 1; moveMatch(i, 1); }}>{'↓'} Later</Btn>
      <Btn t="mw-lock" on={!!m.lock} onClick={() => lockMatch(i)}>{m.lock ? 'Locked in place' : 'Lock this place'}</Btn>
      <Btn kind="danger" t="mw-rm" onClick={() => { closeModal(); removeMatch(i); }}>Remove</Btn></>}>
    <p class="meta d1-meta">{meta.map((x, k) => <span key={x[0]}>{k ? DOT : null}{x[1]}</span>)}</p>
    <Editor m={m} i={i} />
    <FeudEnd m={m} i={i} />
    <Group title="The road agent">{rd ? <div class="agentsay" data-t="mw-agent">{rd.lines.map((l: any, k: number) => <p key={k} class={l.s > 0 ? 'good' : (l.s < 0 ? 'bad' : 'muted')}><span class="ag">{rd.who}{rd.own ? ', on this match' : ''}:</span> {'“'}{l.t}{'”'}</p>)}</div>
      : <p class="muted">Fill every spot and the agent will say what they see.</p>}</Group>
  </Window>;
}
/** What could happen tonight (roadmap 7): moments, who is at risk, what the card sets up and leaves cold, the agent's gut. Words only. */
export function CouldWindow(_p: { m: Modal }) {
  const C = E.couldHappen(G.S);
  const part = (title: string, t: string, L: string[], none: string) => <Group title={title} t={t}>{L.length ? L.map((x, k) => <p key={k} class="clamp"><Txt>{x}</Txt></p>) : <p class="muted">{none}</p>}</Group>;
  return <Window title="What could happen tonight" wide ok="Close">
    {part('Moments that could happen', 'could-moments', C.moments, 'Nothing on this card is built for a big moment.')}
    {part('Who is at risk', 'could-risk', C.risk, 'Nobody on the card looks at risk.')}
    {part('What it sets up', 'could-sets', C.sets, 'This card does not move a story on.')}
    {part('What it leaves cold', 'could-cold', C.cold, 'Nothing hot is left off.')}
    {C.gut ? <p class="agentsay" data-t="could-gut">{C.gut}</p> : null}
  </Window>;
}
/** An arc on the run sheet: the writers put it there, and the booker decides where the story goes (src/99-tale.js).
    The chapter, the question and its answers, each a card to press; the answer can be changed until the show airs. */
function ArcPane(p: { slot: number; ck: any }) {
  const S = G.S, A = E.taleInfo(S), x = E.segInfo(S).list[p.slot], it = p.ck.items.find((q: any) => q.t === 'seg' && q.slot === p.slot);
  if (!A.on || !x) return <Panel title="Arc" cls="d1"><p class="muted">The arc is over.</p></Panel>;
  const pick = (i: number) => act(() => { const r = E.taleDecide(S, A.ch === i ? null : i); say(r.msg, { err: !r.ok }); });
  return <Panel title={'Arc: ' + A.n} cls="d1 arcpane">
    <p class="meta">{A.cn}{x.post ? DOT + 'after the main event' : (it ? DOT + 'on at ' + hm(it.at) : '')}{DOT}{x.mins} min{DOT}<span class="muted">{A.word}</span></p>
    <p class="arc-t clamp2" data-t="arc-text">{A.t}</p>
    <p class="arc-q" data-t="arc-q"><b>{A.q}</b> {A.ch == null ? <span class="bad">Your decision</span> : <span class="good">Decided</span>}</p>
    <div class="arc-opts" role="group" aria-label={A.q}>{A.o.map((o: any) => <button type="button" key={o.i} class={'arcopt' + (A.ch === o.i ? ' on' : '')} data-t="arc-pick" data-v={o.i} aria-pressed={A.ch === o.i} onClick={() => pick(o.i)}>
      <b>{o.n}</b><span class="clamp2">{o.d}</span>{o.lock ? <Tag kind="warn">Locks a match</Tag> : null}{o.end ? <Tag kind="gold">Ends the arc</Tag> : null}</button>)}</div>
    <div class="row d1-btns">
      <Btn kind="sm" t="arc-story" onClick={() => openModal({ kind: 'arcstory' })}>The story so far</Btn>
      <Btn kind="sm" t="seg-done" d={{ v: p.slot }} onClick={() => pickSeg(p.slot)}>Done</Btn>
    </div>
  </Panel>;
}
/** The arc from its first chapter: who is in it, what was decided, and by whom. */
export function ArcStoryWindow(_p: { m: Modal }) {
  const S = G.S, A = E.taleInfo(S);
  if (!A.on) return <Window title="Arc" ok="Close"><p class="muted">No arc is running.</p></Window>;
  return <Window title={'The story so far: ' + A.n} wide ok="Close" info={[A.word, 'Next: ' + A.cn + ', ' + A.when]}>
    <p>{A.d}</p>
    <p class="muted">In it: {A.cast.map((id: number, k: number) => <>{k ? ', ' : null}<Name w={S.w[id]} /></>)}</p>
    <Group title="Chapters" t="arc-hist">{A.hist.length ? <ol class="rules">{A.hist.map((h: any, k: number) => <li key={k}><b>{h.cn}.</b> {h.n}. <span class="muted">{h.w}{h.pre ? ', before you took the book' : (h.you ? ', your call' : ', the writers decided')}</span></li>)}</ol> : <p class="muted">This is the first chapter.</p>}</Group>
    <Group title="Now"><p>{A.t}</p><p><b>{A.q}</b></p></Group>
  </Window>;
}
function SegPane(p: { slot: number; ck: any }) {
  const S = G.S, x = E.segInfo(S).list[p.slot], it = p.ck.items.find((q: any) => q.t === 'seg' && q.slot === p.slot);
  if (!x) return null;
  if (x.k === 'arc') return <ArcPane slot={p.slot} ck={p.ck} />;
  return <Panel title={x.t === 'any' ? E.SEGK[x.k].n : CATN[x.t] + ': ' + E.SEGK[x.k].n} cls="d1">
    <p class="who">{x.why ? <span class="bad">{x.why}</span> : (x.who.length ? x.who.map((id: number, q: number) => <>{q ? ', ' : null}<Name w={S.w[id]} /></>) : 'The writers decide')}</p>
    <p class="meta">{it ? 'On at ' + hm(it.at) + DOT : ''}{E.SEGLENN[x.len]}, {x.mins} minutes{it && it.top ? <>{DOT}<TopTag top={it.top} /></> : null}</p>
    {x.k !== 'writers' && x.who.length ? <SegPic k={x.k} who={x.who} /> : <p class="muted mt1">{E.SEGK[x.k].d}</p>}
    {x.look && x.look.read && x.k !== 'writers' ? <div class="agentsay" data-t="seg-read"><p class={x.look.read.k === 'good' ? 'good' : (x.look.read.k === 'bad' ? 'bad' : 'muted')}>{x.look.read.t}</p></div> : null}
    {x.look && x.look.notes && x.look.notes.length && x.k !== 'writers' ? <p class="muted">{x.look.notes.map((y: any, q: number) => <span key={q} class={y[0] > 0 ? 'good' : (y[0] < 0 ? 'bad' : undefined)}>{q ? DOT : ''}{y[0] > 0 ? '▲' : (y[0] < 0 ? '▼' : '')} {y[1]}</span>)}</p> : null}
    <div class="row d1-btns">
      {x.forced ? <span class="warn">Promised: it stays on the show.</span> : <><Btn kind="sm" t="seg-change" d={{ v: p.slot }} onClick={() => openSeg(p.slot)}>Change</Btn>
      <Btn kind="sm" t="seg-rm" d={{ v: p.slot }} onClick={() => act(() => { const r = E.setSeg(S, p.slot, null); sel().seg = -1; say(r.msg); })}>Remove</Btn></>}
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

/* ---------- the first show (the tutorial, src/99-tutorial.js) ---------- */
const TUT_ACT: Record<string, string> = { titles: 'Title matches', suggest: 'Suggest', arc: 'Open the arc', promise: 'Show me' };
function Tutorial() {
  const S = G.S, T = E.tutInfo(S);
  if (!T.on) return <Notes />;
  const go1 = (a: string) => {
    if (a === 'titles') act(() => { const r = E.suggestTitles(S); say(r.msg, { err: !r.ok }); });
    else if (a === 'suggest') suggest();
    else if (a === 'arc') { const i = E.segInfo(S).list.findIndex((x: any) => x.k === 'arc'); if (i >= 0) pickSeg(i); }
    else if (a === 'promise') { const i = S.card.findIndex((m: any) => m.pm != null); if (i >= 0) pickMatch(i); }
  };
  return <Panel title={'Your first show: ' + T.show}>
    <ol class="tutsteps" data-t="tut-steps">{T.steps.map((s: any) => <li key={s.k} class={s.done ? 'done' : (s.need ? 'need' : '')} data-t="tut-step" data-v={s.k} data-done={s.done ? 1 : 0}>
      <span class="tick" aria-hidden="true">{s.done ? '✔' : '•'}</span><span class="tx clamp2">{s.t}</span>
      {s.act && !(s.done && s.act === 'titles') ? <Btn kind="sm" t={'tut-' + s.act} onClick={() => go1(s.act)}>{TUT_ACT[s.act]}</Btn> : null}</li>)}</ol>
  </Panel>;
}

/* ---------- the booking notes ---------- */
/** What stands in the way of the show, then what the writers and the announcers think of the card. */
const STK: Record<string, [string, any]> = { due: ['Due', 'bad'], story: ['Story', 'good'], title: ['Title', 'face'], ripe: ['Ripe', 'gold'], face: ['Face', 'warn'], war: ['Night', 'bad'], net: ['Network', 'bad'], weak: ['Weak', 'bad'] };
/** Tonight's stakes and Before the bell (final-7): what rides on the show, and the checks before it airs. */
function Tonight() {
  const T = E.tonight(G.S);
  if (!G.S.card.length) return null;
  return <>
    <Group title="Tonight's stakes" t="stakes">{T.stakes.length ? T.stakes.map((x: any, i: number) => <p key={i} class="tn-st clamp"><Tag kind={STK[x.k][1]}>{STK[x.k][0]}</Tag> <Txt>{x.t}</Txt></p>) : <p class="muted">Nothing special rides on tonight.</p>}</Group>
    <Group title="Before the bell" t="bell-checks"><div class="tn-row"><div class="tn-checks">{T.checks.map((x: any, i: number) => <p key={i} class={'clamp ' + (x.ok ? 'good' : 'bad')}>{x.ok ? '✔' : '!'} {x.t}</p>)}</div><LightPic name="bell" dot={1} label="The bell" /></div></Group>
  </>;
}
function Notes() {
  const S = G.S, b = book(), v = E.validate(S, S.card), g = E.taskGate(S, 'show');
  const errs = b.tried ? v.errors : [], A = E.advice(S, S.card).filter((a: any) => a.tips.length), F = E.fogInfo(S);
  const tips: { who: string; t: string }[] = []; A.forEach((a: any) => a.tips.forEach((t: string) => tips.push({ who: a.who, t })));
  // how many notes a page holds: fewer on a tablet's shorter lines, and one fewer when a warning is showing above them
  const small = document.documentElement.dataset.screen === 'tablet', warn = S.card.length > 0 && v.warnings.length > 0 && !errs.length;
  return <Panel title="Staff notes">
    {!errs.length && g.ok && !warn ? <Tonight /> : null}
    {!g.ok ? <div class="flash err" data-t="gate-note"><b>On your desk before this show can run</b><ul>{g.left.slice(0, 4).map((x: string) => <li><Txt>{x}</Txt></li>)}</ul>
      <div class="row mt1"><Btn kind="sm" t="gate-desk" onClick={() => go('desk')}>Go to the desk</Btn></div></div> : null}
    {errs.length ? <div class="flash err"><b>Fix before the show can run</b><ul>{errs.slice(0, 4).map((e: string) => <li>{e}</li>)}</ul></div> : null}
    {S.card.length > 0 && v.warnings.length > 0 && !errs.length ? <div class="flash">{v.warnings.slice(0, small ? 1 : 2).map((w: string, k: number) => <>{k ? <br /> : null}{w}</>)}</div> : null}
    {!S.card.length ? <Empty>Put a card together and your staff will look it over.</Empty>
      : (tips.length ? <Paged id="tips" items={tips} per={1} cls="tips" row={(x, k) => <li key={k}><span class="eyebrow">{x.who}</span><br />{'“'}{x.t}{'”'}</li>} />
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
  return <Panel title="Promises and targets"><Paged id="quests" items={S.quests} per={5} row={(q: any) => { const left = q.due - S.week, nw = E.questNow(S, q); return <li><span><Txt>{q.text}</Txt>{nw ? <span class="muted"> ({nw})</span> : null}</span><Tag kind={left <= 0 ? 'warn' : undefined}>{left <= 0 ? 'This week' : left + ' wk left'}</Tag></li>; }} /></Panel>;
}

export function Side(p: { on: OnCard; ck: any }) {
  const S = G.S, b = book(), s = sel(), show = S.queue[S.qi], T = E.tournActive(S);
  const pre = S.pre && !S.pre.done && S.pre.key === S.week + ':' + show.id ? S.pre : null;
  const tut = E.tutInfo(S), k = b.side || (tut.on ? 'tut' : 'advice'), picked = b.edit >= 0 && b.edit < S.card.length ? 'm' : (s.seg >= 0 && s.seg < E.segInfo(S).booked ? 's' : '');
  const tabs = (tut.on ? [['tut', 'First show']] : []).concat([['advice', 'Notes'], ['order', 'Order'], ['clock', 'Clock'], ['promo', 'Promo'], ['feuds', 'Stories'], ['targets', 'Targets']]);
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
        : k === 'tut' ? <Tutorial />
        : <Notes />}
    </div>
  </div>;
}
