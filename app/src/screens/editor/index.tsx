/* The World Editor: build a world from scratch, or change a copy of one, and share it. Reached from the title screen. */
import { useRef } from 'preact/hooks';
import { E } from '../../engine';
import { UNIS, ui, redraw, builtInUniverse, isBuiltIn, pref, plural } from '../../store';
import { onBack } from '../../input';
import { Btn, Panel, Field } from '../../kit';
import { es, world, keep, edit, look, note, report, freeId, openWorld, EdTab, TABS } from './state';
import { WrestlersPage } from './Wrestlers';
import { DelBtn } from './parts';
import { EdShell } from './shell';
import { WorldTab, ShareTab } from './World';
import { CompaniesTab, ShowsTab } from './Companies';
import { WrestlersTab } from './People';
import { BeltsTab, TeamsTab } from './Belts';
import { ScenesTab, keepScene, forgetScene } from './Scenes';
import { StoriesTab } from './Stories';
import { SceneStudio, fromWorld } from '../scene';
import { CreatePlayer, workerW } from '../player';
import { companyCard } from '../../kit/paperportrait';
import { SCENES, STILLS, SHOW_SCENES, MOVES, allScenes, copy } from '../../kit/scene';
import { threeMoves, finScene } from '../../kit/caw';

/* Back steps out one level at a time: the open record, then the world, then the title screen. */
onBack(() => {
  if (ui.scr !== 'editor') return false;
  const st = es();
  if (st.id && st.sel[st.tab]) { st.sel[st.tab] = null; redraw(); return true; }
  if (st.id) { keep(true); st.id = null; st.msg = ''; redraw(); return true; }
  ui.scr = 'title'; ui.mi = 0; redraw(); return true;
});

function addWorld(pkg: any) { const id = freeId(pkg.manifest.id); pkg.manifest.id = id; UNIS[id] = pkg; openWorld(id); keep(true); }
/** worlds read from the player's Workshop subscriptions (Steam version only) */
let ws: any[] = [];
function summary(pkg: any): string { const n = (pkg.promotions || []).length, w = (pkg.workers || []).length; return n + ' ' + plural(n, 'company', 'companies') + ', ' + w + ' ' + plural(w, 'wrestler'); }

function Home() {
  const st = es(), ids = Object.keys(UNIS), file = useRef<HTMLInputElement>(null), steam = (window as any).gpSteam;
  const onFile = (e: Event) => {
    const t = e.currentTarget as HTMLInputElement, fl = t.files && t.files[0]; if (!fl) return;
    const fr = new FileReader();
    fr.onload = () => { let pkg: any = null; try { pkg = JSON.parse(String(fr.result)); } catch (x) { pkg = null; }
      look(() => { if (!pkg || typeof pkg !== 'object' || Array.isArray(pkg)) note(fl.name + ' is not a world file.', true); else addWorld(E.edCopy(pkg, (pkg.manifest && pkg.manifest.name) || fl.name.replace(/\.json$/i, ''))); }); };
    fr.onerror = () => look(() => note('That file could not be read.', true));
    fr.readAsText(fl); t.value = '';
  };
  const exit = () => look(() => { ui.scr = 'title'; ui.mi = 0; });
  return <EdShell note={st.msg || 'Companies, shows, belts and wrestlers. Make them all, then play it or share it.'} bad={st.err} back={exit} backLabel="Title screen" t="ed-home">
    <div class="edbody"><div class="edbody-in">
    <Panel cls="mb4" title="Your worlds">
      {ids.length ? <ul class="list">{ids.map(id => { const pkg = UNIS[id], v = E.edCheck(pkg); return <li class="col" key={id}>
        <span><b>{pkg.manifest.name || id}</b> <span class="muted">{'·'} {summary(pkg)}</span><br />
          {v.ok ? <span class="good">Ready to play.</span> : <span class="bad">{v.errors} {plural(v.errors, 'problem')} to fix before it can be played.</span>}</span>
        <span class="row opts"><Btn kind="go" t="ed-open" d={{ id }} onClick={() => look(() => openWorld(id))}>Edit</Btn>
          <Btn kind="sm" t="ed-copy" d={{ id }} onClick={() => look(() => addWorld(E.edCopy(pkg)))}>Make a copy</Btn>
          <DelBtn id={'world:' + id} what="this world" onDelete={() => { delete UNIS[id]; keep(true); }} /></span></li>; })}</ul>
        : <p class="empty">No worlds yet. Start one below.</p>}
    </Panel>
    <Panel cls="mb4" title="Start a new world">
      <div class="row"><Field label="Name"><input type="text" id="ed-newname" data-t="ed-newname" value={st.newName} maxLength={40} placeholder="My world" onInput={e => { st.newName = (e.currentTarget as HTMLInputElement).value; }} /></Field></div>
      <div class="row mt2">
        <Btn kind="go" t="ed-new" onClick={() => look(() => { addWorld(E.edNew(st.newName)); st.newName = ''; })}>Start from scratch</Btn>
        <Btn t="ed-new-copy" onClick={() => look(() => { addWorld(E.edCopy(builtInUniverse(isBuiltIn(pref.uni) ? pref.uni : undefined), st.newName || undefined)); st.newName = ''; })}>Start from a copy of {builtInUniverse(isBuiltIn(pref.uni) ? pref.uni : undefined).manifest.name}</Btn>
        <Btn t="ed-new-territory" onClick={() => look(() => { addWorld(E.edQuick('territory', st.newName || undefined, Date.now() & 0xffff)); st.newName = ''; })}>A two-company territory</Btn>
        <Btn t="ed-new-nine" onClick={() => look(() => { addWorld(E.edQuick('nine', st.newName || undefined, Date.now() & 0xffff)); st.newName = ''; })}>A nine-company world of unknowns</Btn>
        <Btn t="ed-import" onClick={() => file.current && file.current.click()}>Open a world file</Btn>
        <input type="file" id="ed-file" ref={file} accept=".json,application/json" hidden onChange={onFile} />
      </div>
      <p class="muted mt2">From scratch gives you an empty world. A world needs at least two companies, each with a weekly show and six wrestlers, before it can be played.</p>
    </Panel>
    {steam && steam.workshopWorlds ? <Panel cls="mb4" title="From the Workshop">
      <div class="row"><Btn t="ed-ws-load" onClick={() => Promise.resolve(steam.workshopWorlds()).then((list: any[]) => look(() => { st.sel.ws = 'y'; ws = (list || []).filter(x => x && x.manifest); }), () => look(() => note('The Workshop could not be read.', true)))}>Look for worlds I have subscribed to</Btn></div>
      {st.sel.ws ? (ws.length ? <ul class="list mt2">{ws.map((pkg, i) => <li key={i}><span><b>{pkg.manifest.name}</b> <span class="muted">{'·'} {summary(pkg)}{pkg.manifest.author ? ' · by ' + pkg.manifest.author : ''}</span></span>
        <Btn kind="sm" t="ed-ws-add" d={{ v: i }} onClick={() => look(() => addWorld(E.edCopy(pkg, pkg.manifest.name)))}>Add to my worlds</Btn></li>)}</ul> : <p class="empty mt2">No subscribed worlds found.</p>) : null}
    </Panel> : null}
    <div class="row"><Btn t="ed-exit" onClick={exit}>{'◄'} Back to the title screen</Btn></div>
    </div></div>
  </EdShell>;
}

function Open() {
  const st = es(), pkg = world(), v = report();
  const body = st.tab === 'world' ? <WorldTab /> : st.tab === 'companies' ? <CompaniesTab /> : st.tab === 'shows' ? <ShowsTab /> : st.tab === 'belts' ? <BeltsTab /> : st.tab === 'wrestlers' ? <WrestlersTab /> : st.tab === 'teams' ? <TeamsTab /> : st.tab === 'scenes' ? <ScenesTab /> : st.tab === 'stories' ? <StoriesTab /> : <ShareTab />;
  const back = () => look(() => { if (st.sel[st.tab]) st.sel[st.tab] = null; else { keep(true); st.id = null; st.msg = ''; } });
  return <EdShell tab={st.tab} note={st.msg || TIPS[st.tab]} bad={st.err} back={back} backLabel={st.sel[st.tab] ? 'Back to the list' : 'All worlds'} t="ed-open"
    main={v.ok ? <Btn kind="go" cls="pkey" t="ed-play-key" onClick={() => look(() => { st.tab = 'share'; })}>CHECK AND SHARE</Btn> : <Btn kind="go" cls="pkey" t="ed-fix-key" onClick={() => look(() => { st.tab = 'share'; })}>{v.errors + ' TO FIX'}</Btn>}>
    <div class="edbody" key={st.tab}><div class="edbody-in">{body}</div></div>
  </EdShell>;
}
/** What each tab is for, on the note strip until there is something to say. */
const TIPS: Record<string, string> = {
  world: 'The world’s name, when it starts, and its lists of names. Work left to right along the tabs.',
  companies: 'Each company: its name, size, model, owner, money, cities and logo.',
  shows: 'Weekly shows and each company’s twelve big events.',
  belts: 'Every belt: who holds it, how big a prize it is, and its design in Create a Belt.',
  wrestlers: 'Pick a wrestler on the list, or add one.',
  teams: 'Tag teams and stables, and who gets on with whom.',
  scenes: 'Scenes made for this world: entrances, moves, stills and more.',
  stories: 'Your own promos and angles: who is in them, the scene they play, what they do. A booker can put them on the card.',
  share: 'Every problem in plain words, then play the world or share it.',
};

export function Editor() {
  const st = es();
  if (st.id && !UNIS[st.id]) st.id = null;
  if (st.id && st.player) {   // Create a Player, full screen, on a wrestler in the world being edited
    const pkg = UNIS[st.id], wk = (pkg.workers || []).find((x: any) => x.id === st.player);
    if (wk) { const nm = pkg.manifest.name || 'this world';
      const con = E.edContract(pkg, wk.id), pr = con && pkg.promotions.find((x: any) => x.id === con.promotion_id), bi = pr && pr.brands && con.brand ? pr.brands.findIndex((b: any) => b.id === con.brand) : -1;
      const card = pr ? companyCard(E.logoOf({ logo: pr.logo, model: pr.model, name: pr.name, full: pr.full_name }), bi) : companyCard(null);
      return <CreatePlayer key={st.player + (st.attire ? ':a' : '')} world={nm} w={workerW(wk)} had={wk.look || null} attire={!!st.attire} card={card}
        onSave={lk => { let ok = false; edit(() => { ok = E.edSetLook(world(), wk.id, lk); const sx = lk.physical_attributes && lk.physical_attributes.sex; if (ok && sx && wk.gender !== sx) wk.gender = sx; }); return { ok, msg: ok ? (lk.name || wk.ring_name) + ' is kept in ' + nm + '. Every scene in the game now draws them like this.' : 'That could not be kept.' }; }}
        onForget={() => { edit(() => { E.edRemoveLook(world(), wk.id); }); return { ok: true, msg: wk.ring_name + ' is drawn by the game again.' }; }} onDone={() => look(() => { st.player = null; st.attire = false; })}
        scenes={E.edScenes(pkg)} onNewEntrance={lk => {   // keep the wrestler, then Create a Scene on a copy of their entrance, with them in it
          edit(() => { E.edSetLook(world(), wk.id, lk); });
          const all = E.edScenes(pkg).concat(SCENES), src = all.find((x: any) => x.id === lk.entrance && x.when === 'entrance') || SCENES.find(x => x.when === 'entrance')!, sc = copy(src);
          sc.id = 'scene-' + Date.now().toString(36); sc.name = ((lk.name || wk.ring_name) + ' comes out').slice(0, 32);
          look(() => { st.player = null; st.scene = sc.id; st.sceneStart = sc; st.sceneFor = { who: wk.id, cast: wk.ring_name }; });
        }} onNewMove={(lk, fi) => {   // keep the wrestler, then Create a Move on a copy of that move, with them in it
          edit(() => { E.edSetLook(world(), wk.id, lk); });
          const fins = threeMoves({ name: wk.ring_name }, lk.finishing_moves), fm = fins[fi], src = allScenes(E.edScenes(pkg)).find((x: any) => x.id === finScene(fm)) || MOVES[0], sc = copy(src);
          sc.id = 'scene-' + Date.now().toString(36); sc.name = ((fm && fm.name) || 'A move').slice(0, 32); sc.when = 'move'; sc.still = false;
          look(() => { st.player = null; st.scene = sc.id; st.sceneStart = sc; st.sceneMode = 'move'; st.sceneFor = { who: wk.id, cast: wk.ring_name, fin: fi }; });
        }} />; }
  }
  if (st.id && st.scene) {   // Create a Scene, full screen, on the world being edited
    const pkg = UNIS[st.id], mine = E.edScenes(pkg), start = st.scene === '__new' ? undefined : (mine.find((x: any) => x.id === st.scene) || (st.sceneStart && st.sceneStart.id === st.scene ? st.sceneStart : null) || SCENES.concat(STILLS, SHOW_SCENES, MOVES).find(x => x.id === st.scene));
    const R = fromWorld(pkg), fr = st.sceneFor, castA = fr ? R.find(w => w.name === fr.cast) : undefined;
    // a custom entrance made from Create a Player: saving it picks it for them, and Done goes back to them
    return <SceneStudio key={st.scene + ':' + (st.sceneMode || '')} mode={st.sceneMode || undefined} world={pkg.manifest.name || 'this world'} roster={R} saved={mine} start={start} blank={st.scene === '__new'} castA={castA ? castA.id : undefined}
      backdrops={E.edBackdrops(pkg)} onSaveBg={b => { let okd = false; edit(() => { okd = E.edSetBackdrop(world(), b); }); return okd; }}
      onSave={sc => { const ok = keepScene(sc); if (ok && fr && fr.fin == null && sc.when === 'entrance') edit(() => { const lk = E.edLook(world(), fr.who); if (lk) { lk.entrance = sc.id; E.edSetLook(world(), fr.who, lk); } });
        if (ok && fr && fr.fin != null) edit(() => { const lk = E.edLook(world(), fr.who); if (lk) { const fins = threeMoves({ name: fr.cast }, lk.finishing_moves); if (fins[fr.fin!]) { fins[fr.fin!].preview_pose_id = sc.id; lk.finishing_moves = fins; E.edSetLook(world(), fr.who, lk); } } });   // a custom move becomes the move's picture
        return ok; }}
      onForget={forgetScene} onDone={() => look(() => { st.scene = null; st.sceneStart = null; st.sceneMode = null; if (fr) { st.player = fr.who; st.sceneFor = null; } })} />;
  }
  if (st.id && st.tab === 'wrestlers') return <WrestlersPage />;   // the first page in the paper look (rule 2a): Create a Wrestler at its heart
  return st.id ? <Open /> : <Home />;
}
