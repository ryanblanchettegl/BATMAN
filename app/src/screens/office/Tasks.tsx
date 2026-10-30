/* This week's tasks: what opens each one (the rows themselves are on the desk's to-do list, Board.tsx), and the
   pop-ups that answer a task without leaving the Office. */
import { E } from '../../engine';
import { G, act, view, openModal, closeModal, Modal, full, slice } from '../../store';
import { go } from '../../nav';
import { Btn, Window, Empty, Name, showResult } from '../../kit';
import { openVoices, openFace } from './Windows';


/** Open whatever deals with a task: a pop-up on the desk where it can be, else its page. */
export function open(t: any) {
  if (t.id === 'ap') { go('backstage'); return; }
  if (t.id === 'desk-pbp' || t.id === 'desk-col') { openVoices(t.id === 'desk-col' ? 'col' : 'pbp'); return; }   // answered in a pop-up, without leaving the Office
  if (t.id === 'face') { openFace(); return; }
  if (t.id === 'house') { openModal({ kind: 'mng', k: 'house', v: 'style' }); return; }
  if (t.id === 'sponsors') { openModal({ kind: 'mng', k: 'deals', v: 'offers' }); return; }   // the offers, over the desk
  if (/^title-/.test(t.id)) { openModal({ kind: 'tasktitle', id: t.id.slice(6) }); return; }
  if (/^deb-/.test(t.id)) { openModal({ kind: 'debut', id: +t.id.slice(4) }); return; }
  if (/^con-/.test(t.id)) { openModal({ kind: 'taskcon', id: +t.id.slice(4) }); return; }
  if (t.id === 'inbox') { const e = G.S.inbox.find((x: any) => !x.done); if (e) openModal({ kind: 'matter', id: e.id }); return; }
  go(t.to);
}

/** A newcomer's debut, planned from the desk: vignettes, a surprise attack or a straight match. */
export function DebutWindow(p: { m: Modal }) {
  const S = G.S, w = S.w[p.m.id];
  if (!w || !w.deb) return <Window title="A debut"><Empty>They have already appeared on the shows.</Empty></Window>;
  const pick = (k: string) => act(() => { const r = E.debutPlan(S, w.id, k); showResult('Debut: ' + w.name, r.msg, !r.ok); });
  return <Window title={'How does ' + w.name + ' debut?'} wide ok="Not now">
    <p class="muted">{w.name} has not appeared on the shows yet. The first night is the one people remember.</p>
    {Object.keys(E.DEBUT).map(k => <p key={k} class="row mt1"><Btn kind={w.dk === k ? 'go' : undefined} t="debut-pick" d={{ v: k }} onClick={() => pick(k)}>{E.DEBUT[k].n}</Btn> <span>{E.DEBUT[k].d}</span></p>)}
  </Window>;
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
  const cs = slice<{ id: number; cl: string[] }>('ctask', () => ({ id: -1, cl: [] })); if (cs.id !== w.id) { cs.id = w.id; cs.cl = []; }
  const C: any[] = E.clauses(S, w.id), on = (k: string) => cs.cl.indexOf(k) >= 0;
  const renew = (weeks: number) => act(() => { const r = E.renew(S, w.id, weeks, cs.cl); showResult(w.name, r); });
  const row = (weeks: number, label: string) => { const ask = E.renewAsk(S, w.id, weeks, cs.cl); return <li class="col" key={weeks}>
    <span><b>{label}</b><br /><span class="muted">{full(ask)} a week{ask > w.wage ? ', up from ' + full(w.wage) : (ask < w.wage ? ', down from ' + full(w.wage) : ', the same as now')}.</span></span>
    <span class="row"><Btn kind="sm" t="tc-renew" d={{ v: weeks }} onClick={() => renew(weeks)}>Sign for {weeks} weeks</Btn></span></li>; };
  return <Window title={w.name + '’s contract'} wide ok="Not now">
    <p><Name w={w} /> is on {full(w.wage)} a week. The contract ends {w.con <= 0 ? 'this week' : 'next week'}. <span class="muted">If nothing is signed they become a free agent, and anybody can make an offer.</span></p>
    {C.length ? <div class="row mt1" data-t="tc-clauses"><span class="muted">They would like:</span>{C.map(c => <Btn key={c.k} kind="sm" on={on(c.k)} t="tc-clause" d={{ k: c.k }} label={c.n + '. ' + c.d} onClick={() => view(() => { cs.cl = on(c.k) ? cs.cl.filter(x => x !== c.k) : cs.cl.concat([c.k]); })}>{c.n}</Btn>)}</div> : null}
    <ul class="list mt2">{row(48, 'One more year')}{row(96, 'Two more years')}</ul>
    <p class="muted mt1">Morale changes the asking price: {w.morale < 50 ? 'they are unhappy, so it costs more.' : (w.morale >= 75 ? 'they are happy here, so it costs less.' : 'theirs is about average.')}</p>
  </Window>;
}

