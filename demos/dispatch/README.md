# Kilo Dispatch

A real-time dispatch console for a same-day grocery courier fleet in Lahore. Built as a live portfolio demo by [Ahtshamdev](https://ahtshamdev-github-io.vercel.app).

Everything runs in the browser. The city, about 350 couriers and a rolling queue of around 120 orders are simulated from a seeded random generator, so every visit starts from the same lunch shift. There are no external services, map tiles, keys or trackers.

## What it does

- **Simulation controls**: pause/resume the shift and choose 1×, 2× or 4× playback. The base playback advances ten simulated seconds per real second.
- **Live map**: a procedurally drawn city on a canvas. Couriers move along the road network at 60 fps; late couriers turn red. Drag to pan, scroll or pinch to zoom.
- **Order queue**: sort by at-risk first, newest or zone, and search by order number or area. ETAs update as couriers move and orders predicted to miss their promise are flagged "Likely late".
- **Selection and reassignment**: pick an order (or a courier on the map) to see its route, distance and progress. Reassign hands it to the nearest free courier.
- **Keyboard**: `j`/`k` or arrow keys move through the queue, `r` reassigns, `/` searches, `Esc` clears, `?` lists the shortcuts.

## Stack

Next.js (App Router), React and TypeScript with plain CSS Modules. No UI kit or map library.

## Run it

```bash
npm install
npm run dev
```

`npm run lint` and `npx tsc --noEmit` validate the source. For a production preview, run `npm run build` then `npm run start -- -p 3101`.

The canonical URL, robots policy and sitemap use `https://kilo-dispatch-demo.vercel.app`; update the metadata files when hosting at a different domain. Local verification screenshots live in the ignored `.shots/` directory.

`npm run build` produces the production build. The folder deploys to Vercel as its own project; `vercel.json` skips rebuilds when a push does not touch this folder.
