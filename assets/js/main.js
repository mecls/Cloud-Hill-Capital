/* Cloud Hill Capital site behaviour.
   Timings are the values measured on the reference sites (see REPORT.md). */
(function () {
  'use strict';

  var EASE_IO_CUBIC = 'cubic-bezier(.645, .045, .355, 1)';
  var EASE_OUT_QUAD = 'cubic-bezier(.25, .46, .45, .94)';
  var EASE_IN_CUBIC = 'cubic-bezier(.55, .055, .675, .19)';

  var root = document.documentElement;
  var reducedMq = window.matchMedia('(prefers-reduced-motion: reduce)');
  var phoneMq = window.matchMedia('(max-width: 767px)');
  function reduced() { return reducedMq.matches; }
  function phoneLayout() { return phoneMq.matches; }

  /* ---------- small animation helper ----------
     Animates from the element's current inline values to `to`, then keeps the end values inline.
     A new tween on the same element takes over from wherever the previous one was. */
  var running = new WeakMap();
  function stop(el) {
    var prev = running.get(el);
    if (!prev) return;
    try { prev.commitStyles(); } catch (e) { /* element not rendered */ }
    prev.cancel();
    running.delete(el);
  }
  function tween(el, to, opts) {
    stop(el);
    if (reduced() || !el.animate) {
      Object.keys(to).forEach(function (k) { el.style[k] = to[k]; });
      return Promise.resolve();
    }
    var anim = el.animate([to], {
      duration: opts.duration,
      delay: opts.delay || 0,
      easing: opts.easing || 'linear',
      fill: 'both'
    });
    running.set(el, anim);
    return anim.finished.then(function () {
      Object.keys(to).forEach(function (k) { el.style[k] = to[k]; });
      anim.cancel();
      if (running.get(el) === anim) running.delete(el);
    }, function () { /* cancelled by a newer tween */ });
  }

  function wait(ms) {
    return new Promise(function (resolve) { setTimeout(resolve, reduced() ? 0 : ms); });
  }

  function headerHeight() {
    return document.querySelector('.site-header').getBoundingClientRect().height;
  }

  /* ---------- 1. home logo: 3D turn (Thrive) and fade in once decoded ---------- */
  var logo = document.querySelector('.home__logo');
  var mark = document.querySelector('.home__mark');
  if (logo && mark) {
    // Copies of the logo stacked behind it, from the front face (+0.5) to the back face (-0.5) of the depth.
    var LAYERS = phoneLayout() ? 10 : 14;
    for (var i = 1; i < LAYERS; i++) {
      var layer = document.createElement('img');
      layer.src = logo.currentSrc || logo.src;
      layer.alt = '';
      layer.decoding = 'async';
      layer.className = 'home__layer' + (i < LAYERS - 1 ? ' home__layer--inner' : '');
      layer.style.setProperty('--z', (.5 - i / (LAYERS - 1)).toFixed(4));
      logo.parentNode.insertBefore(layer, logo);
    }
    var showLogo = function () { requestAnimationFrame(function () { mark.classList.add('is-ready'); }); };
    if (logo.decode) logo.decode().then(showLogo, showLogo);
    else if (logo.complete) showLogo();
    else { logo.addEventListener('load', showLogo); logo.addEventListener('error', showLogo); }
  }

  /* ---------- 2. smooth scroll to sections ---------- */
  var SECTION_IDS = ['home', 'manifesto', 'team', 'contact'];
  var sections = SECTION_IDS.map(function (id) { return document.getElementById(id); });
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.site-nav__link'));
  var scrollAnim = null;

  function sectionTop(id) {
    if (id === 'home') return 0;
    var el = document.getElementById(id);
    var max = document.documentElement.scrollHeight - window.innerHeight;
    return Math.min(Math.round(el.getBoundingClientRect().top + window.scrollY), max);
  }

  function easeInOutCubic(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

  function stopScroll() {
    if (scrollAnim) { cancelAnimationFrame(scrollAnim.raf); var done = scrollAnim.done; scrollAnim = null; done(); }
  }

  function scrollToY(y, onDone) {
    stopScroll();
    var startY = window.scrollY;
    var dist = Math.abs(y - startY);
    if (reduced() || dist < 2) { window.scrollTo(0, y); if (onDone) onDone(); return; }
    var duration = Math.max(600, Math.min(1200, 400 + dist * .25));
    var t0 = performance.now();
    scrollAnim = { raf: 0, done: onDone || function () {} };
    (function frame(now) {
      var p = Math.min(1, (now - t0) / duration);
      window.scrollTo(0, Math.round(startY + (y - startY) * easeInOutCubic(p)));
      if (p < 1) { scrollAnim.raf = requestAnimationFrame(frame); }
      else { var done = scrollAnim.done; scrollAnim = null; done(); }
    })(t0);
  }
  ['wheel', 'touchstart'].forEach(function (type) {
    window.addEventListener(type, stopScroll, { passive: true });
  });
  window.addEventListener('keydown', function (e) {
    if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].indexOf(e.key) > -1) stopScroll();
  });

  /* ---------- 3. current section: menu (for screen readers) and page indicator (Audeo) ---------- */
  var lockedTo = null;
  var pager = document.querySelector('.pager');
  var pagerItems = pager ? Array.prototype.slice.call(pager.querySelectorAll('.pager__item')) : [];
  function setActive(id) {
    navLinks.forEach(function (a) {
      if (a.getAttribute('data-link') === id) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });
    pagerItems.forEach(function (item) {
      item.classList.toggle('is-active', item.getAttribute('data-for') === id);
    });
  }
  // A section becomes current when its top crosses the middle of the screen (Audeo).
  function currentSection() {
    var line = window.innerHeight * .5;
    var current = SECTION_IDS[0];
    sections.forEach(function (s, i) { if (s.getBoundingClientRect().top <= line) current = SECTION_IDS[i]; });
    var atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
    if (atBottom) current = SECTION_IDS[SECTION_IDS.length - 1];
    return current;
  }
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      if (!lockedTo) setActive(currentSection());
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  window.addEventListener('load', onScroll);
  setActive(currentSection());
  // Animate the indicator only after its first state is drawn, so it does not animate on load.
  if (pager) requestAnimationFrame(function () { requestAnimationFrame(function () { pager.classList.add('is-ready'); }); });

  function goTo(id) {
    lockedTo = id;
    setActive(id);
    scrollToY(sectionTop(id), function () { lockedTo = null; setActive(currentSection()); });
  }

  document.querySelectorAll('[data-link]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      var id = a.getAttribute('data-link');
      if (menuIsOpen()) closeMenu(false);
      goTo(id);
    });
  });

  /* ---------- 4. phone menu (Audeo: clip reveal 1s, burger to X 0.6s) ---------- */
  var toggle = document.querySelector('.menu-toggle');
  var main = document.getElementById('main');
  function menuIsOpen() { return root.classList.contains('menu-open'); }
  function openMenu() {
    root.classList.add('menu-open');
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Close menu');
    main.inert = true;
  }
  function closeMenu(returnFocus) {
    root.classList.remove('menu-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open menu');
    main.inert = false;
    if (returnFocus) toggle.focus();
  }
  toggle.addEventListener('click', function () { if (menuIsOpen()) closeMenu(false); else openMenu(); });

  /* ---------- 5. team intro ---------- */
  var stage = document.querySelector('.team__stage');
  var grid = stage.querySelector('.team__grid');
  var people = Array.prototype.slice.call(grid.querySelectorAll('.person'));
  var intro = document.getElementById('intro');
  var introArt = intro.querySelector('.intro__art');
  var introArtInner = intro.querySelector('.intro__art-inner');
  var introPanel = intro.querySelector('.intro__panel');
  var introName = intro.querySelector('.intro__name');
  var introRole = intro.querySelector('.intro__role');
  var introBio = intro.querySelector('.intro__bio');
  var closeBtn = intro.querySelector('.intro__close');
  var introItems = [introName, introRole, introBio];

  var openPerson = null;   // <li> whose intro is open (desktop/tablet)
  var phase = 'closed';    // closed | opening | open | closing
  var runId = 0;           // invalidates pending steps when a newer open/close starts

  function part(li, sel) { return li.querySelector(sel); }

  function flipFrom(li) {
    var f = part(li, '.person__art').getBoundingClientRect();
    var l = introArt.getBoundingClientRect();
    var s = f.width / l.width;
    return 'translate(' + (f.left - l.left) + 'px, ' + (f.top - l.top) + 'px) scale(' + s + ')';
  }

  function fitStage() {
    stage.style.minHeight = '';
    if (openPerson) stage.style.minHeight = Math.max(grid.offsetHeight, intro.offsetHeight) + 'px';
  }

  function openIntro(li) {
    var id = ++runId;
    var btn = part(li, '.person__btn');
    var art = part(li, '.person__art');
    var artOpacity = getComputedStyle(art).opacity;

    [introArt, introPanel, closeBtn].concat(introItems).forEach(stop);
    openPerson = li;
    phase = 'opening';
    btn.setAttribute('aria-expanded', 'true');
    introName.textContent = part(li, '.person__name').textContent;
    introRole.textContent = part(li, '.person__role').textContent;
    introBio.innerHTML = part(li, '.person__more').innerHTML;
    introArtInner.innerHTML = art.innerHTML;

    intro.hidden = false;
    introPanel.style.opacity = '1';
    introItems.forEach(function (el) { el.style.opacity = '0'; el.style.transform = 'translateY(20px)'; });
    closeBtn.style.opacity = '0';
    closeBtn.style.transform = 'scale(.5)';
    introArt.style.transform = 'none';
    introArt.style.transform = flipFrom(li);
    introArt.style.opacity = artOpacity;
    art.style.visibility = 'hidden';
    grid.inert = true;
    fitStage();

    // 0 ms: the clicked name fades, the other people fade and lift 10px.
    tween(part(li, '.person__name'), { opacity: '0' }, { duration: 200, easing: EASE_OUT_QUAD });
    tween(part(li, '.person__role'), { opacity: '0' }, { duration: 200, easing: EASE_OUT_QUAD });
    people.forEach(function (other) {
      if (other === li) return;
      tween(other, { opacity: '0', transform: 'translateY(-10px)' }, { duration: 400, easing: EASE_OUT_QUAD });
    });
    // 140 ms: the portrait moves into the intro (730 ms).
    tween(introArt, { opacity: '1' }, { duration: 400, easing: EASE_IO_CUBIC });
    tween(introArt, { transform: 'translate(0px, 0px) scale(1)' }, { delay: 140, duration: 730, easing: EASE_IO_CUBIC });
    // 1000 ms: name, role and bio rise 20px in, 50 ms apart.
    introItems.forEach(function (el, i) {
      tween(el, { opacity: '1', transform: 'translateY(0px)' }, { delay: 1000 + i * 50, duration: 400, easing: 'ease' });
    });
    // 1315 ms: the close button grows in.
    tween(closeBtn, { opacity: '1', transform: 'scale(1)' }, { delay: 1315, duration: 300, easing: EASE_IO_CUBIC })
      .then(function () { if (id === runId) phase = 'open'; });

    closeBtn.focus({ preventScroll: true });

    // Several rows (tablet): bring the intro into view if its top is under the header.
    var top = stage.getBoundingClientRect().top;
    var minTop = headerHeight() + 16;
    if (top < minTop) scrollToY(Math.round(window.scrollY + top - minTop));
  }

  function closeIntro(opts) {
    if (!openPerson || phase === 'closing') return;
    var instant = opts && opts.instant;
    var id = ++runId;
    var li = openPerson;
    var btn = part(li, '.person__btn');
    var art = part(li, '.person__art');
    phase = 'closing';
    btn.setAttribute('aria-expanded', 'false');

    function finish() {
      if (id !== runId) return;
      intro.hidden = true;
      introArtInner.innerHTML = '';
      grid.inert = false;
      openPerson = null;
      phase = 'closed';
      stage.style.minHeight = '';
      [part(li, '.person__name'), part(li, '.person__role')].concat(people).forEach(function (el) {
        el.style.opacity = '';
        el.style.transform = '';
      });
    }

    if (instant || reduced()) {
      [introArt, introPanel, closeBtn, part(li, '.person__name'), part(li, '.person__role')]
        .concat(introItems, people).forEach(stop);
      art.style.visibility = '';
      finish();
    } else {
      // 30 ms: bio, role, name drop 20px out, last first, 50 ms apart; the text panel fades from 100 ms.
      introItems.slice().reverse().forEach(function (el, i) {
        tween(el, { opacity: '0', transform: 'translateY(20px)' }, { delay: 30 + i * 50, duration: 370, easing: EASE_IN_CUBIC });
      });
      tween(introPanel, { opacity: '0' }, { delay: 100, duration: 310, easing: EASE_OUT_QUAD });
      // 145 ms: the portrait goes back to its place in the grid (720 ms).
      tween(introArt, { transform: flipFrom(li) }, { delay: 145, duration: 720, easing: EASE_IO_CUBIC })
        .then(function () {
          if (id !== runId) return;
          art.style.visibility = '';
          introArt.style.visibility = 'hidden';
        });
      // 1000 ms: the other people and the clicked name come back.
      wait(1000).then(function () {
        if (id !== runId) return;
        tween(part(li, '.person__name'), { opacity: '1' }, { duration: 300, easing: EASE_OUT_QUAD });
        tween(part(li, '.person__role'), { opacity: '1' }, { duration: 300, easing: EASE_OUT_QUAD });
        var last;
        people.forEach(function (other) {
          if (other === li) return;
          last = tween(other, { opacity: '1', transform: 'translateY(0px)' }, { duration: 410, easing: EASE_OUT_QUAD });
        });
        return last;
      }).then(function () {
        introArt.style.visibility = '';
        finish();
      });
    }

    grid.inert = false;
    if (!opts || opts.returnFocus !== false) btn.focus({ preventScroll: true });
  }

  /* Phones: the intro opens in place under the name (Audeo: height, 1s, 170 ms delay).
     The centred name is swapped for the larger left-aligned one with a crossfade. */
  var openMore = null;
  function swapName(li, expanded, fadeOutDelay, fadeInDuration) {
    var token = li._swap = (li._swap || 0) + 1;
    var labels = [part(li, '.person__name'), part(li, '.person__role')];
    var out;
    labels.forEach(function (el) {
      out = tween(el, { opacity: '0' }, { delay: fadeOutDelay, duration: 200, easing: EASE_OUT_QUAD });
    });
    return out.then(function () {
      if (token !== li._swap) return;
      li.classList.toggle('is-expanded', expanded);
      labels.forEach(function (el) { tween(el, { opacity: '1' }, { duration: fadeInDuration, easing: 'ease' }); });
    });
  }
  function expand(li) {
    var btn = part(li, '.person__btn');
    var more = part(li, '.person__more');
    if (openMore && openMore !== li) collapse(openMore);
    openMore = li;
    btn.setAttribute('aria-expanded', 'true');
    more.hidden = false;
    more.style.height = '0px';
    swapName(li, true, 0, 400);
    tween(more, { height: more.scrollHeight + 'px' }, { delay: 170, duration: 1000, easing: EASE_IO_CUBIC })
      .then(function () { if (btn.getAttribute('aria-expanded') === 'true') more.style.height = 'auto'; });
  }
  function collapse(li, opts) {
    var btn = part(li, '.person__btn');
    var more = part(li, '.person__more');
    if (openMore === li) openMore = null;
    btn.setAttribute('aria-expanded', 'false');
    if (opts && opts.instant) {
      [more, part(li, '.person__name'), part(li, '.person__role')].forEach(function (el) { stop(el); el.style.opacity = ''; });
      li._swap = (li._swap || 0) + 1;
      li.classList.remove('is-expanded');
      more.style.height = '';
      more.hidden = true;
      return;
    }
    more.style.height = more.getBoundingClientRect().height + 'px';
    swapName(li, false, 870, 300);
    tween(more, { height: '0px' }, { delay: 170, duration: 1000, easing: EASE_IO_CUBIC })
      .then(function () { if (btn.getAttribute('aria-expanded') === 'false') { more.hidden = true; more.style.height = ''; } });
  }

  people.forEach(function (li) {
    part(li, '.person__btn').addEventListener('click', function () {
      if (phoneMq.matches) {
        if (openMore === li) collapse(li); else expand(li);
      } else if (!openPerson) {
        openIntro(li);
      }
    });
  });
  closeBtn.addEventListener('click', function () { closeIntro(); });

  // Click anywhere outside the open intro closes it (Audeo behaviour).
  document.addEventListener('click', function (e) {
    var t = e.target;
    if (openPerson && phase !== 'closing' && !intro.contains(t) && !t.closest('.person__btn')) {
      closeIntro({ returnFocus: !t.closest('a, button') });
    }
    if (openMore && !openMore.contains(t)) collapse(openMore);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (menuIsOpen()) { closeMenu(true); return; }
    if (openPerson) { closeIntro(); return; }
    if (openMore) { var li = openMore; collapse(li); part(li, '.person__btn').focus(); }
  });

  function onLayoutChange() {
    if (!phoneMq.matches && menuIsOpen()) closeMenu(false);
    if (phoneMq.matches && openPerson) closeIntro({ instant: true, returnFocus: false });
    if (!phoneMq.matches && openMore) collapse(openMore, { instant: true });
  }
  if (phoneMq.addEventListener) phoneMq.addEventListener('change', onLayoutChange);
  else phoneMq.addListener(onLayoutChange);
  window.addEventListener('resize', function () { if (openPerson) fitStage(); });
})();
