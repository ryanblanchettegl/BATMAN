/* Staff (src/99-staff.js): the people on your books who do not wrestle. One pop-up holds them all and makes new
   ones (Create staff); another moves a wrestler of yours onto the staff in a job. */
import { useState } from 'preact/hooks';
import { E, W } from '../../engine';
import { G, act, cash, openModal, closeModal, Modal } from '../../store';
import { Btn, TextBox, Window, Portrait, showResult } from '../../kit';

function skillWord(n: number | null): string { return n == null ? '' : n >= 80 ? 'one of the best' : n >= 68 ? 'very good' : n >= 58 ? 'capable' : 'learning'; }

/** Everybody on your staff, and Create staff beside them. */
export function StaffWindow(_p: { m: Modal }) {
  const S = G.S, L: any[] = E.staffList(S), roles: any[] = E.SROLES, lv: any[] = E.STAFF_LVL;
  const [name, setName] = useState(''), [g, setG] = useState('M'), [role, setRole] = useState('referee'), [lvl, setLvl] = useState('solid');
  const hire = () => { const r = act(() => E.createStaff(S, { name, g, role, lvl })); if (r.ok) { setName(''); showResult('Create staff', r.msg); } else showResult('Create staff', r.msg, true); };
  return <Window title="Your staff" wide>
    <div class="stf">
      <section class="stf-list">
        <h3>On your books ({L.length})</h3>
        <div class="lb scroll stf-rows">
          {L.length ? L.map(x => <div class="stf-row" key={x.id} data-t="staff-row" data-id={x.id}>
            <Portrait w={S.w[x.id]} />
            <div><b>{x.name}</b> <span class="muted">{x.role}{x.skill != null ? ', ' + skillWord(x.skill) : ''}</span><br /><span class="muted">{cash(x.wage)} a week{x.desk ? ' · at the commentary desk' : ''}</span></div>
            <span class="row nowrap">
              {x.k === 'commentator' ? <Btn kind="sm" t="staff-desk" d={{ id: x.id }} onClick={() => openModal({ kind: 'voices' })}>Desk</Btn> : null}
              <Btn kind="sm" t="staff-look" d={{ id: x.id }} onClick={() => openModal({ kind: 'player', id: x.id })}>Look</Btn>
              {x.back ? <Btn kind="sm" t="staff-back" d={{ id: x.id }} onClick={() => { const r = act(() => E.fromStaff(S, x.id)); showResult('Back to wrestling', r.msg, !r.ok); }}>Wrestle</Btn> : null}
            </span>
          </div>) : <p class="muted">Nobody yet.</p>}
        </div>
        <p class="muted mt1">To move a wrestler onto the staff, pick them on the Roster and press Move to staff.</p>
      </section>
      <section class="stf-new" data-t="staff-create">
        <h3>Create staff</h3>
        <div class="row nowrap"><TextBox id="stf-name" t="staff-name" label="Name" placeholder="Their name" value={name} onInput={setName} />
          <Btn kind="sm" t="staff-g" d={{ v: 'M' }} on={g === 'M'} onClick={() => setG('M')}>Man</Btn><Btn kind="sm" t="staff-g" d={{ v: 'F' }} on={g === 'F'} onClick={() => setG('F')}>Woman</Btn></div>
        <p class="eyebrow mt1">The job</p>
        <div class="stf-tiles">{roles.map(r => <button type="button" class={'stf-tile' + (role === r.id ? ' on' : '')} data-t="staff-role" data-v={r.id} aria-pressed={role === r.id} title={r.d} onClick={() => setRole(r.id)}><b>{r.n}</b><span>{r.d}</span></button>)}</div>
        <p class="eyebrow mt1">How seasoned</p>
        <div class="row">{lv.map(l => <Btn kind="sm" t="staff-lvl" d={{ v: l.id }} on={lvl === l.id} onClick={() => setLvl(l.id)}>{l.n} ({cash(l.wage)})</Btn>)}</div>
        <div class="row mt1"><Btn kind="go" t="staff-hire" disabled={name.trim().length < 2} onClick={hire}>Hire</Btn><span class="muted">They join your books on a 48-week deal.</span></div>
      </section>
    </div>
  </Window>;
}

/** Move one wrestler of yours onto the staff: pick the job. Each job says how good at it they would be. */
export function ToStaffWindow(p: { m: Modal }) {
  const S = G.S, w: W = S.w[p.m.id], ok = E.toStaffOk(S, w.id), roles: any[] = E.SROLES;
  const go = (k: string) => { const r = act(() => E.toStaff(S, w.id, k)); closeModal(); showResult('Move to staff', r.msg, !r.ok); };
  return <Window title={'Move to staff: ' + w.name}>
    <div class="row top nowrap gap2"><Portrait w={w} /><p>{ok.ok ? w.name + ' stops wrestling and takes a job. They keep their deal. Pick the job.' : ok.why}</p></div>
    {ok.ok ? <div class="stf-tiles mt1">{roles.map(r => { const sk = Math.round(E.staffSkill(S, w.id, r.id)); return <button type="button" class="stf-tile" data-t="tostaff" data-v={r.id} title={r.d} onClick={() => go(r.id)}><b>{r.n}</b><span>{r.d}</span><i>They would be {skillWord(sk)} at it.</i></button>; })}</div> : null}
  </Window>;
}
