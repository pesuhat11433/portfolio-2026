/**
 * circular-gallery.js
 * 3-D cylindrical drag gallery — polaroid / scrapbook aesthetic
 */

export function initCircularGallery(container) {

  /* ── data ─────────────────────────────────────── */
  const ITEMS = [
    {
      video: 'Video/JP_sakura-0325-02.mp4',
      thumb: 'Video/thumbs/sakura02.jpg',
      label: 'Sakura Series 02',
      tag:   'Motion',
      tagClass: 'work-tag',
    },
    {
      video: 'Video/JP_sakura-0325.mp4',
      thumb: 'Video/thumbs/sakura.jpg',
      label: 'Sakura Series',
      tag:   'Motion',
      tagClass: 'work-tag',
    },
    {
      video: 'Video/max%E9%96%8B%E5%B1%8F%E9%80%A3%E5%8B%952.mp4',
      thumb: 'Video/thumbs/max.jpg',
      label: 'Max Splash Screen',
      tag:   'App',
      tagClass: 'work-tag tag-social',
    },
    {
      video: 'Video/%E6%AB%BB%E8%8A%B1%E9%85%8D%E6%96%B9.mov',
      thumb: 'Video/thumbs/sakura_recipe.jpg',
      label: 'Sakura Formula',
      tag:   'Motion',
      tagClass: 'work-tag',
    },
  ];

  /* ── geometry ─────────────────────────────────── */
  const N        = ITEMS.length;
  const ITEM_W   = 260;   // same width as polaroid cards
  const ITEM_H   = 330;   // image 4:3 (~195px) + caption
  const RADIUS   = 400;
  const FRICTION = 0.91;
  const SNAP_K   = 0.09;
  const DRAG_S   = 0.27;

  /* ── stage wrapper ────────────────────────────── */
  const STAGE_TOP = Math.round(ITEM_H / 2) + 20;   // cards centred here, top edge = 20px

  container.style.cssText =
    `position:relative;width:100%;height:${ITEM_H + 40}px;` +
    `perspective:${RADIUS * 2.6}px;cursor:grab;user-select:none;-webkit-user-select:none;` +
    `overflow:visible;`;

  /* drag hint */
  const hint = document.createElement('div');
  hint.className = 'cg-hint';
  hint.style.top = `${ITEM_H + 12}px`;   // below the cards
  hint.textContent = 'drag to explore';
  container.appendChild(hint);

  /* stage — rotating cylinder, centred so cards sit fully below top edge */
  const stage = document.createElement('div');
  stage.style.cssText =
    `position:absolute;top:${STAGE_TOP}px;left:50%;width:0;height:0;` +
    `transform-style:preserve-3d;will-change:transform;`;
  container.appendChild(stage);

  /* ── build cards ──────────────────────────────── */
  const cards = ITEMS.map((item, i) => {
    const baseAngle = (360 / N) * i;

    /* outer card — polaroid style */
    const card = document.createElement('div');
    card.className = 'cg-card polaroid';
    card.style.cssText =
      `position:absolute;` +
      `width:${ITEM_W}px;height:${ITEM_H}px;` +
      `left:${-ITEM_W / 2}px;top:${-ITEM_H / 2}px;` +
      `transform:rotateY(${baseAngle}deg) translateZ(${RADIUS}px);` +
      `transform-style:preserve-3d;` +
      `backface-visibility:hidden;-webkit-backface-visibility:hidden;` +
      `cursor:pointer;will-change:transform;` +
      `/* override polaroid defaults for 3d */` +
      `box-shadow:4px 8px 28px rgba(0,0,0,0.14);`;

    /* image area */
    const imgWrap = document.createElement('div');
    imgWrap.className = 'polaroid-img';
    imgWrap.style.cssText =
      `aspect-ratio:unset;height:${Math.round(ITEM_W * 0.78)}px;overflow:hidden;` +
      `border-radius:2px;position:relative;`;

    const img = document.createElement('img');
    img.src = item.thumb;
    img.alt = item.label;
    img.draggable = false;
    img.style.cssText =
      `width:100%;height:100%;object-fit:cover;display:block;` +
      `transition:transform 0.55s cubic-bezier(.25,.46,.45,.94);pointer-events:none;`;

    /* play overlay */
    const overlay = document.createElement('div');
    overlay.className = 'polaroid-overlay';
    const playBtn = document.createElement('button');
    playBtn.className = 'work-open-btn';
    playBtn.setAttribute('aria-label', 'Play ' + item.label);
    playBtn.innerHTML =
      `<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">` +
      `<path d="M8 5v14l11-7z"/></svg>`;
    overlay.appendChild(playBtn);
    imgWrap.appendChild(img);
    imgWrap.appendChild(overlay);

    /* caption */
    const caption = document.createElement('div');
    caption.className = 'polaroid-caption';
    caption.style.paddingTop = '10px';

    const tagEl = document.createElement('span');
    tagEl.className = item.tagClass;
    tagEl.textContent = item.tag;
    tagEl.style.marginBottom = '5px';

    const title = document.createElement('p');
    title.style.cssText =
      `font-family:var(--font-hand);font-size:18px;` +
      `color:var(--ink);line-height:1.25;`;
    title.textContent = item.label;

    caption.appendChild(tagEl);
    caption.appendChild(title);

    card.appendChild(imgWrap);
    card.appendChild(caption);
    stage.appendChild(card);

    /* hover */
    card.addEventListener('mouseenter', () => {
      img.style.transform = 'scale(1.06)';
      overlay.style.opacity = '1';
    });
    card.addEventListener('mouseleave', () => {
      img.style.transform = 'scale(1)';
      overlay.style.opacity = '0';
    });

    return { card, item, baseAngle };
  });

  /* ── state ────────────────────────────────────── */
  let rotY    = 0;
  let vel     = 0;
  let drag    = false;
  let dragX   = 0;
  let lastX   = 0;
  let lastDx  = 0;
  let didDrag = false;
  let snap    = true;
  let activeIdx = 0;

  const stepDeg = 360 / N;

  function nearestSnap(r) {
    return Math.round(r / stepDeg) * stepDeg;
  }
  function frontIndex(r) {
    return ((-Math.round(r / stepDeg)) % N + N) % N;
  }

  /* ── RAF loop ─────────────────────────────────── */
  function tick() {
    requestAnimationFrame(tick);
    if (!drag) {
      if (Math.abs(vel) < 0.5) {
        const diff = nearestSnap(rotY) - rotY;
        vel += diff * SNAP_K;
      }
      vel  *= FRICTION;
      rotY += vel;
    }
    stage.style.transform = `rotateY(${rotY}deg)`;

    /* dim/brighten cards by proximity to front */
    const front = frontIndex(rotY);
    if (front !== activeIdx) activeIdx = front;
    cards.forEach(({ card }, i) => {
      const d = Math.abs(((i - front) % N + N + Math.round(N / 2)) % N - Math.round(N / 2));
      const brightness = d === 0 ? 1 : d === 1 ? 0.72 : 0.45;
      const scale      = d === 0 ? 1 : 0.92;
      card.style.filter    = `brightness(${brightness})`;
      card.style.transform =
        `rotateY(${cards[i].baseAngle}deg) translateZ(${RADIUS}px) scale(${scale})`;
    });
  }
  requestAnimationFrame(tick);

  /* ── pointer drag ─────────────────────────────── */
  function onDown(x) {
    drag    = true;
    didDrag = false;
    dragX   = x;
    lastX   = x;
    lastDx  = 0;
    vel     = 0;
    container.style.cursor = 'grabbing';
  }
  function onMove(x) {
    if (!drag) return;
    const dx = x - lastX;
    lastDx   = dx;
    rotY    += dx * DRAG_S;
    lastX    = x;
    if (Math.abs(x - dragX) > 5) didDrag = true;
  }
  function onUp() {
    if (!drag) return;
    drag   = false;
    vel    = lastDx * DRAG_S * 2.0;
    container.style.cursor = 'grab';
  }

  container.addEventListener('mousedown',  e => { onDown(e.clientX); e.preventDefault(); });
  window   .addEventListener('mousemove',  e => onMove(e.clientX));
  window   .addEventListener('mouseup',    onUp);

  container.addEventListener('touchstart', e => onDown(e.touches[0].clientX), { passive: true });
  container.addEventListener('touchmove',  e => onMove(e.touches[0].clientX), { passive: true });
  container.addEventListener('touchend',   onUp);

  /* ── click → play or spin to front ───────────── */
  cards.forEach(({ card, item }, i) => {
    card.addEventListener('click', () => {
      if (didDrag) return;

      /* not front → spin to it */
      if (i !== activeIdx) {
        let delta = -(i * stepDeg) - (rotY % 360);
        if (delta >  180) delta -= 360;
        if (delta < -180) delta += 360;
        vel = delta * 0.12;
        return;
      }

      /* front → open video modal */
      const modal  = document.getElementById('videoModal');
      const player = document.getElementById('videoPlayer');
      if (!modal || !player) return;
      player.src = item.video;
      modal.classList.add('open');
      document.body.style.overflow = 'hidden';
      player.play().catch(() => {});
    });
  });

  /* fade out hint */
  setTimeout(() => { hint.style.opacity = '0'; }, 3200);
}
