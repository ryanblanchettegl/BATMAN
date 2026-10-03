/* The end: fired by the owner, or out of money. Shown instead of the page while S.over is set. */
import { E } from '../../engine';
import { G, me, slice, view } from '../../store';
import { takeJob, abandonGame } from '../../flow';
import { clearSave } from '../../store';
import { clearToasts } from '../../shell/Frame';
import { Head, Panel, Btn, KV, CheckLine } from '../../kit';

export function GameOver() {
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
        <KV label="Booker level">{S.booker.lvl}</KV><KV label="Shows run">{st.shows}</KV><KV label="Best show">{st.bestShow}%</KV><KV label="Best match">{st.bestMatch}%</KV><KV label="Feuds finished">{st.feudsDone}</KV>
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
  </>;
}
