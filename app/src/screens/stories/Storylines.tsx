/* Storylines: the rivalries your booking started, plus streaks, stables and tag teams. Read-only. */
import { E } from '../../engine';
import { G, me, plural } from '../../store';
import { Head, Panel, Tag, Name, Meter, Empty, teamName, Txt } from '../../kit';

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

export function Storylines() {
  const S = G.S, P = me();
  const live = E.activeFeuds(S).filter((f: any) => f.promo === P.id).sort((a: any, b: any) => b.heat - a.heat);
  const done = S.feuds.filter((f: any) => f.res && f.promo === P.id).slice(-8).reverse();
  return <>
    <Head eyebrow="What your booking has set in motion" title="Storylines" />
    <div class="cols">
      <div class="stack">
        <Mystery />
        {live.length ? live.map((f: any) => <FeudCard f={f} />)
          : <Panel><Empty>No rivalries yet. Run a show or two: ambushes, challenges and betrayals start them.</Empty></Panel>}
        <Finished done={done} />
      </div>
      <div class="stack"><Streaks /><StablePanel /><Teams /></div>
    </div>
  </>;
}
