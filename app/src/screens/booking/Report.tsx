/* The show report: the rating, the money, the dirt sheet and every segment, match by match. */
import { E } from '../../engine';
import { G, cash } from '../../store';
import { weekDone, pending } from '../../nav';
import { endWeek } from '../../flow';
import { Head, Panel, Btn, Tag, KV, stars, grade, Txt } from '../../kit';
import { preNote, replay, closeReport } from './run';

/** How the show did against what the crowd expected. */
export function verdict(r: any): string {
  const d = r.rating - r.exp;
  return d >= 4 ? 'Well above what the crowd expected' : d >= 0.5 ? 'Better than the crowd expected' : d > -0.5 ? 'Right on expectations' : d > -4 ? 'A little under expectations' : 'Well under expectations';
}
export function OddsLine(p: { s: any }) {
  const s = p.s; if (!s.odds || !s.sidesN) return null;
  return <p class="muted">Odds at the bell: {s.sidesN.map((n: string, k: number) => n + ' ' + s.odds[k] + '%').join(' / ')} {'·'} {s.called ? <span class="gold">your call</span> : 'played out'}</p>;
}
/** What moved the score, best and worst first. */
export function FxList(p: { s: any; max: number }) {
  const fx = p.s.fx; if (!fx || !fx.length) return null;
  return <ul class="fx">{fx.slice(0, p.max).map((f: any) => <li class={f.s > 0 ? 'good' : 'bad'}>{f.s > 0 ? '+ ' : '− '}{f.x}{f.m ? <span class="muted"> {'·'} company model</span> : null}</li>)}</ul>;
}
export function Crowd(p: { r: any }) { const r = p.r; return <>{r.att.toLocaleString('en-US')}{r.sellout ? <> <span class="mark">sell-out</span></> : null}</>; }

/** What comes after the report: the next show, the end of the week, or back to where you were. */
function Next(p: { r: any }) {
  const S = G.S, r = p.r, n = pending();
  const again = r.venue ? <Btn kind="sm" t="replay" onClick={replay}>Replay the broadcast</Btn> : null;
  if (r.week !== S.week) return <div class="row mt3"><Btn t="closeReport" onClick={closeReport}>Back</Btn>{again}</div>;
  // the same row as the shared EndWeekBtn, with the replay button on the end of it
  if (weekDone()) return <div class="row mt3"><Btn kind="go" t="endweek" disabled={!!n} onClick={endWeek}>End the week</Btn>{n ? <span class="muted">Answer your inbox first.</span> : null}{again}</div>;
  return <div class="row mt3"><Btn kind="go" t="closeReport" onClick={closeReport}>Book {S.queue[S.qi].name}</Btn>{again}</div>;
}

function Angle(p: { s: any }) {
  const s = p.s, q = s.rub;
  return <div class="angle">
    <p><Tag>{s.head}</Tag> <Txt>{s.text}</Txt>{q ? <><br /><span class="muted">Delivery {q.d} {'·'} Content {q.c} {'·'} Character {q.ch} {'·'} Crowd {q.cr} out of 10</span></> : null}</p>
    <span class="num">{s.ov}% <b class="gold">{grade(s.ov)}</b></span>
  </div>;
}
function MatchSeg(p: { s: any; no: number; main: boolean }) {
  const s = p.s, meta = [s.mt, s.mins + ' min']; if (s.stip) meta.push(s.stip);
  if (s.ref) meta.push('Referee ' + s.ref);
  const score = (label: string, v: number, ov?: boolean) => <div class={ov ? 'ov' : undefined}><span>{label}</span><span class="num">{v}%</span></div>;
  return <div class={'seg' + (p.main ? ' me' : '')}>
    <div class="no" aria-hidden="true">{p.no}</div>
    <div class="body">
      <div class="line1">
        <div><div class="who"><Txt>{s.label}</Txt></div><div class="meta">{(p.main ? 'Main event · ' : '') + meta.join(' · ')}{s.title ? <> {'·'} <span class="gold">{s.title}</span></> : null}</div></div>
        <div class="gold">{s.ov}% {stars(s.ov)} <b>{grade(s.ov)}</b></div>
      </div>
      <OddsLine s={s} />
      <div class="pbp">{s.lines.map((x: string) => <><Txt>{x}</Txt><br /></>)}<b><Txt>{s.finish}</Txt></b></div>
      <div class="scores">{score('Match quality', s.mq)}{score('Crowd reaction', s.cr)}{score('Worker effort', s.eff)}{score('Overall', s.ov, true)}</div>
      <FxList s={s} max={8} />
      {s.notes.map((x: string) => <p class="note"><span>{x}</span></p>)}
    </div>
  </div>;
}

/** The few things that mattered most across the night: reasons that came up in the most matches, best and worst. */
function whyLine(r: any): { up: string[]; down: string[] } {
  const up: Record<string, number> = {}, down: Record<string, number> = {};
  r.segs.forEach((s: any) => (s.fx || []).forEach((f: any, i: number) => { const m = f.s > 0 ? up : down; m[f.x] = (m[f.x] || 0) + 1 + (i === 0 ? 0.5 : 0); }));
  const top = (m: Record<string, number>) => Object.keys(m).sort((a, b) => m[b] - m[a]).slice(0, 3);
  return { up: top(up), down: top(down) };
}
export function Report(p: { r: any }) {
  const r = p.r, pre = preNote(r), nMatch = r.segs.filter((s: any) => s.k === 'match').length; let no = 0;
  return <>
    <Head eyebrow={E.cal(r.week).label + ' · show report'} title={r.name} />
    <Panel cls="mb3">
      <div class="row rating">
        <div><div class="eyebrow">Show rating</div><div class="big">{r.rating}% <span class="gold">{grade(r.rating)}</span></div></div>
        <p>{verdict(r)} ({r.exp}%). {Math.abs(r.dImage) < 0.05 ? 'Popularity unchanged.' : 'Popularity ' + (r.dImage > 0 ? 'up ' : 'down ') + Math.abs(r.dImage).toFixed(1) + '.'}</p>
      </div>
      {(() => { const w = whyLine(r); return w.up.length || w.down.length ? <div class="why mt2"><p class="eyebrow">Why it scored</p>
        {w.up.map(x => <p class="good">+ {x}</p>)}{w.down.map(x => <p class="bad">{'−'} {x}</p>)}</div> : null; })()}
      <div class="kv mt3">
        <KV label="Attendance"><Crowd r={r} /></KV><KV label="Gate">{cash(r.gate)}</KV>
        <KV label="TV viewers">{(r.viewers / 1e6).toFixed(2)}M</KV><KV label="TV money">{cash(r.tv)}</KV>
        {r.big ? <><KV label="Buys">{r.buys.toLocaleString('en-US')}</KV><KV label="Buy revenue">{cash(r.ppv)}</KV></> : null}
      </div>
      {(r.quest || []).map((q: string) => <p class="note"><span>{q}</span></p>)}
      {r.owner && r.owner.text ? <p class="note"><span>{r.owner.text}{r.owner.bonus ? ' You earn 1 booking power.' : ''}</span></p> : null}
      <Next r={r} />
    </Panel>
    {r.sheet ? <Panel cls="mb3" title="The dirt sheet"><p class="eyebrow">{r.sheet.by}</p>{r.sheet.lines.map((x: string) => <p class="mt1"><Txt>{x}</Txt></p>)}</Panel> : null}
    <div class="sheet">
      {(r.prep || []).map((l: any) => <div class="angle"><p><Tag>Before the show</Tag> <b>{l.place}:</b> <span class={l.ok ? undefined : 'bad'}><Txt>{l.msg}</Txt></span></p></div>)}
      {pre ? <div class="angle"><p><Tag>Before the show</Tag> {pre}</p></div> : null}
      {r.segs.map((s: any) => s.k === 'angle' ? <Angle s={s} /> : <MatchSeg s={s} no={++no} main={no === nMatch} />)}
    </div>
    <Next r={r} />
  </>;
}
