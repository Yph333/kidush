# Elevation data

| File | Source | Licence |
|---|---|---|
| `israel.json` (0.008° grid), `region.json` (0.05° grid) | **AWS Terrain Tiles** (Tilezen joerd, "terrarium" encoding), sampled by `tools/terrain/build-terrain.mjs`. In this area the tiles come from **NASA SRTM** (land) and **NOAA ETOPO1** (sea floor). | SRTM and ETOPO1 are public domain (US government works). Attribution per https://github.com/tilezen/joerd/blob/master/docs/attribution.md |

The sea floor is flattened in the scene (only the coast matters); heights are exaggerated (Israel ×7, the region ×12).
