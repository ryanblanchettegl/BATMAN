/* The end: fired by the owner, or out of money. Shown instead of the page while S.over is set. */
import { E } from '../../engine';
import { G, me } from '../../store';
import { takeJob, abandonGame } from '../../flow';
import { clearToasts } from '../../shell/Frame';
import { Head, Panel, Btn, KV } from '../../kit';

export function GameOver() {
  const S = G.S, P = me(), fired = S.over.why === 'fired', st = S.stats;
  // achievement pop-ups belong to the game that just ended
  const job = (pid: string) => { clearToasts(); takeJob(pid); };
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
        <p class="muted">You keep your level and skills. Pick up the phone:</p>
        <div class="row mt2">{E.jobOffers(S).map((id: string) => <Btn t="job" d={{ v: id }} onClick={() => job(id)}>Book for {S.promos[id].name}</Btn>)}</div>
      </div>}
      <div class="row mt3"><Btn kind="go" t="newgame-yes" onClick={fresh}>Start a new game</Btn></div>
    </Panel>
  </>;
}
