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

/** The commentary desk, picked from the Office. `m.k` is the chair to fill first. The first of the desk pop-ups:
    a task is answered where it stands, and the player never has to leave the Office for it. */
export function VoicesWindow(p: { m: Modal }) {
  const S = G.S, V = E.voices(S), st = slice<{ seat: string; msg: string; err: boolean }>('voices', () => ({ seat: 'pbp', msg: '', err: false }));
  const seat = st.seat === 'col' ? 'col' : 'pbp', word = seat === 'pbp' ? 'play-by-play' : 'colour';
  const run = (fn: () => any, next?: string) => act(() => { const r = fn(); st.msg = r.text; st.err = !r.ok; say(r.text, { err: !r.ok }); if (r.ok && next) st.seat = next; });
  const chair = (k: string, label: string, v: any, skill: string) => <li class={seat === k ? 'on' : undefined} data-t="voice-chair" data-v={k} data-full={v ? '1' : '0'}>
    <span><b>{label}</b> {v ? <><span>{v.name}</span> <span class="muted">{'·'} {skill} {v[k]} {'·'} {'$' + v.wage.toLocaleString('en-US')} a week</span></> : <span class="muted">Empty</span>}{seat === k ? <> <Tag kind="warn">Picking</Tag></> : null}</span>
    <span class="row opts">{seat !== k ? <Btn kind="sm" t="voice-seat" d={{ v: k }} onClick={() => view(() => { st.seat = k; })}>Pick for this chair</Btn> : null}
      {v ? <Btn kind="sm" t="voice-drop" d={{ v: k }} onClick={() => run(() => E.dropVoice(S, k))}>Let go</Btn> : null}</span></li>;
  const pool: any[] = V.pool.slice().sort((a: any, b: any) => b[seat] - a[seat]).slice(0, 6);
  return <Window title="The commentary desk" wide ok="Done">
    {st.msg ? <p class={(st.err ? 'bad' : 'good') + ' mb1'} role="status" data-t="voice-msg">{st.msg}</p> : null}
    <ul class="list">{chair('pbp', 'Play-by-play', V.pbp, 'calling')}{chair('col', 'Colour', V.col, 'colour')}</ul>
    {V.chem != null ? <p class="mt1">Together: <b class={V.chem >= 1.5 ? 'good' : (V.chem <= -1.5 ? 'bad' : undefined)}>{E.chemWord(V.chem)}</b>. A good desk lifts every match and helps stories get across.</p>
      : <p class="muted mt1">Two voices that work well together lift every match and help stories get across. A weak desk drags them down.</p>}
    <p class="eyebrow mt2">Available for the {word} chair</p>
    {pool.length ? <ul class="list" data-t="voice-pool">{pool.map((v: any) => { const ch = seat === 'pbp' ? v.chemPbp : v.chemCol; return <li key={v.id}>
      <span><b>{v.name}</b> <span class="muted">{'·'} {v.style} {'·'} calling {v.pbp}, colour {v.col} {'·'} {'$' + v.wage.toLocaleString('en-US')} a week</span>{ch != null ? <> <span class={ch >= 1.5 ? 'good' : (ch <= -1.5 ? 'bad' : 'muted')}>{'·'} {E.chemWord(ch)} with your other voice</span></> : null}</span>
      <span class="row opts"><Btn kind="sm" t="desk-hire" d={{ id: v.id }} onClick={() => run(() => E.hireVoice(S, v.id, seat), (seat === 'pbp' ? V.col : V.pbp) ? undefined : (seat === 'pbp' ? 'col' : 'pbp'))}>Sign</Btn></span></li>; })}</ul>
      : <Empty>Nobody is available right now. New voices come on the market each year.</Empty>}
  </Window>;
}
/** Open the commentary desk pop-up on one chair. */
export function openVoices(seat?: string) { const st = slice<{ seat: string; msg: string; err: boolean }>('voices', () => ({ seat: 'pbp', msg: '', err: false })); st.seat = seat === 'col' ? 'col' : 'pbp'; st.msg = ''; openModal({ kind: 'voices' }); }

/** A new game opens on this: the owner's letter. Typed out line by line on a black screen, like a telex. */
export function WelcomeWindow(_p: { m: Modal }) {
  const S = G.S, W = E.welcome(S);
  return <div class="scrim intro" role="dialog" aria-modal="true" aria-label={'A letter from ' + W.from} data-t="welcome">
    <div class="telex">
      <pre class="tx-head" aria-hidden="true">{'╔' + '═'.repeat(46) + '╗\n║' + (' ' + W.company.toUpperCase()).padEnd(46).slice(0, 46) + '║\n║' + (' OFFICE OF THE OWNER').padEnd(46) + '║\n╚' + '═'.repeat(46) + '╝'}</pre>
      <p class="tx-meta"><span>TO: {W.to.toUpperCase()}</span><span>{W.date.toUpperCase()}</span></p>
      <p class="tx-meta"><span>RE: THE JOB</span><span>*** URGENT ***</span></p>
      <div class="tx-body">{W.lines.map((x: string, i: number) => <p key={i} class={'tx-l' + (i === 0 ? ' first' : '')} style={{ animationDelay: (0.5 + i * 0.9) + 's' }}><Txt>{x}</Txt></p>)}
        <p class="tx-l tx-sig" style={{ animationDelay: (0.5 + W.lines.length * 0.9) + 's' }}>{'—'.length ? '' : ''}{W.from}<br /><span class="muted">{W.role}, {W.short}</span></p>
        <p class="tx-l tx-ps" style={{ animationDelay: (1.1 + W.lines.length * 0.9) + 's' }}>P.S. {W.ps}</p></div>
      <div class="tx-foot"><Btn kind="go" id="modal-ok" t="welcome-go" onClick={closeModal}>Get to work</Btn><span class="blink" aria-hidden="true">_</span></div>
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
