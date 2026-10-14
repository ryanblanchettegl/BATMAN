/* Storylines as one screen of windows (docs/mockups/final/final-3-storylines.png, docs/plans/living-storylines.md):
   every feud's heat over the last twelve weeks across the top, the picked story down the right, and under the calendar what it says,
   booking power, and the rest of the stories (finished ones, streaks, stables, teams) behind buttons.
   Everything comes from E.season(S) and E.feudPlan(S, f); the page only reads the game. */
import { ComponentChildren } from 'preact';
import { E } from '../../engine';
import { G, slice, act, view, say, openModal } from '../../store';
import { Btn, Meter, Name, Empty, Tag, Txt, Desktop, Win, Group, Line, LightText, showResult, dataAttrs } from '../../kit';
import { Portrait } from '../../kit/portrait';
import { storyReset } from './StartStory';

type St = { sel: number | null; spg: number; npg: number };
const stl = () => slice<St>('stl', () => ({ sel: null, spg: 0, npg: 0 }));
const short = (n: string) => { const q = n.replace(/^(The|Sir|Lord|Lady|Dr\.|Mr\.|Mrs\.|Miss|Captain|King|Queen|Prince) /, '').split(/ (?:the|of|de|van|von|da) /)[0].split(' '); return q.length > 1 && q[0].length < 4 ? q.slice(0, 2).join(' ') : q[0]; };
const wk = (n: number) => n <= 0 ? 'this week' : n === 1 ? 'next week' : 'in ' + n + ' weeks';
const mode = () => document.documentElement.getAttribute('data-screen') || 'desk';
const flat = () => !!(window as any).EWF_FLAT;

/** The heat line: twelve weeks across, the last one this week, one line a story. Each cell is how hot it was. */
function Season(p: { se: any; sel: number | null }) {
  const S = G.S, st = stl(), se = p.se, per = flat() ? 99 : (mode() === 'desk' ? 6 : 5);
  const pages = Math.max(1, Math.ceil(se.stories.length / per)), pg = Math.min(st.spg, pages - 1), L = se.stories.slice(pg * per, pg * per + per);
  const months: { m: string; n: number }[] = []; se.weeks.forEach((w: any) => { const l = months[months.length - 1]; if (l && l.m === w.month) l.n++; else months.push({ m: w.month, n: 1 }); });
  const last = se.weeks.length - 1;
  return <div class="sn-wrap">
    <div class="sn" role="table" aria-label="The heat of every feud over the last twelve weeks">
      <span class="mh0" />{months.map(m => <span class="mh" style={{ gridColumn: 'span ' + m.n }}>{m.n >= 2 ? m.m : m.m.slice(0, 3)}</span>)}
      <span class="h0">Feud {'·'} heat</span>{se.weeks.map((w: any, i: number) => <span class={'h' + (i === last ? ' now' : (w.big && w.w >= 1 ? ' ev' : ''))} title={w.ev || ''}>{i === last ? 'NOW' : (w.w < 1 ? '' : (w.big ? '★' : 'W' + w.wom))}</span>)}
      {L.map((x: any) => <>
        <button type="button" class={'nm' + (x.id === p.sel ? ' sel' : '')} {...dataAttrs('season-row', { v: x.id })} aria-pressed={x.id === p.sel} onClick={() => view(() => { st.sel = x.id; })}>
          <span class={'ln k' + x.ph}>{PH[x.ph] || ''}</span><Portrait w={S.w[x.a]} /><Portrait w={S.w[x.b]} />
          <b>{short(S.w[x.a].name)} vs {short(S.w[x.b].name)}</b><Meter v={x.heat} kind="hot" n={5} /></button>
        {x.cells.map((c: any, i: number) => <span class={'c' + (c.a ? ' c' + c.a : '') + (se.weeks[i].big ? ' evc' : '')} title={c.h != null ? 'Heat ' + c.h : ''}>{i === last && x.end ? '★' : ''}</span>)}
      </>)}
      {!se.stories.length ? <span class="none">No feuds running. Start one with booking power.</span> : null}
      <span class="h0 evr">Big events</span>{se.weeks.map((w: any) => <span class={'c' + (w.big ? ' evn' : '')} title={w.ev || ''}>{w.big ? w.ev.split(' ').map((x: string) => x[0]).join('').slice(0, 3).toUpperCase() : ''}</span>)}
    </div>
    <div class="sn-foot">
      <span class="lg"><i class="c1" />Warm <i class="c2" />Hot <i class="c3" />Boiling {'·'} ★ an ending is planned</span>
      {pages > 1 ? <span class="pgr"><Btn kind="sm" t="season-page" d={{ v: 'prev' }} label="Earlier feuds" disabled={pg <= 0} onClick={() => view(() => { st.spg = pg - 1; })}>{'◄'}</Btn><span class="num">{pg + 1} of {pages}</span><Btn kind="sm" t="season-page" d={{ v: 'next' }} label="More feuds" disabled={pg >= pages - 1} onClick={() => view(() => { st.spg = pg + 1; })}>{'►'}</Btn></span> : null}
    </div>
    {se.next ? <p class="sn-led"><LightText dot={2} t="season-next" label={'Next big event: ' + se.next.ev + ', ' + wk(se.next.in)} text={[['NEXT BIG EVENT · ', '#8a8a8a'], [se.next.ev.toUpperCase().slice(0, 20), '#ffff55'], [' · ', '#8a8a8a'], [(se.next.in <= 0 ? 'THIS WEEK' : se.next.in === 1 ? 'NEXT WEEK' : se.next.in + ' WEEKS'), '#55ffff'], [' · ', '#8a8a8a'], [se.next.n + (se.next.n === 1 ? ' ENDING' : ' ENDINGS'), '#ff5555']]} /></p> : null}
  </div>;
}
const PH: Record<string, string> = { spark: 'S', build: 'B', boil: 'H', stale: '~', cool: 'C', rest: 'R' };

/** The picked story: how hot, how fresh, who leads, what it needs, and its ending if one is planned. */
function StoryPane(p: { id: number | null }) {
  const S = G.S, f = p.id == null ? null : S.feuds.find((x: any) => x.id === p.id && !x.res);
  if (!f) return <><Empty>No feud picked. Start one: two people who can wrestle each other.</Empty>
    <p class="mt1"><Btn kind="go" t="story-new" onClick={() => { storyReset(); openModal({ kind: 'story' }); }}>Start a feud</Btn></p></>;
  const pl = E.feudPlan(S, f), a = S.w[f.a[0]], b = S.w[f.b[0]];
  const end = () => openModal({ kind: 'info', title: 'Drop ' + E.feudLabel(S, f) + '?', body: () => <><p>It ends now, with no blow-off. There is no payoff, and both of them will remember you dropped it.</p>
    <p class="mt1"><Btn kind="danger" t="story-end-yes" onClick={() => act(() => { const r = E.storyEnd(S, f.id); say(r.msg, { err: !r.ok }); showResult('Storylines', r.msg, !r.ok); })}>Drop it</Btn></p></> });
  const plan = (w?: number | null) => act(() => { const r = E.storyPlanEnd(S, f.id, w); say(r.msg, { err: !r.ok }); });
  const log = () => openModal({ kind: 'info', title: E.feudLabel(S, f), wide: true, body: () => <ul class="list" data-t="story-log">{f.log.slice().reverse().map((l: any, i: number) => <li key={i}><span class="muted">Week {l.w}</span><span><Txt>{l.t}</Txt></span></li>)}</ul> });
  return <div class="sp">
    <div class="sp-vs"><span class="sp-one"><Portrait w={a} /><Name w={a} /></span><b class="rd">VS</b><span class="sp-one"><Portrait w={b} /><Name w={b} /></span></div>
    <p class="sp-tags"><Tag kind={f.heat >= 60 ? 'heel' : undefined}>{E.feudStage(f)}</Tag>{pl.ripe ? <Tag kind="good">Ripe to end</Tag> : null}</p>
    <Line label="Heat" w={9}><Meter v={f.heat} kind="hot" n={6} /> <span class="num">{pl.heat}</span> <span class="muted">Fresh</span> <Meter v={pl.fresh} kind="cool" n={6} /></Line>
    <Line label="Running" w={9}><span title={pl.lead}>{pl.weeks} {pl.weeks === 1 ? 'week' : 'weeks'}{pl.rounds ? ', ' + pl.rounds + (pl.rounds === 1 ? ' round' : ' rounds') : ''}{pl.lead ? (/every time/.test(pl.lead) ? ', one-sided' : (/square/.test(pl.lead) ? ', all square' : '')) : ''}</span></Line>
    <Group title="The ending">
      <p data-t="feud-end" class="clamp">{pl.end ? (pl.end.in < 0 ? 'Planned for ' + pl.end.at + ', which has passed. It goes on until you book the ending.' : 'Planned for ' + pl.end.at + ', ' + wk(pl.end.in) + '. Book them on that show.') : 'None planned. It goes on as long as you want it to.'}</p>
      <p class="sp-btns">{pl.end ? <Btn kind="sm" t="story-unplan" onClick={() => plan(null)}>Take the plan off</Btn> : <Btn kind="go" t="story-plan" onClick={() => plan()}>End it at {pl.next.at.replace(/^\S+ /, '')}</Btn>}</p>
    </Group>
    <Group title="What it needs"><p class="clamp">{NEEDS[pl.phase] ? NEEDS[pl.phase](pl) : ''}</p>
      <p class="sp-acts" data-t="story-acts">{E.storyActs(S, f.id).map((x: any) => <Btn key={x.id} kind="sm" t="story-act" d={{ v: x.id }} disabled={!x.can} label={x.n + '. ' + x.d + (x.why ? ' ' + x.why : '')} onClick={() => act(() => { const r = E.storyDo(S, f.id, x.id); say(r.msg, { err: !r.ok }); })}>{({ stakes: 'Stakes', sitdown: 'Sit-down', title: 'Title', turn: 'Turn', shelf: x.n === 'Bring it back' ? 'Bring back' : 'Rest it' } as any)[x.id] || x.n}{x.cost ? ' · ' + x.cost : ''}</Btn>)}</p></Group>
    {f.stakes ? <p class="good one">Stakes: {f.stakes}</p> : null}
    <p class="sp-btns"><Btn kind="sm" t="story-log" onClick={log}>The feud so far</Btn><Btn kind="danger" t="story-end" onClick={end}>Drop it</Btn></p>
  </div>;
}
const NEEDS: Record<string, (pl: any) => string> = {
  spark: () => 'A spark: a promo, a call-out or an ambush with both on the show.',
  build: () => 'Keep feeding it, and mix it up: a brawl, a war of words, a match. The same thing twice is worth less.',
  boil: (pl) => pl.ripe ? 'It is as hot as it gets and has given most of what it has. End it at the next big event.' : 'It is boiling. Keep it on the show, or plan the ending for the next big event.',
  stale: () => 'It is going stale. A twist, a turn, a stipulation or a week off will freshen it. Or end it now.',
  cool: () => 'It is cooling. Heat it this week or let it go.',
  rest: () => 'It is resting. It will not fizzle, and it comes back fresher.'
};

/** What the calendar says: each line something to act on. A line about a story picks it. */
function Says(p: { se: any }) {
  const S = G.S, st = stl(), L = p.se.says, per = flat() ? 99 : 2;
  const pages = Math.max(1, Math.ceil(L.length / per)), pg = Math.min(st.npg, pages - 1);
  const KW: Record<string, [string, any]> = { late: ['Late', 'bad'], hurt: ['Hurt', 'bad'], cold: ['Cold', 'bad'], ripe: ['Ripe', 'good'], clash: ['Clash', 'bad'], lop: ['One-sided', 'warn'], tired: ['Stale', 'warn'], crowd: ['Crowded', 'warn'], idle: ['Idle', 'off'], good: ['Good', 'good'] };
  if (!L.length) return <p class="muted">Nothing to fix. Every feud is in good shape.</p>;
  return <>
    <ul class="says">{L.slice(pg * per, pg * per + per).map((x: any, i: number) => <li key={pg + ':' + i}>
      {x.id != null ? <button type="button" class="lnk" {...dataAttrs('says', { k: x.k })} onClick={() => view(() => { st.sel = x.id; })}><Tag kind={KW[x.k][1]}>{KW[x.k][0]}</Tag><Txt>{x.t}</Txt></button>
        : <span {...dataAttrs('says', { k: x.k })}><Tag kind={KW[x.k][1]}>{KW[x.k][0]}</Tag><Txt>{x.t}</Txt></span>}</li>)}</ul>
    {pages > 1 ? <p class="pgr"><Btn kind="sm" t="says-page" d={{ v: 'prev' }} label="Earlier lines" disabled={pg <= 0} onClick={() => view(() => { st.npg = pg - 1; })}>{'◄'}</Btn><span class="num">{pg + 1} of {pages}</span><Btn kind="sm" t="says-page" d={{ v: 'next' }} label="More lines" disabled={pg >= pages - 1} onClick={() => view(() => { st.npg = pg + 1; })}>{'►'}</Btn></p> : null}
  </>;
}

/** Booking power: each thing it buys is a button that opens its pop-up. */
function Power() {
  const S = G.S, I = E.plotInfo(S), pl = E.longPlan(S);
  const b = (v: string, n: string, cost: string, can: boolean, go: () => void, note?: ComponentChildren) => <button type="button" class={'btn st-pw' + (can ? '' : ' used')} {...dataAttrs('plot-open', { v })} onClick={go}>
    <span class="one">{n}{note}</span><span class="cost">{cost}</span></button>;
  return <div class="st-pws" data-t="plot">
    {b('story', 'Start a feud', '2', I.bp >= 2, () => { storyReset(); openModal({ kind: 'story' }); })}
    {I.acts.map((a: any) => b(a.id, a.n, String(a.cost), a.can, () => openModal({ kind: 'plot', k: a.id }), a.id === 'tape' && I.taped ? <span class="good" data-t="plot-taped"> {'·'} on</span> : undefined))}
    {b('plan', 'The long plan', pl ? 'set' : 'free', true, () => openModal({ kind: 'plot', k: 'plan' }))}
  </div>;
}

/** Storylines the game found in what has already happened (src/84-sift.js): who, why, and one press to start it. */
function Found() {
  const S = G.S, L: any[] = E.sift(S);
  if (!L.length) return <Empty>Nothing yet. Stories grow out of matches, title changes and who gets on with whom. Run a few shows.</Empty>;
  return <ul class="list" data-t="found">{L.map(x => <li key={x.k + x.a + x.b} class="col" data-t="found-row">
    <span><Tag kind="gold">{x.n}</Tag> <Name w={S.w[x.a]} /> and <Name w={S.w[x.b]} /><br />{x.facts.map((f: string, i: number) => <span key={i} class="muted">{f} </span>)}<br /><i>{x.pitch}</i></span>
    <Btn kind="go" t="found-start" d={{ a: x.a, b: x.b }} onClick={() => { storyReset(x.a, x.b); openModal({ kind: 'story' }); }}>Start this feud</Btn>
  </li>)}</ul>;
}

/** Everything else about the stories, one button each. */
function More(p: { pops: { [k: string]: () => ComponentChildren } }) {
  const S = G.S, P = S.promos[S.player];
  const done = S.feuds.filter((f: any) => f.res && f.promo === P.id).length, streak = E.rosterOf(S, P.id).filter((w: any) => w.ws >= 4).length;
  const stables = (S.stables || []).filter((s: any) => s.promo === S.player).length, teams = S.teams.filter((t: any) => t.promo === P.id).length;
  const m = S.mystery && S.mystery.promo === S.player ? S.mystery : null, R = E.rebelInfo(S);
  const b = (k: string, n: string, c: number, title: string) => <button type="button" class="btn st-pw" {...dataAttrs('st-more', { v: k })} onClick={() => openModal({ kind: 'info', title, wide: true, body: p.pops[k] })}><span class="one">{n}</span><span class="cost">{c}</span></button>;
  return <div class="st-pws">
    <button type="button" class="btn st-pw" {...dataAttrs('plot-open', { v: 'found' })} onClick={() => openModal({ kind: 'info', title: 'Stories waiting', wide: true, body: () => <Found /> })}><span class="one">Stories waiting</span><span class="cost">{E.sift(S).length}</span></button>
    {b('finished', 'Finished feuds', done, 'Finished')}
    {b('streaks', 'Winning streaks', streak, 'Winning streaks')}
    {b('stables', 'Stables', stables, 'Stables')}
    {b('teams', 'Tag teams', teams, 'Tag teams')}
    {m ? <p class="st-note clamp" data-t="st-mystery">Unsolved: who attacked {S.w[m.v].name} in week {m.start}?</p> : null}
    {R ? <p class="st-note clamp" data-t="st-rebel">{R.w.name} has declared war on the boss.</p> : null}
  </div>;
}

export function SeasonPage(p: { pops: { [k: string]: () => ComponentChildren } }) {
  const S = G.S, st = stl(), se = E.season(S);
  const sel = se.stories.some((x: any) => x.id === st.sel) ? st.sel : (se.stories.length ? se.stories.slice().sort((a: any, b: any) => b.heat - a.heat)[0].id : null);
  const cur = se.stories.find((x: any) => x.id === sel), fix = se.says.filter((x: any) => x.k !== 'good').length;
  return <div class="onescreen">
    <h1 class="vh">Storylines</h1>
    <Desktop cls="stpage" t="storylines">
      <Win title="The last twelve weeks: how hot every feud ran" right={se.stories.length + (se.stories.length === 1 ? ' feud' : ' feuds')} area="season" t="season"><Season se={se} sel={sel} /></Win>
      <Win title={cur ? cur.label : 'Your feuds'} right={cur ? cur.phase : ''} area="story" t="story-pane"><StoryPane key={String(sel) + ':' + S.week} id={sel} /></Win>
      <Win title="The calendar says" right={fix ? fix + ' to fix' : ''} tone={fix ? 'hot' : undefined} area="says" t="st-says"><Says se={se} /></Win>
      <Win title="Booking power" right={<span data-t="st-bp">{S.bp}</span>} area="power" t="st-power"><Power /></Win>
      <Win title="Around the feuds" area="more" t="st-morewin"><More pops={p.pops} /></Win>
    </Desktop>
  </div>;
}
