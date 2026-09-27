import { buildCity, findPath, type City } from "./city";
import { createRng, type Rng } from "./rng";

/**
 * The whole shift lives here as plain mutable objects. The map loop reads it
 * every frame; React only sees throttled snapshots.
 */

export const TIME_SCALE = 10; // simulated seconds per real second
const COURIER_COUNT = 350;
const TARGET_OPEN = 120;
const PICKUP_DWELL = 240;
const HANDOVER_DWELL = 35;
const DROP_DWELL = 30;
const PROMISE_MIN = 20;
const PROMISE_MAX = 40;
const SHIFT_START = 12 * 3600 + 4 * 60; // 12:04

export type CourierState = "idle" | "pickup" | "dropoff" | "break";
export type Stage = "new" | "pickup" | "dropoff";

export type Courier = {
  idx: number;
  name: string;
  x: number;
  y: number;
  speed: number;
  /** Traffic multiplier for the current job (1 = clear roads). */
  jam: number;
  path: number[];
  cum: number[];
  seg: number;
  along: number;
  state: CourierState;
  order: number; // order id or -1
  dwell: number;
  home: number; // hub index
  late: boolean;
  prevNode: number;
  breakLeft: number;
};

export type Order = {
  id: number;
  num: number;
  area: string;
  drop: number;
  hub: number;
  pickupNode: number;
  pickupDwell: number;
  createdAt: number;
  promisedAt: number;
  assignAfter: number;
  courier: number;
  stage: Stage;
  progBase: number;
  progTotal: number;
  eta: number;
  late: boolean;
  handover: boolean;
};

export type OrderView = {
  id: number;
  num: number;
  area: string;
  courier: string | null;
  stage: Stage;
  etaMin: number;
  late: boolean;
  createdAt: number;
  progress: number;
  distKm: number;
  handover: boolean;
  hub: string;
};

export type Kpis = { onShift: number; open: number; atRisk: number; avgEta: number; delivered: number };
export type Snapshot = { orders: OrderView[]; kpis: Kpis; clock: string };

export type ReassignFx = { fromX: number; fromY: number; courier: number; start: number };

const FIRST = [
  "Bilal", "Usman", "Hira", "Ali", "Sara", "Fahad", "Ayesha", "Zainab", "Hamza", "Imran", "Kamran", "Asad",
  "Faisal", "Rizwan", "Waqas", "Noman", "Adeel", "Shahid", "Tariq", "Junaid", "Saad", "Danish", "Owais",
  "Salman", "Nadia", "Mehwish", "Sana", "Iqra", "Maryam", "Rabia", "Amna", "Fatima", "Sidra", "Kiran",
  "Umair", "Arslan", "Haris", "Talha", "Zeeshan", "Babar", "Waseem", "Irfan", "Naveed", "Sohail", "Yasir",
  "Ahsan", "Areeb", "Shoaib", "Hassan", "Farhan", "Nabeel", "Muneeb", "Khurram", "Aqib", "Rehan", "Mahnoor",
];
const INITIALS = "ABCDFGHIJKLMNRSTUWYZ";

export type Sim = ReturnType<typeof createSim>;

export function createSim(seed = 48213) {
  const city: City = buildCity(seed);
  const rng: Rng = createRng(seed ^ 0x5eed);
  const { xs, ys, adj } = city;

  const couriers: Courier[] = [];
  const orders = new Map<number, Order>();
  let now = 0;
  let orderSeq = 100;
  let spawnAcc = 0;
  let delivered = 0;
  let etaClock = 0;
  const state = {
    selected: -1 as number,
    fx: null as ReassignFx | null,
  };

  const setPath = (c: Courier, path: number[]) => {
    c.path = path;
    c.cum = [0];
    for (let i = 1; i < path.length; i++) {
      c.cum.push(c.cum[i - 1] + Math.hypot(xs[path[i]] - xs[path[i - 1]], ys[path[i]] - ys[path[i - 1]]));
    }
    c.seg = 0;
  };

  const remaining = (c: Courier) => c.cum[c.cum.length - 1] - (c.cum[c.seg] + c.along);

  /** Point the courier at `target`, continuing smoothly from the edge it is on. */
  const routeTo = (c: Courier, target: number) => {
    const from = c.path[c.seg];
    const to = c.path[c.seg + 1];
    const along = c.along;
    if (to === undefined || to === from || along <= 0) {
      const start = to !== undefined && along > 0 ? to : from;
      setPath(c, findPath(city, start, target));
      c.along = 0;
      return;
    }
    setPath(c, [from, ...findPath(city, to, target)]);
    c.along = along;
  };

  const nearestNode = (x: number, y: number) => {
    let best = city.main[0];
    let bd = Infinity;
    for (const n of city.main) {
      const d = (xs[n] - x) ** 2 + (ys[n] - y) ** 2;
      if (d < bd) {
        bd = d;
        best = n;
      }
    }
    return best;
  };

  // Couriers start spread around their home hubs.
  const usedNames = new Set<string>();
  for (let i = 0; i < COURIER_COUNT; i++) {
    let name = "";
    do name = `${rng.pick(FIRST)} ${INITIALS[rng.int(0, INITIALS.length)]}.`;
    while (usedNames.has(name) && usedNames.size < FIRST.length * INITIALS.length);
    usedNames.add(name);
    const home = i % city.hubs.length;
    const hubNode = city.hubs[home].node;
    const start = nearestNode(xs[hubNode] + rng.range(-1400, 1400), ys[hubNode] + rng.range(-1100, 1100));
    const c: Courier = {
      idx: i,
      name,
      x: xs[start],
      y: ys[start],
      speed: rng.range(3.4, 5.4),
      jam: 1,
      path: [start],
      cum: [0],
      seg: 0,
      along: 0,
      state: "idle",
      order: -1,
      dwell: 0,
      home,
      late: false,
      prevNode: -1,
      breakLeft: 0,
    };
    couriers.push(c);
  }

  const areaHubDistance = (areaIdx: number) => city.hubs.map((h, i) => ({ i, d: Math.hypot(xs[h.node] - city.areas[areaIdx].x, ys[h.node] - city.areas[areaIdx].y) })).sort((a, b) => a.d - b.d);
  const hubRank = city.areas.map((_, i) => areaHubDistance(i).map((h) => h.i));

  const spawnOrder = () => {
    const areaIdx = rng.int(0, city.areas.length);
    const area = city.areas[areaIdx];
    const drop = nearestNode(area.x + rng.range(-800, 800), area.y + rng.range(-650, 650));
    const r = rng.next();
    const hub = hubRank[areaIdx][r < 0.4 ? 0 : r < 0.7 ? 1 : r < 0.88 ? 2 : 3];
    orderSeq++;
    const o: Order = {
      id: orderSeq,
      num: 48000 + (orderSeq % 1000),
      area: area.name,
      drop,
      hub,
      pickupNode: city.hubs[hub].node,
      pickupDwell: rng.range(150, 360),
      createdAt: now,
      promisedAt: now + rng.range(PROMISE_MIN, PROMISE_MAX) * 60,
      assignAfter: now + rng.range(20, 150),
      courier: -1,
      stage: "new",
      progBase: 0,
      progTotal: 1,
      eta: 0,
      late: false,
      handover: false,
    };
    orders.set(o.id, o);
  };

  const planRemaining = (o: Order, c: Courier) => {
    if (o.stage === "pickup") {
      const legB = Math.hypot(xs[o.drop] - xs[o.pickupNode], ys[o.drop] - ys[o.pickupNode]) * 1.25;
      const atHub = c.dwell > 0;
      return { dist: (atHub ? 0 : remaining(c)) + legB, dwell: (atHub ? c.dwell : o.pickupDwell) + DROP_DWELL };
    }
    return { dist: c.dwell > 0 ? 0 : remaining(c), dwell: c.dwell > 0 ? c.dwell : DROP_DWELL };
  };

  const assign = (o: Order, c: Courier) => {
    c.state = "pickup";
    c.order = o.id;
    c.jam = rng.chance(0.16) ? rng.range(0.3, 0.55) : rng.range(0.85, 1.1);
    c.dwell = 0;
    o.courier = c.idx;
    o.stage = "pickup";
    routeTo(c, o.pickupNode);
    const plan = planRemaining(o, c);
    o.progTotal = Math.max(1, plan.dist);
  };

  const nearestIdle = (x: number, y: number, exclude = -1) => {
    let best: Courier | null = null;
    let bd = Infinity;
    for (const c of couriers) {
      if (c.state !== "idle" || c.idx === exclude) continue;
      const d = (c.x - x) ** 2 + (c.y - y) ** 2;
      if (d < bd) {
        bd = d;
        best = c;
      }
    }
    return best;
  };

  const release = (c: Courier) => {
    c.state = "idle";
    c.order = -1;
    c.dwell = 0;
    c.late = false;
    c.jam = 1;
    const from = c.path[c.seg];
    const to = c.path[c.seg + 1];
    const along = c.along;
    if (to !== undefined && along > 0) {
      setPath(c, [from, to]);
      c.along = along;
    } else {
      setPath(c, [c.path[c.path.length - 1]]);
      c.along = 0;
    }
  };

  const idleStep = (c: Courier) => {
    // Pick the next street to drift along, staying loosely near the home hub.
    const at = c.path[c.path.length - 1];
    const hub = city.hubs[c.home].node;
    const far = Math.hypot(xs[at] - xs[hub], ys[at] - ys[hub]) > 1500;
    const options = adj[at].filter((n) => n !== c.prevNode);
    const pool = options.length ? options : adj[at];
    let next = pool[rng.int(0, pool.length)];
    if (far) {
      let bd = Infinity;
      for (const n of pool) {
        const d = Math.hypot(xs[n] - xs[hub], ys[n] - ys[hub]);
        if (d < bd) {
          bd = d;
          next = n;
        }
      }
    }
    c.prevNode = at;
    setPath(c, [at, next]);
    c.along = 0;
  };

  const updateEtas = () => {
    const avgSpeed = 5.2;
    for (const o of orders.values()) {
      if (o.stage === "new") {
        const hubToDrop = Math.hypot(xs[o.drop] - xs[o.pickupNode], ys[o.drop] - ys[o.pickupNode]) * 1.25;
        o.eta = Math.max(o.assignAfter - now, 20) + 1400 / avgSpeed + PICKUP_DWELL + hubToDrop / avgSpeed + DROP_DWELL;
      } else {
        const c = couriers[o.courier];
        const plan = planRemaining(o, c);
        o.eta = plan.dist / (c.speed * c.jam) + plan.dwell;
      }
      o.late = now + o.eta > o.promisedAt;
      if (o.courier >= 0) couriers[o.courier].late = o.late;
    }
  };

  const moveCourier = (c: Courier, dt: number) => {
    if (c.state === "break") {
      c.breakLeft -= dt;
      if (c.breakLeft <= 0) c.state = "idle";
      return;
    }
    if (c.dwell > 0) {
      c.dwell -= dt;
      if (c.dwell <= 0) arrive(c, true);
      return;
    }
    let d = c.speed * dt * (c.state === "idle" ? 0.45 : c.jam);
    while (d > 0) {
      if (c.seg >= c.path.length - 1) {
        if (c.state === "idle") {
          if (c.breakLeft <= 0 && rng.chance(0.0035)) {
            c.state = "break";
            c.breakLeft = rng.range(300, 900);
            return;
          }
          idleStep(c);
          continue;
        }
        arrive(c, false);
        break;
      }
      const edge = c.cum[c.seg + 1] - c.cum[c.seg];
      const left = edge - c.along;
      if (d < left) {
        c.along += d;
        d = 0;
      } else {
        d -= left;
        c.seg++;
        c.along = 0;
      }
    }
    const a = c.path[c.seg];
    const b = c.path[Math.min(c.seg + 1, c.path.length - 1)];
    const edge = (c.cum[c.seg + 1] ?? c.cum[c.seg]) - c.cum[c.seg];
    const t = edge > 0 ? c.along / edge : 0;
    c.x = xs[a] + (xs[b] - xs[a]) * t;
    c.y = ys[a] + (ys[b] - ys[a]) * t;
  };

  function arrive(c: Courier, dwellDone: boolean) {
    const o = orders.get(c.order);
    if (!o) {
      release(c);
      return;
    }
    if (!dwellDone) {
      c.dwell = o.stage === "pickup" ? o.pickupDwell : DROP_DWELL;
      return;
    }
    if (o.stage === "pickup") {
      o.stage = "dropoff";
      c.state = "dropoff";
      routeTo(c, o.drop);
      return;
    }
    orders.delete(o.id);
    delivered++;
    if (state.selected === o.id) state.selected = -1;
    release(c);
  }

  const step = (dt: number) => {
    now += dt;
    // Keep the open order count hovering around the target.
    const open = orders.size;
    const rate = 0.09 * Math.min(3, Math.max(0.2, 1 + (TARGET_OPEN - open) / 20));
    spawnAcc += dt * rate;
    while (spawnAcc >= 1) {
      spawnAcc -= 1;
      spawnOrder();
    }
    let budget = 3;
    for (const o of orders.values()) {
      if (budget <= 0) break;
      if (o.stage !== "new" || o.assignAfter > now) continue;
      const hub = o.pickupNode;
      const c = nearestIdle(xs[hub], ys[hub]);
      if (!c) break;
      assign(o, c);
      budget--;
    }
    for (const c of couriers) moveCourier(c, dt);
    etaClock += dt;
    if (etaClock >= 4) {
      etaClock = 0;
      updateEtas();
    }
  };

  const advance = (dt: number) => {
    // Sub-step so long frames (tab restore, slow devices) stay stable.
    let left = dt;
    while (left > 0) {
      const s = Math.min(left, 2);
      step(s);
      left -= s;
    }
  };

  // Warm up so the page opens mid-shift with a full queue.
  for (let i = 0; i < 1500; i++) step(1.5);
  updateEtas();

  const clock = () => {
    const t = Math.floor(SHIFT_START + now);
    const h = Math.floor(t / 3600) % 24;
    const m = Math.floor((t % 3600) / 60);
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${h12}:${String(m).padStart(2, "0")} ${h < 12 ? "am" : "pm"}`;
  };

  const snapshot = (): Snapshot => {
    updateEtas();
    const list: OrderView[] = [];
    let atRisk = 0;
    let etaSum = 0;
    for (const o of orders.values()) {
      const c = o.courier >= 0 ? couriers[o.courier] : null;
      let progress = 0;
      let dist = Math.hypot(xs[o.drop] - xs[o.pickupNode], ys[o.drop] - ys[o.pickupNode]) * 1.25;
      if (c) {
        const plan = planRemaining(o, c);
        dist = plan.dist;
        progress = o.progBase + (1 - o.progBase) * Math.min(1, Math.max(0, 1 - plan.dist / o.progTotal));
      }
      const etaMin = Math.max(1, Math.ceil(o.eta / 60));
      if (o.late) atRisk++;
      etaSum += etaMin;
      list.push({
        id: o.id,
        num: o.num,
        area: o.area,
        courier: c ? c.name : null,
        stage: o.stage,
        etaMin,
        late: o.late,
        createdAt: o.createdAt,
        progress,
        distKm: Math.round(dist / 100) / 10,
        handover: o.handover,
        hub: city.hubs[o.hub].area,
      });
    }
    let onShift = 0;
    for (const c of couriers) if (c.state !== "break") onShift++;
    return {
      orders: list,
      clock: clock(),
      kpis: {
        onShift,
        open: list.length,
        atRisk,
        avgEta: list.length ? Math.round(etaSum / list.length) : 0,
        delivered,
      },
    };
  };

  /** Hand the order to the nearest free courier. Returns the new courier's name. */
  const reassign = (orderId: number, realNow: number): { ok: true; name: string; assigned: boolean } | { ok: false; reason: string } => {
    const o = orders.get(orderId);
    if (!o) return { ok: false, reason: "That order has already been delivered." };
    const old = o.courier >= 0 ? couriers[o.courier] : null;
    const ref = old ?? { x: xs[o.pickupNode], y: ys[o.pickupNode] };
    const next = nearestIdle(ref.x, ref.y, old ? old.idx : -1);
    if (!next) return { ok: false, reason: "No free courier nearby right now." };
    if (old) {
      const plan = planRemaining(o, old);
      const progress = o.progBase + (1 - o.progBase) * Math.min(1, Math.max(0, 1 - plan.dist / o.progTotal));
      if (o.stage === "dropoff") {
        // The parcel is already on a bike: meet the old courier where they are.
        o.pickupNode = nearestNode(old.x, old.y);
        o.pickupDwell = HANDOVER_DWELL;
        o.handover = true;
      }
      state.fx = { fromX: old.x, fromY: old.y, courier: next.idx, start: realNow };
      release(old);
      o.stage = "pickup";
      assign(o, next);
      o.progBase = progress;
    } else {
      state.fx = { fromX: ref.x, fromY: ref.y, courier: next.idx, start: realNow };
      assign(o, next);
    }
    updateEtas();
    return { ok: true, name: next.name, assigned: !old };
  };

  const courierOrder = (idx: number) => couriers[idx]?.order ?? -1;
  const select = (id: number | null) => {
    state.selected = id ?? -1;
  };

  return {
    city,
    couriers,
    orders,
    state,
    advance,
    snapshot,
    reassign,
    courierOrder,
    select,
    get now() {
      return now;
    },
  };
}
