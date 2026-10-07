/* This week's tasks, on the desk: everything that should be filled in before a show is booked or the week ends.
   Each one has a button that takes you to it, and where it can wait, a button to leave it for another week. */
import { E } from '../../engine';
import { G, act, say, view, openModal, closeModal, Modal, full } from '../../store';
import { go } from '../../nav';
import { Btn, Tag, Txt, Window, Empty, Name, showResult } from '../../kit';
import { office } from './util';
import { openVoices, openFace } from './Windows';

const TAG: Record<string, [string, 'warn' | 'good' | 'bad' | undefined]> = { todo: ['Must do', 'warn'], optional: ['Worth doing', undefined], waved: ['Not this week', undefined], done: ['Done', 'good'] };

function open(t: any) {
  if (t.id === 'ap') { go('backstage'); return; }
  if (t.id === 'desk-pbp' || t.id === 'desk-col') { openVoices(t.id === 'desk-col' ? 'col' : 'pbp'); return; }   // answered in a pop-up, without leaving the Office
  if (t.id === 'face') { openFace(); return; }
  if (t.id === 'house') { openModal({ kind: 'mng', k: 'house', v: 'style' }); return; }
  if (t.id === 'sponsors') { openModal({ kind: 'mng', k: 'deals', v: 'offers' }); return; }   // the offers, over the desk
  if (/^title-/.test(t.id)) { openModal({ kind: 'tasktitle', id: t.id.slice(6) }); return; }
  if (/^con-/.test(t.id)) { openModal({ kind: 'taskcon', id: +t.id.slice(4) }); return; }
  if (t.id === 'inbox') { const e = G.S.inbox.find((x: any) => !x.done); if (e) openModal({ kind: 'matter', id: e.id }); return; }
  go(t.to);
}

/** A vacant title, answered from the desk: start a tournament for it, or go and book a match for it. */
export function TitleTaskWindow(p: { m: Modal }) {
  const S = G.S, P = S.promos[S.player], t = P.titles.find((x: any) => String(x.id) === String(p.m.id));
  if (!t || t.holders.length) return <Window title="The title"><Empty>That belt has a holder now.</Empty></Window>;
  const L: any[] = t.tag ? [] : E.rankFor(S, t.id, 5), ko = t.tag ? 'Tournaments are for singles titles.' : E.tournOk(S, t.id, 'ko'), rr = t.tag ? ko : E.tournOk(S, t.id, 'rr');
  const start = (fmt: string) => act(() => { const r = E.startTourn(S, t.id, fmt); showResult(t.name, r, !/is set/.test(r)); });
  return <Window title={'The ' + t.name + ': vacant'} wide ok="Not now">
    <p>Nobody holds {t.tag ? 'them' : 'it'}. A belt with no champion is worth a little less every week.</p>
    {L.length ? <><p class="eyebrow mt2">First in line</p><ol class="rank" data-t="tt-rank">{L.map(w => <li key={w.id}><Name w={w} /> <span class="muted num">{Math.round(w.ovr)}</span></li>)}</ol></> : null}
    <ul class="list mt2">
      <li class="col"><span><b>Start a tournament</b><br /><span class="muted">It runs over the coming weeks on your shows, and the final crowns the champion.</span>{ko && rr ? <><br /><span class="warn">{ko}</span></> : null}</span>
        <span class="row"><Btn kind="sm" t="tt-tourn" d={{ v: 'ko' }} disabled={!!ko} onClick={() => start('ko')}>Knockout (8)</Btn><Btn kind="sm" t="tt-tourn" d={{ v: 'rr' }} disabled={!!rr} onClick={() => start('rr')}>League (6)</Btn></span></li>
      <li class="col"><span><b>Book one match for it</b><br /><span class="muted">Pick two on the card and put the belt on the line. The winner is champion that night.</span></span>
        <span class="row"><Btn kind="sm" t="tt-book" onClick={() => { closeModal(); go('booking'); }}>Go to the card</Btn></span></li>
    </ul>
  </Window>;
}
/** A contract about to end, answered from the desk: sign them again or let them go. */
export function ContractTaskWindow(p: { m: Modal }) {
  const S = G.S, w = S.w[p.m.id];
  if (!w || w.promo !== S.player || w.con > 1) return <Window title="The contract"><Empty>That contract is dealt with.</Empty></Window>;
  const renew = (weeks: number) => act(() => { const r = E.renew(S, w.id, weeks); showResult(w.name, r); });
  const row = (weeks: number, label: string) => { const ask = E.renewAsk(S, w.id, weeks); return <li class="col" key={weeks}>
    <span><b>{label}</b><br /><span class="muted">{full(ask)} a week{ask > w.wage ? ', up from ' + full(w.wage) : (ask < w.wage ? ', down from ' + full(w.wage) : ', the same as now')}.</span></span>
    <span class="row"><Btn kind="sm" t="tc-renew" d={{ v: weeks }} onClick={() => renew(weeks)}>Sign for {weeks} weeks</Btn></span></li>; };
  return <Window title={w.name + '’s contract'} wide ok="Not now">
    <p><Name w={w} /> is on {full(w.wage)} a week. The contract ends {w.con <= 0 ? 'this week' : 'next week'}. <span class="muted">If nothing is signed they become a free agent, and anybody can make an offer.</span></p>
    <ul class="list mt2">{row(48, 'One more year')}{row(96, 'Two more years')}</ul>
    <p class="muted mt1">Morale changes the asking price: {w.morale < 50 ? 'they are unhappy, so it costs more.' : (w.morale >= 75 ? 'they are happy here, so it costs less.' : 'theirs is about average.')}</p>
  </Window>;
}

/** The body of the tasks window on the desk: four to a page, a line each, with the button that deals with it. */
export function Tasks() {
  const S = G.S, T = E.tasks(S), st = office() as any, per = (window as any).EWF_FLAT ? 99 : (document.documentElement.getAttribute('data-screen') === 'desk' ? 4 : 3), /* a test that wants every task on the page sets EWF_FLAT */ pages = Math.max(1, Math.ceil(T.list.length / per)), pg = Math.min(st.tpg || 0, pages - 1);
  const L: any[] = T.list.slice(pg * per, pg * per + per);
  return <div class="tasks" data-t="tasks">
    {T.list.length ? L.map((t: any) => <div key={t.id} class={'it task ' + t.state + (t.state === 'todo' && T.strict ? ' must' : '')} data-task={t.id}>
      <span class="tx">{t.state === 'todo' && T.strict ? <span class="mark" aria-hidden="true">!</span> : null}<Tag kind={t.req || t.miss ? 'bad' : (TAG[t.state][1] || 'off')}>{t.req ? 'Required' : (t.miss ? (t.id === 'ap' ? 'Unspent' : 'Missed') : (t.hit ? 'Hit' : (t.state === 'todo' && !T.strict ? 'To do' : TAG[t.state][0])))}</Tag><span class={t.state === 'done' || t.state === 'waved' ? 'muted' : undefined} title={t.text}>{t.short && t.state !== 'done' ? t.short : <Txt>{t.text}</Txt>}</span></span>
      <span class="opts">
        {t.state === 'todo' || t.state === 'optional' ? <Btn kind={t.state === 'optional' ? 'less' : undefined} t="task-go" d={{ v: t.id }} onClick={() => open(t)}>{t.label}</Btn> : null}
        {t.state === 'todo' && t.waive ? <Btn kind="less" t="task-wave" d={{ v: t.id }} label={'Not this week: ' + t.text} onClick={() => act(() => { const r = E.taskWave(S, t.id); say(r.msg, { err: !r.ok }); })}>Later</Btn> : null}
        {t.state === 'waved' ? <Btn kind="less" t="task-unwave" d={{ v: t.id }} onClick={() => act(() => { E.taskUnwave(S, t.id); })}>Put it back</Btn> : null}
      </span></div>) : <p class="good">Nothing is waiting on your desk this week.</p>}
    <div class="tfoot">
      <Btn kind="sm" t="open-voices" onClick={() => openVoices()}>Commentary desk</Btn><Btn kind="sm" t="open-letter" onClick={() => openModal({ kind: 'welcome', again: 1 })}>Owner{'’'}s letter</Btn>
    </div>
    <div class="tnote">
      {pages > 1 ? <span class="pgr"><Btn kind="sm" t="tasks-page" d={{ v: 'prev' }} label="Earlier tasks" disabled={pg <= 0} onClick={() => view(() => { st.tpg = pg - 1; })}>{'◄'}</Btn><span class="num" data-t="tasks-pg">{pg + 1} of {pages}</span><Btn kind="sm" t="tasks-page" d={{ v: 'next' }} label="More tasks" disabled={pg >= pages - 1} onClick={() => view(() => { st.tpg = pg + 1; })}>{'►'}</Btn></span> : null}
      {T.list.length ? <span class="muted one" data-t="task-note">{!T.strict ? 'Reminders only. Tasks do not come first (Options).'
        : (T.todo ? (T.show ? 'A show cannot run until ' + (T.show === 1 ? 'the one marked ! is' : 'those marked ! are') + ' done or left for later.' : 'The week cannot end until ' + (T.todo === 1 ? 'it is' : 'they are') + ' done.') : 'Everything that had to be done is done.')}</span> : null}
    </div>
  </div>;
}
