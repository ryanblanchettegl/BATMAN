/* Storylines: the rivalries your booking started, plus streaks, stables and tag teams. The long plan is the one place to pencil something in. */
import { E } from '../../engine';
import { G, me, plural, slice, act, view, say } from '../../store';
import { Head, Panel, Tag, Name, Meter, Empty, teamName, Txt, Btn, Sel, Field, showResult } from '../../kit';

/** What each of the four acts needs from the booker. Act 4 depends on whether the match is already made. */
function actNote(f: any): string {
  const a = E.feudAct(f);
  if (a === 1) return 'Words and mind games. Keep both on the show to build it.';
  if (a === 2) return 'Brawls, ambushes and contract signings. It needs to reach 60 heat.';
  if (a === 3) return 'Something is about to change this feud for good.';
  if (a === 4) return (f.finale ? 'Book the match at the big event' : 'The match gets made official next') + ', then finish it at a big event or in a gimmick match.';
  return '';
}

/** One line on what would heat a feud up next. */
function heatStep(f: any): string {
  const S = G.S, a = E.feudAct(f), cold = S.week - f.last;
  if (cold >= 3) return 'It has gone cold for ' + cold + ' weeks. Put both on the next show, in a segment or a match.';
  if (a === 1) return 'Book a promo or an ambush with both on the show.';
  if (a === 2) return f.heat < 45 ? 'A brawl or an attack will get it past 45 heat.' : 'A contract signing or a brawl should take it to 60 heat.';
  if (a === 3) return 'Raise the stakes or book a betrayal. That is the twist this feud needs.';
  return f.finale ? 'Book the match at the big event. Heat peaks there.' : 'Make the match official, then book it on a big event.';
}

function FeudCard(p: { f: any }) {
  const S = G.S, P = me(), f = p.f, a = E.feudAct(f);
  const t = f.title ? P.titles.find((x: any) => x.id === f.title) : null;
  return <Panel cls="feud">
    <div class="row between">
      <div class="t">{E.feudLabel(S, f)}</div>
      <div class="row"><Meter v={f.heat} kind="hot" /><span class="num">{Math.round(f.heat)} heat</span></div>
    </div>
    <div class="row">
      <Tag kind="gold">Act {a} of 4: {E.ACTN[a]}</Tag>
      <Tag kind={f.heat >= 60 ? 'heel' : undefined}>{E.feudStage(f)}</Tag>
      {f.finale ? <Tag kind="good">Match made</Tag> : null}
      {f.kind === 'dream' ? <Tag>Dream match</Tag> : null}
      {t ? <Tag kind="gold">{t.name}</Tag> : null}
      <span class="muted">{f.matches} {plural(f.matches, 'match', 'matches')}, {f.aw}–{f.bw} {'·'} since week {f.start}</span>
    </div>
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

/** Booking power spent on the stories themselves: break up a team, push somebody, buy a cheap pre-tape for the next show. */
function Plot() {
  const S = G.S, I = E.plotInfo(S);
  const st = slice<{ team: string; who: string; w: string; k: string; a: string; b: string; at: string }>('plot', () => ({ team: '', who: '', w: '', k: 'interview', a: '', b: '', at: 'start' }));
  const run = (id: string, o: any, after?: () => void) => act(() => { const r = E.plotDo(S, id, o); say(r.msg, { err: !r.ok }); showResult(I.acts.find((x: any) => x.id === id).n, r.msg, !r.ok); if (r.ok && after) after(); });
  const A = (id: string) => I.acts.find((x: any) => x.id === id), tm = I.teams.find((t: any) => String(t.id) === st.team) || null, kind = I.kinds.find((k: any) => k.id === st.k) || I.kinds[0];
  const W1: number[] = I.show ? (E.plotTapeWho(S, kind.id, [])[0] || []) : [], W2: number[] = I.show && kind.two && st.a ? (E.plotTapeWho(S, kind.id, [+st.a])[1] || []) : [];
  const cost = (id: string) => <span class={A(id).can ? 'gold' : 'bad'}>{A(id).cost} BP</span>;
  return <Panel title={'Booking power: ' + I.bp + ' to spend on the stories'} cls="mb2">
    <ul class="list" data-t="plot">
      <li class="col" data-t="plot-row" data-v="split"><span><b>{A('split').n}</b> {cost('split')}<br /><span class="muted">{A('split').d}</span></span>
        {I.teams.length ? <span class="row"><Sel t="plot-team" label="Which team" value={st.team} options={[['', 'Pick a team'], ...I.teams.map((t: any): [string, string] => [String(t.id), t.n])]} onChange={v => view(() => { st.team = v; st.who = ''; })} />
          {tm ? <Sel t="plot-who" label="Who turns" value={st.who} options={[['', 'Whoever is unhappier turns'], [String(tm.a), S.w[tm.a].name + ' turns'], [String(tm.b), S.w[tm.b].name + ' turns']]} onChange={v => view(() => { st.who = v; })} /> : null}
          <Btn kind="sm" t="plot-do" d={{ v: 'split' }} disabled={!tm || !A('split').can} onClick={() => run('split', { team: st.team, who: st.who || null }, () => { st.team = ''; st.who = ''; })}>Break them up</Btn></span> : <span class="muted">You have no regular teams to break up.</span>}</li>
      <li class="col" data-t="plot-row" data-v="push"><span><b>{A('push').n}</b> {cost('push')}<br /><span class="muted">{A('push').d}</span></span>
        <span class="row"><Sel t="plot-w" label="Who to push" value={st.w} options={[['', 'Pick a wrestler'], ...I.push.map((w: any): [string, string] => [String(w.id), w.n])]} onChange={v => view(() => { st.w = v; })} />
          <Btn kind="sm" t="plot-do" d={{ v: 'push' }} disabled={!st.w || !A('push').can} onClick={() => run('push', { w: st.w }, () => { st.w = ''; })}>Push them</Btn></span></li>
      <li class="col" data-t="plot-row" data-v="tape"><span><b>{A('tape').n}</b> {cost('tape')}<br /><span class="muted">{A('tape').d}</span>
        {I.taped ? <><br /><span class="good" data-t="plot-taped">On {I.show}, {I.taped.where.toLowerCase()}: {I.taped.label}.</span></> : null}</span>
        {!I.show ? <span class="muted">Every show this week has run.</span> : (I.taped ? null : <span class="row">
          <Sel t="plot-k" label="What it is" value={st.k} options={I.kinds.map((k: any): [string, string] => [k.id, k.n])} onChange={v => view(() => { st.k = v; st.a = ''; st.b = ''; })} />
          <Sel t="plot-a" label="Who" value={st.a} options={[['', 'Who'], ...W1.map((id): [string, string] => [String(id), S.w[id].name])]} onChange={v => view(() => { st.a = v; st.b = ''; })} />
          {kind.two ? <Sel t="plot-b" label="Against whom" value={st.b} disabled={!st.a} options={[['', 'Against whom'], ...W2.map((id): [string, string] => [String(id), S.w[id].name])]} onChange={v => view(() => { st.b = v; })} /> : null}
          <Sel t="plot-at" label="Where on the show" value={st.at} options={I.pos.map((x: any): [string, string] => [x.id, x.n])} onChange={v => view(() => { st.at = v; })} />
          <Btn kind="sm" t="plot-do" d={{ v: 'tape' }} disabled={!st.a || (kind.two && !st.b) || !A('tape').can} onClick={() => run('tape', { k: kind.id, who: kind.two ? [st.a, st.b] : [st.a], at: st.at }, () => { st.a = ''; st.b = ''; })}>Buy it for {I.show}</Btn></span>)}</li>
    </ul>
  </Panel>;
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
      <div class="stack"><LongPlan /><Rebel /><Streaks /><StablePanel /><StableRoles /><Teams /></div>
    </div>
  </>;
}
