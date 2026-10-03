/* The end: fired by the owner, or out of money. Shown instead of the page while S.over is set. */
import { E } from '../../engine';
import { G, me, slice, view } from '../../store';
import { takeJob, abandonGame } from '../../flow';
import { copyText } from '../start';
import { clearSave } from '../../store';
import { clearToasts } from '../../shell/Frame';
import { Head, Panel, Btn, KV, CheckLine, stars } from '../../kit';

/** The score for a finished career, kept in this browser so the next one has something to beat. */
function bestSoFar(score: number, name: string): number {
  let best = 0;
  try { best = +(localStorage.getItem('ewf9000-legacy') || '0') || 0; if (score > best) localStorage.setItem('ewf9000-legacy', String(score)); } catch (e) { /* no storage: no record */ }
  return best;
}
export function LegacyPanel(p: { final?: boolean }) {
  const S = G.S, L = E.legacy(S), prev = p.final ? bestSoFar(L.score, S.booker.name) : 0;
  return <Panel title={p.final ? 'Your legacy' : 'Your legacy so far'}>
    <p class="big"><span class="num">{L.score}</span> <span class="muted">points{p.final ? (L.score > prev ? '. A new best.' : '. Your best is ' + prev + '.') : ''}</span></p>
    <ul class="list">{L.parts.filter((x: any) => x.v).map((x: any) => <li><span>{x.n}</span><span class={'num ' + (x.v < 0 ? 'bad' : 'muted')}>{x.v > 0 ? '+' : ''}{x.v}</span></li>)}</ul>
    {L.made.length ? <><p class="eyebrow mt2">Stars you made</p><ul class="list">{L.made.map((m: any) => <li><span>{m.w.name}</span><span class="num good">{m.from} to {m.to}</span></li>)}</ul></> : null}
    {L.best.length ? <><p class="eyebrow mt2">Your best matches</p><ul class="list">{L.best.map((m: any) => <li><span>{m.l}</span><span class="muted">{stars(m.ov)} {'·'} {m.show}</span></li>)}</ul></> : null}
    <p class="eyebrow mt2">The career</p>
    <ul class="list">{L.timeline.map((e: any) => <li class="col"><span class="muted">{e.when || e.year || ''}</span><span>{e.label}</span></li>)}</ul>
  </Panel>;
}

/** The twelve weeks are up: the score, a code to share, and the way back. */
function ChallengeDone() {
  const S = G.S, C = S.chal, P = me(), cp = slice<{ msg: string }>('chalcopy', () => ({ msg: '' }));
  const fresh = () => { clearToasts(); abandonGame(); };
  return <>
    <Head eyebrow={'Challenge ' + C.id} title="Challenge complete" />
    <Panel>
      <p>Twelve weeks with {P.name} are done.</p>
      <p class="big mt2"><span class="num">{C.score}</span> <span class="muted">points</span></p>
      <p class="mt2">Your code: <b class="num" id="chal-final">{C.code}</b></p>
      <div class="row mt2"><Btn kind="sm" t="chal-copy" onClick={() => copyText(C.code, 'chal-final', () => view(() => { cp.msg = 'Copied.'; }))}>Copy the code</Btn><span class="muted">{cp.msg}</span></div>
      <p class="muted mt2">Share the code. A friend can paste it on the title card under Weekly challenge to check the score.</p>
      <div class="row mt3"><Btn kind="go" t="newgame-yes" onClick={fresh}>Back to the menu</Btn></div>
    </Panel>
    <LegacyPanel />
  </>;
}

/** A scenario is over: did you do it? */
function ScenarioDone() {
  const S = G.S, C = S.scn, R = C.res || { ok: false, text: '', figures: [] }, P = me();
  const fresh = () => { clearToasts(); abandonGame(); };
  return <>
    <Head eyebrow={'Scenario: ' + (E.SCENARIOS.filter((s: any) => s.id === C.id)[0] || { n: '' }).n} title={R.ok ? 'You did it' : 'Not this time'} />
    <Panel>
      <p class={R.ok ? 'good' : 'bad'}>{R.text}</p>
      <ul class="list mt2">{(R.figures || []).map((f: string) => <li><span>{f}</span></li>)}</ul>
      <p class="muted mt2">{C.weeks} weeks with {P.name}.</p>
      <div class="row mt3"><Btn kind="go" t="newgame-yes" onClick={fresh}>Back to the menu</Btn></div>
    </Panel>
    <LegacyPanel />
  </>;
}

export function GameOver() {
  if (G.S.over.why === 'challenge') return <ChallengeDone />;
  if (G.S.over.why === 'scenario') return <ScenarioDone />;
  const S = G.S, P = me(), fired = S.over.why === 'fired', st = S.stats;
  // achievement pop-ups belong to the game that just ended
  const jt = slice<{ t: string[] }>('jobterms', () => ({ t: [] })), ck = E.jobTermsCheck(S, jt.t);
  // an iron man game that ends in bankruptcy is over for good: its save is erased so Continue cannot bring it back
  if (S.iron && !fired) clearSave();
  const job = (pid: string) => { clearToasts(); takeJob(pid, jt.t.slice()); jt.t = []; };
  const fresh = () => { clearToasts(); abandonGame(); };
  return <>
    <Head eyebrow={E.cal(S.over.week).label} title={fired ? 'You are fired' : 'Out of business'} />
    <Panel>
      <p>{fired ? S.owner.name + ' has lost faith in your booking and let you go from ' + P.name + '.' : P.name + ' ran out of money after six straight weeks in the red.'}</p>
      <div class="kv mt3 mb2">
        <KV label="Booker level">{S.booker.lvl}</KV><KV label="Shows run">{st.shows}</KV><KV label="Best show">{st.bestShow}%</KV><KV label="Best match">{stars(st.bestMatch)}</KV><KV label="Feuds finished">{st.feudsDone}</KV>
      </div>
      {fired && <div class="mt3">
        <h2 class="mb1">Somebody is always hiring</h2>
        <p class="muted">You keep your level and skills. You can ask for terms before you say yes, but asking is an attempt, and a failed ask starts you on the wrong foot.</p>
        <div class="row mt2 opts">{Object.keys(E.JOB_TERMS).map((k: string) => <Btn kind="sm" on={jt.t.indexOf(k) >= 0} t="jobterm" d={{ v: k }} onClick={() => view(() => { const i = jt.t.indexOf(k); if (i >= 0) jt.t.splice(i, 1); else jt.t.push(k); })}>{E.JOB_TERMS[k].n}</Btn>)}</div>
        {jt.t.length ? <>{jt.t.map((k: string) => <p class="muted">{E.JOB_TERMS[k].n}: {E.JOB_TERMS[k].d}</p>)}<CheckLine label="Asking" ck={ck} /></> : null}
        <p class="muted mt2">Pick up the phone:</p>
        <div class="row mt2">{E.jobOffers(S).map((id: string) => <Btn t="job" d={{ v: id }} onClick={() => job(id)}>Book for {S.promos[id].name}</Btn>)}</div>
      </div>}
      <div class="row mt3"><Btn kind="go" t="newgame-yes" onClick={fresh}>Start a new game</Btn></div>
    </Panel>
    <LegacyPanel final />
  </>;
}
