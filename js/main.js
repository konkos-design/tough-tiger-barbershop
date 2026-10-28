(function () {
  'use strict';
  var root = document.documentElement;
  var unhide = function () { root.classList.remove('js-anim'); };
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* year */
  document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* today in hours table (Winnipeg time) */
  try {
    var wd = new Intl.DateTimeFormat('en-CA', { weekday: 'long', timeZone: 'America/Winnipeg' }).format(new Date());
    var idx = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].indexOf(wd);
    document.querySelectorAll('.hours tr[data-day="' + idx + '"]').forEach(function (tr) { tr.classList.add('is-today'); });
  } catch (e) {}

  /* header: solid on scroll, hide on scroll down */
  var hdr = document.getElementById('hdr'), lastY = 0, ticking = false;
  function onScroll() {
    var y = window.scrollY;
    hdr.classList.toggle('is-solid', y > 30);
    if (!document.body.classList.contains('menu-open') && y > 400 && y > lastY + 2) hdr.classList.add('is-hidden');
    if (y <= 400) hdr.classList.remove('is-hidden');
    if (y < lastY - 4) hdr.classList.remove('is-hidden');
    lastY = y; ticking = false;
  }
  window.addEventListener('scroll', function () { if (!ticking) { requestAnimationFrame(onScroll); ticking = true; } }, { passive: true });
  onScroll();

  /* mobile menu */
  var burger = document.querySelector('.burger');
  function setMenu(open) {
    document.body.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    hdr.classList.remove('is-hidden');
  }
  burger.addEventListener('click', function () { setMenu(!document.body.classList.contains('menu-open')); });
  document.querySelectorAll('.mnav a').forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });

  /* scroll reveal */
  var rvs = document.querySelectorAll('.rv');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    rvs.forEach(function (el) { io.observe(el); });
  } else { rvs.forEach(function (el) { el.classList.add('in'); }); }

  /* drag-to-scroll strips (mouse); touch uses native swipe */
  document.querySelectorAll('[data-drag]').forEach(function (el) {
    var down = false, sx = 0, sl = 0, moved = 0, v = 0, lx = 0, raf;
    el.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      down = true; moved = 0; sx = lx = e.clientX; sl = el.scrollLeft; v = 0; cancelAnimationFrame(raf);
    });
    window.addEventListener('pointermove', function (e) {
      if (!down) return;
      var dx = e.clientX - sx; moved = Math.max(moved, Math.abs(dx));
      if (moved > 4) el.classList.add('is-drag');
      el.scrollLeft = sl - dx; v = e.clientX - lx; lx = e.clientX;
    });
    window.addEventListener('pointerup', function () {
      if (!down) return; down = false;
      setTimeout(function () { el.classList.remove('is-drag'); }, 0);
      if (reduce) return;
      (function glide() { v *= 0.93; el.scrollLeft -= v; if (Math.abs(v) > 0.5) raf = requestAnimationFrame(glide); })();
    });
    el.addEventListener('click', function (e) { if (moved > 6) { e.preventDefault(); e.stopPropagation(); } }, true);
    el.addEventListener('dragstart', function (e) { e.preventDefault(); });
  });

  /* lightbox (gallery page) */
  var grid = document.getElementById('grid'), lb = document.getElementById('lb');
  if (grid && lb) {
    var btns = Array.prototype.slice.call(grid.querySelectorAll('button')), cur = 0, lbImg = lb.querySelector('img'), opener;
    function show(i) {
      cur = (i + btns.length) % btns.length;
      var im = btns[cur].querySelector('img');
      lbImg.src = im.currentSrc || im.src; lbImg.alt = im.alt;
    }
    function open(i) { opener = btns[i]; show(i); lb.classList.add('is-open'); document.body.style.overflow = 'hidden'; lb.querySelector('.lb__x').focus(); }
    function close() { lb.classList.remove('is-open'); document.body.style.overflow = ''; if (opener) opener.focus(); }
    btns.forEach(function (b, i) { b.addEventListener('click', function () { open(i); }); });
    lb.querySelector('.lb__x').addEventListener('click', close);
    lb.querySelector('.lb__p').addEventListener('click', function () { show(cur - 1); });
    lb.querySelector('.lb__n').addEventListener('click', function () { show(cur + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
    document.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('is-open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') show(cur - 1);
      if (e.key === 'ArrowRight') show(cur + 1);
    });
    var tx = null;
    lb.addEventListener('touchstart', function (e) { tx = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', function (e) {
      if (tx === null) return; var dx = e.changedTouches[0].clientX - tx; tx = null;
      if (Math.abs(dx) > 50) show(cur + (dx < 0 ? 1 : -1));
    });
  }

  /* barber pole progress without GSAP fallback */
  var pole = document.querySelector('.pole');
  function poleUpdate() {
    var h = document.documentElement.scrollHeight - innerHeight;
    var p = h > 0 ? scrollY / h : 0;
    pole.style.setProperty('--p', p.toFixed(4));
    pole.style.backgroundPosition = '0 ' + (scrollY * 0.6).toFixed(1) + 'px';
  }
  window.addEventListener('scroll', poleUpdate, { passive: true }); poleUpdate();

  /* GSAP moments */
  function boot() {
    if (!window.gsap || !window.ScrollTrigger) { unhide(); return; }
    gsap.registerPlugin(ScrollTrigger);
    var mm = gsap.matchMedia();
    mm.add({ all: 'all', wide: '(min-width: 900px)', reduce: '(prefers-reduced-motion: reduce)' }, function (ctx) {
      var c = ctx.conditions;
      if (c.reduce) { unhide(); return; }

      /* first screen */
      var hero = document.querySelector('.hero, .phero');
      if (hero) {
        var lines = hero.querySelectorAll('h1 .ln > span');
        var soft = hero.querySelectorAll('.hero__lead, .hero__sub, .hero__cta, .phero p');
        var photo = hero.querySelector('.hero__reveal');
        var badge = hero.querySelector('.badge');
        gsap.set(lines, { y: 0, yPercent: 125 });
        gsap.set(soft, { opacity: 0, y: 20 });
        if (photo) gsap.set(photo, { clipPath: 'inset(100% 0% 0% 0%)' });
        if (badge) gsap.set(badge, { opacity: 0, scale: 0.4, rotate: -90 });
        var frame = hero.querySelector('.hero__frame');
        if (frame) gsap.set(frame, { opacity: 0, y: 40 });
        unhide();
        var tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
        tl.to(lines, { yPercent: 0, duration: 1.05, stagger: 0.11 })
          .to(soft, { opacity: 1, y: 0, duration: 0.85, stagger: 0.08 }, '-=.7');
        if (frame) tl.to(frame, { opacity: 1, y: 0, duration: 0.7 }, 0);
        if (photo) tl.to(photo, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.25, ease: 'power4.inOut', clearProps: 'clipPath' }, 0.1);
        if (badge) tl.to(badge, { opacity: 1, scale: 1, rotate: 0, duration: 1, ease: 'back.out(1.6)' }, 0.9);

        /* checkered floor slides as you scroll away */
        var fl = hero.querySelector('.floor');
        if (fl) gsap.to(fl, { backgroundPosition: '-192px 0', ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
        if (c.wide) {
          var fr = hero.querySelector('.hero__frame');
          if (fr) gsap.to(fr, { yPercent: 10, rotate: 4, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
        }
      } else unhide();

      /* flash cards drop in like stickers */
      var cards = gsap.utils.toArray('.card');
      if (cards.length) {
        gsap.set(cards, { transition: 'none' });
        gsap.from(cards, { y: 80, rotate: function (i) { return i % 2 ? 8 : -8; }, opacity: 0, duration: 0.9, ease: 'back.out(1.4)', stagger: 0.09,
          clearProps: 'transform,opacity,transition', scrollTrigger: { trigger: '.flash', start: 'top 82%' } });
      }

      /* service icons wiggle in on the menu page */
      gsap.utils.toArray('.mi svg').forEach(function (s) {
        gsap.from(s, { rotate: -25, scale: 0.6, duration: 0.8, ease: 'back.out(2)', scrollTrigger: { trigger: s, start: 'top 88%' } });
      });

      /* gentle parallax on framed photos (desktop) */
      if (c.wide) {
        gsap.utils.toArray('.duo figure, .ritual figure, .easy__pics figure').forEach(function (f, i) {
          gsap.to(f, { yPercent: i % 2 ? -8 : 6, ease: 'none', scrollTrigger: { trigger: f, start: 'top bottom', end: 'bottom top', scrub: true } });
        });
      }
    });
    setTimeout(unhide, 3000);
  }
  if (document.readyState === 'complete' || document.readyState === 'interactive') boot();
  else document.addEventListener('DOMContentLoaded', boot);
})();
