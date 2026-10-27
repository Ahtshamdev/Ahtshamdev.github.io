// Interactive 3D backdrop: a glassy core, orbiting project spheres and a star field.
// It reacts to the pointer and to scrolling, and degrades to a single still frame with reduced motion.
import {
  AdditiveBlending, AmbientLight, BufferAttribute, BufferGeometry, Color, Group, IcosahedronGeometry, Mesh,
  MeshBasicMaterial, MeshStandardMaterial, OctahedronGeometry, PerspectiveCamera, PointLight, Points,
  PointsMaterial, Scene, SphereGeometry, TorusGeometry, TorusKnotGeometry, WebGLRenderer,
} from 'three';
import { projects, sites } from '../data/site';

const css = (name: string, fallback: string) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;

function webglAvailable(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

export function initScene(canvas: HTMLCanvasElement) {
  if (!webglAvailable()) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const small = innerWidth < 720;
  const weak = (navigator.hardwareConcurrency ?? 4) <= 4 || small;

  const renderer = new WebGLRenderer({ canvas, antialias: !weak, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, weak ? 1.25 : 1.75));
  const scene = new Scene();
  const camera = new PerspectiveCamera(48, 1, 0.1, 100);
  camera.position.set(0, 0, 9);

  scene.add(new AmbientLight(0xffffff, 0.55));
  const l1 = new PointLight(0x8a98ff, 60, 40); l1.position.set(4, 3, 5); scene.add(l1);
  const l2 = new PointLight(0x38e8c6, 40, 40); l2.position.set(-5, -3, 4); scene.add(l2);

  // Central core: wire knot around a faceted crystal.
  const core = new Group();
  const knotMat = new MeshBasicMaterial({ color: 0x8a98ff, wireframe: true, transparent: true, opacity: 0.55 });
  const knot = new Mesh(new TorusKnotGeometry(1.5, 0.34, weak ? 120 : 220, weak ? 12 : 18, 2, 3), knotMat);
  const crystalMat = new MeshStandardMaterial({ color: 0x1b1f48, metalness: 0.7, roughness: 0.25, flatShading: true });
  const crystal = new Mesh(new IcosahedronGeometry(0.95, 1), crystalMat);
  const ringMat = new MeshBasicMaterial({ color: 0x38e8c6, transparent: true, opacity: 0.35 });
  const ring = new Mesh(new TorusGeometry(2.6, 0.012, 8, 160), ringMat);
  ring.rotation.x = Math.PI / 2.6;
  core.add(knot, crystal, ring);
  scene.add(core);

  // One orbiting body per piece of work: spheres for apps, octahedra for websites.
  const orbit = new Group();
  const bodies: { mesh: Mesh; radius: number; speed: number; phase: number; tilt: number }[] = [];
  const work = [...projects.map((p) => ({ color: p.color, web: false })), ...sites.map((p) => ({ color: p.color, web: true }))];
  work.forEach((w, i) => {
    const mat = new MeshStandardMaterial({ color: new Color(w.color), metalness: 0.4, roughness: 0.3, emissive: new Color(w.color), emissiveIntensity: 0.35 });
    const mesh = new Mesh(w.web ? new OctahedronGeometry(0.3) : new SphereGeometry(0.26, 24, 24), mat);
    bodies.push({ mesh, radius: 3.2 + (i % 3) * 0.55, speed: 0.18 + i * 0.03, phase: (i / work.length) * Math.PI * 2, tilt: (i % 2 ? 1 : -1) * 0.35 });
    orbit.add(mesh);
  });
  core.add(orbit);

  // Star field.
  const count = weak ? 700 : 1800;
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const r = 9 + Math.random() * 22, th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1);
    pos[i * 3] = r * Math.sin(ph) * Math.cos(th);
    pos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th);
    pos[i * 3 + 2] = r * Math.cos(ph);
  }
  const starGeo = new BufferGeometry();
  starGeo.setAttribute('position', new BufferAttribute(pos, 3));
  const starMat = new PointsMaterial({ color: 0xaab4ff, size: 0.05, transparent: true, opacity: 0.8, blending: AdditiveBlending, depthWrite: false });
  const stars = new Points(starGeo, starMat);
  scene.add(stars);

  const applyTheme = () => {
    const light = document.documentElement.dataset.theme === 'light';
    const accent = new Color(css('--accent', '#8a98ff'));
    const accent2 = new Color(css('--accent-2', '#38e8c6'));
    knotMat.color.copy(accent); ringMat.color.copy(accent2);
    crystalMat.color.set(light ? 0xcfd5ff : 0x1b1f48);
    starMat.color.set(light ? 0x6a76d8 : 0xaab4ff); starMat.opacity = light ? 0.5 : 0.8;
    l1.color.copy(accent); l2.color.copy(accent2);
  };
  applyTheme();
  new MutationObserver(applyTheme).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  let w = 0, h = 0;
  const resize = () => {
    w = innerWidth; h = innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  };
  resize();
  addEventListener('resize', resize, { passive: true });

  // Pointer parallax and scroll progress, both smoothed.
  const target = { x: 0, y: 0 }, cur = { x: 0, y: 0 };
  addEventListener('pointermove', (e) => { target.x = (e.clientX / innerWidth - 0.5) * 2; target.y = (e.clientY / innerHeight - 0.5) * 2; }, { passive: true });
  let scrollP = 0, scrollCur = 0;
  const onScroll = () => { const max = document.documentElement.scrollHeight - innerHeight; scrollP = max > 0 ? scrollY / max : 0; };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  const frame = (t: number) => {
    const time = t / 1000;
    cur.x += (target.x - cur.x) * 0.05; cur.y += (target.y - cur.y) * 0.05;
    scrollCur += (scrollP - scrollCur) * 0.06;
    const wide = w > 900;
    // The core sits to the right on wide screens so the text stays readable, and drifts as you scroll.
    core.scale.setScalar(wide ? 1.2 : 0.55);
    core.position.set(wide ? 4.3 - scrollCur * 4.8 : 0.6, (wide ? 0 : 2.6) + scrollCur * 5, -scrollCur * 3);
    core.rotation.y = time * 0.18 + scrollCur * 6 + cur.x * 0.4;
    core.rotation.x = Math.sin(time * 0.3) * 0.15 + cur.y * 0.25 + scrollCur * 1.5;
    crystal.rotation.y = -time * 0.4; knot.rotation.z = time * 0.1;
    bodies.forEach((b, i) => {
      const a = b.phase + time * b.speed;
      b.mesh.position.set(Math.cos(a) * b.radius, Math.sin(a * 1.3 + i) * b.tilt * 2, Math.sin(a) * b.radius);
      b.mesh.rotation.y = time + i;
    });
    stars.rotation.y = time * 0.012 + scrollCur * 0.8; stars.rotation.x = scrollCur * 0.4;
    camera.position.x = cur.x * 0.6; camera.position.y = -cur.y * 0.4;
    camera.lookAt(0, 0, 0);
    renderer.render(scene, camera);
  };

  canvas.classList.add('ready');
  if (reduced) { frame(0); addEventListener('resize', () => frame(0)); return; }

  let raf = 0, running = true;
  const loop = (t: number) => { if (!running) return; frame(t); raf = requestAnimationFrame(loop); };
  raf = requestAnimationFrame(loop);
  document.addEventListener('visibilitychange', () => {
    running = !document.hidden;
    if (running) raf = requestAnimationFrame(loop); else cancelAnimationFrame(raf);
  });
}
