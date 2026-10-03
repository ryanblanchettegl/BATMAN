/* Career: your own record. Level and skills, the owner's trust, your word, the season saga, achievements. */
import { E } from '../../engine';
import { G, me, act, plural } from '../../store';
import { Head, Panel, Btn, Tag, Meter } from '../../kit';

const role = () => G.S.owner.me ? 'owner and booker' : 'booker';

function You() {
  const S = G.S, b = S.booker, o = S.owner, P = me(), need = E.xpNeed(b.lvl), style = E.STYLES[o.style];
  return <Panel title="You">
    <p><b>{b.name}</b>, {role()} of {P.name}</p>
    <p class="muted">Difficulty: {(E.DIFF[S.diff] || E.DIFF.normal).n}{E.diffSummary(S) ? ' (' + E.diffSummary(S) + ')' : ''}</p>
    {S.iron ? <p class="gold">Iron man: one save, no going back.</p> : null}
    <p>Level <b>{b.lvl}</b> <Meter v={b.xp / need * 100} kind="au" /> <span class="num muted">{b.xp}/{need} XP</span>{b.pts ? <> {'·'} <span class="mark">{b.pts} {plural(b.pts, 'skill point')}</span></> : null}</p>
    <p>Booking power <b class="gold">{S.bp}</b> <span class="muted">(+{S.bpGrant} a week, holds up to {S.bpGrant * 2})</span></p>
    {o.me ? <p class="good">The company is yours. House style: {style.n}.</p>
      : <p>{o.name}{'’'}s trust <Meter v={o.trust} kind={o.trust < 25 ? 'hot' : 'cool'} /> <span class="num">{Math.round(o.trust)}</span>{o.trust < 20 ? <> <span class="bad">Your job is in danger.</span></> : null}<br />
        <span class="muted">House style: {style.n}. {o.name} wants {style.likes}.</span></p>}
    <ul class="list">{Object.keys(E.SKILLS).map(k => {
      const sk = E.SKILLS[k], lv = b.sk[k] || 0;
      return <li>
        <span><b>{sk.n}</b> <span class="num gold" role="img" aria-label={lv + ' of ' + sk.max}>{'■'.repeat(lv)}<span class="muted">{'□'.repeat(Math.max(0, sk.max - lv))}</span></span><br /><span class="muted">{sk.d}</span></span>
        {b.pts > 0 && lv < sk.max && <Btn kind="sm" t="skill" d={{ k }} label={'Add a point to ' + sk.n} onClick={() => act(() => E.spendPoint(S, k))}>+1</Btn>}
      </li>;
    })}</ul>
  </Panel>;
}

/** Locker-room trust and the last few promises, kept or broken. */
function YourWord() {
  const S = G.S, t = S.trust == null ? 60 : S.trust, L: any[] = S.ledger || [];
  return <Panel title="Your word">
    <p>Locker-room trust <Meter v={t} kind="cool" /> <span class="num">{Math.round(t)}</span></p>
    {L.length ? <ul class="list">{L.slice(0, 6).map(x => <li><span>{x.t}</span><Tag kind={x.k ? 'good' : 'bad'}>{x.k ? 'Kept' : 'Broken'}</Tag></li>)}</ul>
      : <p class="muted">No promises made yet. Keeping your word builds trust; breaking it costs far more than it earns.</p>}
  </Panel>;
}

function Saga() {
  const info = E.sagaInfo(G.S); if (!info) return null;
  return <Panel title={'Season ' + info.n + ' saga'}>
    <ul class="list">{info.ch.map((c: any, i: number) => {
      const st = c.done === true ? <Tag kind="good">Done</Tag> : (c.done === false ? <Tag kind="bad">Missed</Tag> : (c.cur ? <Tag kind="gold">{c.v} of {c.need}</Tag> : <Tag>To come</Tag>));
      return <li><span><b>Chapter {i + 1}: {c.name}</b>{c.goal && (c.cur || c.done != null) ? <><br /><span class="muted">{c.goal}{c.cur && c.done == null ? ' By ' + E.cal(c.due).label + '.' : ''}</span></> : null}</span>{st}</li>;
    })}</ul>
    <p class="muted mt2">A chapter lasts twelve weeks. Finishing one earns 2 booking power. The season ends with a chronicle on the History screen.</p>
  </Panel>;
}

function Achievements() {
  const S = G.S, got = Object.keys(S.ach).length, A = E.ACH.filter((a: any) => !a.ms);
  return <>
    <h2 class="mt4 mb2">Achievements {'·'} {got} of {A.length}</h2>
    <div class="ach">{A.map((a: any) => {
      const g = S.ach[a.id], hide = a.hidden && !g;
      return <div class={g ? 'got' : undefined}><b>{hide ? 'Hidden' : a.name}</b><span>{hide ? 'Keep playing to find this one.' : a.desc}</span>{g ? <><br /><span class="muted">Unlocked {E.cal(g).label}</span></> : null}</div>;
    })}</div>
  </>;
}

function MilestoneWall() {
  const L: any[] = E.milestones(G.S), got = L.filter(m => m.w).length;
  return <Panel title={'Milestone wall · ' + got + ' of ' + L.length}>
    <ul class="list">{L.map(m => <li><span><b>{m.name}</b><br /><span class="muted">{m.desc}</span></span><span class={m.w ? 'good' : 'muted'}>{m.w ? E.cal(m.w).label : 'Not yet'}</span></li>)}</ul>
  </Panel>;
}

/** What your booking has earned you a name for. */
function Reputation() {
  const S = G.S, L = E.bookerRep(S);
  return <Panel title="Your reputation">
    <ul class="list">{L.map((r: any) => <li class="col"><span><b class={r.has ? 'gold' : 'muted'}>{r.n}</b> <span class="muted">{r.has ? '· since ' + E.cal(r.since).label : '· ' + r.progress + ' of ' + r.need}</span><br /><span class="muted">{r.earn}</span></span>
      {r.has ? <span><span class="good">{r.edge}</span><br /><span class="bad">{r.cost}</span></span> : null}</li>)}</ul>
    <p class="muted mt1">A name is earned by how you book, and lost if you stop. Each one has an edge and a price. Rival owners and the board notice.</p>
  </Panel>;
}

export function Career() {
  const S = G.S, P = me();
  return <>
    <Head eyebrow={S.booker.name + ', ' + role() + ' of ' + P.name} title="Career" />
    <div class="cols">
      <div class="stack"><You /><YourWord /></div>
      <div class="stack"><Reputation /><Saga /><MilestoneWall /></div>
    </div>
    <Achievements />
  </>;
}
