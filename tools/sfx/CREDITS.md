# Sound effects: sources and credits

The game's sound effects are real recordings (Ryan, 23 October 2026: external assets are allowed). Every one is free to
use in a commercial game. `tools/sfx/build-sfx.py` trims them, evens their levels and writes them into the page
(`app/addons/sfx-bank.js`); the code that plays them is `app/src/audio/`.

| Sounds in the game | Recording | Made by | Licence | Source |
| --- | --- | --- | --- | --- |
| Button presses (`ui_press`), pointing at something (`ui_hover`) | `click1` to `click4`, `rollover1` to `rollover3` from UI Audio | Kenney | CC0 | https://kenney.nl/assets/ui-audio |
| Card set down for a big button (`ui_go`), paper turned when a pop-up opens (`ui_open`) and closes (`ui_close`), cloth for a grapple (`grab`) | `bookPlace`, `bookFlip`, `bookClose`, `bookOpen`, `cloth` from RPG Audio | Kenney | CC0 | https://kenney.nl/assets/rpg-audio |
| Switches, a good result, a refused one, the typing tick, a call on the headset, a list choice (`ui_toggle`, `ui_ok`, `ui_err`, `ui_tick`, `ui_call`, `ui_scroll`) | `toggle`, `confirmation`, `error`, `tick`, `question`, `scroll` from Interface Sounds | Kenney | CC0 | https://kenney.nl/assets/interface-sounds |
| Strikes (`hit`, `hit_heavy`), a body on the mat (`body`), the boards under it (`boards`), the referee's hand (`mat`), the turnbuckle (`steel`), footsteps (`step`), the ring bell (`bell`, raised in pitch) | `impactPunch`, `impactSoft`, `impactWood`, `impactMetal`, `footstep_wood`, `impactBell_heavy` from Impact Sounds | Kenney | CC0 | https://kenney.nl/assets/impact-sounds |
| The crowd's murmur (`crowd_bed`) | Crowd shouting and speaking ambience | StarNinjas | CC0 | https://opengameart.org/content/crowd-shoutingspeaking-ambience |
| The hot crowd, clapping (`crowd_hot`) | Applause in a large hall or church | eXpl0it3r | CC0 | https://opengameart.org/content/applause-in-a-large-hall-or-church |
| The "ooh" (`ooh`, also lowered for a groan) | Oooooooooooooo | Nocturnal_Vanguard | CC0 | https://opengameart.org/content/oooooooooooooo |
| The "ooh" (`ooh`, second take) | Ohhh ahhh | starlite | Public domain | https://commons.wikimedia.org/wiki/File:Ohhh_ahhh.ogg |
| A pop (`pop`) | Applause i | thore | Public domain | https://commons.wikimedia.org/wiki/File:Applause_i.ogg |
| A big pop (`pop_big`) | Slow starting applause | Wikimedia Commons | Public domain | https://commons.wikimedia.org/wiki/File:Slow_starting_applause.ogg |

The tension under a near fall is made in code (`riser()` in `app/src/audio/engine.ts`).

## Rebuilding

Download the four Kenney packs and unzip them into `<folder>/src/` (`kenney_impact-sounds`, `kenney_interface-sounds`,
`kenney_rpg-audio`, `kenney_ui-audio`), put the crowd recordings in `<folder>/crowd/` under the names in `BANK` in the
script, and run `SFX_DIR=<folder> python3 tools/sfx/build-sfx.py`, then `node build.js`. It needs ffmpeg and numpy.
