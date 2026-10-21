/* The editor for the match selected on the run sheet: who is in it, the finish you call, the title, the rules.
   It sits in the pane beside the sheet, so it is compact: short labels beside their boxes, and one line of advice. */
import { E, W } from '../../engine';
import { G, me, cash } from '../../store';
import { Sel, Field, Opt, Data, teamName } from '../../kit';
import { Match, onCard, setMatch, setRingside, sideText } from './run';

/** A drop-down of everyone who can work this show, men and women in separate groups. */
function WrestlerSel(p: { id: string; sel: number | null; d: Data; elig: W[]; busy: Record<number, 1>; onChange: (v: string) => void; off?: boolean }) {
  const S = G.S;
  const opt = (w: W): Opt => [w.id, w.name + ' · ' + Math.round(w.ovr) + ' ' + w.align + (w.promo !== S.player ? ' · visiting' : '') + (w.cond < 45 ? ' · worn down' : '') + (p.busy[w.id] ? ' · booked' : '')];
  return <Sel id={p.id} t="slot" d={p.d} value={p.sel} disabled={p.off} onChange={p.onChange} options={[['', 'Pick a wrestler']]}
    groups={[{ label: 'Men', options: p.elig.filter(w => w.g === 'M').map(opt) }, { label: 'Women', options: p.elig.filter(w => w.g === 'F').map(opt) }]} />;
}
function slotLabel(m: Match, k: number, p: number): string {
  if (m.sides.length > 2) return (m.mt === 'br' ? 'Entrant ' : 'Wrestler ') + (k + 1);
  if (m.sides[k].length > 1) return 'Team ' + (k + 1) + (p ? ', ' + (p + 1) : '');
  return k === 0 ? 'Corner' : 'Opponent';
}
const INT_NOTE: Record<string, string> = { safe: ' · less wear, flatter crowd', brutal: ' · louder crowd, heavy wear' };

export function Editor(p: { m: Match; i: number }) {
  const S = G.S, P = me(), m = p.m, i = p.i;
  const elig: W[] = E.eligible(S).slice().sort((a: W, b: W) => b.ovr - a.ovr), inE: Record<number, 1> = {}, busy = onCard(i);
  elig.forEach(w => { inE[w.id] = 1; });
  const teams = m.mt === 'tag' ? S.teams.filter((t: any) => t.promo === P.id && inE[t.m[0]] && inE[t.m[1]]) : [];
  const od = E.matchOdds(S, m, i, S.card.length), mm = E.matchMins(S, m, i, S.card.length);
  const titles = E.showTitles(S).filter((t: any) => t.tag ? m.mt === 'tag' : (E.MT[m.mt].per === 1 && !(m.mt === 'br' && t.holders.length)));
  const calls: Opt[] = [['', 'Let it play out (free)']];
  if (od) {
    m.sides.forEach((s: any[], k: number) => calls.push([k, sideText(s) + ' wins · ' + Math.round(od.p[k] * 100) + '% · ' + od.cost[k] + ' BP']));
    if (m.sides.length === 2) calls.push([-1, 'Draw · ' + od.drawCost + ' BP']);
  }
  // picking a regular team fills the side, then the list goes back to its heading so it can be used again
  const pickTeam = (k: number, id: string) => (v: string) => { setMatch(i, 'team', v, { s: k }); const el = document.getElementById(id) as HTMLSelectElement | null; if (el) el.value = ''; };
  // a match promised for tonight (src/99-tale.js): the promised wrestler, the kind of match and the title stay as promised
  // a guest at the commentary desk and a run-in at the curtain: the ones with a story with somebody in the match come first (not for a battle royal, which has its own surprise entrant)
  const rs: any[] = E.ringsideChoices(S, i), rsOpt = (x: any): Opt => [x.id, x.n + (x.why ? ' · ' + x.why : '')];
  const pm = m.pm != null ? (E.locksNow(S) as any[]).find(l => l.id === m.pm) : null, held = pm ? m.sides[0][0] : null;
  return <div class="editor">
    {pm ? <p class="warn wide" data-t="ed-promised">Promised for tonight: {pm.label}{pm.why ? ' (' + pm.why + ')' : ''}.</p> : null}
    <Field label="Type"><Sel id={'m' + i + '-type'} t="mt" d={{ i }} disabled={!!pm} value={m.mt} onChange={v => setMatch(i, 'mt', v)} options={Object.keys(E.MT).map(k => [k, E.MT[k].n] as Opt)} /></Field>
    {m.sides.map((s: (number | null)[], k: number) => <div class="side">
      {s.map((id, q) => <Field label={slotLabel(m, k, q)}>
        <WrestlerSel id={'m' + i + '-s' + k + '-' + q} sel={id} d={{ i, s: k, p: q }} elig={elig} busy={busy} off={!!pm && (id === held || (!!m.title && k === 1))} onChange={v => setMatch(i, 'slot', v, { s: k, p: q })} />
      </Field>)}
      {teams.length > 0 && <Field label="Or a team"><Sel id={'m' + i + '-t' + k} t="team" d={{ i, s: k }} value="" onChange={pickTeam(k, 'm' + i + '-t' + k)}
        options={[['', 'Regular teams'], ...teams.map((t: any) => [t.id, teamName(t)] as Opt)]} /></Field>}
    </div>)}
    {m.mt === 'br' && <Field label="Entrants"><Sel id={'m' + i + '-size'} t="br-size" d={{ i }} value={m.sides.length} onChange={v => setMatch(i, 'size', v)}
      options={Array.from({ length: E.MT.br.max - E.MT.br.min + 1 }, (_, k) => { const n = k + E.MT.br.min; return [n, n + ' entrants · ' + 2 * n + ' min'] as Opt; })} /></Field>}
    {m.mt === 'br' && !m.title && <Field label="Prize"><Sel id={'m' + i + '-shot'} t="br-shot" d={{ i }} value={m.shot ? '1' : ''} onChange={v => setMatch(i, 'shot', v)}
      options={[['', 'Bragging rights only'], ['1', 'The winner earns a title match']]} /></Field>}
    {m.mt === 'br' && <Field label="Surprise"><Sel id={'m' + i + '-surp'} t="br-surp" d={{ i }} value={m.surp ? '1' : ''} onChange={v => setMatch(i, 'surp', v)}
      options={[['', 'No surprise entrant'], ['1', 'Hold a spot for a surprise' + (E.brSurpriseInfo(S, m).n ? ' · about ' + cash(E.brSurpriseInfo(S, m).fee) : ' · nobody free')]]} /></Field>}
    <Field label="Finish"><Sel id={'m' + i + '-call'} t="call" d={{ i }} value={m.call} onChange={v => setMatch(i, 'call', v)} options={calls} /></Field>
    <Field label="Ending"><Sel id={'m' + i + '-how'} t="how" d={{ i }} value={m.how || ''} onChange={v => setMatch(i, 'how', v)}
      options={[['', 'Let the story decide'], ...Object.keys(E.HOWS).filter(k => !(['cheap', 'dq', 'co'].includes(k) && E.hasRule(S, 'clean'))).map(k => [k, E.HOWS[k].n] as Opt)]} /></Field>
    {E.hasBoss(S) && <Field label="By the boss"><Sel id={'m' + i + '-boss'} t="boss" d={{ i }} value={m.boss ? '1' : ''} onChange={v => setMatch(i, 'boss', v)} options={[['', 'No'], ['1', 'Yes: it reads well if a story explains it']]} /></Field>}
    {E.agents(S).length > 0 && <Field label="Agent"><Sel id={'m' + i + '-agent'} t="agent" d={{ i }} value={m.agent == null ? '' : m.agent} onChange={v => setMatch(i, 'agent', v)} options={[['', 'No agent'], ...E.agents(S).map((a: any) => [a.id, a.name + ' · skill ' + a.skill + (S.card.filter((x: any) => x.agent === a.id).length >= 2 && m.agent !== a.id ? ' · covering two' : '')] as Opt)]} /></Field>}
    {m.mt !== 'br' && <Field label="Commentary"><Sel id={'m' + i + '-gc'} t="gc" d={{ i }} value={m.gc == null ? '' : m.gc} onChange={v => setRingside(i, 'gc', v)} options={[['', 'No guest'], ...rs.map(rsOpt)]} /></Field>}
    {m.mt !== 'br' && <Field label="Run-in"><Sel id={'m' + i + '-ri'} t="ri" d={{ i }} value={m.ri == null ? '' : m.ri} onChange={v => setRingside(i, 'ri', v)} options={[['', 'Nobody'], ...rs.map(rsOpt)]} /></Field>}
    <Field label="Title"><Sel id={'m' + i + '-title'} t="title" d={{ i }} disabled={!!pm && !!m.title} value={m.title} onChange={v => setMatch(i, 'title', v)}
      options={[['', 'No title'], ...titles.map((t: any) => [t.id, t.name + (t.holders.length ? '' : ' (vacant)')] as Opt)]} /></Field>
    <Field label="Rules"><Sel id={'m' + i + '-stip'} t="stip" d={{ i }} value={m.stip} onChange={v => setMatch(i, 'stip', v)} options={Object.keys(E.STIP).map(k => { const sf = E.stipFits(S, m), w = sf && sf[k]; return [k, E.STIP[k].n + (w === 'good' ? ' (earned)' : w === 'soon' ? ' (too soon)' : '')] as Opt; })} /></Field>
    <Field label="Intensity"><Sel id={'m' + i + '-int'} t="int" d={{ i }} value={m.int || 'normal'} onChange={v => setMatch(i, 'int', v)} options={Object.keys(E.INTN).map(k => [k, E.INTN[k].n + (INT_NOTE[k] || '')] as Opt)} /></Field>
    <Field label="Length"><Sel id={'m' + i + '-len'} t="len" d={{ i }} value={m.len} onChange={v => setMatch(i, 'len', v)} options={[['S', 'Short · ' + mm.S + ' min'], ['M', 'Medium · ' + mm.M + ' min'], ['L', 'Long · ' + mm.L + ' min']]} /></Field>
    <p class="muted wide clamp2" data-t="ed-note">{m.how ? E.finishPrice(m.how) : (E.STIPNOTE[m.stip] ? E.STIPNOTE[m.stip] : (m.mt === '1v1' && m.sides[0][0] != null && m.sides[1][0] != null ? E.pairMemory(S, m.sides[0][0], m.sides[1][0]) : 'On the clock this match takes ' + mm.now + ' minutes: ' + mm.bell + ' in the ring, the rest for entrances and a break.'))}</p>
  </div>;
}
