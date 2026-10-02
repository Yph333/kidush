# CLAUDE.md — בונים לוח עברי (Hebrew Calendar Learning Site)

## What this is
An interactive, Hebrew (RTL) teaching site that explains the Hebrew calendar end to end:
time units → the day (sun & zmanim) → the month (moon) → the year (cycles, tekufot) →
the fixed calendar (molad, year types, keviut) → the four dechiyot → sighting vs calculation
(mean vs true molad, Odeh criterion, Rambam's method from Hilchot Kiddush HaChodesh 11–17).

Primary use: a teacher projecting it in class. Secondary: students exploring at home on phones.
Full product spec: `docs/SPEC.md` (Hebrew). Verification data: `docs/VERIFICATION.md` + `tests/vectors.json`.

## Starting point
`legacy/` holds a working single-file prototype (`luach-v1.html`) and its source split into:
- `engine.js` — fixed calendar (molad, dechiyot, year types, keviut, gematria). Verified.
- `astro.js` — Meeus low-precision sun/moon, alt/az, Israel time, sunset/moonset, conjunction, Odeh. Verified.
- `rambam.js` — Rambam ch. 12–17 sighting calculation. Reproduces his worked example exactly.
- `app.js`, `astroapp.js` — prototype UI (reference only for visuals and copy; do not port as-is).

Port the three engines to typed TypeScript modules FIRST, with tests passing against
`tests/vectors.json`, before building any UI. Do not "improve" engine math while porting.

## Stack
- Vite + TypeScript + React. Vitest for unit tests. Playwright for screenshot/e2e checks.
- three.js for the 3D scenes (lazy-loaded per scene; 2D fallback when WebGL is unavailable).
- No backend. Static build. Also produce a single-file build (vite-plugin-singlefile) so the
  site can be published as one HTML file.
- No external network calls at runtime. Fonts may load from Google Fonts with real fallbacks.

## Structure (target)
```
src/
  engines/        calendar.ts astro.ts rambam.ts zmanim.ts  (+ *.test.ts each)
  state/          global store: demoYear, location, mode, progress, guesses (URL params + localStorage)
  components/     WeekWheel, DayBand, Steps, GuessGate, Glossary, SkyPanorama, PhaseStrip,
                  OrbitTopDown, LiveTable, Timeline, Sandbox, Scene3D/*
  chapters/       01-yesodot … 08-kelim (one folder per chapter, slides as components)
  content/        glossary.ts, teacherNotes.ts, sources.ts (Kitzur page lines & Rambam halachot → slides)
docs/  tests/  legacy/
```

## Non-negotiable rules
1. **Engines are pure functions** with no DOM access. UI never re-implements math.
2. **Every engine change needs a test.** Never weaken a vector in `tests/vectors.json` to make a test pass;
   if a vector looks wrong, stop and ask.
3. **Rambam fidelity:** use his tables and rounding exactly (see VERIFICATION.md). The modern model
   and the Rambam model are separate engines; never mix them.
4. **Zmanim are shown as opinions with sources**, never as a halachic ruling. Each opinion carries
   its definition (degrees or fixed minutes) and a source string. If you are not sure of an attribution,
   leave the source as `TODO: verify` instead of guessing.
5. **Hebrew RTL everywhere.** Wrap numbers, times and degree values in an LTR-isolated span.
   Timelines and strips flow right-to-left.
6. **Two modes:** `presentation` (one large visual per screen, big type, keyboard nav, teacher
   notes hidden) and `explore` (all controls). Same content, different layout.
7. **Accessibility:** keyboard navigation, visible focus, `prefers-reduced-motion`, light/dark themes.
8. **Copyright:** only public-domain source texts (Rambam, Kitzur Shulchan Aruch, Tur) may be quoted.
   Do not copy text from modern translations or modern luach publishers.

## Commands (once scaffolded)
- `npm run dev` — dev server
- `npm test` — unit tests (must pass before any commit)
- `npm run e2e` — Playwright screenshots of every slide in both modes, desktop 1600×900 and mobile 390×800
- `npm run build` / `npm run build:single`
- `npm run oracle:zmanim` — regenerate tests/zmanim-oracle.json from KosherJava (needs a JDK + the jar in tools/kosherjava/lib)

## Working style
- Work milestone by milestone (docs/SPEC.md §7). Finish a milestone with tests + screenshots before
  starting the next.
- After UI work, take Playwright screenshots and look at them; fix overlap, clipping, RTL issues.
- Keep commits small and descriptive.
