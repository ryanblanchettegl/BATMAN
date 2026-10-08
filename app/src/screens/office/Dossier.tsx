/* A person's file (docs/mockups/final/final-2-backstage.png, the right-hand window): who they are, why they are in
   the building, how they stand, what they remember about you, the people around them, and what you can do about it now.
   The engine reads it all in one call (E.dossier). It stands beside the board on Backstage, and opens as a pop-up from
   anywhere else (openDossier). */
import { useLayoutEffect, useRef, useState } from 'preact/hooks';
import { E } from '../../engine';
import { G, act, say, openModal, Modal } from '../../store';
import { Window, Group, Line, Meter, Tag, Name, Empty, Answer, showResult, Txt } from '../../kit';
import { Portrait } from '../../kit/portrait';

export function openDossier(id: number) { openModal({ kind: 'dossier', id }); }

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
/** The body of a file. `t` names the answer buttons (dz-do in the pop-up, ppl-do on the Backstage page).
    With `fit` it is in a window of fixed height (Backstage): when it does not fit, it says less, one step at a time
    (one memory, then no people around them, then no memories), and never scrolls. */
export function DossierBody(p: { id: number; t?: string; mem?: number; fit?: boolean }) {
  const S = G.S, D = E.dossier(S, p.id), box = useRef<HTMLDivElement>(null), [cut, setCut] = useState(0);
  useLayoutEffect(() => { const b = box.current && box.current.parentElement; if (p.fit && b && b.scrollHeight - b.clientHeight > 1 && cut < 3) setCut(cut + 1); });
  if (!D) return <Empty>They are not on your roster any more.</Empty>;
  const w = S.w[D.id], H = D.here, t = p.t || 'dz-do';
  const spend = (a: any) => act(() => { const r = E.peopleDo(S, H.pid, a.id); say(r.msg, { err: !r.ok }); showResult(D.name, r.msg, !r.ok); });
  const short = (n: string) => { const q = n.replace(/^(The|Sir|Lord|Lady|Dr\.|Mr\.|Mrs\.|Miss|Captain|King|Queen|Prince) /, '').split(/ (?:the|of|de|van|von|da) /)[0].split(' '); return q.length > 1 && q[0].length < 4 ? q.slice(0, 2).join(' ') : q[0]; };
  const who = (x: any, foe: boolean) => <span class="dz-who" key={x.id} title={x.name}><Portrait w={S.w[x.id]} /><Name w={S.w[x.id]} /><b class="nm">{short(x.name)}</b><i class={foe ? 'bad' : 'good'}>{foe ? (x.bond <= -60 ? 'real heat' : 'rival') : 'friend'}</i></span>;
  const mw = D.mood.w;
  const mem = cut >= 1 ? 1 : (p.mem || 3);
  return <div class="dz" data-t="dossier" data-id={D.id} data-cut={cut} ref={box}>
    <div class="dz-head"><Portrait w={w} cls="m" /><div>
      <p class="bl dz-name one">{D.name}</p>
      <p class="one">{D.align === 'F' ? 'Hero' : (D.align === 'H' ? 'Heel' : 'In between')} {'·'} {D.age}{D.town ? ' · from ' + D.town : ''}</p>
      <p class="muted one">{D.con} {D.con === 1 ? 'week' : 'weeks'} left {'·'} {E.money(D.wage)} a week</p>
      <p><Tag kind={D.mood.v < 40 ? 'bad' : (D.mood.v >= 65 ? 'good' : 'off')}>{mw}</Tag>{H ? <Tag kind="off">{H.place}</Tag> : null}{D.hurt ? <Tag kind="bad">Hurt, {D.hurt} wk</Tag> : null}</p>
    </div></div>
    <Group title="What is going on" t="dz-here">
      {H ? <p class="clamp c3"><Txt>{H.why}</Txt>.{H.story ? <span class="muted"> {H.story}.</span> : null}</p> : <p class="muted">Not waiting on you this week.</p>}
      {D.feuds.length && !H ? <p class="muted one">{D.feuds.map((f: any) => f.label + ' (' + f.stage.toLowerCase() + ')').join('. ')}</p> : null}
    </Group>
    <Group title="How they stand" t="dz-stand">
      <Line label="Mood" w={9}><Meter v={D.mood.v} n={6} kind={D.mood.v < 40 ? 'hot' : undefined} /> {D.mood.d != null && D.mood.d !== 0 ? <span class={D.mood.d < 0 ? 'bad' : 'good'}>{D.mood.d < 0 ? '▼ ' + (-D.mood.d) : '▲ ' + D.mood.d} since the show</span> : <span class="muted">{D.mood.d === 0 ? 'no change since the show' : mw.toLowerCase()}</span>}</Line>
      <Line label="With you" w={9}><Meter v={50 + D.you.v / 2} n={6} kind="cool" /> {D.you.w.toLowerCase()}</Line>
      <Line label="Stress" w={9}><Meter v={D.stress.v} n={6} kind={D.stress.v >= 55 ? 'hot' : 'au'} /> {D.stress.w.toLowerCase()}</Line>
    </Group>
    {cut >= 3 ? null : <Group title="They remember" t="dz-mem">
      {D.remember.length ? D.remember.slice(0, mem).map((m: any, i: number) => <p key={i} class="one"><Tag kind={m.v < 0 ? 'bad' : (m.v > 0 ? 'good' : 'off')}>{MONTHS[E.cal(S.week - m.ago).month] || 'Now'}</Tag><Txt>{m.t}</Txt></p>) : <p class="muted">Nothing about you yet. From here on, they will.</p>}
    </Group>}
    {cut >= 2 ? null : <Group title="The people around them" t="dz-ties">
      {D.friends.length || D.rivals.length ? <div class="dz-ties">{D.friends.map((x: any) => who(x, false))}{D.rivals.map((x: any) => who(x, true))}</div> : <p class="muted">Nobody close, and nobody against them.</p>}
    </Group>}
    <Group title="What you can do" t="dz-acts">
      {H && H.acts.length ? H.acts.map((a: any) => <Answer key={a.id} kind={/_no$/.test(a.id) ? 'danger' : (a.free ? 'less' : 'go')} t={t} d={{ v: a.id }} disabled={H.used || (S.ap <= 0 && !a.free)} note={(a.p != null ? a.p + '% · ' : '') + (a.free ? 'free' : '1 point')} onClick={() => spend(a)}>{a.n}</Answer>)
        : <p class="muted">Nothing they are asking of you this week.</p>}
      {H && H.used ? <p class="muted">You have already spent time with them this week.</p> : null}
    </Group>
  </div>;
}

export function DossierWindow(p: { m: Modal }) {
  const D = E.dossier(G.S, p.m.id);
  return <Window title={D ? D.name : 'Their file'} wide ok="Back"><DossierBody id={p.m.id} /></Window>;
}
