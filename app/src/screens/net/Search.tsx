/* Wrestle Search (Ryan, 14 October): a 90s web portal with six buttons, each one a make-believe wrestling website,
   the way a game world fills its own internet. Every site only reads the game; nothing here changes it. */
import { ComponentChildren } from 'preact';
import { E, W } from '../../engine';
import { G, slice, view } from '../../store';
import { Btn, Empty, Txt, Name, PromoName, TitleName } from '../../kit';
import { Boards } from './Boards';

interface Site { id: string; n: string; url: string; blurb: string; cls: string; body: () => ComponentChildren }

/** A visitor count that only ever climbs: from the week and the site, never from the game's dice. */
function hits(id: string): string { let h = 7; for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 9973; return String(1200 + h + G.S.week * 37).padStart(6, '0'); }
/** The newest finished issue of the dirt sheet, or this week's if there is none yet. */
function issue(): any { const I = E.sheetInfo(G.S); return I.now.yours.length || !I.past.length ? I.now : I.past[0]; }

function Rumors() {
  const s = issue(), L = (s.followups || []).concat(s.rumours || []);
  return <>{L.length ? <ul class="ws-ul">{L.map((r: any, i: number) => <li key={i}><Txt>{r.t}</Txt>{r.lvl ? <i> ({E.NET_LVL[r.lvl]})</i> : null}</li>)}</ul> : <Empty>No rumors this week. Check back!!!</Empty>}
    <p class="ws-small">We are not responsible for anything posted here. Most of it is made up.</p></>;
}
function Results() {
  const s = issue();
  return <>
    {s.yours.map((y: any) => <div key={y.show}><p><b>{y.show}</b> got a <b>{E.repGrade(y)}</b></p>{y.lines.slice(0, 3).map((l: string, i: number) => <p key={i}>{'> '}<Txt>{l}</Txt></p>)}</div>)}
    {s.world.map((w: any) => <div key={w.id}><p><b><PromoName id={w.id} /></b></p>{w.lines.map((l: string, i: number) => <p key={i}>{'> '}<Txt>{l}</Txt></p>)}</div>)}
    {!s.yours.length && !s.world.length ? <Empty>No results posted yet this week.</Empty> : null}
  </>;
}
function Rankings() {
  const C = E.criticList(G.S);
  return C.rows.length ? <><p class="ws-small">As voted by {C.name}. No arguing.</p>
    <ol class="ws-ol">{C.rows.map((r: any) => <li key={r.w.id}><Name w={r.w} /> <span class="ws-small">{r.w.promo !== 'FA' && G.S.promos[r.w.promo] ? G.S.promos[r.w.promo].name : ''}{r.move ? (r.move > 0 ? ' UP ' + r.move : ' DOWN ' + (-r.move)) : (r.move === 0 ? '' : ' NEW!')}</span></li>)}</ol></>
    : <Empty>The list comes out after the first shows.</Empty>;
}
function Belts() {
  const S = G.S;
  return <>{S.order.map((pid: string) => S.promos[pid]).map((P: any) => <div key={P.id} class="ws-co"><p><b><PromoName id={P.id} /></b></p>
    {P.titles.map((t: any) => <p key={t.id}>{'* '}<TitleName pid={P.id} t={t} />{': '}{t.holders.length ? t.holders.map((id: number, i: number) => <span key={id}>{i ? ' & ' : ''}<Name w={S.w[id] as W} /></span>) : <i>VACANT</i>}</p>)}</div>)}</>;
}
function Whispers() {
  const s = issue(), L = (s.backstage || []).map((r: any) => r.t).concat(s.business || []);
  return L.length ? <ul class="ws-ul">{L.map((t: string, i: number) => <li key={i}><Txt>{t}</Txt></li>)}</ul> : <Empty>Quiet week backstage. Too quiet.</Empty>;
}

const SITES: Site[] = [
  { id: 'rumor', n: 'Rumor Mill Daily', url: 'www.rumormilldaily.net', blurb: 'Who is unhappy, who is leaving', cls: 'ws-rumor', body: Rumors },
  { id: 'board', n: 'The Squared Circle Board', url: 'boards.squaredcircle.org', blurb: 'The fans talk back', cls: 'ws-board', body: Boards },
  { id: 'results', n: 'Ringside Results', url: 'www.ringsideresults.com', blurb: 'Every show, every grade', cls: 'ws-results', body: Results },
  { id: 'rank', n: 'Top Ten Tuesday', url: 'members.toptentuesday.net/~list', blurb: 'The best in the world right now', cls: 'ws-rank', body: Rankings },
  { id: 'belts', n: 'The Title Line', url: 'www.thetitleline.com/champs.html', blurb: 'Every champion, every company', cls: 'ws-belts', body: Belts },
  { id: 'whisper', n: 'Backstage Whispers', url: 'www.backstagewhispers.com', blurb: 'What happened behind the curtain', cls: 'ws-whisper', body: Whispers }
];

export function Search() {
  const st = slice<{ site: string }>('wsearch', () => ({ site: '' })), site = SITES.find(x => x.id === st.site);
  const home = () => view(() => { st.site = ''; });
  return <div class="wsearch" data-t="wsearch">
    <div class="ws-bar"><Btn kind="sm" t="ws-back" disabled={!site} onClick={home}>Back</Btn><span class="ws-url" data-t="ws-url">http://{site ? site.url : 'www.wrestlesearch.com'}</span></div>
    {site ? <div class={'ws-site ' + site.cls} data-t="ws-site" data-v={site.id}>
      <p class="ws-title">{site.n}</p>
      <div class="ws-body">{site.body()}</div>
      <p class="ws-count">You are visitor number {hits(site.id)} {'·'} Best viewed at 800 by 600</p>
    </div> : <div class="ws-home">
      <p class="ws-logo">Wrestle<span>Search</span></p>
      <p class="ws-tag">The wrestling web, all in one place</p>
      <div class="ws-grid">{SITES.map(x => <button type="button" key={x.id} class="ws-link" data-t="ws-go" data-v={x.id} onClick={() => view(() => { st.site = x.id; })}><b>{x.n}</b><small>{x.blurb}</small></button>)}</div>
    </div>}
  </div>;
}
