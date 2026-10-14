(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* ---------- split headline into words, keeping inline elements ---------- */
  const splitWords = (el, cls = 'w', inner = true) => {
    let i = 0;
    const walk = node => {
      [...node.childNodes].forEach(child => {
        if (child.nodeType === 3) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.append(' '); return; }
            const outer = document.createElement('span');
            outer.className = cls;
            if (inner) {
              const s = document.createElement('span');
              s.textContent = part;
              s.style.setProperty('--i', i);
              outer.append(s);
            } else {
              outer.textContent = part;
            }
            i++;
            frag.append(outer);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === 1) {
          walk(child);
        }
      });
    };
    walk(el);
    return i;
  };

  $$('[data-split]').forEach(el => {
    splitWords(el);
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('is-split')));
  });

  /* ---------- reveal on scroll ---------- */
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-in');
      io.unobserve(e.target);
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
  $$('[data-reveal]').forEach(el => io.observe(el));

  /* ---------- counters ---------- */
  const countIO = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const end = +el.dataset.count;
      countIO.unobserve(el);
      if (reduced) { el.textContent = end; return; }
      const dur = 1600;
      const t0 = performance.now();
      const tick = t => {
        const p = clamp((t - t0) / dur, 0, 1);
        el.textContent = Math.round(end * (1 - Math.pow(1 - p, 4)));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }, { threshold: 0.6 });
  $$('[data-count]').forEach(el => countIO.observe(el));

  /* ---------- manifesto word highlight ---------- */
  const manifesto = $('[data-words]');
  let mWords = [];
  if (manifesto) {
    splitWords(manifesto, 'mw', false);
    mWords = $$('.mw', manifesto);
    if (reduced) mWords.forEach(w => w.classList.add('on'));
  }

  /* ---------- nav ---------- */
  const nav = $('#nav');
  const burger = $('#burger');
  const menu = $('#menu');
  const setMenu = open => {
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) {
      menu.hidden = false;
      requestAnimationFrame(() => menu.classList.add('is-open'));
    } else {
      menu.classList.remove('is-open');
      setTimeout(() => { if (!menu.classList.contains('is-open')) menu.hidden = true; }, 700);
    }
  };
  burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
  $$('a', menu).forEach(a => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape' && burger.getAttribute('aria-expanded') === 'true') setMenu(false); });

  // active section in nav
  const navLinks = $$('.nav__links a');
  const secIO = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      navLinks.forEach(a => a.classList.toggle('is-active', a.getAttribute('href') === '#' + e.target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  ['services', 'work', 'process', 'team', 'community'].forEach(id => { const s = document.getElementById(id); if (s) secIO.observe(s); });

  /* ---------- services accordion + cursor preview ---------- */
  const items = $$('.svc__item');
  items.forEach(item => {
    const btn = $('.svc__row', item);
    btn.addEventListener('click', () => {
      const open = !item.classList.contains('is-open');
      items.forEach(o => { o.classList.remove('is-open'); $('.svc__row', o).setAttribute('aria-expanded', 'false'); });
      if (open) { item.classList.add('is-open'); btn.setAttribute('aria-expanded', 'true'); }
    });
  });
  items[0] && (items[0].classList.add('is-open'), $('.svc__row', items[0]).setAttribute('aria-expanded', 'true'));

  const preview = $('#svcPreview');
  const list = $('#svc');
  if (preview && list && finePointer && !reduced) {
    const img = $('img', preview);
    img.addEventListener('error', () => { img.style.visibility = 'hidden'; });
    img.addEventListener('load', () => { img.style.visibility = ''; });
    let tx = 0, ty = 0, x = 0, y = 0, raf = 0;
    const loop = () => {
      x += (tx - x) * 0.14; y += (ty - y) * 0.14;
      preview.style.left = x + 'px'; preview.style.top = y + 'px';
      raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.3 ? requestAnimationFrame(loop) : 0;
    };
    list.addEventListener('mousemove', e => {
      tx = e.clientX + 200; ty = e.clientY;
      if (!raf) raf = requestAnimationFrame(loop);
    });
    items.forEach(item => {
      $('.svc__row', item).addEventListener('mouseenter', e => {
        if (img.getAttribute('src') !== item.dataset.img) img.src = item.dataset.img;
        if (!preview.classList.contains('is-on')) { x = tx = e.clientX + 200; y = ty = e.clientY; }
        preview.classList.add('is-on');
      });
      $('.svc__row', item).addEventListener('mouseleave', () => preview.classList.remove('is-on'));
    });
    // warm the cache so swaps feel instant
    addEventListener('load', () => items.forEach(i => { const im = new Image(); im.src = i.dataset.img; }));
  }

  /* ---------- magnetic buttons ---------- */
  if (finePointer && !reduced) {
    $$('.btn--magnetic').forEach(btn => {
      btn.addEventListener('mousemove', e => {
        const r = btn.getBoundingClientRect();
        const dx = (e.clientX - r.left - r.width / 2) / r.width;
        const dy = (e.clientY - r.top - r.height / 2) / r.height;
        btn.style.transform = `translate(${dx * 10}px, ${dy * 8}px)`;
      });
      btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
    });
  }

  /* ---------- scroll driven: progress, nav, parallax, horizontal work, steps ---------- */
  const bar = $('.progress span');
  const heroImg = $('.hero__media');
  const work = $('#work');
  const track = $('#workTrack');
  const workBar = $('#workBar');
  const steps = $('.steps');
  const stepsFill = $('#stepsFill');
  let workDist = 0;
  let horizontal = false;

  const measure = () => {
    horizontal = innerWidth > 900 && !reduced;
    if (horizontal) {
      workDist = Math.max(0, track.scrollWidth - innerWidth);
      work.style.height = (workDist + innerHeight) + 'px';
    } else {
      work.style.height = '';
      track.style.transform = '';
    }
  };

  let lastY = scrollY;
  let ticking = false;
  const update = () => {
    ticking = false;
    const y = scrollY;
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;

    nav.classList.toggle('is-scrolled', y > 40);
    const menuOpen = burger.getAttribute('aria-expanded') === 'true';
    nav.classList.toggle('is-hidden', !menuOpen && y > lastY && y > innerHeight * 0.8);
    lastY = y;

    if (!reduced && heroImg && y < innerHeight * 1.2) {
      heroImg.style.transform = `translate3d(0, ${y * 0.25}px, 0)`;
    }

    if (horizontal) {
      const r = work.getBoundingClientRect();
      const p = clamp(-r.top / (work.offsetHeight - innerHeight || 1), 0, 1);
      track.style.transform = `translate3d(${-p * workDist}px, 0, 0)`;
      workBar.style.transform = `scaleX(${p})`;
    }

    if (manifesto && !reduced) {
      const r = manifesto.getBoundingClientRect();
      const p = clamp((innerHeight * 0.85 - r.top) / (r.height + innerHeight * 0.3), 0, 1);
      const lit = Math.round(p * mWords.length);
      mWords.forEach((w, i) => { const on = i < lit; if (w._on !== on) { w._on = on; w.classList.toggle('on', on); } });
    }

    if (steps && stepsFill) {
      const r = steps.getBoundingClientRect();
      const p = clamp((innerHeight * 0.75 - r.top) / (r.height * 0.8), 0, 1);
      stepsFill.style.transform = `scaleX(${p})`;
    }
  };
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };

  measure(); update();
  addEventListener('scroll', onScroll, { passive: true });
  let rT;
  addEventListener('resize', () => { clearTimeout(rT); rT = setTimeout(() => { measure(); update(); }, 120); });
  addEventListener('load', () => { measure(); update(); });
  if (document.fonts) document.fonts.ready.then(() => { measure(); update(); });

  /* ---------- contact form: opens a ready to send email ---------- */
  const form = $('#form');
  const status = $('#formStatus');
  form.addEventListener('submit', e => {
    e.preventDefault();
    let ok = true;
    ['name', 'email', 'message'].forEach(n => {
      const f = form.elements[n];
      const bad = !f.value.trim() || (n === 'email' && !/^\S+@\S+\.\S+$/.test(f.value));
      f.parentElement.classList.toggle('is-bad', bad);
      if (bad) ok = false;
    });
    if (!ok) { status.textContent = 'Please fill in your name, a valid email and a few words about the project.'; return; }
    const d = Object.fromEntries(new FormData(form));
    const subject = `Project inquiry: ${d.type}${d.org ? ' for ' + d.org : ''}`;
    const body = `Name: ${d.name}\nEmail: ${d.email}\nCompany or agency: ${d.org || 'n/a'}\nProject type: ${d.type}\n\n${d.message}`;
    location.href = `mailto:CWright@CW-3.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    status.textContent = 'Your email app should open with everything filled in. If it does not, call us at 239.205.6473.';
  });

  const yr = $('#year');
  if (yr) yr.textContent = new Date().getFullYear();
})();
