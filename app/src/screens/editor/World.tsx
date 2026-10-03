/* World Editor: the World tab (name, calendar start, newcomers) and the Check and share tab. */
import { E } from '../../engine';
import { ui, setUniverse, plural } from '../../store';
import { Btn, Panel, Opt } from '../../kit';
import { copyText } from '../start';
import { es, world, look, note, report, keep, EdTab } from './state';
import { TextF, NumF, SelF } from './parts';

export function WorldTab() {
  const pkg = world(), m = pkg.manifest, months: Opt[] = E.MONTHS.map((n: string, i: number) => [i + 1, n] as Opt), info = E.edInfo(pkg);
  return <>
    <Panel cls="mb4" title="About this world">
      <div class="editor plain">
        <TextF label="Name" rec={m} k="name" max={40} keepEmpty t="ed-wname" />
        <TextF label="Made by" rec={m} k="author" max={40} ph="Your name" />
        <TextF label="Version" rec={m} k="version" max={12} ph="1.0" />
      </div>
      <div class="editor plain"><TextF label="A line about it" rec={m} k="description" max={160} ph="What kind of world is this?" /></div>
    </Panel>
    <Panel cls="mb4" title="When it starts">
      <div class="editor plain">
        <NumF label="Year" rec={m} k="start_year" min={1900} max={2200} />
        <SelF label="Month" rec={m} k="start_month" options={months} num />
        <NumF label="Newcomers without a contract" rec={m} k="free_agents" min={0} max={120} />
      </div>
      <p class="muted mt2">The game adds that many unknown free agents on day one, on top of the wrestlers you leave unsigned.</p>
    </Panel>
    <Panel cls="mb4" title="What is in it">
      <p class="kv"><span>Companies <b>{pkg.promotions.length}</b></span><span>Shows <b>{pkg.shows.length}</b></span><span>Belts <b>{pkg.titles.length}</b></span><span>Wrestlers <b>{info.workers}</b></span><span>Unsigned <b>{info.free}</b></span><span>Teams <b>{pkg.teams.length}</b></span></p>
      <p class="muted mt2">Work left to right along the tabs: companies first, then their shows and belts, then the wrestlers. Check and share tells you what is missing.</p>
    </Panel>
  </>;
}

/** Take the player to the record a problem is about. */
function goTo(l: any) { const st = es(); st.tab = l.tab as EdTab; if (l.id) { st.sel[l.tab] = l.id; if (l.tab === 'wrestlers') { st.fp = ''; st.q = ''; } } window.scrollTo(0, 0); }

export function ShareTab() {
  const st = es(), pkg = world(), v = report(), steam = (window as any).gpSteam, canFile = (() => { try { return window.self === window.top; } catch (e) { return false; } })();
  const errs = v.lines.filter((l: any) => l.lvl === 'error'), warns = v.lines.filter((l: any) => l.lvl === 'warning');
  const text = () => JSON.stringify(pkg);
  const line = (l: any, i: number) => <li key={l.lvl + i}><span><b>{l.where}{l.name ? ': ' + l.name : ''}</b><br /><span class="muted">{l.msg}</span></span>
    <Btn kind="sm" t="ed-goto" d={{ v: l.tab }} onClick={() => look(() => goTo(l))}>Go to it</Btn></li>;
  const play = () => { keep(true); const r = setUniverse(st.id as string); look(() => { if (r.ok) { ui.scr = 'select'; ui.mi = 0; ui.setup = null; window.scrollTo(0, 0); } else note('This world could not be loaded. Fix the problems listed here first.', true); }); };
  const saveFile = () => { try { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(pkg, null, 1)], { type: 'application/json' })); a.download = (pkg.manifest.id || 'world') + '.json'; document.body.appendChild(a); a.click(); a.remove(); look(() => note('Saved as ' + a.download + '.')); } catch (e) { look(() => note('This device would not save a file. Copy the text instead.', true)); } };
  const upload = () => { look(() => note('Sending to the Workshop...')); Promise.resolve(steam.workshopUpload(pkg)).then((r: any) => look(() => note(r && r.ok ? 'Sent to the Workshop' + (r.id ? ' as item ' + r.id : '') + '.' : 'The Workshop did not take it: ' + ((r && r.msg) || 'no reason given') + '.', !(r && r.ok))), (e: any) => look(() => note('The Workshop did not take it: ' + String((e && e.message) || e) + '.', true))); };
  return <>
    <Panel cls="mb4" title="The check">
      {v.ok ? <p class="good"><b>Ready to play.</b> Every company has a show and enough wrestlers.</p>
        : <p class="bad"><b>{v.errors} {plural(v.errors, 'problem')} to fix</b> before this world can be played.</p>}
      {errs.length ? <><p class="eyebrow mt2">Problems</p><ul class="list">{errs.slice(0, 40).map(line)}</ul>{errs.length > 40 ? <p class="muted">And {errs.length - 40} more.</p> : null}</> : null}
      {warns.length ? <><p class="eyebrow mt2">Notes ({warns.length})</p><p class="muted">The world plays with these. They are worth a look.</p><ul class="list">{warns.slice(0, 20).map(line)}</ul>{warns.length > 20 ? <p class="muted">And {warns.length - 20} more.</p> : null}</> : null}
    </Panel>
    <Panel cls="mb4" title="Play it">
      <div class="row"><Btn kind="go" t="ed-play" disabled={!v.ok} onClick={play}>Play this world</Btn><span class="muted">{v.ok ? 'Takes you to pick a company in it.' : 'Fix the problems first.'}</span></div>
    </Panel>
    <Panel cls="mb4" title="Share it">
      <div class="row">
        {steam && steam.workshopUpload ? <Btn kind="go" t="ed-workshop" disabled={!v.ok} onClick={upload}>Upload to the Workshop</Btn> : null}
        {canFile ? <Btn t="ed-savefile" onClick={saveFile}>Save as a file</Btn> : null}
        <Btn t="ed-copytext" onClick={() => { look(() => { st.text = text(); }); copyText(st.text, 'ed-text', () => look(() => { st.copied = true; })); }}>{st.copied ? 'Copied' : 'Copy the world as text'}</Btn>
      </div>
      {steam && steam.workshopUpload ? null : <p class="muted mt2">Uploading to the Workshop needs the Steam version of the game. Here, {canFile ? 'save the file or ' : ''}copy the text and keep it as a <b>.json</b> file. Anyone can open it from this editor or from the Federations screen.</p>}
      {st.text ? <textarea id="ed-text" class="savebox mt2" rows={5} readOnly aria-label="The world as text" value={st.text} /> : null}
    </Panel>
  </>;
}
