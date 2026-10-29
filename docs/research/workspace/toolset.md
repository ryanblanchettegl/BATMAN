# TOOLSET — free/OSS game asset pipeline
Install status 2026-10-26: installed = Godot, Krita, GIMP, Inkscape, Blockbench, Synfig, Audacity, LMMS, Kdenlive, OBS, FFmpeg, ImageMagick, Git LFS, GitHub CLI, Material Maker. FAILED (retry/manual) = Blender (installer error), Pixelorama, LibreSprite, OpenToonz, Tiled, MuseScore (id not found in winget).
Install: winget ids below (see tools/install-toolchain.ps1). status: I=installed, P=pending, M=manual.

## Engine
| tool | use | winget id | license | auto (CLI/script) |
|---|---|---|---|---|
| Godot 4 | engine, 2D/3D | GodotEngine.GodotEngine | MIT | `godot --headless --export-release` ; GDScript |
| Blender | model/rig/anim/render/bake | BlenderFoundation.Blender | GPL | `blender -b file.blend -P script.py` (bpy) — primary 3D automation |

## 3D
| Blockbench | low-poly/voxel, anim | JannisX11.Blockbench | GPL | glTF export |
| MagicaVoxel | voxel | M (ephtracy.github.io) | free | — |
| Material Maker 1.8 | procedural PBR textures | I → tools/apps/RodZill4/ | MIT | Godot-based |
| ArmorPaint | 3D texture paint | M build from github.com/armory3d/armorpaint | zlib (src) | — |
| MakeHuman / MPFB2 | base human wrestler bodies | M (Blender addon MPFB2) | CC0 output | bpy |
| Mixamo-alt: Rigify | auto-rig | built into Blender | GPL | bpy |

## 2D / art / animation
| Krita | paint, concept, frame anim | KDE.Krita | GPL | python API |
| GIMP 3 | raster edit | GIMP.GIMP.3 | GPL | script-fu/python |
| Inkscape | vector UI/logos | Inkscape.Inkscape | GPL | `inkscape --export-type=png` |
| Pixelorama | pixel art | Orama-Interactive.Pixelorama | MIT | — |
| LibreSprite | sprite anim | LibreSprite.LibreSprite | GPL | CLI export |
| Synfig | 2D vector anim | Synfig.SynfigStudio | GPL | CLI render |
| OpenToonz | 2D anim | OpenToonz.OpenToonz | BSD | — |
| Tiled | tilemaps/levels | mapeditor.Tiled | GPL | JSON/TMX |
| ImageMagick | batch images/atlases | ImageMagick.ImageMagick | Apache | `magick` |

## Audio
| Audacity | edit SFX/VO | Audacity.Audacity | GPL | — |
| LMMS | music | LMMS.LMMS | GPL | `lmms -r` render |
| MuseScore | score | MuseScore.MuseScore | GPL | CLI export |
| sfxr/jsfxr/ChipTone | retro SFX gen | web (sfxr.me) | MIT | — |
| Bfxr | SFX gen | web | Apache | — |
| FFmpeg | convert/normalize | Gyan.FFmpeg | LGPL/GPL | `ffmpeg` |

## Video / capture
| Kdenlive | trailers | KDE.Kdenlive | GPL |
| OBS | capture | OBSProject.OBSStudio | GPL |

## AI generation (local, open weights — optional, GPU)
| ComfyUI | image gen pipelines | github.com/comfyanonymous/ComfyUI | GPL |
| Stable Diffusion / FLUX-schnell | concept/textures | HF weights; check license per model |
| TripoSR / Hunyuan3D / TRELLIS | image→3D mesh | GitHub; check license |
| AudioCraft (MusicGen/AudioGen) | music/SFX | github.com/facebookresearch/audiocraft | MIT code, CC-BY-NC weights (non-commercial!) |
| Piper / Coqui TTS | voice/announcer | github.com/rhasspy/piper | MIT |

## Free asset libraries (CC0 first)
- Kenney.nl (CC0), Poly Haven (CC0 HDRI/tex/models), ambientCG (CC0), OpenGameArt (check per-asset), Freesound (check per-asset), Quaternius (CC0).

## Dev / pipeline
| Git LFS | GitHub.GitLFS | | GitHub CLI | GitHub.cli (`gh search repos "godot wrestling"`) |

## Licensing rule
Commercial-safe = CC0/MIT/BSD/Apache/zlib. GPL tools are fine (output is yours). Non-commercial weights/assets → flag in MASTER before use.
