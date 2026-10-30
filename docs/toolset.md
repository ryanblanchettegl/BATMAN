# Toolset

What the free-tools-first skill checks first. Everything here is free; nothing here ships unless a credits file says so (rule 2).

| Tool | Here (cloud) | Used for |
| --- | --- | --- |
| Node 22, esbuild, TypeScript (`app/node_modules`) | yes | the build, the engine, every test |
| Playwright with Chromium | yes (`NODE_PATH=$(npm root -g)`) | browser tests, screenshots (`tools/screenshots.js`) |
| Python 3 | yes | font, map, music and sound tools |
| fonttools, brotli | install with pip | `tools/build-font.py`, `tools/build-ui-font.py` |
| ffmpeg | yes | sound and music (`tools/sfx/`, `tools/music/`) |
| ImageMagick (`convert`) | yes | image batches |
| pdftotext | yes | reading plan PDFs |
| gh, git | yes | GitHub searches; GitHub work goes through the GitHub tools |
| Blender (`bpy` 4.5 from pip, Python 3.11) | install with pip | paper pieces (`tools/creator/ui-pieces.py`) |
| Piper with LibriTTS-R voices | install when needed | the broadcast voices (`tools/sfx/build-voices.py`) |
| world-atlas, us-atlas, topojson-client | install in a scratch folder | `tools/build-maps.js` |
