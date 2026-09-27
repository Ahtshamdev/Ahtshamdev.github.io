import { findPath, type City } from "./city";
import type { Sim } from "./sim";

export type Camera = { scale: number; tx: number; ty: number };

export const COLORS = {
  ground: "#1d2127",
  park: "#1e2621",
  water: "#1a2631",
  canal: "#1f3040",
  street: "#2b3038",
  arterial: "#343a44",
  label: "#727a86",
  labelHalo: "#1d2127",
  ok: "#3ddc84",
  late: "#ff6b4d",
  idle: "rgba(61, 220, 132, 0.38)",
  brand: "#e0482b",
  pending: "#f5c451",
};

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** Static city layer. Drawn to an offscreen canvas whenever the camera changes. */
export function drawCity(ctx: CanvasRenderingContext2D, city: City, cam: Camera, w: number, h: number, dpr: number) {
  const { xs, ys } = city;
  const sx = (x: number) => x * cam.scale + cam.tx;
  const sy = (y: number) => y * cam.scale + cam.ty;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = COLORS.ground;
  ctx.fillRect(0, 0, w, h);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.fillStyle = COLORS.park;
  for (const p of city.parks) {
    ctx.beginPath();
    if (p.kind === "circle") ctx.arc(sx(p.x), sy(p.y), p.r * cam.scale, 0, Math.PI * 2);
    else ctx.roundRect(sx(p.x), sy(p.y), p.w * cam.scale, p.h * cam.scale, 6 * cam.scale);
    ctx.fill();
  }

  const polyline = (pts: { x: number; y: number }[]) => {
    ctx.beginPath();
    pts.forEach((p, i) => (i ? ctx.lineTo(sx(p.x), sy(p.y)) : ctx.moveTo(sx(p.x), sy(p.y))));
  };
  polyline(city.river.line);
  ctx.strokeStyle = COLORS.water;
  ctx.lineWidth = city.river.half * 2 * cam.scale;
  ctx.stroke();
  polyline(city.canal);
  ctx.strokeStyle = COLORS.canal;
  ctx.lineWidth = clamp(26 * cam.scale, 1.5, 8);
  ctx.stroke();

  ctx.beginPath();
  for (const [a, b] of city.streets) {
    ctx.moveTo(sx(xs[a]), sy(ys[a]));
    ctx.lineTo(sx(xs[b]), sy(ys[b]));
  }
  for (const [a, b] of city.connectors) {
    ctx.moveTo(sx(xs[a]), sy(ys[a]));
    ctx.lineTo(sx(xs[b]), sy(ys[b]));
  }
  ctx.strokeStyle = COLORS.street;
  ctx.lineWidth = clamp(18 * cam.scale, 1.4, 7);
  ctx.stroke();

  ctx.beginPath();
  for (const seq of city.arterials) {
    seq.forEach((n, i) => (i ? ctx.lineTo(sx(xs[n]), sy(ys[n])) : ctx.moveTo(sx(xs[n]), sy(ys[n]))));
  }
  ctx.strokeStyle = COLORS.arterial;
  ctx.lineWidth = clamp(42 * cam.scale, 3.5, 16);
  ctx.stroke();

  ctx.font = "600 11px system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineWidth = 4;
  ctx.strokeStyle = COLORS.labelHalo;
  ctx.fillStyle = COLORS.label;
  for (const a of city.areas) {
    const x = sx(a.x);
    const y = sy(a.y);
    if (x < -60 || y < -20 || x > w + 60 || y > h + 20) continue;
    const text = a.name.toUpperCase();
    ctx.strokeText(text, x, y);
    ctx.fillText(text, x, y);
  }
}

type RouteCache = { key: string; path: number[] };

export function createDynamicRenderer(sim: Sim) {
  const { city, couriers } = sim;
  const { xs, ys } = city;
  let cache: RouteCache = { key: "", path: [] };

  const legPath = (from: number, to: number, key: string) => {
    if (cache.key !== key) cache = { key, path: findPath(city, from, to) };
    return cache.path;
  };

  return function draw(ctx: CanvasRenderingContext2D, cam: Camera, dpr: number, now: number, reduced: boolean) {
    const sx = (x: number) => x * cam.scale + cam.tx;
    const sy = (y: number) => y * cam.scale + cam.ty;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const sel = sim.state.selected >= 0 ? sim.orders.get(sim.state.selected) : undefined;
    const selCourier = sel && sel.courier >= 0 ? couriers[sel.courier] : undefined;

    // Route for the selected order, drawn under the couriers.
    if (sel) {
      const trace = (nodes: number[], startX?: number, startY?: number) => {
        ctx.beginPath();
        let first = true;
        if (startX !== undefined && startY !== undefined) {
          ctx.moveTo(sx(startX), sy(startY));
          first = false;
        }
        for (const n of nodes) {
          if (first) ctx.moveTo(sx(xs[n]), sy(ys[n]));
          else ctx.lineTo(sx(xs[n]), sy(ys[n]));
          first = false;
        }
      };
      const nextLeg = legPath(sel.pickupNode, sel.drop, `${sel.id}:${sel.pickupNode}`);
      if (selCourier) {
        trace(selCourier.path.slice(selCourier.seg + 1), selCourier.x, selCourier.y);
        ctx.strokeStyle = COLORS.brand;
        ctx.lineWidth = 4;
        ctx.stroke();
      }
      if (sel.stage !== "dropoff") {
        trace(nextLeg);
        ctx.setLineDash([6, 6]);
        ctx.strokeStyle = sel.stage === "new" ? COLORS.pending : "rgba(224, 72, 43, 0.8)";
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    // Couriers: halos then dots, batched by colour.
    const r = clamp(3.6 * Math.sqrt(cam.scale / 0.15), 3, 6);
    const idle = new Path2D();
    const okHalo = new Path2D();
    const okDot = new Path2D();
    const lateHalo = new Path2D();
    const lateDot = new Path2D();
    const w = ctx.canvas.width / dpr;
    const h = ctx.canvas.height / dpr;
    for (const c of couriers) {
      if (c.state === "break") continue;
      const x = sx(c.x);
      const y = sy(c.y);
      if (x < -10 || y < -10 || x > w + 10 || y > h + 10) continue;
      if (c.state === "idle") {
        idle.moveTo(x + r * 0.75, y);
        idle.arc(x, y, r * 0.75, 0, Math.PI * 2);
        continue;
      }
      const halo = c.late ? lateHalo : okHalo;
      const dot = c.late ? lateDot : okDot;
      halo.moveTo(x + r + 3, y);
      halo.arc(x, y, r + 3, 0, Math.PI * 2);
      dot.moveTo(x + r, y);
      dot.arc(x, y, r, 0, Math.PI * 2);
    }
    ctx.fillStyle = COLORS.idle;
    ctx.fill(idle);
    ctx.fillStyle = "rgba(61, 220, 132, 0.18)";
    ctx.fill(okHalo);
    ctx.fillStyle = "rgba(255, 107, 77, 0.24)";
    ctx.fill(lateHalo);
    ctx.fillStyle = COLORS.ok;
    ctx.fill(okDot);
    ctx.fillStyle = COLORS.late;
    ctx.fill(lateDot);

    // Dark stores sit on top so courier clusters around them don't hide them.
    const hs = 8;
    ctx.beginPath();
    for (const hub of city.hubs) {
      ctx.roundRect(sx(xs[hub.node]) - hs / 2, sy(ys[hub.node]) - hs / 2, hs, hs, 2);
    }
    ctx.fillStyle = "#181b20";
    ctx.fill();
    ctx.lineWidth = 1.75;
    ctx.strokeStyle = "rgba(224, 72, 43, 0.85)";
    ctx.stroke();

    if (sel) {
      // Drop-off pin.
      const px = sx(xs[sel.drop]);
      const py = sy(ys[sel.drop]);
      ctx.beginPath();
      ctx.arc(px, py, 7.5, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.brand;
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = "#ffffff";
      ctx.stroke();
      if (sel.stage !== "dropoff") {
        const hx = sx(xs[sel.pickupNode]);
        const hy = sy(ys[sel.pickupNode]);
        ctx.beginPath();
        ctx.roundRect(hx - 6, hy - 6, 12, 12, 3);
        ctx.fillStyle = "#181b20";
        ctx.fill();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = sel.stage === "new" ? COLORS.pending : COLORS.brand;
        ctx.stroke();
      }
      if (selCourier) {
        const cx = sx(selCourier.x);
        const cy = sy(selCourier.y);
        ctx.beginPath();
        ctx.arc(cx, cy, r + 5, 0, Math.PI * 2);
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = "#ffffff";
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(cx, cy, r + 0.5, 0, Math.PI * 2);
        ctx.fillStyle = selCourier.late ? COLORS.late : COLORS.ok;
        ctx.fill();
      }
    }

    // Reassignment hand-off: a fading link from the old courier to the new one.
    const fx = sim.state.fx;
    if (fx) {
      const t = (now - fx.start) / 1400;
      if (t >= 1) sim.state.fx = null;
      else {
        const c = couriers[fx.courier];
        const alpha = reduced ? 1 : 1 - t;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.moveTo(sx(fx.fromX), sy(fx.fromY));
        ctx.lineTo(sx(c.x), sy(c.y));
        ctx.setLineDash([3, 5]);
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#ffffff";
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.arc(sx(c.x), sy(c.y), reduced ? r + 10 : r + 4 + t * 22, 0, Math.PI * 2);
        ctx.lineWidth = 2;
        ctx.strokeStyle = COLORS.brand;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    }
  };
}

/** Nearest visible courier to a screen point, within `radius` CSS pixels. */
export function hitCourier(sim: Sim, cam: Camera, px: number, py: number, radius = 12): number {
  let best = -1;
  let bd = radius * radius;
  for (const c of sim.couriers) {
    if (c.state === "break") continue;
    const dx = c.x * cam.scale + cam.tx - px;
    const dy = c.y * cam.scale + cam.ty - py;
    const d = dx * dx + dy * dy;
    // Prefer couriers carrying an order when dots overlap.
    const bias = c.order >= 0 ? 0.6 : 1;
    if (d * bias < bd) {
      bd = d * bias;
      best = c.idx;
    }
  }
  return best;
}
