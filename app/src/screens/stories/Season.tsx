/* Storylines as one screen of windows (docs/mockups/final/final-3-storylines.png, docs/plans/storylines.md step 3):
   the next twelve weeks across the top (wrestling has no seasons: it runs every week and builds to big nights), the
   picked story down the right, and under the calendar what it says,
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
const ACTN = ['', 'Spark', 'Build', 'Twist', 'Blow-off', 'Chapter'];
const LENW: Record<string, string> = { s: 'S', m: 'M', l: 'L' };
const wk = (n: number) => n <= 0 ? 'this week' : n === 1 ? 'next week' : 'in ' + n + ' weeks';
const mode = () => document.documentElement.getAttribute('data-screen') || 'desk';
const flat = () => !!(window as any).EWF_FLAT;

/** The calendar: twelve weeks across, one line a story, the big events along the bottom. */
function Season(p: { se: any; sel: number | null }) {
  const S = G.S, st = stl(), se = p.se, per = flat() ? 99 : (mode() === 'desk' ? 6 : 5);
  const pages = Math.max(1, Math.ceil(se.stories.length / per)), pg = Math.min(st.spg, pages - 1), L = se.stories.slice(pg * per, pg * per + per);
  const months: { m: string; n: number }[] = []; se.weeks.forEach((w: any) => { const l = months[months.length - 1]; if (l && l.m === w.month) l.n++; else months.push({ m: w.month, n: 1 }); });
  return <div class="sn-wrap">
    <div class="sn" role="table" aria-label="The next twelve weeks of every feud">
      <span class="mh0" />{months.map(m => <span class="mh" style={{ gridColumn: 'span ' + m.n }}>{m.n >= 2 ? m.m : m.m.slice(0, 3)}</span>)}
      <span class="h0">Feud {'·'} heat</span>{se.weeks.map((w: any, i: number) => <span class={'h' + (i === 0 ? ' now' : (w.big ? ' ev' : ''))} title={w.ev || ''}>{i === 0 ? 'NOW' : (w.big ? '★' : 'W' + w.wom)}</span>)}
      {L.map((x: any) => <>
        <button type="button" class={'nm' + (x.id === p.sel ? ' sel' : '')} {...dataAttrs('season-row', { v: x.id })} aria-pressed={x.id === p.sel} onClick={() => view(() => { st.sel = x.id; })}>
          <span class={'ln k' + x.len}>{LENW[x.len]}</span><Portrait w={S.w[x.a]} /><Portrait w={S.w[x.b]} />
          <b>{short(S.w[x.a].name)} vs {short(S.w[x.b].name)}</b><Meter v={x.heat} kind="hot" n={5} /></button>
        {x.cells.map((c: any, i: number) => <span class={'c' + (c.a ? ' c' + c.a : '') + (se.weeks[i].big ? ' evc' : '') + (c.late ? ' late' : '')} title={c.a ? ACTN[c.a] : ''}>{c.star ? '★' : (c.late ? '!' : '')}</span>)}
      </>)}
      {!se.stories.length ? <span class="none">No feuds running. Start one with booking power.</span> : null}
      <span class="h0 evr">Big events</span>{se.weeks.map((w: any) => <span class={'c' + (w.big ? ' evn' : '')} title={w.ev || ''}>{w.big ? w.ev.split(' ').map((x: string) => x[0]).join('').slice(0, 3).toUpperCase() : ''}</span>)}
    </div>
    <div class="sn-foot">
      <span class="lg"><span class="ln ks">S</span>Short <span class="ln km">M</span>Medium <span class="ln kl">L</span>Long <i class="c1" />Spark <i class="c2" />Build <i class="c3" />Twist <i class="c5" />Chapter <i class="c4" />Blow-off</span>
      {pages > 1 ? <span class="pgr"><Btn kind="sm" t="season-page" d={{ v: 'prev' }} label="Earlier feuds" disabled={pg <= 0} onClick={() => view(() => { st.spg = pg - 1; })}>{'◄'}</Btn><span class="num">{pg + 1} of {pages}</span><Btn kind="sm" t="season-page" d={{ v: 'next' }} label="More feuds" disabled={pg >= pages - 1} onClick={() => view(() => { st.spg = pg + 1; })}>{'►'}</Btn></span> : null}
    </div>
    {se.next ? <p class="sn-led"><LightText dot={2} t="season-next" label={'Next ending: ' + se.next.ev + ', ' + wk(se.next.in)} text={[['NEXT ENDING · ', '#8a8a8a'], [se.next.ev.toUpperCase().slice(0, 20), '#ffff55'], [' · ', '#8a8a8a'], [(se.next.in <= 0 ? 'THIS WEEK' : se.next.in === 1 ? 'NEXT WEEK' : se.next.in + ' WEEKS'), '#55ffff'], [' · ', '#8a8a8a'], [se.next.n + (se.next.n === 1 ? ' STORY' : ' STORIES'), '#ff5555']]} /></p> : null}
  </div>;
}

/** The picked story: where it is, what it needs this week, and where it ends. */
function StoryPane(p: { id: number | null }) {
  const S = G.S, f = p.id == null ? null : S.feuds.find((x: any) => x.id === p.id && !x.res);
  if (!f) return <><Empty>No feud picked. Start one: two people, and how long it runs.</Empty>
    <p class="mt1"><Btn kind="go" t="story-new" onClick={() => { storyReset(); openModal({ kind: 'story' }); }}>Start a feud</Btn></p></>;
  const pl = E.feudPlan(S, f), a = S.w[f.a[0]], b = S.w[f.b[0]], act0 = E.feudAct(f, S), run = S.week - f.start, total = pl.pay - f.start;
  const track = pl.ch ? [['Spark', f.start], ...pl.ch.map((c: any, i: number) => ['Ch ' + (i + 1), c.w])] : (pl.len === 's' ? [['Spark', 1], ['Blow-off', 4]] : [['Spark', 1], ['Build', 2], ['Twist', 3], ['Blow-off', 4]]);
  const at = pl.ch ? Math.min((f.chd || 0) + 1, pl.ch.length) : 0;
  const end = () => openModal({ kind: 'info', title: 'End ' + E.feudLabel(S, f) + '?', body: () => <><p>It ends now, before its night. There is no payoff, and both of them will remember you dropped it.</p>
    <p class="mt1"><Btn kind="danger" t="story-end-yes" onClick={() => act(() => { const r = E.storyEnd(S, f.id); say(r.msg, { err: !r.ok }); showResult('Storylines', r.msg, !r.ok); })}>End it now</Btn></p></> });
  const log = () => openModal({ kind: 'info', title: E.feudLabel(S, f), wide: true, body: () => <ul class="list" data-t="story-log">{f.log.slice().reverse().map((l: any, i: number) => <li key={i}><span class="muted">Week {l.w}</span><span><Txt>{l.t}</Txt></span></li>)}</ul> });
  return <div class="sp">
    <div class="sp-vs"><span class="sp-one"><Portrait w={a} /><Name w={a} /></span><b class="rd">VS</b><span class="sp-one"><Portrait w={b} /><Name w={b} /></span></div>
    <p class="sp-tags"><Tag kind={pl.len === 'l' ? 'heel' : pl.len === 'm' ? 'gold' : 'info'}>{pl.n} feud</Tag><Tag kind={f.heat >= 60 ? 'heel' : undefined}>{E.feudStage(f)}</Tag>{f.finale ? <Tag kind="good">Match made</Tag> : null}</p>
    <div class={'sp-trk n' + track.length} data-t="story-track">{track.map((x: any, i: number) => { const done = pl.ch ? (i === 0 ? true : i <= (f.chd || 0)) : x[1] < act0, on = pl.ch ? i === at : x[1] === act0;
      return <span class={done && !on ? 'dn' : (on ? 'on' : '')}>{done && !on ? '✔ ' : (on ? '● ' : '○ ')}{x[0]}</span>; })}</div>
    <Line label="Heat" w={9}><Meter v={f.heat} kind="hot" /> <span class="num">{Math.round(f.heat)}</span></Line>
    <Line label="Running" w={9}>{run} of {total} weeks</Line>
    <Group title={pl.ch && at < pl.ch.length ? 'Chapter ' + at + ' ends' : 'Where it ends'}>
      <p data-t="feud-end" class={pl.late ? 'bad' : ''}>{pl.late ? 'It was meant to end at ' + pl.at + '. It cools every week it runs over.' : (pl.ch && at < pl.ch.length ? pl.ch[at - 1].at + ', ' + wk(pl.ch[at - 1].w - S.week) + '. It ends for good at ' + pl.at + '.' : pl.at + ', ' + wk(pl.in) + '.')}{pl.slip && !pl.late ? ' One big event later than planned.' : ''}</p>
    </Group>
    <Group title="This week it needs"><p>{NEEDS[act0] ? NEEDS[act0](f, pl) : ''}</p></Group>
    {f.stakes ? <p class="good one">Stakes: {f.stakes}</p> : null}
    <Group title="Last in the feud"><div class="sp-log">{f.log.slice(-1).map((l: any, i: number) => <p key={i} class="clamp"><span class="muted">Week {l.w}:</span> <Txt>{l.t}</Txt></p>)}</div></Group>
    <p class="sp-btns"><Btn kind="sm" t="story-log" onClick={log}>The feud so far</Btn><Btn kind="danger" t="story-end" onClick={end}>End it</Btn></p>
  </div>;
}
const NEEDS: Record<number, (f: any, pl: any) => string> = {
  1: (_f, pl) => pl.len === 's' ? 'A spark: a promo or an ambush with both on the show. The match is close.' : 'Words and mind games. Keep both on the show.',
  2: () => 'A brawl, an attack or a contract signing. Build the heat.',
  3: (f) => f.tww != null && f.tww >= f.start && (G.S.week - f.tww) < 4 ? 'The twist has happened. Keep it hot.' : 'A twist: raise the stakes or book a betrayal.',
  4: (f) => (f.finale ? 'The match is made.' : 'Make the match official.') + ' Book it on its night.'
};

/** What the calendar says: each line something to act on. A line about a story picks it. */
function Says(p: { se: any }) {
  const S = G.S, st = stl(), L = p.se.says, per = flat() ? 99 : (mode() === 'tablet' ? 2 : 3);
  const pages = Math.max(1, Math.ceil(L.length / per)), pg = Math.min(st.npg, pages - 1);
  const KW: Record<string, [string, any]> = { late: ['Late', 'bad'], hurt: ['Hurt', 'bad'], clash: ['Clash', 'bad'], tired: ['Tired', 'warn'], crowd: ['Crowded', 'warn'], gap: ['Gap', 'bad'], idle: ['Idle', 'off'], good: ['Good', 'good'] };
  if (!L.length) return <p class="muted">Nothing to fix. Every feud has its night.</p>;
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
    {b('story', 'Start a feud', '1-3', I.bp >= 1, () => { storyReset(); openModal({ kind: 'story' }); })}
    {I.acts.map((a: any) => b(a.id, a.n, String(a.cost), a.can, () => openModal({ kind: 'plot', k: a.id }), a.id === 'tape' && I.taped ? <span class="good" data-t="plot-taped"> {'·'} on</span> : undefined))}
    {b('plan', 'The long plan', pl ? 'set' : 'free', true, () => openModal({ kind: 'plot', k: 'plan' }))}
  </div>;
}

/** Everything else about the stories, one button each. */
function More(p: { pops: { [k: string]: () => ComponentChildren } }) {
  const S = G.S, P = S.promos[S.player];
  const done = S.feuds.filter((f: any) => f.res && f.promo === P.id).length, streak = E.rosterOf(S, P.id).filter((w: any) => w.ws >= 4).length;
  const stables = (S.stables || []).filter((s: any) => s.promo === S.player).length, teams = S.teams.filter((t: any) => t.promo === P.id).length;
  const m = S.mystery && S.mystery.promo === S.player ? S.mystery : null, R = E.rebelInfo(S);
  const b = (k: string, n: string, c: number, title: string) => <button type="button" class="btn st-pw" {...dataAttrs('st-more', { v: k })} onClick={() => openModal({ kind: 'info', title, wide: true, body: p.pops[k] })}><span class="one">{n}</span><span class="cost">{c}</span></button>;
  return <div class="st-pws">
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
      <Win title="The next twelve weeks: where every feud ends" right={se.weeks[0] ? se.weeks[0].month : ""} area="season" t="season"><Season se={se} sel={sel} /></Win>
      <Win title={cur ? cur.label : 'Your feuds'} right={cur ? (cur.len === 'l' ? 'Long' : cur.len === 'm' ? 'Medium' : 'Short') : ''} area="story" t="story-pane"><StoryPane key={String(sel) + ':' + S.week} id={sel} /></Win>
      <Win title="The calendar says" right={fix ? fix + ' to fix' : ''} tone={fix ? 'hot' : undefined} area="says" t="st-says"><Says se={se} /></Win>
      <Win title="Booking power" right={<span data-t="st-bp">{S.bp}</span>} area="power" t="st-power"><Power /></Win>
      <Win title="Around the feuds" area="more" t="st-morewin"><More pops={p.pops} /></Win>
    </Desktop>
  </div>;
}
