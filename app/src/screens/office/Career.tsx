/* Career: your own record, as a page of windows. Level and skills, the owner's trust, your word, your name, the
   assistant, the season saga, and your legacy, achievements and milestones behind buttons. */
import { E } from '../../engine';
import { G, me, act, plural, openModal } from '../../store';
import { Btn, Tag, Meter, Desktop, Win, Line, Window } from '../../kit';
import { useState } from 'preact/hooks';
import { LegacyPanel } from './GameOver';

const role = () => G.S.owner.me ? 'owner and booker' : 'booker';

function You() {
  const S = G.S, b = S.booker, o = S.owner, P = me(), need = E.xpNeed(b.lvl), style = E.STYLES[o.style], Y = E.ownerYear(S), owned = (E as any).treeInfo(S).owned;
  return <Win title={b.name} area="you" t="career-you" right={'Level ' + b.lvl}>
    <p>{role().charAt(0).toUpperCase() + role().slice(1)} of {P.name}</p>
    <p class="muted">Difficulty: {(E.DIFF[S.diff] || E.DIFF.normal).n}{E.diffSummary(S) ? ' (' + E.diffSummary(S) + ')' : ''}</p>
    {S.iron ? <p class="gold">Iron man: one save, no going back.</p> : null}
    <p data-t="career-dir">The Director: <b>{(E as any).dirDesk(S).style}</b> <Btn kind="sm" t="dir-style" onClick={() => openModal({ kind: 'dirstyle' })}>Change</Btn></p>
    <p>Level <b>{b.lvl}</b> <Meter v={b.xp / need * 100} kind="au" /> <span class="num muted">{b.xp}/{need} XP</span>{b.pts ? <> {'·'} <span class="mark">{b.pts} {plural(b.pts, 'skill point')}</span></> : null}</p>
    <p>Booking power <b class="gold">{S.bp}</b> <span class="muted">(+{S.bpGrant} a week, holds up to {S.bpGrant * 2})</span></p>
    {o.me ? <p class="good">The company is yours. House style: {style.n}.</p>
      : <p>{o.name}{'’'}s trust <Meter v={o.trust} kind={o.trust < 25 ? 'hot' : 'cool'} /> <span class="num">{Math.round(o.trust)}</span>{o.trust < 20 ? <> <span class="bad">Your job is in danger.</span></> : null}<br />
        <span class="muted">House style: {style.n}. {o.name} wants {style.likes}.</span></p>}
    {Y ? <p data-t="career-year">Goals for the year <b class={Y.met === 3 ? 'good' : (Y.met <= 1 ? 'bad' : undefined)}>{Y.met} of 3</b> <span class="muted">on course</span> <Btn kind="sm" t="career-goals" onClick={() => openModal({ kind: 'ownyear' })}>Goals</Btn></p> : null}
    <p data-t="career-tree">Skill tree: <b>{owned}</b> {plural(owned, 'skill')}, {need - b.xp} XP to level {b.lvl + 1}{b.pts ? <> {'·'} <span class="mark">{b.pts} {plural(b.pts, 'point')} to spend</span></> : null} <Btn kind={b.pts ? undefined : 'sm'} t="tree-open" onClick={() => openModal({ kind: 'tree' })}>Skill tree</Btn></p>
  </Win>;
}

/** The owner's three goals for the year, judged at the flagship (src/66-owner-year.js). */
export function OwnerYearWindow() {
  const S = G.S, o = S.owner, Y = E.ownerYear(S);
  if (!Y) return <Window title="Goals for the year" ok="Done"><p>The company is yours. Nobody sets you goals now.</p></Window>;
  return <Window title={o.name + '’s goals for the year'} ok="Done">
    <p>{o.name} judges the year at the flagship{Y.end ? ', ' + Y.end : ''}{Y.left != null ? ' (' + Y.left + ' ' + plural(Y.left, 'week') + ' away)' : ''}. All three met raises trust by 12; one or none costs up to 15.</p>
    <ul class="list mt1" data-t="year-goals">{Y.asks.map((x: any) => <li key={x.k}><span><b>{x.n}</b><br /><span class="muted">{x.now}</span></span><Tag kind={x.ok ? 'good' : 'bad'}>{x.ok ? 'On course' : 'Behind'}</Tag></li>)}</ul>
    <p class="muted mt1">Meet all three for two years and {o.name} can hand you the company. Years with all three met: {Y.years} of 2.</p>
  </Window>;
}

/** Locker-room trust and the last few promises, kept or broken. */
function YourWord() {
  const S = G.S, t = S.trust == null ? 60 : S.trust, L: any[] = S.ledger || [];
  return <Win title="Your word" area="word" t="career-word">
    <p>Locker-room trust <Meter v={t} kind="cool" /> <span class="num">{Math.round(t)}</span></p>
    {L.length ? <ul class="list">{L.slice(0, 3).map(x => <li><span>{x.t.charAt(0).toUpperCase() + x.t.slice(1)}</span><Tag kind={x.k ? 'good' : 'bad'}>{x.k ? 'Kept' : 'Broken'}</Tag></li>)}</ul>
      : <p class="muted">No promises made yet. Keeping your word builds trust; breaking it costs far more than it earns.</p>}
  </Win>;
}

function Saga() {
  const info = E.sagaInfo(G.S); if (!info) return <Win title="The season" area="saga" t="career-saga"><p class="muted">The season saga starts with your first season.</p></Win>;
  return <Win title={'Season ' + info.n + ' saga'} area="saga" t="career-saga">
    <ul class="list">{info.ch.map((c: any, i: number) => {
      const st = c.done === true ? <Tag kind="good">Done</Tag> : (c.done === false ? <Tag kind="bad">Missed</Tag> : (c.cur ? <Tag kind="gold">{c.v} of {c.need}</Tag> : <Tag>To come</Tag>));
      return <li title={c.goal || ''}><span><b>{i + 1}. {c.name}</b>{c.goal && c.cur && c.done == null ? <><br /><span class="muted">{c.goal}</span></> : null}</span>{st}</li>;
    })}</ul>
    <p class="muted">A chapter lasts twelve weeks and earns 2 booking power.</p>
  </Win>;
}

/* Legacy, achievements and the milestone wall: a line each, with a button that opens the whole of it. */
function Trophies() {
  const S = G.S, L = E.legacy(S), got = Object.keys(S.ach).length, A = E.ACH.filter((a: any) => !a.ms), M: any[] = E.milestones(S), mg = M.filter(m => m.w).length;
  const wall = () => <ul class="list">{M.map(m => <li><span><b>{m.name}</b><br /><span class="muted">{m.desc}</span></span><span class={m.w ? 'good' : 'muted'}>{m.w ? E.cal(m.w).label : 'Not yet'}</span></li>)}</ul>;
  const next = M.filter(m => !m.w)[0];
  return <Win title="Legacy" area="troph" t="career-troph">
    <Line label="Legacy" w={13}><b class="num">{L.score}</b> points{L.made.length ? ', ' + L.made.length + ' ' + plural(L.made.length, 'star') + ' made' : ''}</Line>
    <Line label="Achievements" w={13}><b class="num">{got}</b> of {A.length} earned</Line>
    <Line label="Milestones" w={13}><b class="num">{mg}</b> of {M.length}{next ? <span class="muted">, next: {next.name}</span> : null}</Line>
    <div class="row mt1">
      <Btn kind="sm" t="career-legacy" onClick={() => openModal({ kind: 'info', title: 'Your legacy so far', wide: true, body: () => <LegacyPanel /> })}>The whole story</Btn>
      <Btn kind="sm" t="career-ach" onClick={() => openModal({ kind: 'info', title: 'Achievements · ' + got + ' of ' + A.length, wide: true, body: () => <Achievements /> })}>Achievements</Btn>
      <Btn kind="sm" t="career-wall" onClick={() => openModal({ kind: 'info', title: 'Milestone wall · ' + mg + ' of ' + M.length, wide: true, body: wall })}>The wall</Btn>
    </div>
  </Win>;
}
function Achievements() {
  const S = G.S, A = E.ACH.filter((a: any) => !a.ms);
  return <>
    <div class="ach">{A.map((a: any) => {
      const g = S.ach[a.id], hide = a.hidden && !g;
      return <div class={g ? 'got' : undefined}><b>{hide ? 'Hidden' : a.name}</b><span>{hide ? 'Keep playing to find this one.' : a.desc}</span>{g ? <><br /><span class="muted">Unlocked {E.cal(g).label}</span></> : null}</div>;
    })}</div>
  </>;
}

/** What your booking has earned you a name for. */
function Reputation() {
  const S = G.S, L = E.bookerRep(S);
  return <Win title="Your reputation" area="rep" t="career-rep">
    <ul class="list">{L.map((r: any) => <li class="col" title={r.earn + (r.has ? ' ' + r.edge + ' ' + r.cost : '')}><span><b class={r.has ? 'gold' : 'muted'}>{r.n}</b> <span class="muted">{r.has ? '· since ' + E.cal(r.since).label : '· ' + r.progress + ' of ' + r.need}</span>{r.has ? <><br /><span class="good">{r.edge}</span></> : null}</span></li>)}</ul>
    <p class="muted">A name is earned by how you book, and lost if you stop.</p>
  </Win>;
}

export function Career() {
  const S = G.S, P = me();
  return <div class="onescreen"><div class="head sr"><h1>Career</h1><p>{S.booker.name}, {role()} of {P.name}</p></div>
    <Desktop cls="crpage" t="career"><You /><Reputation /><Saga /><YourWord /><Trophies /></Desktop>
  </div>;
}

/** The Director's style: how trouble reaches your desk (src: engine/99-director.ts). Free in the first week, then a small cost to the owner's trust; locked in iron man. */
export function DirStyleWindow(p: { m: any }) {
  const S = G.S, T = (E as any).DIR_STYLES, cur = (E as any).dirDesk(S).st, cost = S.week > 1 && !S.owner.me;
  return <Window title="The Director" ok="Back">
    <p class="muted">How trouble reaches your desk. It is a taste, not difficulty.{S.iron && S.week > 1 ? ' In iron man it is set for the whole game.' : cost ? ' Changing it now costs a little of the owner\u2019s trust.' : ''}</p>
    <ul class="list">{Object.keys(T).map(id => <li key={id} data-t="dir-opt" data-v={id}><span><b>{T[id].n}</b><br /><span class="muted">{T[id].d}</span></span>
      {id === cur ? <span class="good">Now</span> : <Btn kind="sm" t="dir-pick" d={{ v: id }} disabled={!!(S.iron && S.week > 1)} onClick={() => act(() => { (E as any).dirSetStyle(S, id); })}>Pick</Btn>}</li>)}</ul>
  </Window>;
}

/** The booker's skill tree: four branches in tiers; a tier opens as you spend in its branch (engine/65-youtree.ts).
    Each skill is a short card; the picked one is told in full at the foot with its Take button, so the tree fits one screen. */
const KIND: Record<string, string> = { bonus: 'Bonus', action: 'New action', trade: 'Trade-off' };
export function TreeWindow(p: { m: any }) {
  const S = G.S, T = (E as any).treeInfo(S), all = T.branches.flatMap((b: any) => b.tiers.flatMap((t: any) => t.nodes.map((n: any) => Object.assign({ br: b, tier: t }, n))));
  const [pick, setPick] = useState<string>(''), P = all.find((n: any) => n.id === pick) || null;
  return <Window title="Skill tree" wide ok="Back">
    <p class="muted one">{T.pts ? T.pts + ' ' + plural(T.pts, 'point') + ' to spend.' : 'No points to spend: you get one each level.'} Spend in a branch to open its next tier. {T.owned} {plural(T.owned, 'skill')} yours so far.</p>
    <div class="treecols" data-t="tree">{T.branches.map((b: any, bi: number) => <div class="treecol" key={b.id} data-t="tree-branch" data-v={b.id}>
      <h3 class="treehd" title={b.d}>{b.n}</h3>
      {b.tiers.map((t: any) => <div class={'treetier' + (t.open ? '' : ' locked')} key={t.t}>
        <p class="treetl" title={t.open ? '' : 'Spend ' + (t.need - b.spent) + ' more in ' + b.n + ' to open it.'}>Tier {t.t + 1}{t.open ? '' : ' · ' + (t.need - b.spent) + ' more to open'}</p>
        {t.nodes.map((n: any, ni: number) => <button type="button" key={n.id} data-t="tree-node" data-v={n.id} aria-pressed={pick === n.id}
          class={'treecard' + (n.has ? ' has' : '') + (n.soon ? ' soon' : '') + (n.can ? ' can' : '') + (pick === n.id ? ' on' : '')} style={{ transform: 'rotate(' + (((bi * 7 + ni * 3 + t.t) % 5) - 2) * 0.4 + 'deg)' }}
          title={n.d} onClick={() => setPick(n.id)}>
          <b>{n.n}</b><span class="tk">{n.has ? 'Yours' : n.soon ? 'Soon' : KIND[n.k]}{n.c > 1 ? ' · ' + n.c : ''}</span>
        </button>)}
      </div>)}
    </div>)}</div>
    <div class="treepick" data-t="tree-pick">{P ? <>
      <span><b>{P.n}</b> <span class="muted">{KIND[P.k]}, {P.c} {plural(P.c, 'point')}, {P.br.n}</span><br />{P.d}{P.soon ? ' Coming in a later update.' : ''}{P.k === 'bonus' && T.stand[P.sk] ? <><br /><b class="mark">{T.stand[P.sk].n} {T.stand[P.sk].v}{P.has ? '' : ' \u2192 ' + Math.min(T.stand[P.sk].cap, T.stand[P.sk].v + 1)} of {T.stand[P.sk].cap}</b></> : null}</span>
      {P.has ? <span class="good">Yours</span> : <Btn t="tree-buy" d={{ id: P.id }} disabled={!P.can} tip={P.soon ? 'Coming in a later update.' : !P.tier.open ? 'Spend ' + (P.tier.need - P.br.spent) + ' more in ' + P.br.n + ' to open this tier.' : T.pts < P.c ? 'You need ' + P.c + ' ' + plural(P.c, 'point') + '.' : 'Take it now.'}
        onClick={() => act(() => { (E as any).treeSpend(S, P.id); })}>Take</Btn>}
    </> : <span class="muted">Pick a skill to read it in full.</span>}</div>
  </Window>;
}
