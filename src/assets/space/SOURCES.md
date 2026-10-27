# Imagery and data in this folder

Everything here ships inside the app (the site works offline). Files were scaled down from the originals with
`tools/textures/prepare.mjs`; nothing else was changed except as noted.

| File | Source | Credit / terms |
|---|---|---|
| `moon-color.jpg` (2048×1024) | NASA SVS **CGI Moon Kit** (ID 4720), LROC WAC colour mosaic — https://svs.gsfc.nasa.gov/4720 | NASA's Scientific Visualization Studio (Ernie Wright); LROC / Arizona State University. NASA media guidelines; no endorsement implied. |
| `moon-bump.jpg` (1024×512) | Same kit, LOLA elevation (converted to 8-bit grey, used only as relief shading) | NASA SVS; LRO / LOLA. |
| `earth-day.jpg` (2048×1024) | NASA Blue Marble (land surface, ocean colour, sea ice), as distributed with WebGL Earth | NASA Earth Observatory. Preserve NASA attribution. |
| `earth-night.jpg` (2048×1024) | NASA Earth at Night (Black Marble) composite, as distributed with three-globe | NASA Earth Observatory / NOAA NGDC. Brightness adjusted in the renderer. |
| `earth-water.jpg` (1024×512) | Ocean mask derived from the Blue Marble set (WebGL Earth) | NASA-derived. Used only for the ocean glint. |
| `earth-clouds.jpg` (1024×512) | NASA cloud cover (alpha channel of the WebGL Earth cloud map, written as grey) | NASA-derived. |
| `stars.json` | **HYG Database 4.1**, David Nash / Astronomy Nexus — https://github.com/astronexus/HYG-Database ; subset: magnitude ≤ 5.5, coordinates rounded | **CC BY-SA 4.0.** This adapted subset is shared under the same licence. |

The intermediate copies used for scaling came from the open-source project *earth-moon-solar* by Ethan Rogers
(code MIT; its CREDITS.md lists the same original sources). No code was copied from it.
