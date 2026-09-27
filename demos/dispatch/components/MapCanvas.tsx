"use client";

import { useEffect, useEffectEvent, useRef } from "react";
import { createDynamicRenderer, drawCity, hitCourier, type Camera } from "@/lib/render";
import { TIME_SCALE, type Sim } from "@/lib/sim";
import styles from "./MapCanvas.module.css";

type Props = {
  sim: Sim;
  paused: boolean;
  speed: number;
  reducedMotion: boolean;
  selectedId: number | null;
  onPickCourier: (courierIdx: number) => void;
};

type View = Camera & { fit: number; w: number; h: number; dirty: boolean; anim: null | { fromS: number; fromX: number; fromY: number; toS: number; toX: number; toY: number; start: number } };

/** The part of the canvas not covered by floating panels (detail card, mobile sheet). */
function visibleRect(canvas: HTMLCanvasElement, v: { w: number; h: number }) {
  const c = canvas.getBoundingClientRect();
  const out = { x0: 0, y0: 0, x1: v.w, y1: v.h };
  document.querySelectorAll<HTMLElement>("[data-obstruct]").forEach((el) => {
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height || r.right <= c.left || r.left >= c.right || r.bottom <= c.top || r.top >= c.bottom) return;
    if (r.top - c.top < c.height / 3) out.y0 = Math.max(out.y0, r.bottom - c.top);
    else out.y1 = Math.min(out.y1, r.top - c.top);
  });
  if (out.y1 - out.y0 < 120) return { x0: 0, y0: 0, x1: v.w, y1: v.h };
  return out;
}

const MAX_ZOOM = 5;

export default function MapCanvas({ sim, reducedMotion, selectedId, onPickCourier, paused, speed }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewRef = useRef<View>({ scale: 1, tx: 0, ty: 0, fit: 1, w: 0, h: 0, dirty: true, anim: null });

  const advance = useEffectEvent((dt: number) => {
    if (!paused) sim.advance(dt * TIME_SCALE * speed);
  });

  const pick = useEffectEvent((idx: number) => onPickCourier(idx));

  const clampView = (v: View) => {
    const W = sim.city.width * v.scale;
    const H = sim.city.height * v.scale;
    v.tx = W <= v.w ? (v.w - W) / 2 : Math.min(0, Math.max(v.w - W, v.tx));
    v.ty = H <= v.h ? (v.h - H) / 2 : Math.min(0, Math.max(v.h - H, v.ty));
  };

  const zoomAt = (factor: number, px: number, py: number) => {
    const v = viewRef.current;
    const next = Math.max(v.fit, Math.min(v.fit * MAX_ZOOM, v.scale * factor));
    const k = next / v.scale;
    v.tx = px - (px - v.tx) * k;
    v.ty = py - (py - v.ty) * k;
    v.scale = next;
    v.anim = null;
    clampView(v);
    v.dirty = true;
  };

  // Frame the selected delivery (courier, pickup and drop-off) in the part of the map not covered by panels.
  useEffect(() => {
    if (selectedId === null) return;
    const o = sim.orders.get(selectedId);
    const canvas = canvasRef.current;
    if (!o || !canvas) return;
    const { xs, ys } = sim.city;
    const pts: [number, number][] = [[xs[o.drop], ys[o.drop]]];
    if (o.courier >= 0) pts.push([sim.couriers[o.courier].x, sim.couriers[o.courier].y]);
    if (o.stage !== "dropoff") pts.push([xs[o.pickupNode], ys[o.pickupNode]]);
    const bx0 = Math.min(...pts.map((p) => p[0]));
    const bx1 = Math.max(...pts.map((p) => p[0]));
    const by0 = Math.min(...pts.map((p) => p[1]));
    const by1 = Math.max(...pts.map((p) => p[1]));

    const v = viewRef.current;
    const vis = visibleRect(canvas, v);
    const pad = 36;
    const availW = Math.max(60, vis.x1 - vis.x0 - pad * 2);
    const availH = Math.max(60, vis.y1 - vis.y0 - pad * 2);
    const bw = Math.max(bx1 - bx0, 250);
    const bh = Math.max(by1 - by0, 250);
    const fitRoute = Math.min(availW / bw, availH / bh);
    let s = v.scale;
    if (bw * s > availW || bh * s > availH) s = fitRoute;
    else if (bw * s < availW * 0.3 && bh * s < availH * 0.3) s = Math.max(s, Math.min(fitRoute * 0.6, v.fit * 3));
    s = Math.max(v.fit, Math.min(v.fit * MAX_ZOOM, s));

    const inside = pts.every(([x, y]) => {
      const px = x * v.scale + v.tx;
      const py = y * v.scale + v.ty;
      return px > vis.x0 + pad && px < vis.x1 - pad && py > vis.y0 + pad && py < vis.y1 - pad;
    });
    if (inside && s === v.scale) return;

    const cx = (bx0 + bx1) / 2;
    const cy = (by0 + by1) / 2;
    const target = { ...v, scale: s, tx: (vis.x0 + vis.x1) / 2 - cx * s, ty: (vis.y0 + vis.y1) / 2 - cy * s };
    clampView(target);
    if (reducedMotion) {
      v.scale = target.scale;
      v.tx = target.tx;
      v.ty = target.ty;
      v.dirty = true;
    } else {
      v.anim = { fromS: v.scale, fromX: v.tx, fromY: v.ty, toS: target.scale, toX: target.tx, toY: target.ty, start: performance.now() };
    }
    // clampView is stable for a given sim.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, sim, reducedMotion]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;
    const v = viewRef.current;
    const offscreen = document.createElement("canvas");
    const offCtx = offscreen.getContext("2d", { alpha: false });
    if (!offCtx) return;
    const drawDynamic = createDynamicRenderer(sim);
    let dpr = 1;
    let raf = 0;
    let last = 0;
    let lastDraw = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const prevFit = v.fit;
      const hadSize = v.w > 0;
      // Keep the world point at the centre of the view stable across resizes.
      const cx = hadSize ? (v.w / 2 - v.tx) / v.scale : sim.city.width * 0.5;
      const cy = hadSize ? (v.h / 2 - v.ty) / v.scale : sim.city.height * 0.5;
      v.w = rect.width;
      v.h = rect.height;
      canvas.width = offscreen.width = Math.round(rect.width * dpr);
      canvas.height = offscreen.height = Math.round(rect.height * dpr);
      v.fit = Math.max(v.w / sim.city.width, v.h / sim.city.height);
      v.scale = hadSize ? Math.max(v.fit, v.scale * (v.fit / prevFit)) : v.fit;
      v.tx = v.w / 2 - cx * v.scale;
      v.ty = v.h / 2 - cy * v.scale;
      clampView(v);
      v.dirty = true;
      lastDraw = 0;
    };

    const render = (now: number) => {
      if (v.anim) {
        const t = Math.min(1, (now - v.anim.start) / 550);
        const e = 1 - Math.pow(1 - t, 3);
        v.scale = v.anim.fromS + (v.anim.toS - v.anim.fromS) * e;
        v.tx = v.anim.fromX + (v.anim.toX - v.anim.fromX) * e;
        v.ty = v.anim.fromY + (v.anim.toY - v.anim.fromY) * e;
        v.dirty = true;
        if (t >= 1) v.anim = null;
      }
      if (v.dirty) {
        drawCity(offCtx, sim.city, v, v.w, v.h, dpr);
        v.dirty = false;
      }
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.drawImage(offscreen, 0, 0);
      drawDynamic(ctx, v, dpr, now, reducedMotion);
    };

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = last ? Math.min(0.1, (now - last) / 1000) : 0;
      last = now;
      advance(dt);
      // With reduced motion, couriers step once a second instead of gliding.
      if (reducedMotion && !v.dirty && !v.anim && !sim.state.fx && now - lastDraw < 1000) return;
      lastDraw = now;
      render(now);
    };

    const start = () => {
      if (raf) return;
      last = 0;
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };
    const onVisibility = () => (document.hidden ? stop() : start());

    const ro = new ResizeObserver(() => {
      resize();
      render(performance.now());
    });
    ro.observe(canvas);
    resize();
    document.addEventListener("visibilitychange", onVisibility);
    if (!document.hidden) start();

    // Pan, wheel zoom, pinch zoom and click-to-select.
    const pointers = new Map<number, { x: number; y: number }>();
    let downAt: { x: number; y: number } | null = null;
    let moved = false;
    let pinchDist = 0;
    const local = (e: PointerEvent | WheelEvent) => {
      const rect = canvas.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    const onDown = (e: PointerEvent) => {
      canvas.setPointerCapture(e.pointerId);
      const p = local(e);
      pointers.set(e.pointerId, p);
      if (pointers.size === 1) {
        downAt = p;
        moved = false;
      } else if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        pinchDist = Math.hypot(a.x - b.x, a.y - b.y);
        moved = true;
      }
    };
    const onMove = (e: PointerEvent) => {
      const p = local(e);
      const prev = pointers.get(e.pointerId);
      if (!prev) {
        canvas.style.cursor = sim.couriers[hitCourier(sim, v, p.x, p.y)]?.order >= 0 ? "pointer" : "";
        return;
      }
      if (pointers.size === 2) {
        pointers.set(e.pointerId, p);
        const [a, b] = [...pointers.values()];
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        if (pinchDist > 0) zoomAt(dist / pinchDist, (a.x + b.x) / 2, (a.y + b.y) / 2);
        pinchDist = dist;
        return;
      }
      if (downAt && Math.hypot(p.x - downAt.x, p.y - downAt.y) > 4) moved = true;
      if (moved) {
        v.tx += p.x - prev.x;
        v.ty += p.y - prev.y;
        v.anim = null;
        clampView(v);
        v.dirty = true;
        canvas.style.cursor = "grabbing";
      }
      pointers.set(e.pointerId, p);
    };
    const onUp = (e: PointerEvent) => {
      const had = pointers.delete(e.pointerId);
      if (pointers.size < 2) pinchDist = 0;
      canvas.style.cursor = "";
      if (had && !moved && pointers.size === 0 && downAt) {
        const p = local(e);
        const idx = hitCourier(sim, v, p.x, p.y);
        pick(idx);
      }
      if (pointers.size === 0) downAt = null;
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const p = local(e);
      zoomAt(Math.exp(-e.deltaY * 0.0015), p.x, p.y);
    };
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);
    canvas.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      stop();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
      canvas.removeEventListener("wheel", onWheel);
    };
    // clampView/zoomAt only close over `sim` and the view ref.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sim, reducedMotion]);

  const zoomButton = (factor: number) => {
    const v = viewRef.current;
    zoomAt(factor, v.w / 2, v.h / 2);
  };
  const resetView = () => {
    const v = viewRef.current;
    v.scale = v.fit;
    v.tx = v.w / 2 - (sim.city.width / 2) * v.scale;
    v.ty = v.h / 2 - (sim.city.height / 2) * v.scale;
    v.anim = null;
    clampView(v);
    v.dirty = true;
  };

  return (
    <div className={styles.wrap}>
      <canvas
        ref={canvasRef}
        className={styles.canvas}
        role="img"
        aria-label="Live map of Lahore showing courier positions. Green couriers are on time, red couriers are running late. Use the order queue to select a delivery."
      />
      <div className={styles.zoom} role="group" aria-label="Map zoom">
        <button type="button" onClick={() => zoomButton(1.4)} aria-label="Zoom in">
          <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 3v10M3 8h10" /></svg>
        </button>
        <button type="button" onClick={() => zoomButton(1 / 1.4)} aria-label="Zoom out">
          <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h10" /></svg>
        </button>
        <button type="button" onClick={resetView} aria-label="Show whole city">
          <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 6V3h3M10 3h3v3M13 10v3h-3M6 13H3v-3" /></svg>
        </button>
      </div>
    </div>
  );
}
