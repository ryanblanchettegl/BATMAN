/* Attributes and progression (src/99-progress.js): a wrestler's level, experience and development trait, every
   attribute from 1 to 100 with how far it can go now and what a point costs, and the points to spend. A press on +
   spends a point; Let them choose spends them all on what suits their style and gimmick. */
import { E, W } from '../../engine';
import { G, act, Modal } from '../../store';
import { Btn, Window, Portrait, showResult } from '../../kit';

const GROUPS: [string, string][] = [['ring', 'In the ring'], ['body', 'The body'], ['mic', 'Presence']];

/** The level, trait and experience in one line with a bar, for the Roster file. */
export function LevelLine(p: { w: W }) {
  const S = G.S, pi = E.progInfo(S, p.w.id); if (!pi) return null;
  return <div class="lvl-line" data-t="lvl-line">
    <span class="lvl-n">Level <b>{pi.lv}</b></span><span class="lvl-dev" title={pi.devD}>{pi.devN}</span>
    <i class="xpbar" aria-label={pi.xp + ' of ' + pi.need + ' experience to the next level'}><i style={{ width: Math.round(pi.xp / pi.need * 100) + '%' }} /></i>
    {pi.ap ? <b class="lvl-pts">{pi.ap} {pi.ap === 1 ? 'point' : 'points'}</b> : null}
  </div>;
}

export function AttrWindow(p: { m: Modal }) {
  const S = G.S, w: W = S.w[p.m.id], pi = E.progInfo(S, w.id), mine = w.promo === S.player;
  const spend = (k: string) => { const r = act(() => E.spendAttr(S, w.id, k)); if (!r.ok) showResult('Attributes', r.msg, true); };
  return <Window title={'Attributes: ' + w.name} wide>
    <div class="row top nowrap gap2 attr-head"><Portrait w={w} />
      <div><p class="attr-title">Level <b>{pi.lv}</b> <span class="muted">{'·'} {pi.devN} {'·'}</span> Overall <b>{pi.overall}</b></p>
        <p><i class="xpbar wide" aria-hidden="true"><i style={{ width: Math.round(pi.xp / pi.need * 100) + '%' }} /></i> <span class="muted">{pi.xp} of {pi.need} XP to level {pi.lv + 1}. {pi.devD}</span></p>
        <p>{mine ? <><b data-t="attr-pts">{pi.ap}</b> {pi.ap === 1 ? 'point' : 'points'} to spend. A point raises one attribute by one; above 80 it costs 2, above 90 it costs 3.</> : 'Another company decides where their points go.'}</p></div></div>
    <div class="attr-cols">{GROUPS.map(([g, gn]) => <section key={g}><h3>{gn}</h3>
      {pi.attrs.filter((a: any) => a.g === g).map((a: any) => <div class="attr-row" key={a.k} data-t="attr" data-v={a.k}>
        <span class="an" title={a.d || undefined}>{a.n}</span>
        <i class="abar" aria-hidden="true"><i class="cap" style={{ width: a.cap + '%' }} /><i class="val" style={{ width: a.v + '%' }} /></i>
        <b class="av">{a.v}</b>
        {mine ? <Btn kind="sm" t="attr-up" d={{ v: a.k }} disabled={!a.can} label={'Raise ' + a.n + ' for ' + a.cost + (a.cost === 1 ? ' point' : ' points')} onClick={() => spend(a.k)}>{'+' + (a.cost > 1 ? ' (' + a.cost + ')' : '')}</Btn> : null}
        {a.fall > 0 ? <span class="acap afall" title="Lost in the last year">{'-' + a.fall}</span> : null}
        {a.v >= a.cap ? <span class="muted acap">{g === 'body' && w.age > (w.pk ? w.pk[1] : 99) ? 'past their peak' : 'at their limit'}</span> : (a.grow > 0 ? <span class="muted acap" title="Learned by doing it on the shows">{'learning'}</span> : null)}
      </div>)}
    </section>)}</div>
    {(() => { const gi = E.gimInfo(S, w.id); return gi ? <div class="gim-box" data-t="gim-info"><p><b>{gi.n}</b> <span class="muted">{'·'} {gi.d} Fit {gi.fit >= 70 ? 'strong' : gi.fit >= 50 ? 'fair' : 'poor'}.</span></p>
      <p>Shines in {gi.best.join(', ')}; at home in {gi.mt.join(', ')}. Hot against {gi.hot.join(', ')}; falls flat with {gi.flat.join(', ')}. {gi.promo[0].toUpperCase() + gi.promo.slice(1)}. {gi.main}</p></div> : null; })()}
    {pi.reg && pi.reg.length ? <div class="gim-box reg-box" data-t="attr-reg"><p><b>Lately</b> <span class="muted">{'·'} what they lost and why</span></p>
      <p>{pi.reg.slice(0, 4).map((r: any) => r.n + ' -' + r.by + ' (' + r.why + ', ' + r.when + ')').join('; ')}.</p></div> : null}
    <p class="muted mt1">Doing it grows it: hardcore matches teach Hardcore, submission and iron man matches Technical, long matches Stamina, promos the Microphone, main events Star quality. The body stops growing after their peak; the microphone never does. It goes the other way too: age, ring rust, a cold streak and a long injury take points away.</p>
    {mine ? <div class="row mt1"><Btn kind="go" t="attr-auto" disabled={!pi.ap} onClick={() => { const r = act(() => E.autoSpend(S, w.id)); showResult('Attributes', r.msg); }}>Let them choose</Btn>
      <Btn t="attr-autoall" onClick={() => { const r = act(() => E.autoSpendAll(S)); showResult('Attributes', r.msg); }}>Let everyone on the roster choose</Btn></div> : null}
  </Window>;
}
