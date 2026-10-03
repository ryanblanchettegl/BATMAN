/* The Locker room page of a profile: why they feel the way they do, wear and tear, and what you can do about either. */
import { E, W } from '../../engine';
import { G, act, say } from '../../store';
import { Btn, Sel, Meter, CheckLine, Opt } from '../../kit';

export function zoneCls(v: number): string { return v >= 80 ? 'bad' : (v >= 60 ? 'warn' : (v >= 40 ? 'gold' : 'good')); }

/** The body drawn in characters, one line per zone, each with a ten-block wear bar. */
export function BodyFig(p: { w: W }) {
  const z: any[] = E.zones(G.S, p.w.id), by: Record<string, any> = {}; z.forEach(x => { by[x.k] = x; });
  const row = (art: string, x: any) => {
    const n = Math.max(0, Math.min(10, Math.round(x.v / 10)));
    return <><span class={zoneCls(x.v)}>{art}</span>{'  ' + (x.n + '          ').slice(0, 10)}<span class={zoneCls(x.v)}>{'█'.repeat(n)}</span><span class="muted">{'░'.repeat(10 - n)}</span>{' ' + x.v}</>;
  };
  return <pre class="ascii body" role="img" aria-label={'Wear: ' + z.map(x => x.n + ' ' + x.v).join(', ')}>
    {row('  ( )  ', by.n)}{'\n'}{row(' --+-- ', by.s)}{'\n'}{row('   |   ', by.b)}{'\n'}{row('  / \\  ', by.k)}
  </pre>;
}

function Glyph(p: { v: number }) {
  const v = p.v;
  if (v >= 2) return <span class="good">{'▲▲'}</span>;
  if (v === 1) return <span class="good">{'▲ '}</span>;
  if (v === 0) return <span class="muted">{'■ '}</span>;
  if (v === -1) return <span class="bad">{'▼ '}</span>;
  return <span class="bad">{'▼▼'}</span>;
}

/** Rest, work hurt, mentor and "have a word": the things a booker can do for one wrestler this week. */
function Moves(p: { w: W }) {
  const S = G.S, w = p.w, id = w.id, resting = w.rest === S.week;
  const ms: W[] = E.mentorsFor(S, id), wo = E.wordOdds(S, id), hurtOk = E.workHurtOk(S, id);
  // a mentor who has since filled up still shows as this wrestler's mentor
  const mentors: W[] = (w.ment != null && !ms.some(m => m.id === w.ment) ? [S.w[w.ment]] : []).concat(ms);
  return <>
    <div class="row mt2">
      {w.inj > 0
        ? (hurtOk ? <Btn kind="danger" t="workhurt" d={{ id }} onClick={() => act(() => say(E.workHurt(S, id), { err: true }))}>Work them hurt this week</Btn> : null)
        : <Btn kind="sm" on={resting} t="rest" d={{ id }} onClick={() => act(() => say(E.rest(S, id)))}>{resting ? 'Resting this week (undo)' : 'Give them the week off'}</Btn>}
      {(ms.length > 0 || w.ment != null) && <label class="row">Mentor <Sel id={'ment-' + id} t="ment" d={{ id }} value={w.ment == null ? '' : w.ment}
        options={[['', 'Nobody'] as Opt].concat(mentors.map(m => [m.id, m.name] as Opt))}
        onChange={v => act(() => say(E.setMentor(S, id, v === '' ? null : +v)))} /></label>}
      {wo && <Btn kind="sm" t="word" d={{ id }} onClick={() => act(() => { const r = E.haveWord(S, id); if (r) say(r.msg, { err: !r.ok }); })}>Have a word</Btn>}
    </div>
    {wo && <CheckLine label="Have a word" ck={wo} />}
  </>;
}

export function LockerBlock(p: { w: W }) {
  const S = G.S, w = p.w, eg = E.ego(S, w.id);
  if (!eg) return null;
  return <div class="cols mt3">
    <div>
      <p class="eyebrow">Why they feel the way they do{eg.role ? <> {'·'} <span class="gold">{E.ROLE[eg.role].n}</span></> : null}</p>
      {eg.role && <p class="muted">{E.ROLE[eg.role].d}</p>}
      <div class="ego">{eg.lines.map((l: any) => <div><span><Glyph v={l.v} /> {l.n}</span><span class="muted">{l.why}</span></div>)}</div>
      <p class="mt1">Morale is heading for <b>{eg.target}</b>. Stress <Meter v={eg.stress} kind={eg.stress >= 50 ? 'hot' : 'cool'} /> <span class="num">{eg.stress}</span>{eg.stress >= 75 ? <> <span class="bad">Close to breaking.</span></> : null}</p>
    </div>
    <div>
      <p class="eyebrow">Wear and tear</p>
      <BodyFig w={w} />
      <p class="muted">Over 60 it hurts their work. Over 85 the next injury there is a bad one.</p>
      <Moves w={w} />
    </div>
  </div>;
}
