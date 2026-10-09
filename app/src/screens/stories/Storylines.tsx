/* Storylines: the rivalries your booking started, plus streaks, stables and tag teams. The long plan is the one place to pencil something in. */
import { E } from '../../engine';
import { G, me, plural, slice, act, view, say, openModal, Modal } from '../../store';
import { SeasonPage } from './Season';
import { Head, Panel, Tag, Name, Meter, Empty, teamName, Txt, Btn, Sel, Field, showResult, Window } from '../../kit';

/** Pencil in the flagship main event. The build is counted every week, and a plan made early pays more. */
function LongPlan() {
  const S = G.S, P = me(), pl = E.longPlan(S), wk = E.flagshipWeek(S);
  const st = slice<{ a: string; b: string }>('longplan', () => ({ a: '', b: '' }));
  const R = S.w.filter((w: any) => w.promo === P.id && !w.nw && w.inj <= 0).sort((x: any, y: any) => y.ovr - x.ovr);
  const opts = (skip: string) => [['', 'Pick a wrestler'], ...R.filter((w: any) => String(w.id) !== skip).map((w: any) => [w.id, w.name + ' · ' + Math.round(w.ovr)] as [number | string, string])] as any;
  const set = () => act(() => { const r = E.setLongPlan(S, +st.a, +st.b, null); if (r.ok) { st.a = ''; st.b = ''; } say(r.text, { err: !r.ok }); showResult('The long plan', r.text, !r.ok); });
  const drop = () => act(() => { const r = E.clearLongPlan(S); say(r.text); showResult('The long plan', r.text); });
  return <Panel title="The long plan">
    {!wk ? <Empty>There is no flagship show in sight.</Empty> : <>
      <p class="muted">Pick the flagship main event now. Each week that the two are in a feud builds it. A plan made early and paid off lifts the match.</p>
      {pl ? <>
        <p><Name w={pl.a} /> against <Name w={pl.b} /> at <b>{pl.when}</b>, in {pl.toGo} {plural(pl.toGo, 'week')}.</p>
        <p class="muted">{pl.state} Build so far: <b class="num">{pl.built}</b>. If it pays off now: <b class="good num">+{pl.bonus}</b> to the match.</p>
        {pl.toGo <= 4 ? <p class="bad">Changing it now costs trust and mood.</p> : null}
      </> : <p class="muted">Nothing is pencilled in for {E.cal(wk).label}.</p>}
      <Field label="One side"><Sel id="lp-a" t="lp-a" value={st.a} options={opts(st.b)} onChange={v => view(() => { st.a = v; })} /></Field>
      <Field label="The other"><Sel id="lp-b" t="lp-b" value={st.b} options={opts(st.a)} onChange={v => view(() => { st.b = v; })} /></Field>
      <div class="row opts mt1">
        <Btn kind="sm" t="lp-set" disabled={!st.a || !st.b} onClick={set}>{pl ? 'Change the plan' : 'Pencil it in'}</Btn>
        {pl ? <Btn kind="sm" t="lp-drop" onClick={drop}>Scrap it</Btn> : null}
      </div>
    </>}
  </Panel>;
}

const plotState = () => slice<{ team: string; who: string; w: string; k: string; a: string; b: string; at: string }>('plot', () => ({ team: '', who: '', w: '', k: 'interview', a: '', b: '', at: 'start' }));
/** The pop-up for one thing booking power buys on Storylines (`m.k`), or for the long plan. */
export function PlotWindow(p: { m: Modal }) {
  const S = G.S, I = E.plotInfo(S), st = plotState(), id: string = p.m.k;
  if (id === 'plan') return <Window title="The long plan" wide ok="Done"><LongPlan /></Window>;
  const A = I.acts.find((x: any) => x.id === id); if (!A) return <Window title="Storylines"><Empty>That is not on offer.</Empty></Window>;
  const run = (o: any) => act(() => { const r = E.plotDo(S, id, o); say(r.msg, { err: !r.ok }); showResult(A.n, r.msg, !r.ok); });
  const tm = I.teams.find((t: any) => String(t.id) === st.team) || null, kind = I.kinds.find((k: any) => k.id === st.k) || I.kinds[0];
  const W1: number[] = I.show ? (E.plotTapeWho(S, kind.id, [])[0] || []) : [], W2: number[] = I.show && kind.two && st.a ? (E.plotTapeWho(S, kind.id, [+st.a])[1] || []) : [];
  let body: any = null;
  if (id === 'split') body = I.teams.length ? <div class="row mt2">
    <Field label="Which team"><Sel t="plot-team" label="Which team" value={st.team} options={[['', 'Pick a team'], ...I.teams.map((t: any): [string, string] => [String(t.id), t.n])]} onChange={v => view(() => { st.team = v; st.who = ''; })} /></Field>
    {tm ? <Field label="Who turns"><Sel t="plot-who" label="Who turns" value={st.who} options={[['', 'Whoever is unhappier'], [String(tm.a), S.w[tm.a].name], [String(tm.b), S.w[tm.b].name]]} onChange={v => view(() => { st.who = v; })} /></Field> : null}
    <Btn kind="go" t="plot-do" d={{ v: 'split' }} disabled={!tm || !A.can} onClick={() => run({ team: st.team, who: st.who || null })}>Break them up</Btn></div> : <p class="muted mt1">You have no regular teams to break up.</p>;
  if (id === 'push') body = <div class="row mt2">
    <Field label="Who to push"><Sel t="plot-w" label="Who to push" value={st.w} options={[['', 'Pick a wrestler'], ...I.push.map((w: any): [string, string] => [String(w.id), w.n])]} onChange={v => view(() => { st.w = v; })} /></Field>
    <Btn kind="go" t="plot-do" d={{ v: 'push' }} disabled={!st.w || !A.can} onClick={() => run({ w: st.w })}>Push them</Btn></div>;
  if (id === 'tape') body = !I.show ? <p class="muted mt1">Every show this week has run. Buy it when there is a show to put it on.</p>
    : (I.taped ? <p class="good mt1">Already on {I.show}, {I.taped.where.toLowerCase()}: {I.taped.label}. One a show.</p> : <div class="row mt2">
      <Field label="What it is"><Sel t="plot-k" label="What it is" value={st.k} options={I.kinds.map((k: any): [string, string] => [k.id, k.n])} onChange={v => view(() => { st.k = v; st.a = ''; st.b = ''; })} /></Field>
      <Field label="Who"><Sel t="plot-a" label="Who" value={st.a} options={[['', 'Pick a wrestler'], ...W1.map((x): [string, string] => [String(x), S.w[x].name])]} onChange={v => view(() => { st.a = v; st.b = ''; })} /></Field>
      {kind.two ? <Field label="Against whom"><Sel t="plot-b" label="Against whom" value={st.b} disabled={!st.a} options={[['', 'Pick a wrestler'], ...W2.map((x): [string, string] => [String(x), S.w[x].name])]} onChange={v => view(() => { st.b = v; })} /></Field> : null}
      <Field label={'Where on ' + I.show}><Sel t="plot-at" label="Where on the show" value={st.at} options={I.pos.map((x: any): [string, string] => [x.id, x.n])} onChange={v => view(() => { st.at = v; })} /></Field>
      <Btn kind="go" t="plot-do" d={{ v: 'tape' }} disabled={!st.a || (kind.two && !st.b) || !A.can} onClick={() => run({ k: kind.id, who: kind.two ? [st.a, st.b] : [st.a], at: st.at })}>Buy it</Btn></div>);
  return <Window title={A.n} wide ok="Not now">
    <p>{A.d}</p>
    <p class={A.can ? 'gold' : 'bad'}>Costs {A.cost} booking power. You have {I.bp}.</p>
    {body}
  </Window>;
}

/* what the buttons under Around the stories open */
const POPS = {
  finished: () => { const S = G.S, P = me(), L = S.feuds.filter((f: any) => f.res && f.promo === P.id).slice(-12).reverse();
    return L.length ? <ul class="list" data-t="st-finished">{L.map((f: any) => <li><span>{E.feudLabel(S, f)}{f.len ? <span class="muted"> {'·'} {E.FLEN[f.len].n.toLowerCase()}</span> : null}</span><span class={f.dead ? 'bad' : 'good'}>{f.cut ? 'Dropped' : (f.dead ? 'Fizzled out' : 'Settled')}, week {f.end}</span></li>)}</ul>
      : <Empty>No story has finished yet.</Empty>; },
  streaks: () => { const S = G.S, P = me(), L = E.rosterOf(S, P.id).filter((w: any) => w.ws >= 4).sort((a: any, b: any) => b.ws - a.ws);
    return L.length ? <><ul class="list" data-t="st-streaks">{L.map((w: any) => <li><span><Name w={w} /></span><span class="num">{w.ws} straight</span></li>)}</ul><p class="muted mt1">A streak of six or more draws a bigger reaction. Whoever ends it gets the rub.</p></>
      : <Empty>Nobody has won four in a row. Keep a hot wrestler on the card and call their wins.</Empty>; },
  stables: () => { const S = G.S, L = (S.stables || []).filter((s: any) => s.promo === S.player);
    return L.length ? <div data-t="st-stables">{L.map((s: any) => <>
      <p class="eyebrow">{s.name} {'·'} unity {E.stableUnity(S, s)} {'·'} tension <Meter v={Math.min(100, s.tension * 10)} kind="hot" /></p>
      <ul class="list">{E.stableRoles(S, s).map((r: any) => <li class="col"><span><Name w={r.w} />{r.w.id === s.leader ? <span class="muted"> (leader)</span> : null} <span class={r.role ? 'muted' : 'bad'}>{'·'} {r.name}</span></span><span class="muted">{r.note}</span></li>)}</ul></>)}
      <p class="muted mt1">Stablemates run in for each other. Losses raise the tension, and at the top of the meter somebody gets thrown out. Somebody nobody needs, who is also losing, is the first to go.</p></div>
      : <Empty>No stables. They form from your stories and your shows.</Empty>; },
  teams: () => { const S = G.S, P = me(), L = S.teams.filter((t: any) => t.promo === P.id).sort((a: any, b: any) => b.exp - a.exp);
    return L.length ? <><ul class="list" data-t="st-teams">{L.map((t: any) => <li><span>{teamName(t)}</span><span class="row"><Meter v={t.exp} /><span class="num">{t.exp}</span></span></li>)}</ul><p class="muted mt1">Experience improves tag matches. Losing teams with little experience can fall apart.</p></>
      : <Empty>No regular teams. They form from tag matches and team-up angles on your shows.</Empty>; }
};

/** The Storylines page: one screen of windows (Season.tsx). */
export function Storylines() { return <SeasonPage pops={POPS} />; }
