# Working on the interface

Read `../docs/design.md` first. This file is the practical half: how the code is laid out and the rules a screen follows.

## Layout

```
app/
  src/
    main.tsx          mounts the app, runs the boot timer
    app.tsx           root: boot / start screens / game frame; page and pop-up registries
    engine.ts         `E` (the engine API, global GP) and loose types
    store.ts          G.S (game state), ui (view state), pref, save/load, act(), view(), say(), openModal(), cash(), full()
    nav.ts            the screen map (SECTIONS), go(page), weekDone(), pending()
    flow.ts           startGame, continueGame, endWeek, openReport, book() (Booking view state)
    input.ts          screen modes, remote/gamepad focus, hotkeys, onBack(), onKey()
    sfx.ts            SFX.bell() and friends
    kit/              the building blocks (see below)
    shared/week.tsx   ScheduleList, EndWeekBtn, QuestList
    shell/Frame.tsx   MenuBar, SubNav, StatusBar, FlashBar, Toasts
    screens/<section>/index.tsx   exports `pages` and `modals` for that section
  styles/
    base.css          everything shared
    caw.css           the Windows 95 creator window
    <section>.css     rules only that section needs
  tests/              browser tests: helper.js, journey.js, one per section
```

Build from the repo root: `node build.js` writes `dist/index.html` (open this in a browser) and `dist/gorilla-position.html` (the same page without the document shell).
Tests: `NODE_PATH=<where playwright lives> node app/tests/journey.js` plays five weeks on four screen modes; each section has its own test beside it.
Type-check: `cd app && node_modules/.bin/tsc --noEmit -p .`

The interface this replaced is kept in `../legacy/` (one file of HTML strings, `ui.js`) for reference. Nothing builds it any more.

## Rules

1. **The engine owns the game.** Never write to `G.S` from a screen. Call `E.something(S, ...)` and let it change the state. View state (which tab, which row is open, filter text) lives in `slice()`.
2. **Every click that touches the game goes through `act()`.** It clears the last message, runs your function, saves and redraws. Clicks that only change the view use `view()`.
   ```tsx
   <Btn t="rest" d={{ id: w.id }} kind="sm" onClick={() => act(() => say(E.rest(S, w.id)))}>Give them the week off</Btn>
   ```
3. **Results are said, not alerted.** `say(text, { err, roll })` shows one line above the page. Engine calls usually return `{ ok, msg, roll }` or a string; pass them straight through: `say(r.msg, { err: !r.ok, roll: r.roll })`.
4. **Build from the kit.** `Panel`, `Head`, `Btn`, `Tabs`, `Sel`, `Field`, `TextBox`, `Tag`, `Name`, `Side`, `Meter`, `Gauge`, `Stat`, `KV`, `Dice`, `CheckLine`, `Empty`, `Pie`, `ColChart`, `RangeBar`, `Dial`, `BigText`, `Banner`, `BeltArt`, `Portrait`, `FaceCanvas`, `Window`. Layout uses plain elements with these classes: `row` (wrapping flex row), `cols` (two columns, one on narrow screens), `stack` (vertical gap), `list` (`ul`; add `col` to an `li` to stack its children), `kv` (label/value grid), `tw` (scrolling table wrapper), `grid`, `subnav`. Spacing: `mt1`..`mt4`, `mb1`..`mb4`. No inline styles except a computed width or font size.
5. **Text is plain.** JSX escapes for you. Use `’` for apostrophes inside JSX expressions and `{'·'}` for the middle dot. Keep the wording of the old interface unless it mentioned something that no longer exists.
6. **Name every control.** Give each button, select and input a `t` (it becomes `data-t`) equal to the old `data-act` or `data-ch` name, and pass the old `data-*` values through `d` (`d={{ v: 3, id: w.id }}` becomes `data-v="3" data-id="12"`). Keep the old element ids on inputs and selects. The browser tests find controls this way.
7. **Clickable table rows** are `<tr class="pick" onClick=...>`; the input layer makes them focusable and Enter clicks them.
8. **Pop-ups.** `openModal({ kind: 'info', title, body: () => <p>...</p> })` covers simple cases. A section can register its own kinds in its exported `modals` map; each is a component that renders a `<Window>`.
9. **Back and keys.** If your section has something Back should close (a report, a profile), register it at module level: `onBack(() => { if (st.sel == null) return false; st.sel = null; redraw(); return true; })`. Use `onKey()` for keys that only apply while something of yours is open.
10. **Four inputs.** Every control is a real `button`, `select` or `input`, so mouse, touch, keyboard and remote all reach it. Nothing appears only on hover. Mark the control that should be highlighted first on a page with `data-home` when it is not the first one.
11. **Own files only.** A section edits `screens/<section>/` and `styles/<section>.css`. If you need something shared, write it locally and note it in your hand-over; do not edit `kit/`, `store.ts`, `nav.ts`, `flow.ts`, `input.ts`, `shell/`, `shared/` or another section.
12. **Split by page.** `index.tsx` imports one file per page (`Desk.tsx`, `Backstage.tsx`) and exports `pages` and `modals`. Keep files under about 250 lines.

## Example

`screens/start/index.tsx` is a complete section written to these rules.

A minimal page:

```tsx
import { E } from '../../engine';
import { G, me, act, say, slice, view } from '../../store';
import { Head, Panel, Btn, Empty } from '../../kit';

export function Titles() {
  const S = G.S, P = me(), st = slice('titles', () => ({ open: null as string | null }));
  return <>
    <Head eyebrow={P.name} title="Titles" />
    <Panel title="Champions">
      {P.titles.length ? <ul class="list">{P.titles.map((t: any) =>
        <li><span><b>{t.name}</b></span><Btn kind="sm" t="title-open" d={{ id: t.id }} onClick={() => view(() => { st.open = t.id; })}>History</Btn></li>)}</ul>
        : <Empty>No titles yet.</Empty>}
    </Panel>
  </>;
}
```
