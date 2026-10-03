/* Before the game: boot sequence, title card, Select Promotion, the first-day screens, and the Help and Options windows. */
import { ComponentChildren } from 'preact';
import { useEffect, useRef } from 'preact/hooks';
import { E } from '../../engine';
import { G, ui, pref, Modal, VER, UNIS, saveUnis, savePrefs, setUniverse, builtInUniverse, basePackage, cut, loadSave, cash, view, redraw, openModal, plural, slice } from '../../store';
import { HOT, pageName } from '../../nav';
import { autoScreen, skipBoot, onKey } from '../../input';
import { startGame, continueGame, loadSaveText, startChallenge, startScenario, isoWeekId } from '../../flow';
import { Btn, Panel, Head, Sel, Field, TextBox, Window, Data, dataAttrs } from '../../kit';
import { MusicBtn } from '../../shell/Frame';
import { ModelCard } from '../../shared/model';
import { SFX } from '../../sfx';

/* ---------- boot ---------- */
function bootLines(): string[] { const info = E.universe(); return ['LOADING ROSTER... ' + info.workers + ' WORKERS', 'INITIALIZING BOOKING SYSTEM...', 'CHECKING MEMORY... 640K OK', 'READING SAVE... ' + (loadSave() ? 'FOUND' : 'NONE')]; }
export const BOOT_STEPS = 5;
export function Boot() {
  const L = bootLines(), n = ui.boot ? ui.boot.step : 0, W = 22, f = Math.min(W, Math.round(W * n / BOOT_STEPS));
  return <div class="bootscr" data-t="boot-skip" onClick={skipBoot}><div class="bootin">
    <p class="bt">GORILLA POSITION ENGINE <span>v</span>{VER}</p>
    <p class="rule" aria-hidden="true">{'─'.repeat(26)}</p>
    {L.map((l, k) => <p style={{ visibility: k < n ? 'visible' : 'hidden' }}>{l}</p>)}
    <p class="bar" role="img" aria-label="Loading">[<span>{'█'.repeat(f)}</span><i>{'░'.repeat(W - f)}</i>]</p>
    <p class="skip">Press any key</p>
  </div></div>;
}

/* ---------- the list menus of the start screens ---------- */
interface MenuItem { t: string; d?: Data; cls?: string; label: ComponentChildren; pick: () => void }
let menuItems: MenuItem[] = [];
function MenuList(p: { items: MenuItem[] }) {
  const cur = Math.max(0, Math.min(p.items.length - 1, ui.mi || 0)); ui.mi = cur; menuItems = p.items;
  return <div class="dmenu" role="menu">{p.items.map((it, k) =>
    <button type="button" class={'mi' + (k === cur ? ' on' : '') + (it.cls ? ' ' + it.cls : '')} role="menuitem" data-i={k} {...dataAttrs(it.t, it.d)}
      onClick={it.pick} onMouseEnter={() => { if (ui.mi !== k) view(() => { ui.mi = k; }); }} onFocus={() => { if (ui.mi !== k) view(() => { ui.mi = k; }); }}>{it.label}</button>)}</div>;
}
onKey(e => {
  if (G.S || ui.modal || ui.setup || ui.boot || ui.scr === 'editor') return false;
  const tag = (e.target as HTMLElement).tagName; if (tag === 'SELECT' || tag === 'INPUT') return false;
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { const n = menuItems.length || 1; view(() => { ui.mi = ((ui.mi || 0) + (e.key === 'ArrowDown' ? 1 : n - 1)) % n; }); const el = document.querySelectorAll('.dmenu .mi')[ui.mi] as HTMLElement; if (el) el.focus(); return true; }
  if ((e.key === 'Enter' || e.key === ' ') && (tag !== 'BUTTON' || (e.target as HTMLElement).classList.contains('mi'))) { const it = menuItems[ui.mi]; if (it) { it.pick(); return true; } }
  return false;
});
const toScreen = (scr: 'title' | 'select' | 'editor') => view(() => { ui.scr = scr; ui.mi = 0; ui.setup = null; window.scrollTo(0, 0); });
export function StartMenu() {
  return <nav class="menu startmenu" aria-label="Menu">
    <button type="button" data-t="scr" data-v="title" onClick={() => toScreen('title')}><u>T</u>itle</button>
    <button type="button" data-t="scr" data-v="select" onClick={() => toScreen('select')}><u>F</u>ederations</button>
    <button type="button" data-t="scr" data-v="editor" onClick={() => toScreen('editor')}><u>W</u>orld Editor</button>
    <button type="button" data-t="options" onClick={() => openModal({ kind: 'options' })}><u>O</u>ptions</button>
    <button type="button" data-t="help" onClick={() => openModal({ kind: 'help' })}><u>H</u>elp</button>
    <span class="sp" />
    <MusicBtn />
  </nav>;
}

/* ---------- the weekly challenge: this week's world, and a way to check a friend's code ---------- */
function ChallengeBody() {
  const I = E.challengeInfo(isoWeekId(new Date())), st = slice<{ code: string; msg: string; ok: boolean }>('chalcode', () => ({ code: '', msg: '', ok: true }));
  const check = (v: string) => view(() => { st.code = v; const r = v.trim() ? E.challengeRead(v) : null; st.msg = r ? r.text : ''; st.ok = !r || r.ok; });
  if (!I) return <p class="bad">The challenge could not be set up.</p>;
  return <>
    <p>This week ({I.id}) everyone gets the same world: <b>{I.name}</b>, the same shows, the same roster. You have <b>{I.weeks} weeks</b>. Your score comes from how your shows beat expectations, how popular the company becomes, how the cash goes and the feuds you finish.</p>
    <p class="muted mt1">When the twelve weeks are up you get a short code to copy and share. Anyone can paste it below to see the score. No server, no sign-in.</p>
    <div class="row mt2"><Btn kind="go" t="chal-play" onClick={startChallenge}>Play this week{'’'}s challenge</Btn></div>
    <p class="eyebrow mt3">Check a code</p>
    <TextBox id="chal-code" t="chal-code" label="Challenge code" placeholder="EWF-2026W40-CC-S5" value={st.code} onInput={check} />
    {st.msg ? <p class={st.ok ? 'good mt1' : 'bad mt1'}>{st.msg}</p> : null}
  </>;
}

/* ---------- scenarios: a problem and a deadline ---------- */
function ScenarioBody() {
  return <>
    <p class="muted">Each scenario drops you into a company with a problem and a deadline. When the time is up you get a result.</p>
    <ul class="list mt2">{E.SCENARIOS.map((s: any) => <li class="col"><span><b>{s.n}</b> <span class="muted">{'·'} {s.weeks} weeks</span><br /><span class="muted">{s.d}</span></span>
      <span class="row opts"><Btn kind="sm" t="scn-play" d={{ v: s.id }} onClick={() => startScenario(s.id)}>Play</Btn></span></li>)}</ul>
  </>;
}

/* ---------- title card ---------- */
export function Title() {
  const sv = loadSave(), items: MenuItem[] = [];
  if (sv) items.push({ t: 'continue', pick: continueGame, label: <><span class="ab">CONTINUE</span><span class="st">{sv.booker.name} at {sv.promos[sv.player].name} {'·'} week {sv.week}</span></> });
  items.push({ t: 'scr', d: { v: 'select' }, pick: () => toScreen('select'), label: <><span class="ab">NEW GAME</span><span class="st">Pick a promotion or create your own</span></> });
  items.push({ t: 'scenarios', pick: () => openModal({ kind: 'info', title: 'Scenarios', body: () => <ScenarioBody /> }), label: <><span class="ab">SCENARIOS</span><span class="st">A problem, a deadline, a result</span></> });
  items.push({ t: 'challenge', pick: () => openModal({ kind: 'info', title: 'The weekly challenge', body: () => <ChallengeBody /> }), label: <><span class="ab">WEEKLY CHALLENGE</span><span class="st">Twelve weeks, the same world for everyone, one score</span></> });
  items.push({ t: 'editor', pick: () => toScreen('editor'), label: <><span class="ab">WORLD EDITOR</span><span class="st">Build your own world: companies, shows, belts, wrestlers</span></> });
  items.push({ t: 'options', pick: () => openModal({ kind: 'options' }), label: <><span class="ab">OPTIONS</span><span class="st">Sound, text size, screen</span></> });
  return <div class="crt"><StartMenu /><div class="start">
    <h1 class="sr">Elite Wrestling Federation 9000</h1>
    <div class="logo-box"><i class="tl" /><i class="tr" /><i class="bl" /><i class="br" />
      <svg class="logo-main" aria-hidden="true" viewBox="0 0 500 128"><text class="sh" x="258" y="114" textLength="480" lengthAdjust="spacingAndGlyphs">EWF 9000</text><text x="250" y="106" textLength="480" lengthAdjust="spacingAndGlyphs">EWF 9000</text></svg>
      <p class="logo-sub" aria-hidden="true">Elite Wrestling Federation</p>
    </div>
    <p class="lede c">Whatcha gonna do, booker man?</p>
    <div class="dbox sm"><MenuList items={items} /></div>
  </div><div class="status c"><span>Gorilla Position Engine v{VER}</span><span class="opt">|</span><span>(C) 1997 Elite Software</span></div></div>;
}

/* ---------- select promotion ---------- */
const newFed = () => ({ name: '', short: '', show: '', title: '', size: 'regional', region: 'midwest', model: 'classic', style: 'merit', roots: 'tradition', pledge: 'chance', women: true });
function pick(pid: string) { view(() => { ui.setup = { pid, name: (ui.setup && ui.setup.name) || '', diff: (ui.setup && ui.setup.diff) || 'normal', fed: newFed() }; window.scrollTo(0, 0); }); }
function importUniverse(text: string, fname: string) {
  let pkg: any;
  try { pkg = JSON.parse(text); } catch (e: any) { openModal({ kind: 'info', title: 'Universe not loaded', body: () => <><p class="bad">{fname} is not valid JSON.</p><p class="muted mt1">{String(e.message)}</p></> }); return; }
  let v = E.validateUniverse(pkg);
  const name = pkg && pkg.manifest && pkg.manifest.name ? pkg.manifest.name : fname;
  const text2 = (v.ok ? 'OK' : 'FAILED') + ': ' + name + '\n' + v.errors.map((x: any) => 'ERROR ' + x.at + ': ' + x.msg).concat(v.warnings.map((x: any) => 'WARNING ' + x.at + ': ' + x.msg)).join('\n');
  if (v.ok) { UNIS[pkg.manifest.id] = pkg; const kept = saveUnis(); v = setUniverse(pkg.manifest.id); if (!kept) v.warnings.push({ at: 'storage', msg: 'This browser could not store the package, so it will need importing again next time.' }); }
  openModal({ kind: 'unireport', v, name, text: text2 });
}
export function Select() {
  const info = E.universe(), ids = Object.keys(UNIS), cur = pref.uni && UNIS[pref.uni] ? pref.uni : 'public_domain', file = useRef<HTMLInputElement>(null);
  const items: (MenuItem & { promo?: any })[] = info.promotions.map((d: any) => ({ t: 'pick', d: { v: d.id }, promo: d, pick: () => pick(d.id),
    label: <><span class="ab">{d.name}</span><span class="fn">{d.full ? '- ' + d.full : ''}</span><span class="st">{(E.MODELS[d.model] || E.MODELS.classic).n} {'·'} Pop {d.image} {'·'} {cash(d.cash)} {'·'} {info.count[d.id] || 0} workers</span></> }));
  items.push({ t: 'pick', d: { v: 'OWN' }, cls: 'new', pick: () => pick('OWN'), label: <span class="fn">CREATE NEW FEDERATION</span> });
  const d = (items[Math.max(0, Math.min(items.length - 1, ui.mi || 0))] || items[0]).promo;
  const onFile = (e: Event) => { const t = e.currentTarget as HTMLInputElement, fl = t.files && t.files[0]; if (!fl) return; const fr = new FileReader(); fr.onload = () => importUniverse(String(fr.result), fl.name); fr.onerror = () => openModal({ kind: 'info', title: 'Universe not loaded', body: () => <p class="bad">That file could not be read.</p> }); fr.readAsText(fl); t.value = ''; };
  return <div class="crt"><StartMenu /><div class="start">
    <div class="selrow"><div class="dbox"><h1 class="dt">Select promotion</h1><MenuList items={items} /></div>
    <Panel cls="det mb4" title={d ? d.name : 'New'} live>
      {d ? <><p><b>{d.full || d.name}.</b> {d.blurb}</p><p class="kv"><span>Popularity <b>{d.image}</b></span><span>Cash <b>{cash(d.cash)}</b></span><span>Roster <b>{info.count[d.id] || 0}</b></span><span>Weekly shows <b>{d.shows.length}</b></span><span>Owner <b>{d.owner.name}</b></span></p><div class="mt1"><span class="eyebrow">How it is run</span><ModelCard id={d.model} short /></div></>
        : <p><b>Create your own federation.</b> Name it, pick its size and house style, and start as owner and booker with a roster of unknowns and every title vacant.</p>}
    </Panel></div>
    <Panel cls="mb3" title="Universe">
      <div class="row">
        <Sel id="uni-sel" label="Universe" value={cur} onChange={v => view(() => { setUniverse(v); ui.setup = null; ui.mi = 0; })}
          options={[['public_domain', builtInUniverse().manifest.name + ' (built in)'], ...ids.map(id => [id, UNIS[id].manifest.name + ' (yours)'] as [string, string])]} />
        <Btn t="uni-import" onClick={() => file.current && file.current.click()}>Import a universe file</Btn>
        <Btn t="uni-editor" onClick={() => toScreen('editor')}>World Editor</Btn>
        <Btn t="uni-cut" onClick={() => openModal({ kind: 'unicut' })}>Choose the companies in this game</Btn>
        {cur !== 'public_domain' && <Btn t="uni-remove" onClick={() => view(() => { delete UNIS[pref.uni]; saveUnis(); setUniverse('public_domain'); ui.mi = 0; })}>Remove this one</Btn>}
        <input type="file" id="uni-file" ref={file} accept=".json,application/json" hidden onChange={onFile} />
      </div>
      <p class="muted mt2">{info.desc} {info.workers} workers, {info.promotions.length} promotions. Starts in {info.start}.{info.author ? ' By ' + info.author + '.' : ''}</p>
      {cut.out.length ? <p class="hl mt1" data-t="uni-cut-note">{info.promotions.length} of {basePackage().promotions.length} companies are in this game. {cut.gone ? 'The wrestlers of the others have left the world.' : 'The wrestlers of the others are free agents.'}</p> : null}
      <p class="muted mt1">Every roster is a universe package: a file anyone can make in the World Editor and share. The built-in one is made of history, myth and fiction published before 1929.</p>
    </Panel>
  </div><div class="status"><span class="opt">Arrows: move</span><span class="opt">Enter: select</span><span>Esc: back</span></div></div>;
}

/* ---------- leave companies out of a new game ---------- */
function CutWindow() {
  const base = basePackage(), all: any[] = base.promotions, st = slice<{ msg: string }>('unicut', () => ({ msg: '' })), kept = all.length - cut.out.length;
  const apply = (out: string[], gone: boolean) => view(() => {
    const was = { out: cut.out.slice(), gone: cut.gone }; cut.out = out; cut.gone = gone;
    const v = setUniverse(pref.uni || 'public_domain', true);
    if (cut.out.length !== out.length) { cut.out = was.out; cut.gone = was.gone; setUniverse(pref.uni || 'public_domain', true); st.msg = 'That would leave a world the game cannot play' + (v && v.errors && v.errors[0] ? ': ' + v.errors[0].msg : '') + '.'; }
    else st.msg = '';
    ui.mi = 0; ui.setup = null;
  });
  const toggle = (id: string) => { const isOut = cut.out.indexOf(id) >= 0; if (!isOut && kept <= 2) { view(() => { st.msg = 'A game needs at least two companies.'; }); return; } apply(isOut ? cut.out.filter(x => x !== id) : cut.out.concat([id]), cut.gone); };
  return <Window title="Companies in this game" wide ok="Done">
    <p>Leave out the companies you do not want. A game needs at least two. <b>{kept} of {all.length}</b> are in.</p>
    {st.msg ? <p class="bad mt1" role="status" data-t="cut-msg">{st.msg}</p> : null}
    <ul class="list mt1">{all.map(p => { const isOut = cut.out.indexOf(p.id) >= 0; return <li key={p.id}>
      <span><b>{p.name}</b>{p.full_name ? ' - ' + p.full_name : ''} <span class="muted">{'·'} Popularity {p.popularity}</span></span>
      <Btn kind="sm" on={!isOut} t="cut-toggle" d={{ v: p.id }} onClick={() => toggle(p.id)}>{isOut ? 'Left out' : 'In the game'}</Btn></li>; })}</ul>
    <p class="eyebrow mt2">The wrestlers of a company you leave out</p>
    <div class="row opts"><Btn kind="sm" on={!cut.gone} t="cut-gone" d={{ v: 0 }} onClick={() => apply(cut.out, false)}>Become free agents</Btn><Btn kind="sm" on={cut.gone} t="cut-gone" d={{ v: 1 }} onClick={() => apply(cut.out, true)}>Leave the world too</Btn></div>
    <p class="muted mt1">{cut.gone ? 'They are gone with their company. The world is smaller.' : 'Any company can sign them. A small world gets a very deep pool of free agents.'}</p>
    {cut.out.length ? <div class="row mt2"><Btn kind="sm" t="cut-reset" onClick={() => apply([], false)}>Put every company back</Btn></div> : null}
  </Window>;
}

/* ---------- first day, or create a federation ---------- */
function PickRow(p: { k: string; table: Record<string, any>; cur: string; label: string; set: (v: string) => void }) {
  return <><p class="eyebrow">{p.label}</p>
    <div class="row opts">{Object.keys(p.table).map(id => <Btn kind="sm" on={id === p.cur} t="setup-set" d={{ k: p.k, v: id }} onClick={() => view(() => p.set(id))}>{p.table[id].n}</Btn>)}</div>
    <p class="muted mt1 mb2">{p.table[p.cur].d || ''}</p></>;
}
/** The long explanation lives behind a button so the first-day screen stays short. */
/* ---------- the glossary: the words the game uses ---------- */
const WORDS: [string, string, string][] = [
  ['overness', 'Overness', 'How much the crowd cares about a wrestler, from 0 to 100. The higher it is, the more a wrestler draws and the more their wins and losses matter.'],
  ['heat', 'Heat', 'How hot a rivalry is, from 0 to 100. Heat builds from promos, ambushes and matches between the two. A feud at 60 or more is ready for a big finish.'],
  ['workrate', 'Work rate', 'How good a wrestler is in the ring: brawling, technical skill and speed together. It lifts match quality, but the crowd also needs a reason to care.'],
  ['momentum', 'Momentum', 'Whether a wrestler is hot or cold right now. Wins and big moments raise it, losses lower it. A hot wrestler gets the benefit of the doubt on the night.'],
  ['bp', 'Booking power', 'What you spend to call a finish yourself. The owner grants some each week. The favourite costs 1, an underdog 2, a long shot 3, and a title change 1 more.'],
  ['prestige', 'Prestige', 'How much a title is worth, from 10 to 100. Good title matches raise it. A title with high prestige adds to the matches that carry it.']
];
function Glossary(p: { m: Modal }) {
  useEffect(() => { const el = p.m.term && document.getElementById('gl-' + p.m.term); if (el) el.scrollIntoView({ block: 'nearest' }); }, []);
  return <Window title="Glossary" ok="Got it">
    <dl class="gloss">{WORDS.map(w => <div key={w[0]} id={'gl-' + w[0]} class={p.m.term === w[0] ? 'on' : undefined}><dt><b>{w[1]}</b></dt><dd>{w[2]}</dd></div>)}</dl>
  </Window>;
}
/** A word that opens the glossary at its entry. */
function Term(p: { id: string; children: any }) { return <button type="button" class="lnk" data-t="term" data-id={p.id} onClick={() => openModal({ kind: 'glossary', term: p.id })}>{p.children}</button>; }
function HowBtn(p: { body: () => any }) { return <div class="row mb4"><Btn t="how" onClick={() => openModal({ kind: 'info', title: 'How it works', body: p.body })}>How it works</Btn></div>; }
function DiffPanel() {
  const s = ui.setup!, dp = s.dpart || { money: 1, inj: 1, ego: 1, rival: 1 }, W = ['Easier', 'As set', 'Harder'];
  return <Panel cls="mb4" title="Difficulty">
    <PickRow k="diff" table={E.DIFF} cur={s.diff || 'normal'} label="How hard a job is it?" set={v => { s.diff = v; }} />
    <p class="eyebrow">Iron man mode</p>
    <div class="row opts"><Btn kind="sm" on={!s.iron} t="iron" d={{ v: 0 }} onClick={() => view(() => { s.iron = false; })}>Off</Btn><Btn kind="sm" on={!!s.iron} t="iron" d={{ v: 1 }} onClick={() => view(() => { s.iron = true; })}>On</Btn></div>
    <p class="muted mt1 mb2">{s.iron ? 'One save, written after every action. You cannot copy it out, paste another in, or load it again once you are fired or broke.' : 'Off: the usual way to play. You can move a save between devices.'}</p>
    <p class="eyebrow">Fine tune (optional)</p>
    {Object.keys(E.DPART).map((k: string) => <div class="row opts" key={k}><span class="muted" style={{ minWidth: '18ch' }}>{E.DPART[k]}</span>{W.map((w, i) => <Btn kind="sm" on={dp[k] === i} t="dpart" d={{ k, v: i }} onClick={() => view(() => { s.dpart = Object.assign({ money: 1, inj: 1, ego: 1, rival: 1 }, s.dpart || {}); s.dpart[k] = i; })}>{w}</Btn>)}</div>)}
  </Panel>;
}
function Begin(p: { label: string; block?: string }) {
  const s = ui.setup!;
  const go = () => startGame(s.pid === 'OWN' ? null : s.pid, { name: s.name, diff: s.diff, fed: s.pid === 'OWN' ? s.fed : null, dpart: s.dpart || null, iron: !!s.iron });
  return <div class="row"><label class="row">Your name <TextBox id="bname" value={s.name} max={24} placeholder="The Booker" width="24ch" onInput={v => { s.name = v; }} /></label>
    <Btn kind="go" t="begin" disabled={!!p.block} onClick={go}>{p.label}</Btn><Btn t="unpick" onClick={() => view(() => { ui.setup = null; ui.scr = 'select'; })}>Back</Btn></div>;
}
function FedSetup() {
  const s = ui.setup!, f = s.fed, z = E.FED_SIZE[f.size];
  const ini = String(f.short || '').trim().toUpperCase(), used = ini && E.universe().promotions.find((p: any) => String(p.id).toUpperCase() === ini || String(p.name).toUpperCase() === ini);
  const taken = used ? 'The initials ' + ini + ' already belong to ' + (used.full || used.name) + '. Pick others.' : '';
  const inp = (k: string, label: string, max: number, ph: string, w?: number) => <Field label={label}><TextBox id={'fed-' + k} value={f[k] || ''} max={max} placeholder={ph} width={(w || 30) + 'ch'} onInput={v => { f[k] = v; if (k === 'short') redraw(); }} /></Field>;
  return <div class="crt"><StartMenu /><div class="start">
    <Head eyebrow="Create a federation" title="Your name on the door" />
    <Panel cls="mb4" title="The name"><div class="editor plain">{inp('name', 'Full name', 40, 'Elite Wrestling Federation')}{inp('short', 'Initials (up to 6)', 6, 'EWF', 10)}{inp('show', 'Weekly TV show', 28, 'Friday Night Fury')}{inp('title', 'Top title', 28, 'World Title')}</div></Panel>
    <Panel cls="mb4" title="The company">
      <PickRow k="size" table={E.FED_SIZE} cur={f.size} label="How big do you start?" set={v => { f.size = v; }} />
      <p class="muted mb2">Popularity {z.image}, {cash(z.cash)} in the bank, a roster of {z.roster} unknowns.</p>
      <PickRow k="region" table={E.FED_REGION} cur={f.region} label="Home territory" set={v => { f.region = v; }} />
      {E.MODELS[f.model] && E.MODELS[f.model].gender ? <p class="muted">An all-women company: every division is a women{'’'}s division.</p> : <>
        <p class="eyebrow">Women{'’'}s division</p>
        <div class="row opts"><Btn kind="sm" on={!!f.women} t="setup-set" d={{ k: 'women', v: 1 }} onClick={() => view(() => { f.women = true; })}>Yes</Btn><Btn kind="sm" on={!f.women} t="setup-set" d={{ k: 'women', v: '' }} onClick={() => view(() => { f.women = false; })}>No</Btn></div></>}
    </Panel>
    <Panel cls="mb4" title="How it is run">
      <p class="eyebrow">What kind of company is it?</p>
      <div class="row opts">{Object.keys(E.MODELS).map(id => <Btn kind="sm" on={id === (f.model || 'classic')} t="setup-set" d={{ k: 'model', v: id }} onClick={() => view(() => { f.model = id; })}>{E.MODELS[id].n}</Btn>)}</div>
      <div class="mt1"><ModelCard id={f.model} /></div>
    </Panel>
    <Panel cls="mb4" title="The house style">
      <PickRow k="style" table={E.STYLES} cur={f.style} label="What wins matches here?" set={v => { f.style = v; }} />
      <PickRow k="roots" table={E.ROOTS} cur={f.roots} label="What does your crowd expect?" set={v => { f.roots = v; }} />
      <PickRow k="pledge" table={E.PLEDGE} cur={f.pledge} label="What do you promise the locker room?" set={v => { f.pledge = v; }} />
    </Panel>
    <DiffPanel />
    <HowBtn body={() => <><p>You are owner and booker from day one. Nobody grants you booking power and nobody can fire you, but the money is yours to lose.</p><p class="mt1">Every title starts vacant. Run a tournament from the Titles page to crown your first champion.</p></>} />
    {taken ? <p class="bad mb2">{taken}</p> : null}
    <Begin label="Open the doors" block={taken} />
  </div><div class="status"><span>Name your federation and open the doors</span></div></div>;
}
export function Setup() {
  const s = ui.setup!;
  if (s.pid === 'OWN') return <FedSetup />;
  const d = E.universe().promotions.find((p: any) => p.id === s.pid), o = d.owner;
  return <div class="crt"><StartMenu /><div class="start">
    <Head eyebrow={d.full || d.name} title="Your first day" />
    <Panel cls="mb4" title="The owner">
      <p><b>{o.name}</b> owns {d.name} and has hired you to book it.</p>
      <p class="mt1">House style: <b>{E.STYLES[o.style].n}.</b> {E.STYLES[o.style].d} {o.name} is happiest with {E.STYLES[o.style].likes}.</p>
      <p class="mt1">The crowd: <b>{E.ROOTS[o.roots].n}.</b> {E.ROOTS[o.roots].d}</p>
      <p class="mt1">The locker room was promised: <b>{E.PLEDGE[o.pledge].n}.</b> {E.PLEDGE[o.pledge].d}</p>
    </Panel>
    <Panel cls="mb4" title="How this company is run"><ModelCard id={d.model} /></Panel>
    <HowBtn body={() => <>
      <p>You set the card. Every match has odds, and the odds decide the winner on the night.</p>
      <p class="mt1">Each week {o.name} grants you <b>booking power</b>. Spend it to call a finish: 1 point for the favourite, 2 for an underdog, 3 for a long shot, and 1 more to change a title.</p>
      <p class="mt1">Good shows and met directives raise the owner{'’'}s trust, which raises your allowance. Lose that trust and you are out. Earn enough of it and the company is yours.</p>
    </>} />
    <p class="muted mb2">Words used in the game: <Term id="overness">overness</Term>, <Term id="heat">heat</Term>, <Term id="workrate">work rate</Term>, <Term id="momentum">momentum</Term>, <Term id="bp">booking power</Term>, <Term id="prestige">prestige</Term>.</p>
    <DiffPanel />
    <Begin label="Take the job" />
  </div><div class="status"><span>Enter a name and take the job</span></div></div>;
}

/* ---------- windows: help, options, the universe import report ---------- */
function Help() {
  return <Window title="Help" ok="Got it">
    <p><b>The job.</b> Book the shows, answer the inbox, close the week. Shows that beat what the crowd expects raise your popularity.</p>
    <ul class="list mt1">
      <li><span><b>Office.</b> The desk and your career. It opens on what needs doing before the show.</span></li>
      <li><span><b>Booking.</b> Build the card. Spend booking power to call a finish.</span></li>
      <li><span><b>Roster.</b> Wrestlers, the locker room, titles and free agents.</span></li>
      <li><span><b>Stories.</b> Rivalries, history and what the fans say.</span></li>
      <li><span><b>Manage.</b> Every choice: operations, house rules, deals.</span></li>
      <li><span><b>Company.</b> Information only: overview, finances, the world.</span></li>
    </ul>
    <p class="mt1"><b>Attempts.</b> Some actions may fail. Each one shows its chance, what helps and what hurts.</p>
    <p class="mt1"><b>Names.</b> Select any name or title to open a pop-up. Back steps out, Close shuts them all.</p>
    <p class="mt1"><b>World Editor.</b> On the title screen. Build your own world of companies, shows, belts and wrestlers, then play it or share it.</p>
    <p class="mt1"><b>Your company.</b> Each company runs on a model that changes what its crowd rewards and where its money comes from. Read it on the Company overview.</p>
    <p class="eyebrow mt2">Keys</p>
    <div class="keys">{Object.keys(HOT).map(k => <span><b>{k.toUpperCase()}</b> {pageName(HOT[k])}</span>)}<span><b>Enter</b> next line of a show</span><span><b>Esc</b> skip or close</span><span><b>F1</b> this window</span><span><b>F2</b> options</span></div>
    <div class="row mt2"><Btn kind="sm" t="glossary" onClick={() => openModal({ kind: 'glossary' })}>Glossary of game words</Btn></div>
    <p class="eyebrow mt2">Remote or gamepad</p>
    <div class="keys"><span><b>Arrows</b> move the highlight</span><span><b>OK / A</b> select</span><span><b>Back / B</b> go back</span><span><b>LB RB</b> change section</span><span><b>Start</b> options</span></div>
  </Window>;
}
/** Move a game between devices as text: copy it here, paste it there. */
function SaveText() {
  const sv = slice<{ mode: string; text: string; msg: string }>('savetext', () => ({ mode: '', text: '', msg: '' })), S = G.S;
  if (S && S.iron) return <p class="muted mt2">Iron man game: the save cannot be copied out or replaced.</p>;
  const open = (m: string) => view(() => { sv.mode = sv.mode === m ? '' : m; sv.msg = ''; sv.text = m === 'copy' && S ? JSON.stringify(S) : ''; });
  return <div class="mt2">
    <div class="row">{S ? <Btn kind="sm" t="save-copy" on={sv.mode === 'copy'} onClick={() => { open('copy'); copyText(JSON.stringify(S), 'save-text', () => view(() => { sv.msg = 'Copied. Paste it into the same window on your other device.'; })); }}>Copy my save</Btn> : null}
      <Btn kind="sm" t="save-paste" on={sv.mode === 'paste'} onClick={() => open('paste')}>Paste a save</Btn></div>
    {sv.mode ? <><textarea id="save-text" class="savebox mt1" rows={4} readOnly={sv.mode === 'copy'} placeholder="Paste the text of a save here" value={sv.text} onInput={e => { sv.text = (e.currentTarget as HTMLTextAreaElement).value; }} />
      {sv.mode === 'paste' ? <div class="row mt1"><Btn kind="sm" t="save-load" onClick={() => { const m = loadSaveText(sv.text); view(() => { if (m) sv.msg = m; else { sv.mode = ''; ui.modal = null; } }); }}>Load this save</Btn><span class="muted">This replaces the game you are playing.</span></div> : null}
      {sv.msg ? <p class={sv.mode === 'paste' ? 'bad' : 'good'}>{sv.msg}</p> : null}</> : null}
  </div>;
}
function Options() {
  const S = G.S;
  const toggle = (k: 'snd' | 'type' | 'crt' | 'boot', n: string, d: string) => <li><span><b>{n}</b><br /><span class="muted">{d}</span></span>
    <Btn kind="sm" on={!!pref[k]} t="pref" d={{ k }} onClick={() => { pref[k] = !pref[k]; savePrefs(); if (k === 'snd' && pref.snd) SFX.ach(); redraw(); }}>{pref[k] ? 'On' : 'Off'}</Btn></li>;
  const choice = (k: 'screen' | 'zoom' | 'speed' | 'motion' | 'fxvol', n: string, d: string, opts: [string | number, string][]) => <li class="col"><span><b>{n}</b><br /><span class="muted">{d}</span></span>
    <span class="row">{opts.map(o => <Btn kind="sm" on={String(pref[k]) === String(o[0])} t="prefset" d={{ k, v: o[0] }} onClick={() => { (pref as any)[k] = o[0]; savePrefs(); redraw(); }}>{o[1]}</Btn>)}</span></li>;
  const fs = () => { try { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen().catch(() => {}); } catch (e) { /* not available here */ } };
  return <Window title="Options" ok="Done">
    <ul class="list">
      {toggle('snd', 'Sound', 'Beeps, bells and fanfares.')}
      {toggle('type', 'Typewriter text', 'Commentary types itself out during a show.')}
      {toggle('crt', 'Monitor effect', 'Scanlines and a darkened edge, like a tube screen.')}
      {toggle('boot', 'Boot sequence', 'The loading screen when the game starts.')}
      {choice('screen', 'Screen', 'Auto picks from the device. TV is for the couch: larger text, edge margins, and a remote or gamepad moves the highlight.', [['auto', 'Auto (' + ({ desk: 'desk', tablet: 'tablet', tv: 'TV', phone: 'phone' } as any)[autoScreen()] + ')'], ['desk', 'Desk'], ['tablet', 'Tablet'], ['tv', 'TV']])}
      {choice('fxvol', 'Effects volume', 'Bells, beeps and the crowd.', [[0.4, 'Low'], [1, 'Normal'], [1.8, 'High']])}
      {(window as any).EWF_MUSIC_VOL ? <li class="col"><span><b>Music volume</b><br /><span class="muted">The soundtrack. The Jukebox on the Music button has the rest.</span></span>
        <span class="row">{[[0.3, 'Low'], [0.6, 'Medium'], [1, 'High']].map(o => <Btn kind="sm" on={Math.abs((window as any).EWF_MUSIC_VOL.vol() - (o[0] as number)) < 0.01} t="musvol" d={{ v: o[0] }} onClick={() => { (window as any).EWF_MUSIC_VOL.setVol(o[0]); redraw(); }}>{o[1]}</Btn>)}</span></li> : null}
      {choice('speed', 'Broadcast speed', 'How fast the commentary types itself out.', [[0.5, 'Slow'], [1, 'Normal'], [2.5, 'Fast']])}
      {choice('motion', 'Reduce motion', 'Stops the typewriter text and the blinking cursor. Auto follows your device setting.', [['auto', 'Auto'], ['reduce', 'On'], ['full', 'Off']])}
      {choice('zoom', 'Text size', 'Scales everything on screen.', [[0.85, 'Small'], [1, 'Normal'], [1.2, 'Large'], [1.45, 'Largest']])}
    </ul>
    <div class="row mt2"><Btn kind="sm" t="fullscreen" onClick={fs}>Full screen on or off</Btn></div>
    <SaveText />
    {S && <div class="row mt2"><Btn kind="danger" t="newgame" onClick={() => view(() => { ui.confirm = 'new'; ui.modal = null; window.scrollTo(0, 0); })}>Start a new game</Btn><span class="muted">Asks before erasing anything.</span></div>}
  </Window>;
}
/** Copy text to the clipboard, or select it in a text box if the browser refuses. */
export function copyText(t: string, fallbackId: string, done?: () => void) {
  const sel = () => { const el = document.getElementById(fallbackId) as HTMLTextAreaElement | null; if (el && el.select) el.select(); };
  try { navigator.clipboard.writeText(t).then(() => done && done(), sel); } catch (e) { sel(); }
}
function UniReport(p: { m: Modal }) {
  const v = p.m.v, name = p.m.name, copy = !v.ok || v.warnings.length > 0;
  const li = (x: any) => <li><span><b>{x.at}</b><br /><span class="muted">{x.msg}</span></span></li>;
  return <Window title={v.ok ? 'Universe loaded' : 'Universe not loaded'} wide footer={copy ? <Btn t="copy-modal" onClick={() => copyText(p.m.text, 'modal-text', () => { p.m.copied = true; redraw(); })}>{p.m.copied ? 'Copied' : 'Copy the report'}</Btn> : null}>
    <p>{v.ok ? <span class="good">{name} loaded{v.warnings.length ? ' with ' + v.warnings.length + ' ' + plural(v.warnings.length, 'warning') : ' cleanly'}.</span> : <span class="bad">{name} could not be loaded: {v.errors.length} {plural(v.errors.length, 'error')}.</span>}</p>
    {v.errors.length > 0 && <><p class="eyebrow mt2">Errors</p><ul class="list">{v.errors.slice(0, 40).map(li)}</ul></>}
    {v.warnings.length > 0 && <><p class="eyebrow mt2">Warnings</p><ul class="list">{v.warnings.slice(0, 40).map(li)}</ul></>}
    {v.info && <p class="mt2">{v.info.workers} workers in {v.info.promotions.length} promotions. The world starts in {v.info.start}.</p>}
    {copy && <textarea id="modal-text" class="sr" readOnly value={p.m.text} />}
  </Window>;
}
export const modals: Record<string, (p: { m: Modal }) => ComponentChildren> = { help: Help, glossary: Glossary, options: Options, unireport: UniReport, unicut: CutWindow };
