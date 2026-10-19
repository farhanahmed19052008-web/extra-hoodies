const product   = document.querySelector('#product');
const orbsFG    = document.querySelector('.orbs-fg');
const orbsBG    = document.querySelector('.orbs-bg');
const heroCenter= document.querySelector('.hero-center');
const orbs      = document.querySelectorAll('.orb');
const cards     = document.querySelectorAll('.card');
const root      = document.documentElement;
let isSwitching = false;
let spin = -200;          // starts rotated, settles to 0 on page load
let blur = 0;

// Entrance: hoodie swings in from the side
const intro = { v: -200 };
gsap.to(intro, { v: 0, duration: 1.8, delay: .3, ease: 'power3.out', onUpdate: () => { spin = intro.v; } });

cards.forEach(card => {
  card.addEventListener('click', () => {
    if (isSwitching) return;
    cards.forEach(c => c.classList.remove('active'));
    card.classList.add('active');
    switchColor(card);
  });
});

function switchColor(card) {
  isSwitching = true;
  const toPink = card.dataset.flavor === 'pink';
  const body = document.body;
  const colors = toPink
    ? { inner: '#0b4f8a', mid: '#04294e', outer: '#010c14' }
    : { inner: '#0b8a78', mid: '#044e3b', outer: '#011411' };

  // 1. Background morph
  gsap.to(body, { '--bg-inner': colors.inner, '--bg-mid': colors.mid, '--bg-outer': colors.outer, duration: 1.5, ease: 'power2.inOut' });

  // 2. Hoodie spin with blur, colour swaps at the peak
  const s = { val: 0, blur: 0 };
  gsap.to(s, {
    val: 360, blur: 15, duration: .6, ease: 'power2.in',
    onUpdate: () => { spin = s.val; blur = s.blur; },
    onComplete: () => {
      body.classList.toggle('blue-theme', toPink);
      root.style.setProperty('--hoodie', card.dataset.hoodie);
      root.style.setProperty('--hoodie-dark', card.dataset.dark);
      gsap.to(s, {
        val: 720, blur: 0, duration: 1.5, ease: 'back.out(0.7)',
        onUpdate: () => { spin = s.val; blur = s.blur; },
        onComplete: () => { spin = 0; blur = 0; }
      });
    }
  });

  // 3. Shapes implode to the centre, swap shape, explode to new spots
  let done = 0;
  orbs.forEach(orb => {
    const cx = window.innerWidth / 2 - orb.offsetLeft - orb.offsetWidth / 2;
    const cy = window.innerHeight / 2 - orb.offsetTop - orb.offsetHeight / 2;
    const a = parseFloat(orb.dataset.angle) || 0;
    const nx = (Math.random() - .5) * 200, ny = (Math.random() - .5) * 200;
    gsap.set(orb, { rotation: a, x: parseFloat(orb.dataset.baseX) || 0, y: parseFloat(orb.dataset.baseY) || 0 });
    gsap.timeline()
      .to(orb, { x: cx, y: cy, rotation: a + 45, scale: .1, opacity: 0, duration: .5, ease: 'power2.in',
        onComplete: () => {
          orb.classList.toggle('star'); orb.classList.toggle('ring');
          heroCenter.style.zIndex = 50;
        } })
      .to(orb, { duration: .3 })
      .to(orb, { onStart: () => { heroCenter.style.zIndex = 1; },
        x: nx, y: ny, rotation: a + 90, scale: 1, opacity: 1, duration: .9, ease: 'back.out(1.5)',
        onComplete: () => {
          orb.dataset.angle = a + 90; orb.dataset.baseX = nx; orb.dataset.baseY = ny;
          orb.dataset.rx = 0; orb.dataset.ry = 0;
          if (++done === orbs.length) isSwitching = false;
        } });
  });
}

orbs.forEach(o => {
  o.dataset.rx = 0; o.dataset.ry = 0; o.dataset.angle = Math.random() * 360;
  o.dataset.baseX = 0; o.dataset.baseY = 0;
});

const mouse = { x: 0, y: 0, px: 0, py: 0 };
const cur = { x: 0, y: 0 };
window.addEventListener('mousemove', e => {
  mouse.x = e.clientX / window.innerWidth - .5;
  mouse.y = e.clientY / window.innerHeight - .5;
  mouse.px = e.clientX; mouse.py = e.clientY;
});

function animate() {
  const time = Date.now() * .001;
  cur.x += (mouse.x - cur.x) * .05;
  cur.y += (mouse.y - cur.y) * .05;

  // Hoodie tilts toward the cursor (+ spin during colour switch)
  product.style.transform =
    `translate(-50%,-50%) perspective(1200px) rotateY(${cur.x * 40 + spin}deg) rotateX(${cur.y * -20}deg)`;
  product.style.filter = blur > 0.1 ? `blur(${blur}px)` : 'none';

  orbsFG.style.transform = `translate(${cur.x * 60}px, ${cur.y * 60}px)`;
  orbsBG.style.transform = `translate(${cur.x * -30}px, ${cur.y * -30}px)`;

  if (!isSwitching) {
    orbs.forEach((orb, i) => {
      const r = orb.getBoundingClientRect();
      const dx = mouse.px - (r.left + r.width / 2);
      const dy = mouse.py - (r.top + r.height / 2);
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      let tx = 0, ty = 0, speed = 1;
      if (dist < 400) {
        const force = (400 - dist) / 400;
        tx = (dx / dist) * force * -80;
        ty = (dy / dist) * force * -80;
        speed = 1 + force * 5;
      }
      let rx = parseFloat(orb.dataset.rx) || 0, ry = parseFloat(orb.dataset.ry) || 0;
      let angle = parseFloat(orb.dataset.angle) || 0;
      const bx = parseFloat(orb.dataset.baseX) || 0, by = parseFloat(orb.dataset.baseY) || 0;
      rx += (tx - rx) * .1; ry += (ty - ry) * .1; angle += .2 * speed;
      orb.dataset.rx = rx; orb.dataset.ry = ry; orb.dataset.angle = angle;

      const dur = [5, 7, 6, 8, 5.5, 6.5, 9, 11, 10][i % 9];
      const phase = (time + i * .7) * (Math.PI * 2 / dur);
      const fy = Math.sin(phase) * 15, fa = Math.cos(phase) * 6;
      orb.style.transform = `translate(${rx + bx}px, ${ry + by + fy}px) rotate(${angle + fa}deg)`;
    });
  }
  requestAnimationFrame(animate);
}
animate();

// Rising bubbles
const bubbles = document.getElementById('bubbles-container');
function createBubble() {
  const b = document.createElement('div');
  const size = Math.random() * 20 + 10;
  const dur = Math.random() * 6 + 4;
  b.className = 'bubble';
  b.style.cssText = `width:${size}px;height:${size}px;left:${Math.random() * 100}%;bottom:-50px;opacity:${Math.random() * .4 + .2};animation:floatUp ${dur}s linear forwards`;
  bubbles.appendChild(b);
  setTimeout(() => b.remove(), dur * 1000);
}
setInterval(createBubble, 400);
