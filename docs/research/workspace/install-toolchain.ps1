# WrestleCraft free/open-source toolchain installer (winget). Re-runnable; skips installed.
$ids = @(
  'BlenderFoundation.Blender',      # 3D model/rig/animate/render
  'GodotEngine.GodotEngine',        # game engine (MIT)
  'KDE.Krita',                      # painting/concept art/2D anim
  'GIMP.GIMP.3',                    # raster editing
  'Inkscape.Inkscape',              # vector/UI/logos
  'Orama-Interactive.Pixelorama',   # pixel art + anim
  'LibreSprite.LibreSprite',        # pixel/sprite anim (Aseprite fork)
  'JannisX11.Blockbench',           # low-poly/voxel models
  'Synfig.SynfigStudio',            # 2D vector animation
  'OpenToonz.OpenToonz',            # 2D animation
  'mapeditor.Tiled',                # tilemaps/levels
  'Audacity.Audacity',              # audio edit
  'LMMS.LMMS',                      # music DAW
  'MuseScore.MuseScore',            # scoring
  'KDE.Kdenlive',                   # video/trailers
  'OBSProject.OBSStudio',           # capture/trailers
  'Gyan.FFmpeg',                    # media CLI
  'ImageMagick.ImageMagick',        # image batch CLI
  'GitHub.GitLFS',                  # large assets in git
  'GitHub.cli',                     # GitHub search/automation
  'KhronosGroup.glTF-Validator'     # glTF checks (may not exist)
)
$log = Join-Path $PSScriptRoot 'install-log.txt'
"=== $(Get-Date) ===" | Out-File $log -Append -Encoding utf8
foreach ($id in $ids) {
  winget install --id $id -e --silent --accept-package-agreements --accept-source-agreements --disable-interactivity | Out-Null
  "$id exit=$LASTEXITCODE" | Out-File $log -Append -Encoding utf8
}
"DONE" | Out-File $log -Append -Encoding utf8
