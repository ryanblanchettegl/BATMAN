/* Backstage as the board (docs/mockups/final/final-2-backstage.png; Ryan, 6 October: "bs full 1 is the closest").
   One screen of windows. The board: everybody in the building for a reason, one line each, worst first. Beside it,
   the file of whoever is picked. Under the board: the things to do (each opens its pop-up and spends a point), who is
   at your door asking for something (answered here, free), and the room in a few numbers. */
import { useLayoutEffect } from 'preact/hooks';
import { E } from '../../engine';
import { G, act, say, view, openModal } from '../../store';
import { Btn, Tag, Meter, Empty, Txt, showResult, Desktop, Win, Line, ListBox, Row, dataAttrs } from '../../kit';
import { Portrait } from '../../kit/portrait';
import { office } from './util';
import { ACT_UI, ACT_GROUPS, openAct } from './BeforeShow';
import { DossierBody } from './Dossier';

interface BRow { id: number; pid: number; name: string; room: string; place: string; why: string; tone: string; k: string; used: boolean; mark: string; rank: number }
const MARK: Record<string, [string, string, number]> = { bad: ['!', 'bad', 0], ask: ['?', 'warn', 1], none: ['·', 'off', 2], good: ['▲', 'good', 3] };
/** Everybody on the board: a line each, both people of a scene. */
function boardRows(N: any): BRow[] {
  const out: BRow[] = [], seen: Record<number, 1> = {};
  N.rooms.forEach((r: any) => r.people.forEach((p: any) => {
    const kind = p.tone === 'bad' ? 'bad' : (/^ask/.test(p.k) ? 'ask' : (p.tone === 'good' ? 'good' : 'none')), m = MARK[kind];
    const add = (id: number, name: string) => { if (seen[id]) return; seen[id] = 1; out.push({ id, pid: p.id, name, room: r.id, place: (n => n.charAt(0).toUpperCase() + n.slice(1))(r.n.replace(/^The /, '')), why: p.why, tone: kind, k: p.k, used: !!p.used, mark: m[0], rank: m[2] }); };
    add(p.id, p.name); if (p.with != null && p.duo && !seen[p.with]) { add(p.with, p.duo); out[out.length - 1].why = p.why.split(p.duo).join(p.name); }   // a scene, told from the other side
  }));
  return out;
}
const ROOMS = ['truck', 'catering', 'trainer', 'gym', 'lot', 'office', 'court'];
const SORTS: [string, string][] = [['worst', 'Worst first'], ['room', 'By room'], ['door', 'At my door']];

function Board(p: { rows: BRow[]; sel: number }) {
  const S = G.S, st = office() as any, sort = st.bsort || 'worst', per = (window as any).EWF_FLAT ? 99 : (st.bper || 7);
  // as many lines as the window holds: measured after drawing, and drawn again once if that is more or fewer
  useLayoutEffect(() => { if ((window as any).EWF_FLAT) return; const lb = document.querySelector('[data-t="bs-list"]') as HTMLElement | null, rw = lb && lb.querySelector('.rw') as HTMLElement | null, hd = lb && lb.querySelector('.hd') as HTMLElement | null;
    if (!lb || !rw) return; const fit = Math.max(4, Math.floor((lb.clientHeight - (hd ? hd.offsetHeight : 0) - 2) / rw.offsetHeight)); if (fit !== per && (fit < per || L.length > per)) view(() => { st.bper = fit; }); });
  let L = p.rows.slice();
  if (sort === 'worst') L.sort((a, b) => a.rank - b.rank || (S.w[a.id].morale - S.w[b.id].morale));
  else if (sort === 'room') L.sort((a, b) => ROOMS.indexOf(a.room) - ROOMS.indexOf(b.room) || a.rank - b.rank);
  else L = L.filter(r => r.room === 'truck').concat(L.filter(r => r.room !== 'truck'));
  const pages = Math.max(1, Math.ceil(L.length / per)), pg = Math.min(st.bpg || 0, pages - 1), shown = L.slice(pg * per, pg * per + per);
  const youOf = (id: number) => { const Y = S.rmY && S.rmY[id]; return 50 + (Y ? Y.v : 0) / 2; };
  return <>
    {L.length ? <ListBox cols="1.4em minmax(0,16ch) minmax(0,14ch) 1.6ch minmax(0,1fr) 6ch 6ch" label="Who needs you tonight" t="bs-list"
      head={<><span /><span>Who</span><span>Where</span><span /><span>What is going on</span><span>Mood</span><span>You</span></>}>
      {shown.map(r => <Row key={r.id} sel={r.id === p.sel} t="ppl-who" d={{ v: r.id, k: r.k }} label={r.name + ', ' + r.place + ': ' + r.why} onPick={() => view(() => { st.who = r.id; })}>
        <Portrait w={S.w[r.id]} /><b class="one">{r.name}</b><span class={'one ' + (r.tone === 'bad' ? 't-r' : (r.tone === 'good' ? 't-g' : ''))}>{r.place}</span>
        <Tag kind={MARK[r.tone][1] as any}>{r.mark}</Tag><span class={'one ' + (r.tone === 'bad' ? 't-r' : (r.tone === 'good' ? 't-g' : ''))}>{r.used ? 'Seen this week' : r.why}</span>
        <Meter v={S.w[r.id].morale} n={5} kind={S.w[r.id].morale < 40 ? 'hot' : undefined} /><Meter v={youOf(r.id)} n={5} kind="cool" />
      </Row>)}
    </ListBox> : <Empty>Nobody needs you backstage right now. That will not last.</Empty>}
    <div class="bs-foot">
      <span class="muted">Show me:</span>{SORTS.map(x => <Btn key={x[0]} kind="sm" on={sort === x[0]} t="bs-sort" d={{ v: x[0] }} onClick={() => view(() => { st.bsort = x[0]; st.bpg = 0; })}>{x[1]}</Btn>)}
      {pages > 1 ? <span class="pgr"><Btn kind="sm" t="bs-page" d={{ v: 'prev' }} label="Earlier on the board" disabled={pg <= 0} onClick={() => view(() => { st.bpg = pg - 1; })}>{'◄'}</Btn><span class="num">{pg + 1} of {pages}</span><Btn kind="sm" t="bs-page" d={{ v: 'next' }} label="More on the board" disabled={pg >= pages - 1} onClick={() => view(() => { st.bpg = pg + 1; })}>{'►'}</Btn></span> : null}
    </div>
  </>;
}

function Things() {
  const S = G.S, B = E.backstage(S), st = office() as any, nc = S.court ? S.court.length : 0, per = (window as any).EWF_FLAT ? 99 : (document.documentElement.getAttribute('data-screen') === 'desk' ? 5 : 4);
  const acts: { pl: any; a: any; ui: string[]; hot?: boolean }[] = [];
  ACT_GROUPS.forEach(g => B.places.forEach((pl: any) => pl.acts.forEach((a: any) => { if (!a.off && a.id !== 'case' && ACT_UI[a.id] && ACT_UI[a.id][2] === g[0]) acts.push({ pl, a, ui: ACT_UI[a.id] }); })));
  const court = B.places.find((x: any) => x.id === 'court');
  if (court) acts.splice(nc ? 0 : acts.length, 0, { pl: court, a: { id: 'case' }, ui: ['Call wrestlers’ court' + (nc ? ' (' + nc + ' waiting)' : ''), nc ? 'Hear both sides and rule.' : 'Nobody has brought a case this week.', 'people'], hot: nc > 0 });
  const pages = Math.max(1, Math.ceil(acts.length / per)), pg = Math.min(st.tdpg || 0, pages - 1);
  return <>
    <div class="bs-acts">{acts.slice(pg * per, pg * per + per).map(x => <button type="button" key={x.pl.id + x.a.id} class={'btn bs-a' + (x.pl.used ? ' used' : '') + (x.hot ? ' hot' : '')} title={x.ui[1]} {...dataAttrs('bs-act', { k: x.pl.id, v: x.a.id })} onClick={() => openAct(x.pl.id, x.a.id)}>
      <span class="one">{x.ui[0]}</span><span class="cost">{x.pl.used ? 'done' : (x.a.ck ? Math.round(x.a.ck.p * 100) + '%' : '1 point')}</span></button>)}</div>
    <div class="bs-foot">
      {pages > 1 ? <span class="pgr"><Btn kind="sm" t="td-page" d={{ v: 'prev' }} label="Earlier things to do" disabled={pg <= 0} onClick={() => view(() => { st.tdpg = pg - 1; })}>{'◄'}</Btn><span class="num">{pg + 1} of {pages}</span><Btn kind="sm" t="td-page" d={{ v: 'next' }} label="More things to do" disabled={pg >= pages - 1} onClick={() => view(() => { st.tdpg = pg + 1; })}>{'►'}</Btn></span> : null}
      {B.log && B.log.length ? <Btn kind="sm" t="bs-log" onClick={() => openModal({ kind: 'info', title: 'What you did this week', wide: true, body: () => <ul class="list" data-t="bs-log-list">{B.log.map((l: any, i: number) => <li class="col" key={i}><span><b>{l.place}</b> {'·'} {l.act}{l.who && l.who.length ? ' (' + l.who.join(', ') + ')' : ''}</span><span class={l.ok ? 'good' : 'bad'}><Txt>{l.msg}</Txt></span></li>)}</ul> })}>Done this week ({B.log.length})</Btn> : null}
    </div>
  </>;
}

function Door(p: { N: any }) {
  const S = G.S, truck = p.N.rooms.find((r: any) => r.id === 'truck'), asks: any[] = truck ? truck.people.filter((x: any) => /^ask/.test(x.k)) : [];
  const answer = (x: any, a: any) => act(() => { const r = E.peopleDo(S, x.id, a.id); say(r.msg, { err: !r.ok }); showResult(x.name, r.msg, !r.ok); });
  if (!asks.length) return <p class="muted">Nobody is at your door asking for anything.</p>;
  return <>{asks.slice(0, 2).map(x => <div class="door" key={x.id} data-t="door" data-v={x.id}>
    <Portrait w={S.w[x.id]} /><p class="clamp"><Txt>{x.name + ' ' + x.why.charAt(0).toLowerCase() + x.why.slice(1)}</Txt>.</p>
    <p class="yn">{x.used ? <span class="muted">Answered.</span> : x.acts.filter((a: any) => a.free).map((a: any) => <Btn key={a.id} kind={/_no$/.test(a.id) ? 'less' : undefined} t="door-do" d={{ id: x.id, v: a.id }} onClick={() => answer(x, a)}>{/_yes$/.test(a.id) ? 'Yes' : (/_no$/.test(a.id) ? 'No' : a.n)}</Btn>)}</p>
  </div>)}{asks.length > 2 ? <p class="muted one">And {asks.length - 2} more on the board.</p> : null}</>;
}

function Room() {
  const R = E.roomInfo(G.S), hostile = R.circles.filter((c: any) => c.power).length;
  return <div data-t="room-line">
    <Line label="Trust" w={9}><Meter v={R.trust.v} n={4} kind="cool" /> <span class={R.trust.v < 40 ? 'bad' : undefined} title={R.trust.w}>{R.trust.v}</span></Line>
    <Line label="Mood" w={9}><Meter v={R.mood.v} n={4} kind={R.mood.v < 40 ? 'hot' : undefined} /> {R.mood.w.toLowerCase()}{R.mood.d ? <span class={R.mood.d < 0 ? 'bad' : 'good'}> {R.mood.d < 0 ? '▼' : '▲'}</span> : null}</Line>
    <Line label="Unhappy" w={9}><b class={R.unhappy ? 'bad' : undefined}>{R.unhappy}</b> of {R.size}</Line>
    <Line label="Hurt" w={9}><b class={R.hurt ? 'bad' : undefined}>{R.hurt}</b> out</Line>
    <Line label="Circles" w={9}>{R.circles.length}{hostile ? <span class="bad" title={hostile + ' led by a star'}> ({hostile} strong)</span> : null}</Line>
    <Line label="Heat" w={9}><b class={R.heatN ? 'bad' : undefined}>{R.heatN}</b> {R.heatN === 1 ? 'pair' : 'pairs'}</Line>
  </div>;
}

export function Backstage() {
  const S = G.S, B = E.backstage(S), N = E.people(S), st = office() as any, rows = boardRows(N);
  const sel = rows.some(r => r.id === st.who) ? st.who : (rows.length ? rows.slice().sort((a, b) => a.rank - b.rank)[0].id : null);
  const trouble = rows.filter(r => r.tone === 'bad').length, truck = N.rooms.find((r: any) => r.id === 'truck'), asking = truck ? truck.people.filter((x: any) => /^ask/.test(x.k) && !x.used).length : 0;
  const i = sel == null ? -1 : rows.findIndex(r => r.id === sel), selName = sel == null ? 'Their file' : S.w[sel].name;
  return <div class="onescreen">
    <h1 class="vh">Backstage</h1>
    <Desktop cls="bspage" t="backstage">
      <Win title="Who needs you tonight" right={rows.length + ' ' + (rows.length === 1 ? 'person' : 'people') + (trouble ? ' · ' + trouble + ' trouble' : '')} area="board" t="people">
        <Board rows={rows} sel={sel} />
      </Win>
      <Win title="Things to do" label="Things to do: action points left" right={<span data-t="bs-ap" title="action points left this week">{B.ap} of {B.max}</span>} area="acts" t="bs-things"><Things /></Win>
      <Win title={asking ? 'At your door: ' + asking + ' asking' : 'At your door'} tone={asking ? 'hot' : undefined} area="door" t="bs-door"><Door N={N} /></Win>
      <Win title="The room" area="room" t="bs-roomwin"><Room /></Win>
      <Win title={selName} right={i >= 0 ? (i + 1) + ' of ' + rows.length : ''} area="file" cls="bsfile" t="ppl-det">
        {sel != null ? <DossierBody key={sel + ':' + G.S.week + ':' + G.S.ap} id={sel} t="ppl-do" mem={2} fit /> : <Empty>Nobody is waiting on you. Pick somebody from the roster to see their file.</Empty>}
      </Win>
    </Desktop>
  </div>;
}
