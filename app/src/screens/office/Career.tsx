/* Career: your own record, as a page of windows. Level and skills, the owner's trust, your word, your name, the
   assistant, the season saga, and your legacy, achievements and milestones behind buttons. */
import { E } from '../../engine';
import { G, me, act, plural, openModal } from '../../store';
import { Btn, Tag, Meter, Desktop, Win, Line, Window } from '../../kit';
import { LegacyPanel } from './GameOver';

const role = () => G.S.owner.me ? 'owner and booker' : 'booker';

function You() {
  const S = G.S, b = S.booker, o = S.owner, P = me(), need = E.xpNeed(b.lvl), style = E.STYLES[o.style], Y = E.ownerYear(S);
  return <Win title={b.name} area="you" t="career-you" right={'Level ' + b.lvl}>
    <p>{role().charAt(0).toUpperCase() + role().slice(1)} of {P.name}</p>
    <p class="muted">Difficulty: {(E.DIFF[S.diff] || E.DIFF.normal).n}{E.diffSummary(S) ? ' (' + E.diffSummary(S) + ')' : ''}</p>
    {S.iron ? <p class="gold">Iron man: one save, no going back.</p> : null}
    <p>Level <b>{b.lvl}</b> <Meter v={b.xp / need * 100} kind="au" /> <span class="num muted">{b.xp}/{need} XP</span>{b.pts ? <> {'·'} <span class="mark">{b.pts} {plural(b.pts, 'skill point')}</span></> : null}</p>
    <p>Booking power <b class="gold">{S.bp}</b> <span class="muted">(+{S.bpGrant} a week, holds up to {S.bpGrant * 2})</span></p>
    {o.me ? <p class="good">The company is yours. House style: {style.n}.</p>
      : <p>{o.name}{'’'}s trust <Meter v={o.trust} kind={o.trust < 25 ? 'hot' : 'cool'} /> <span class="num">{Math.round(o.trust)}</span>{o.trust < 20 ? <> <span class="bad">Your job is in danger.</span></> : null}<br />
        <span class="muted">House style: {style.n}. {o.name} wants {style.likes}.</span></p>}
    {Y ? <p data-t="career-year">Goals for the year <b class={Y.met === 3 ? 'good' : (Y.met <= 1 ? 'bad' : undefined)}>{Y.met} of 3</b> <span class="muted">on course</span> <Btn kind="sm" t="career-goals" onClick={() => openModal({ kind: 'ownyear' })}>Goals</Btn></p> : null}
    <ul class="list sklist">{Object.keys(E.SKILLS).map(k => {
      const sk = E.SKILLS[k], lv = b.sk[k] || 0;
      return <li>
        <span title={sk.d}><b>{sk.n}</b> <span class="meter au skp" role="img" aria-label={lv + ' of ' + sk.max}>{Array.from({ length: lv }, (_, k) => <s key={k} />)}<i>{Array.from({ length: Math.max(0, sk.max - lv) }, (_, k) => <s key={k} />)}</i></span></span>
        {b.pts > 0 && lv < sk.max && <Btn kind="sm" t="skill" d={{ k }} label={'Add a point to ' + sk.n} onClick={() => act(() => E.spendPoint(S, k))}>+1</Btn>}
      </li>;
    })}</ul>
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
