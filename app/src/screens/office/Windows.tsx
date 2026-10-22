/* The Office pop-ups: the week-closed summary and the clock detail. Both are drawn from the live game state. */
import { E } from '../../engine';
import { G, me, Modal, full, cash, openModal, closeModal, act, say, view, slice } from '../../store';
import { Window, ColChart, Dial, Empty, Txt, Name, Btn, Tag } from '../../kit';

/** Opened by flow.endWeek() once the engine has closed the week: the money, the last ten weeks, the news, the new date. */
export function WeekClosed(p: { m: Modal }) {
  const S = G.S, P = me(), fin = S.fin, H: any[] = P.hist.slice(-10), nw: any[] = S.news.filter((x: any) => x.w === S.week - 1).slice(0, 6);
  return <Window title="Week closed" ok="On to next week">
    {fin ? <p>Net for the week: <b class={'num ' + (fin.net < 0 ? 'bad' : 'good')}>{full(fin.net)}</b>. Cash in the bank: <b class="num">{full(P.cash)}</b>.</p>
      : <p>Cash in the bank: <b class="num">{full(P.cash)}</b>.</p>}
    {H.length > 0 && <ColChart vals={H.map(x => x.net)} labels={H.map(x => x.w)} title={'Weekly net, last ' + H.length + ' weeks'} />}
    {nw.length > 0 && <><p class="eyebrow mt1">This week</p><ul class="list">{nw.map(x => <li><span><Txt>{x.t}</Txt></span></li>)}</ul></>}
    {p.m.did && p.m.did.length > 0 && <><p class="eyebrow mt1">Your action points</p><ul class="list">{p.m.did.map((l: any) => <li><span><b>{l.place}</b> {'·'} {l.act}: <span class={l.ok ? 'good' : 'bad'}><Txt>{l.msg}</Txt></span></span></li>)}</ul></>}
    {(p.m.up || p.m.down) && <><p class="eyebrow mt1">Movers on your roster</p><ul class="list">
      {p.m.up && S.w[p.m.up.id] ? <li><span>Biggest riser: <Name w={S.w[p.m.up.id]} /></span><span class="good num">+{p.m.up.d.toFixed(1)}</span></li> : null}
      {p.m.down && S.w[p.m.down.id] ? <li><span>Biggest faller: <Name w={S.w[p.m.down.id]} /></span><span class="bad num">{p.m.down.d.toFixed(1)}</span></li> : null}
    </ul></>}
    <p class="mt2">It is now <b>{E.cal(S.week).label}</b>.</p>
  </Window>;
}

/** The year in figures, opened once at the end of each year. */
export function AnnualReport(p: { m: Modal }) {
  const S = G.S, A = E.annualReport(S);
  if (!A) return <Window title="Annual report"><Empty>The books close at the end of the year.</Empty></Window>;
  const tot = Math.max(1, A.src.reduce((a: number, x: any) => a + Math.max(0, x.v), 0));
  return <Window title={'Annual report, ' + A.year} wide ok="On to next year" onClose={() => (p.m.next ? openModal(p.m.next) : openModal({ kind: 'weekclosed' }))}>
    <p>Net for the year: <b class={'num ' + (A.net < 0 ? 'bad' : 'good')}>{full(A.net)}</b> <span class="muted">against a plan of {full(A.plan)}</span></p>
    <p class="eyebrow mt1">Where the money came from</p>
    <pre class="ascii">{A.src.map((x: any) => (x.n + '              ').slice(0, 16) + '█'.repeat(Math.round(24 * Math.max(0, x.v) / tot)) + ' ' + Math.round(100 * Math.max(0, x.v) / tot) + '%\n')}</pre>
    <ul class="list mt1">
      {A.draw ? <li><span>Best draw</span><span class="r">{A.draw.n}: <b class="num">{A.draw.v.toLocaleString('en-US')}</b></span></li> : null}
      {A.match ? <li><span>Best match</span><span class="r"><Txt>{A.match}</Txt></span></li> : null}
      {A.sign ? <li><span>Biggest signing</span><span class="r"><Name w={S.w[A.sign.id]} /> at {full(A.sign.wage)} a week</span></li> : null}
    </ul>
    <p class="mt2"><i>{A.letter}</i></p>
  </Window>;
}

/** What one clock measures and what moved it this week. `m.k` is the clock id. */
export function ClockWindow(p: { m: Modal }) {
  const ck = E.clocks(G.S).find((x: any) => x.id === p.m.k);
  if (!ck) return <Window title="Clock"><Empty>That clock is not running.</Empty></Window>;
  return <Window title={ck.n}>
    <div class="row nowrap top gap2">
      <Dial v={ck.v} n={ck.segs} bad={ck.bad} />
      <div>
        <p><b>{ck.v} of {ck.segs}</b> segments filled.</p>
        <p class="mt1">{ck.d}</p>
        {ck.why ? <p class="muted mt1">This week: {ck.why}.</p> : null}
      </div>
    </div>
  </Window>;
}

/** The chairs at the commentary desk, in the order they are picked. A third voice later is one more entry here
    (Bill, 21 October: three in the booth is standard now). `f` is the skill on the voice that this chair uses. */
const CHAIRS: { k: string; n: string; skill: string; f: string; d: string }[] = [
  { k: 'pbp', n: 'Play-by-play', skill: 'Calling', f: 'pbp', d: 'The play-by-play voice calls the action: every move, every near fall and the finish. Better calling makes every match play better on television.' },
  { k: 'col', n: 'Colour', skill: 'Colour', f: 'col', d: 'The colour voice explains why it matters: the story, the grudge, what each wrestler wants. Better colour helps your stories get across.' }
];
const STYLE_SAYS: Record<string, string> = { Excitable: 'big energy, loudest on the big moments', Dry: 'calm and exact, a straight voice', Warm: 'friendly, gets on with anyone' };
const skillWord = (v: number) => v >= 80 ? 'Excellent' : (v >= 70 ? 'Very good' : (v >= 60 ? 'Good' : (v >= 50 ? 'Average' : 'Weak')));

/** The commentary desk, picked from the Office: one screen for each chair, so a new player picks one voice at a
    time. `st.seat` is the chair on screen. A task is answered where it stands, without leaving the Office. */
export function VoicesWindow(_p: { m: Modal }) {
  const S = G.S, V = E.voices(S), st = slice<{ seat: string; msg: string; err: boolean }>('voices', () => ({ seat: 'pbp', msg: '', err: false }));
  const at = Math.max(0, CHAIRS.findIndex(c => c.k === st.seat)), C = CHAIRS[at], sat: any = V[C.k], other = CHAIRS.find(c => c.k !== C.k), with_: any = other ? V[other.k] : null;
  const empty = CHAIRS.find(c => !V[c.k] && c.k !== C.k);
  const run = (fn: () => any, next?: string) => act(() => { const r = fn(); st.msg = r.text; st.err = !r.ok; say(r.text, { err: !r.ok }); if (r.ok && next) st.seat = next; });
  const pool: any[] = V.pool.slice().sort((a: any, b: any) => b[C.f] - a[C.f]).slice(0, 6);
  const done = CHAIRS.every(c => V[c.k]);
  return <Window title="The commentary desk" wide ok="Done">
    <div class="vpick" data-t="voice-screen" data-v={C.k}>
      <ol class="vsteps">{CHAIRS.map((c, i) => <li key={c.k} class={c.k === C.k ? 'on' : undefined} data-t="voice-chair" data-v={c.k} data-full={V[c.k] ? '1' : '0'}>
        <button type="button" class="vstep" data-t="voice-seat" data-v={c.k} aria-current={c.k === C.k ? 'step' : undefined} onClick={() => view(() => { st.seat = c.k; st.msg = ''; })}>
          <span class="vnum">{V[c.k] ? '✓' : i + 1}</span><span><b>{c.n}</b><br /><span class="muted">{V[c.k] ? V[c.k].name : 'Empty'}</span></span></button></li>)}</ol>
      {st.msg ? <p class={(st.err ? 'bad' : 'good') + ' vmsg'} role="status" data-t="voice-msg">{st.msg}</p> : null}
      <h3 class="vhead">Step {at + 1} of {CHAIRS.length}: pick your {C.n.toLowerCase()} voice</h3>
      <p class="vabout">{C.d}</p>
      <p class="vnow" data-t="voice-now">{sat ? <>In the chair: <b>{sat.name}</b>, {C.skill.toLowerCase()} {sat[C.f]} ({skillWord(sat[C.f]).toLowerCase()}), ${sat.wage.toLocaleString('en-US')} a week. <Btn kind="sm" t="voice-drop" d={{ v: C.k }} onClick={() => run(() => E.dropVoice(S, C.k))}>Let go</Btn></>
        : <span class="muted">Nobody is in this chair yet. Pick one of the voices below.</span>}</p>
      {pool.length ? <ul class="vcards" data-t="voice-pool">{pool.map((v: any, i: number) => {
        const ch = C.k === 'pbp' ? v.chemPbp : v.chemCol;
        return <li key={v.id} class="vcard">
          <p class="vname"><b>{v.name}</b>{i === 0 ? <> <Tag kind="gold">Best {C.skill.toLowerCase()}</Tag></> : null}</p>
          <p class="vskill"><span>{C.skill}</span> <b class="num">{v[C.f]}</b> <span class={v[C.f] >= 70 ? 'good' : (v[C.f] < 50 ? 'bad' : undefined)}>{skillWord(v[C.f])}</span></p>
          <p class="muted">Style: {v.style}, {STYLE_SAYS[v.style] || ''}</p>
          {ch != null ? <p class={ch >= 1.5 ? 'good' : (ch <= -1.5 ? 'bad' : undefined)}>With {with_.name}: {E.chemWord(ch)}</p> : null}
          <p class="vfoot"><span>${v.wage.toLocaleString('en-US')} a week</span>
            <Btn kind="go" t="desk-hire" d={{ id: v.id }} onClick={() => run(() => E.hireVoice(S, v.id, C.k), empty ? empty.k : undefined)}>Sign as {C.n.toLowerCase()}</Btn></p>
        </li>; })}</ul>
        : <Empty>Nobody is available right now. New voices come on the market each year.</Empty>}
      <p class="muted vtip">{done && V.chem != null ? <>Your desk: <b>{V.pbp.name}</b> and <b>{V.col.name}</b>. {E.chemWord(V.chem)}. A good desk lifts every match.</>
        : 'Tip: an excitable voice and a dry one work best together. Two of the same style tend to talk over each other.'}</p>
    </div>
  </Window>;
}
/** Open the commentary desk pop-up on one chair. */
export function openVoices(seat?: string) { const st = slice<{ seat: string; msg: string; err: boolean }>('voices', () => ({ seat: 'pbp', msg: '', err: false })); st.seat = seat === 'col' ? 'col' : 'pbp'; st.msg = ''; openModal({ kind: 'voices' }); }

/** A new game opens on this: the owner's letter, written by hand on cream paper laid on the black board (rule 2a).
    The lines appear one after another, as if read down the page. */
export function WelcomeWindow(_p: { m: Modal }) {
  const S = G.S, W = E.welcome(S);
  return <div class="scrim intro" role="dialog" aria-modal="true" aria-label={'A letter from ' + W.from} data-t="welcome">
    <div class={'letter' + (_p.m.again ? ' again' : '')}>
      <div class="lt-head"><b>{W.company}</b><span>Office of the owner</span></div>
      <p class="lt-meta"><span>To: {W.to}</span><span>{W.date}</span></p>
      <p class="lt-meta"><span>About: the job</span></p>
      <div class="lt-body">{W.lines.map((x: string, i: number) => <p key={i} class={'lt-l' + (i === 0 ? ' first' : '')} style={{ animationDelay: (0.3 + i * 0.6) + 's' }}><Txt>{x}</Txt></p>)}
        <p class="lt-l lt-sig" style={{ animationDelay: (0.3 + W.lines.length * 0.6) + 's' }}>{W.from}<br /><span class="lt-role">{W.role}, {W.short}</span></p>
        <p class="lt-l lt-ps" style={{ animationDelay: (0.7 + W.lines.length * 0.6) + 's' }}>P.S. {W.ps}</p></div>
      <div class="lt-foot"><Btn kind="go" id="modal-ok" t="welcome-go" onClick={closeModal}>{_p.m.again ? 'Put it away' : 'Get to work'}</Btn></div>
    </div>
  </div>;
}

/** Name the face of the company, from the desk. Required once, before the first big event. */
export function FaceWindow(_p: { m: Modal }) {
  const S = G.S, C: any[] = E.faceCandidates(S), F = E.faceInfo ? E.faceInfo(S) : null, cur = S.fc ? S.fc.id : null;
  const pick = (id: number) => act(() => { const r = E.nameFace(S, id); say(r.msg, { err: !r.ok }); if (r.ok) openModal({ kind: 'info', title: 'The face of the company', body: () => <p class="good"><Txt>{r.msg}</Txt></p> }); });
  return <Window title="The face of the company" wide ok="Not now">
    <p>Who are the shows built around? The crowd comes to see them. <span class="muted">A lift when they are in the main event. A letdown when they could be on the card and are not. It can change later, on the air, when the building will not sit down for somebody.</span></p>
    <ul class="list mt1" data-t="face-list">{C.map((c: any) => <li key={c.id}>
      <span><Name w={S.w[c.id]} /> <span class="muted">{'·'} {c.why}</span>{cur === c.id ? <> <Tag kind="good">Now</Tag></> : null}</span>
      <span class="row opts"><Btn kind="sm" t="face-pick" d={{ v: c.id }} disabled={cur === c.id} onClick={() => pick(c.id)}>Build around them</Btn></span></li>)}</ul>
    {F ? null : null}
  </Window>;
}
export function openFace() { openModal({ kind: 'face' }); }
