/* Wrestlers' court: the docket shown when the court room is open on the desk. */
import { E } from '../../engine';
import { G, act, say, plural } from '../../store';
import { Btn, Tag, Txt } from '../../kit';
import { focusAfter, TO_MAP } from './util';

export function Court(p: { blocked: string }) {
  const S = G.S, cs: any[] = E.court(S), off = !!p.blocked;
  // a ruling costs an action point; handing the case to a locker-room leader is free
  const rule = (cid: number, v: number) => act(() => { const r = E.apDo(S, 'court', 'case', { cid, v }); say(r.msg, { err: !r.ok }); focusAfter(TO_MAP); });
  const hand = (cid: number) => act(() => { const r = E.courtDelegate(S, cid); say(r.msg, { err: !r.ok }); focusAfter(TO_MAP); });
  return <>
    <ul class="list">
      {!cs.length && <li><span class="empty">No cases on the docket. Disputes turn up when tempers do.</span></li>}
      {cs.map(c => {
        const A = S.w[c.a], B = S.w[c.b];
        return <li class="col" key={c.id}>
          <span><b>{A.name} against {B.name}</b><br /><Txt>{c.text}</Txt><br />
            <span class="muted">{c.left ? 'Festers into a grudge in ' + c.left + ' ' + plural(c.left, 'week') + '.' : 'Last chance: this turns into a grudge at the end of the week.'}</span></span>
          <span><span class="eyebrow">Witnesses</span>{c.ev.map((e: any) => <><br />{e.name}{e.role ? <> <Tag kind="gold">{e.role}</Tag></> : null} backs <b>{e.backs}</b></>)}</span>
          <span class="row">
            <Btn kind="sm" t="bs-court" d={{ id: c.id, v: 0 }} disabled={off} onClick={() => rule(c.id, 0)}>Find for {A.name}</Btn>
            <Btn kind="sm" t="bs-court" d={{ id: c.id, v: 1 }} disabled={off} onClick={() => rule(c.id, 1)}>Find for {B.name}</Btn>
            {c.ring && <Btn kind="sm" t="bs-court" d={{ id: c.id, v: 2 }} disabled={off} onClick={() => rule(c.id, 2)}>Settle it in the ring</Btn>}
            <Btn kind="sm" t="bs-court" d={{ id: c.id, v: 3 }} disabled={off} onClick={() => rule(c.id, 3)}>Dismiss</Btn>
            {c.leader && <Btn kind="sm" t="bs-deleg" d={{ id: c.id }} onClick={() => hand(c.id)}>Let a leader or veteran hear it (free)</Btn>}
          </span>
        </li>;
      })}
    </ul>
    {E.courtLog(S).length ? <div class="mt2"><p class="eyebrow">Past verdicts</p><ul class="list">{E.courtLog(S).map((v: any) => <li><span>Week {v.w}: <Txt>{S.w[v.win].name + ' over ' + S.w[v.lose].name}</Txt>{v.judge != null && S.w[v.judge] ? <span class="muted"> (heard by {S.w[v.judge].name})</span> : null}</span>
      <span>{v.fair ? <span class="good">fair</span> : <span class="bad">disputed</span>}{v.rep ? <> <Tag kind="bad">{S.w[v.lose].name.split(' ')[0]}: {v.n} lost, dealt with harder</Tag></> : null}</span></li>)}</ul></div> : null}
    <p class="muted mt1">A fair verdict builds locker-room trust; a wrong one costs it. Leaders and veterans are reliable witnesses. A toxic influence usually is not.</p>
  </>;
}
