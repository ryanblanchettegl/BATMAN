/* The editor that opens under a match on the card: who is in it, the finish you call, the title, the rules. */
import { E, W } from '../../engine';
import { G, me } from '../../store';
import { Sel, Field, Opt, Data, teamName } from '../../kit';
import { Match, onCard, setMatch, sideText } from './run';

/** A drop-down of everyone who can work this show, men and women in separate groups. */
function WrestlerSel(p: { id: string; sel: number | null; d: Data; elig: W[]; busy: Record<number, 1>; onChange: (v: string) => void }) {
  const S = G.S;
  const opt = (w: W): Opt => [w.id, w.name + ' · ' + Math.round(w.ovr) + ' ' + w.align + (w.promo !== S.player ? ' · visiting' : '') + (w.cond < 45 ? ' · worn down' : '') + (p.busy[w.id] ? ' · booked' : '')];
  return <Sel id={p.id} t="slot" d={p.d} value={p.sel} onChange={p.onChange} options={[['', 'Pick a wrestler']]}
    groups={[{ label: 'Men', options: p.elig.filter(w => w.g === 'M').map(opt) }, { label: 'Women', options: p.elig.filter(w => w.g === 'F').map(opt) }]} />;
}
function slotLabel(m: Match, k: number, p: number): string {
  if (m.sides.length > 2) return (m.mt === 'br' ? 'Entrant ' : 'Wrestler ') + (k + 1);
  if (m.sides[k].length > 1) return 'Team ' + (k + 1) + ', member ' + (p + 1);
  return k === 0 ? 'In this corner' : 'Opponent';
}
const INT_NOTE: Record<string, string> = { safe: ' · less wear, flatter crowd', brutal: ' · louder crowd, heavy wear' };

export function Editor(p: { m: Match; i: number }) {
  const S = G.S, P = me(), m = p.m, i = p.i;
  const elig: W[] = E.eligible(S).slice().sort((a: W, b: W) => b.ovr - a.ovr), inE: Record<number, 1> = {}, busy = onCard(i);
  elig.forEach(w => { inE[w.id] = 1; });
  const teams = m.mt === 'tag' ? S.teams.filter((t: any) => t.promo === P.id && inE[t.m[0]] && inE[t.m[1]]) : [];
  const od = E.matchOdds(S, m, i, S.card.length);
  const titles = E.showTitles(S).filter((t: any) => t.tag ? m.mt === 'tag' : (E.MT[m.mt].per === 1 && !(m.mt === 'br' && t.holders.length)));
  const calls: Opt[] = [['', 'Let it play out (free)']];
  if (od) {
    m.sides.forEach((s: any[], k: number) => calls.push([k, sideText(s) + ' wins · ' + Math.round(od.p[k] * 100) + '% · ' + od.cost[k] + ' BP']));
    if (m.sides.length === 2) calls.push([-1, 'Draw · ' + od.drawCost + ' BP']);
  }
  // picking a regular team fills the side, then the list goes back to its heading so it can be used again
  const pickTeam = (k: number, id: string) => (v: string) => { setMatch(i, 'team', v, { s: k }); const el = document.getElementById(id) as HTMLSelectElement | null; if (el) el.value = ''; };
  return <div class="editor">
    <Field label="Match type"><Sel id={'m' + i + '-type'} t="mt" d={{ i }} value={m.mt} onChange={v => setMatch(i, 'mt', v)} options={Object.keys(E.MT).map(k => [k, E.MT[k].n] as Opt)} /></Field>
    {m.sides.map((s: (number | null)[], k: number) => <div class="side">
      {s.map((id, q) => <Field label={slotLabel(m, k, q)}>
        <WrestlerSel id={'m' + i + '-s' + k + '-' + q} sel={id} d={{ i, s: k, p: q }} elig={elig} busy={busy} onChange={v => setMatch(i, 'slot', v, { s: k, p: q })} />
      </Field>)}
      {teams.length > 0 && <Field label="Or pick a team"><Sel id={'m' + i + '-t' + k} t="team" d={{ i, s: k }} value="" onChange={pickTeam(k, 'm' + i + '-t' + k)}
        options={[['', 'Regular teams'], ...teams.map((t: any) => [t.id, teamName(t)] as Opt)]} /></Field>}
    </div>)}
    <Field label="Call the finish"><Sel id={'m' + i + '-call'} t="call" d={{ i }} value={m.call} onChange={v => setMatch(i, 'call', v)} options={calls} /></Field>
    <Field label="How it ends"><Sel id={'m' + i + '-how'} t="how" d={{ i }} value={m.how || ''} onChange={v => setMatch(i, 'how', v)}
      options={[['', 'Let the story decide'], ...Object.keys(E.HOWS).filter(k => !(['cheap', 'dq', 'co'].includes(k) && E.hasRule(S, 'clean'))).map(k => [k, E.HOWS[k].n] as Opt)]} /></Field>
    {m.how && <p class="muted wide">{E.finishPrice(m.how)}</p>}
    {E.hasBoss(S) && <Field label="Made by the boss"><Sel id={'m' + i + '-boss'} t="boss" d={{ i }} value={m.boss ? '1' : ''} onChange={v => setMatch(i, 'boss', v)} options={[['', 'No'], ['1', 'Yes: it reads well if a story explains it']]} /></Field>}
    <Field label="Title on the line"><Sel id={'m' + i + '-title'} t="title" d={{ i }} value={m.title} onChange={v => setMatch(i, 'title', v)}
      options={[['', 'No title'], ...titles.map((t: any) => [t.id, t.name + (t.holders.length ? '' : ' (vacant)')] as Opt)]} /></Field>
    <Field label="Stipulation"><Sel id={'m' + i + '-stip'} t="stip" d={{ i }} value={m.stip} onChange={v => setMatch(i, 'stip', v)} options={Object.keys(E.STIP).map(k => [k, E.STIP[k].n] as Opt)} /></Field>
    {E.STIPNOTE[m.stip] && <p class="muted wide">{E.STIPNOTE[m.stip]}</p>}
    <Field label="Intensity"><Sel id={'m' + i + '-int'} t="int" d={{ i }} value={m.int || 'normal'} onChange={v => setMatch(i, 'int', v)} options={Object.keys(E.INTN).map(k => [k, E.INTN[k].n + (INT_NOTE[k] || '')] as Opt)} /></Field>
    <Field label="Length"><Sel id={'m' + i + '-len'} t="len" d={{ i }} value={m.len} onChange={v => setMatch(i, 'len', v)} options={[['S', 'Short'], ['M', 'Medium'], ['L', 'Long']]} /></Field>
    {m.mt === '1v1' && m.sides[0][0] != null && m.sides[1][0] != null && <p class="muted wide">{E.pairMemory(S, m.sides[0][0], m.sides[1][0])}</p>}
    {od && od.chem != null && <p class="muted wide">Ring chemistry between them: {od.chem >= 2.2 ? <span class="good">great</span> : (od.chem <= -2.2 ? <span class="bad">poor</span> : 'ordinary')}.</p>}
  </div>;
}
