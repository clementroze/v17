// ── Chaos Mode ────────────────────────────────────────────────────────────────
// Konami easter egg: Comic Sans + rainbow + physics-driven draggable elements.

const GRAVITY      = 0.4;
const DAMPING      = 0.984;
const ANG_DAMPING  = 0.91;
const REPEL_RADIUS = 180;
const REPEL_FORCE  = 20;
const BOUNCE       = 0.42;

interface PhysEl {
  el: HTMLElement;
  ghost: HTMLElement;
  x: number;   // viewport X (fixed positioning)
  y: number;   // viewport Y (fixed positioning)
  vx: number;
  vy: number;
  angle: number;
  angV: number;
  w: number;
  h: number;
  dragging: boolean;
  dragOffX: number;
  dragOffY: number;
}

let items: PhysEl[] = [];
let raf             = 0;
let mouseX          = 0;
let mouseY          = 0;
let active          = false;
let savedScrollY    = 0;

// ── element selection ─────────────────────────────────────────────────────────

const SKIP_CLASSES = new Set([
  'effect-b__bg',
  'effect-b__section',
  'effect-b__inner',
  'navbar__blur-bg',
  'page-transition',
  'page-transition__col',
  'menu-overlay',
  'cs-hero__img',
]);

function shouldSkip(el: HTMLElement): boolean {
  for (const cls of SKIP_CLASSES) {
    if (el.classList.contains(cls)) return true;
  }
  // Skip full-width/full-height wrapper divs
  const r = el.getBoundingClientRect();
  if (r.width > window.innerWidth * 0.95 && r.height > window.innerHeight * 0.5) return true;
  return false;
}

function pickElements(): HTMLElement[] {
  const sel = [
    'h1', 'h2', 'h3', 'h4',
    'p',
    'li',
    '.btn',
    '.project__number',
    '.project__name',
    '.effect-b__btn-wrap',
    '.hero__title',
    '.hero__subtitle',
    '.work-grid__row',
    '.work-list__item',
    '.accordion-row',
    '.about-info',
    '.craft-card',
    '.cs-cover',
    '.cs-meta',
    '.cs-section',
    '.cs-images',
    '.cs-nav__card',
    '.footer__col',
    '.footer__archive',
    '.footer__bottom',
    'img:not(.effect-b__bg):not(.cs-hero__img)',
  ].join(',');

  const all = Array.from(document.querySelectorAll<HTMLElement>(sel));
  const vw  = window.innerWidth;
  const vh  = window.innerHeight;

  const picked: HTMLElement[] = [];
  outer: for (const el of all) {
    if (shouldSkip(el)) continue;
    for (const p of picked) { if (p.contains(el)) continue outer; }
    const r = el.getBoundingClientRect();
    if (r.width < 4 || r.height < 4) continue;
    // Only pick elements currently visible in the viewport (scroll is locked)
    if (r.bottom < 0 || r.top > vh || r.right < 0 || r.left > vw) continue;
    picked.push(el);
  }
  return picked;
}

function rand(a: number, b: number) { return a + Math.random() * (b - a); }

// ── activation ────────────────────────────────────────────────────────────────

export function enterChaos() {
  if (active) return;
  active = true;

  // Lock scroll: freeze body at current scroll position
  savedScrollY = window.scrollY;
  document.body.style.position   = 'fixed';
  document.body.style.top        = `-${savedScrollY}px`;
  document.body.style.left       = '0';
  document.body.style.right      = '0';
  document.body.style.overflow   = 'hidden';

  const els = pickElements();

  for (const el of els) {
    const rect = el.getBoundingClientRect(); // viewport coords

    // Ghost keeps layout from collapsing
    const ghost = document.createElement('div');
    ghost.style.cssText = `width:${rect.width}px;height:${rect.height}px;visibility:hidden;pointer-events:none;flex-shrink:0;display:block;`;
    el.parentNode?.insertBefore(ghost, el);

    // Save original style so we can restore it exactly
    el.dataset.chaosOrigStyle = el.getAttribute('style') ?? '';

    el.style.cssText = (el.dataset.chaosOrigStyle ? el.dataset.chaosOrigStyle + ';' : '') +
      `position:fixed!important;left:${rect.left}px!important;top:${rect.top}px!important;` +
      `width:${rect.width}px!important;margin:0!important;z-index:9000;` +
      `cursor:grab;user-select:none;will-change:transform;box-sizing:border-box;`;

    const item: PhysEl = {
      el, ghost,
      x: rect.left, y: rect.top,
      vx: rand(-4, 4), vy: rand(-8, -2),
      angle: 0, angV: rand(-4, 4),
      w: rect.width, h: rect.height,
      dragging: false, dragOffX: 0, dragOffY: 0,
    };

    const handler = (e: MouseEvent) => onMouseDown(e, item);
    (el as any).__chaosDown = handler;
    el.addEventListener('mousedown', handler, { passive: false });

    items.push(item);
  }

  window.addEventListener('mousemove', onMouseMove, { passive: true });
  window.addEventListener('mouseup',   onMouseUp);
  raf = requestAnimationFrame(tick);
}

// ── exit ─────────────────────────────────────────────────────────────────────
// NOTE: does NOT remove .chaos from <html> — caller does that after the wipe.
// onDone is called after elements are flung + faded, DOM is restored.

export function exitChaos(onDone: () => void) {
  if (!active) { onDone(); return; }

  cancelAnimationFrame(raf);
  window.removeEventListener('mousemove', onMouseMove);
  window.removeEventListener('mouseup',   onMouseUp);

  // Give everything a big upward fling
  for (const item of items) {
    item.vy      = rand(-30, -18);
    item.vx      = rand(-12, 12);
    item.angV    = rand(-10, 10);
    item.dragging = false;
  }

  // Physics-only loop for ~600ms — let them fly off screen
  const flyStart = performance.now();
  const FLY_MS   = 600;

  function flyTick(now: number) {
    for (const item of items) {
      item.vy += GRAVITY;
      item.x  += item.vx;
      item.y  += item.vy;
      item.angle += item.angV;
      applyPos(item);
    }
    if (now - flyStart < FLY_MS) {
      requestAnimationFrame(flyTick);
    } else {
      // Fade out
      for (const item of items) {
        item.el.style.transition = 'opacity 220ms ease';
        item.el.style.opacity    = '0';
      }
      setTimeout(() => {
        restoreDOM();
        onDone();
      }, 240);
    }
  }

  requestAnimationFrame(flyTick);
}

// Restore DOM elements but leave .chaos on <html> — caller removes it.
function restoreDOM() {
  active = false;

  for (const item of items) {
    const handler = (item.el as any).__chaosDown;
    if (handler) item.el.removeEventListener('mousedown', handler);
    delete (item.el as any).__chaosDown;

    const orig = item.el.dataset.chaosOrigStyle ?? '';
    if (orig) {
      item.el.setAttribute('style', orig);
    } else {
      item.el.removeAttribute('style');
    }
    delete item.el.dataset.chaosOrigStyle;

    item.ghost.remove();
  }

  items = [];

  // Restore scroll
  document.body.style.position = '';
  document.body.style.top      = '';
  document.body.style.left     = '';
  document.body.style.right    = '';
  document.body.style.overflow = '';
  window.scrollTo(0, savedScrollY);
}

// ── physics tick ──────────────────────────────────────────────────────────────

function tick() {
  if (!active) return;

  const vw = window.innerWidth;
  const vh = window.innerHeight;

  for (const item of items) {
    if (item.dragging) { applyPos(item); continue; }

    // Repulsion (viewport coords — both mouse and elements are fixed)
    const cx = item.x + item.w / 2;
    const cy = item.y + item.h / 2;
    const dx = cx - mouseX;
    const dy = cy - mouseY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < REPEL_RADIUS && dist > 0.1) {
      const s = (1 - dist / REPEL_RADIUS) * REPEL_FORCE;
      item.vx  += (dx / dist) * s;
      item.vy  += (dy / dist) * s;
      item.angV += (Math.random() - 0.5) * s * 0.35;
    }

    item.vy   += GRAVITY;
    item.vx   *= DAMPING;
    item.vy   *= DAMPING;
    item.angV *= ANG_DAMPING;
    item.x    += item.vx;
    item.y    += item.vy;
    item.angle += item.angV;

    // Walls
    if (item.x < 0)            { item.x = 0;            item.vx  =  Math.abs(item.vx)  * BOUNCE; item.angV *= -0.5; }
    if (item.x + item.w > vw)  { item.x = vw - item.w;  item.vx  = -Math.abs(item.vx)  * BOUNCE; item.angV *= -0.5; }
    if (item.y < 0)            { item.y = 0;             item.vy  =  Math.abs(item.vy)  * BOUNCE; }
    // Floor
    if (item.y + item.h > vh)  {
      item.y  = vh - item.h;
      item.vy = -Math.abs(item.vy) * BOUNCE;
      item.vx *= 0.86;
      item.angV *= 0.65;
      if (Math.abs(item.vy) < 0.6) item.vy = 0;
    }

    applyPos(item);
  }

  raf = requestAnimationFrame(tick);
}

function applyPos(item: PhysEl) {
  item.el.style.left      = `${item.x}px`;
  item.el.style.top       = `${item.y}px`;
  item.el.style.transform = `rotate(${item.angle}deg)`;
}

// ── drag ─────────────────────────────────────────────────────────────────────

function onMouseMove(e: MouseEvent) {
  mouseX = e.clientX;
  mouseY = e.clientY;
  for (const item of items) {
    if (!item.dragging) continue;
    const nx = e.clientX - item.dragOffX;
    const ny = e.clientY - item.dragOffY;
    item.vx = nx - item.x;
    item.vy = ny - item.y;
    item.x  = nx;
    item.y  = ny;
  }
}

function onMouseDown(e: MouseEvent, item: PhysEl) {
  e.preventDefault();
  item.dragging = true;
  item.dragOffX = e.clientX - item.x;
  item.dragOffY = e.clientY - item.y;
  item.vx = 0; item.vy = 0;
  item.el.style.cursor = 'grabbing';
  item.el.style.zIndex = '9999';
}

function onMouseUp() {
  for (const item of items) {
    if (!item.dragging) continue;
    item.dragging        = false;
    item.el.style.cursor = 'grab';
    item.el.style.zIndex = '9000';
    item.angV = item.vx * 0.12;
  }
}
