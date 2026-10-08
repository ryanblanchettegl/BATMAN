/* Storylines: the rivalries your booking started, plus streaks, stables and tag teams. The long plan is the one place to pencil something in. */
import { E } from '../../engine';
import { G, me, plural, slice, act, view, say, openModal, Modal } from '../../store';
import { storyReset } from './StartStory';
import { Head, Panel, Tag, Name, Meter, Empty, teamName, Txt, Btn, Sel, Field, showResult, Window } from '../../kit';

/** When a story ends: its night, or its next chapter. */
function endLine(f: any): string {
  const S = G.S, p = E.feudPlan(S, f), wk = (n: number) => n <= 0 ? 'this week' : n === 1 ? 'next week' : 'in ' + n + ' weeks';
  if (p.ch) {
    const nx = p.ch.find((c: any) => !c.done), k = p.ch.indexOf(nx) + 1;
    if (nx && k < p.ch.length) return 'Chapter ' + k + ' of ' + p.ch.length + ' ends at ' + nx.at + ', ' + wk(nx.w - S.week) + '. It ends for good at ' + p.at + '.';
  }
  if (p.late) return 'It was meant to end at ' + p.at + '. It is cooling every week it runs over.';
  return 'It ends at ' + p.at + ', ' + wk(p.in) + (p.slip ? ', one big event later than planned' : '') + '.';
}

/** What each act needs from the booker. The act comes from the calendar: where the story is on the way to its ending. */
function actNote(f: any): string {
  const a = E.feudAct(f, G.S), p = E.feudPlan(G.S, f);
  if (a === 1) return p.len === 's' ? 'A short story: a spark, then the match. Keep both on the show.' : 'Words and mind games. Keep both on the show to build it.';
  if (a === 2) return 'Brawls, ambushes and contract signings. Build the heat before the twist.';
  if (a === 3) return 'Something is about to change this feud for good: one twist to a stretch.';
  if (a === 4) return (f.finale ? 'The match is made' : 'The match gets made official next') + '. Book it on the night the story ends.';
  return '';
}

/** One line on what the story needs next. */
function heatStep(f: any): string {
  const S = G.S, a = E.feudAct(f, S), cold = S.week - f.last;
  if (cold >= 3) return 'It has gone cold for ' + cold + ' weeks. Put both on the next show, in a segment or a match.';
  if (a === 1) return 'Book a promo or an ambush with both on the show.';
  if (a === 2) return 'A brawl, an attack or a contract signing.';
  if (a === 3) return 'Raise the stakes or book a betrayal. That is the twist this story needs.';
  return 'Book the match on its night. If it is missed, it cools.';
}

function FeudCard(p: { f: any }) {
  const S = G.S, P = me(), f = p.f, a = E.feudAct(f, S), pl = E.feudPlan(S, f);
  const t = f.title ? P.titles.find((x: any) => x.id === f.title) : null;
  return <Panel cls="feud">
    <div class="row between">
      <div class="t">{E.feudLabel(S, f)}</div>
      <div class="row"><Meter v={f.heat} kind="hot" /><span class="num">{Math.round(f.heat)} heat</span></div>
    </div>
    <div class="row">
      <Tag kind={pl.len === 'l' ? 'heel' : pl.len === 'm' ? 'gold' : 'info'}>{pl.n} story</Tag>
      <Tag kind="gold">{pl.len === 's' ? (a === 4 ? 'Blow-off' : 'Spark') : 'Act ' + a + ' of 4: ' + E.ACTN[a]}</Tag>
      <Tag kind={f.heat >= 60 ? 'heel' : undefined}>{E.feudStage(f)}</Tag>
      {f.finale ? <Tag kind="good">Match made</Tag> : null}
      {f.kind === 'dream' ? <Tag>Dream match</Tag> : null}
      {t ? <Tag kind="gold">{t.name}</Tag> : null}
      <span class="muted">{f.matches} {plural(f.matches, 'match', 'matches')}, {f.aw}–{f.bw} {'·'} since week {f.start}</span>
    </div>
    <p data-t="feud-end" class={pl.late ? 'bad' : ''}>{endLine(f)}</p>
    {f.stakes ? <p class="good">Stakes: {f.stakes}</p> : null}
    <p class="muted">{actNote(f)}</p>
    <p>Next: {heatStep(f)}</p>
    <div class="log">{f.log.slice(-6).map((l: any) => <span>Wk {l.w} <Txt>{l.t}</Txt></span>)}</div>
  </Panel>;
}

/** The on-screen boss and the rebel who has declared war on them, while it lasts. */
function Rebel() {
  const S = G.S, R = E.rebelInfo(S); if (!R) return null;
  return <Panel title="The boss and the rebel">
    <p><Name w={R.w} /> against {R.boss ? <Name w={R.boss} /> : 'the boss'}, {R.weeks} {plural(R.weeks, 'week')} in.</p>
    <div class="row"><Meter v={R.heat} kind="hot" /><span class="muted">heat {R.heat}</span></div>
    <p class="muted mt1">Put the rebel on the card to keep it going. When it peaks, an inbox choice settles it.</p>
  </Panel>;
}
function Mystery() {
  const S = G.S, m = S.mystery;
  if (!m || m.promo !== S.player) return null;
  return <Panel title="Unsolved"><p>Someone attacked <Name w={S.w[m.v]} /> in week {m.start}. The attacker has not been named yet.</p></Panel>;
}

function Finished(p: { done: any[] }) {
  const S = G.S;
  if (!p.done.length) return null;
  return <Panel title="Finished"><ul class="list">{p.done.map(f =>
    <li><span>{E.feudLabel(S, f)}</span><span class="muted">{f.dead ? 'Fizzled out' : 'Settled'}, week {f.end}</span></li>)}</ul></Panel>;
}

function Streaks() {
  const S = G.S, P = me();
  const L = E.rosterOf(S, P.id).filter((w: any) => w.ws >= 4).sort((a: any, b: any) => b.ws - a.ws);
  return <Panel title="Winning streaks">
    {L.length ? <>
      <ul class="list">{L.map((w: any) => <li><span><Name w={w} /></span><span class="num">{w.ws} straight</span></li>)}</ul>
      <p class="muted mt2">A streak of six or more draws a bigger reaction. Whoever ends it gets the rub.</p>
    </> : <Empty>Nobody has won four in a row. Keep a hot wrestler on the card and call their wins.</Empty>}
  </Panel>;
}

export function StablePanel() {
  const S = G.S, L = (S.stables || []).filter((s: any) => s.promo === S.player);
  if (!L.length) return null;
  return <Panel title="Stables">
    <ul class="list">{L.map((s: any) => <li>
      <span><b>{s.name}</b><br />{s.m.map((id: number, i: number) => <>{i ? ', ' : ''}<Name w={S.w[id]} />{id === s.leader ? <span class="muted"> (leader)</span> : null}</>)}</span>
      <span class="row"><Meter v={Math.min(100, s.tension * 10)} kind="hot" /><span class="muted">tension</span></span>
    </li>)}</ul>

    <p class="muted mt2">Stablemates run in for each other. Losses raise the tension, and at the top of the meter somebody gets thrown out.</p>
  </Panel>;
}

/** Who does what in each stable, and how well it holds together. */
export function StableRoles() {
  const S = G.S, L = (S.stables || []).filter((s: any) => s.promo === S.player);
  if (!L.length) return null;
  return <Panel title="Stable roles">
    {L.map((s: any) => <>
      <p class="eyebrow">{s.name} {'·'} unity {E.stableUnity(S, s)}</p>
      <ul class="list">{E.stableRoles(S, s).map((r: any) => <li class="col"><span><Name w={r.w} /> <span class={r.role ? 'muted' : 'bad'}>{'·'} {r.name}</span></span><span class="muted">{r.note}</span></li>)}</ul>
    </>)}
    <p class="muted mt1">Every member needs a job. Somebody nobody needs, who is also losing, is the first to go.</p>
  </Panel>;
}

function Teams() {
  const S = G.S, P = me();
  const L = S.teams.filter((t: any) => t.promo === P.id).sort((a: any, b: any) => b.exp - a.exp);
  return <Panel title="Tag teams">
    {L.length ? <>
      <ul class="list">{L.map((t: any) => <li><span>{teamName(t)}</span><span class="row"><Meter v={t.exp} /><span class="num">{t.exp}</span></span></li>)}</ul>
      <p class="muted mt2">Experience improves tag matches. Losing teams with little experience can fall apart.</p>
    </> : <Empty>No regular teams. They form from tag matches and team-up angles on your shows.</Empty>}
  </Panel>;
}

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

/** Booking power spent on the stories themselves. Each thing it buys is a button; the button opens a pop-up with the choices. */
const PLOT_UI: Record<string, string> = { split: 'One turns on the other. The team ends and a rivalry starts hot.', push: 'Momentum now, and the crowd is told they matter.', tape: 'A cheap promo or angle that adds itself to your next show, where you say.' };
function Plot() {
  const S = G.S, I = E.plotInfo(S), pl = E.longPlan(S);
  const open = (k: string) => { const st = plotState(); st.team = ''; st.who = ''; st.w = ''; st.a = ''; st.b = ''; openModal({ kind: 'plot', k }); };
  return <Panel title={'Booking power: ' + I.bp + ' to spend on the stories'} cls="mb2">
    <div class="bsacts" data-t="plot">
      <button type="button" class={'bsact' + (I.bp >= 1 ? '' : ' used')} data-t="plot-open" data-v="story" onClick={() => { storyReset(); openModal({ kind: 'story' }); }}>
        <b>Start a story</b><span class="eff">Two people, and how long it runs: short, medium or long. It ends on the night you pick.</span>
        <span class="ft"><span class={I.bp >= 1 ? 'gold' : 'bad'}>1 to 3 booking power</span></span></button>
      {I.acts.map((a: any) => <button type="button" key={a.id} class={'bsact' + (a.can ? '' : ' used')} data-t="plot-open" data-v={a.id} onClick={() => open(a.id)}>
      <b>{a.n}</b><span class="eff">{PLOT_UI[a.id]}</span>
      <span class="ft"><span class={a.can ? 'gold' : 'bad'}>{a.cost} booking power</span>{a.id === 'tape' && I.taped ? <span class="good" data-t="plot-taped"> {'·'} on {I.show}: {I.taped.label}</span> : null}</span></button>)}
      <button type="button" class="bsact" data-t="plot-open" data-v="plan" onClick={() => openModal({ kind: 'plot', k: 'plan' })}>
        <b>Pencil in the long plan</b><span class="eff">Pick the main event of your flagship event now. Every week the two are in a rivalry builds it.</span>
        <span class="ft muted">{pl ? 'A main event is pencilled in' : 'Nothing pencilled in'} {'·'} free</span></button>
    </div>
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

export function Storylines() {
  const S = G.S, P = me();
  const live = E.activeFeuds(S).filter((f: any) => f.promo === P.id).sort((a: any, b: any) => b.heat - a.heat);
  const done = S.feuds.filter((f: any) => f.res && f.promo === P.id).slice(-8).reverse();
  return <>
    <Head eyebrow="What your booking has set in motion" title="Storylines" />
    <Plot />
    <div class="cols">
      <div class="stack">
        <Mystery />
        {live.length ? live.map((f: any) => <FeudCard f={f} />)
          : <Panel><Empty>No rivalries yet. Run a show or two: ambushes, challenges and betrayals start them.</Empty></Panel>}
        <Finished done={done} />
      </div>
      <div class="stack"><Rebel /><Streaks /><StablePanel /><StableRoles /><Teams /></div>
    </div>
  </>;
}
