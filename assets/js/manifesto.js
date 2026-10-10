/* Cloud Hill Capital manifesto page: phone menu, contents highlight, phone contents dropdown. */
(function () {
  'use strict';

  var root = document.documentElement;
  var main = document.getElementById('main');

  /* ---------- phone menu (same behaviour as the home page) ---------- */
  var menuToggle = document.querySelector('.menu-toggle');
  function menuIsOpen() { return root.classList.contains('menu-open'); }
  function openMenu() {
    root.classList.add('menu-open');
    menuToggle.setAttribute('aria-expanded', 'true');
    menuToggle.setAttribute('aria-label', 'Close menu');
    main.inert = true;
  }
  function closeMenu(returnFocus) {
    root.classList.remove('menu-open');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Open menu');
    main.inert = false;
    if (returnFocus) menuToggle.focus();
  }
  menuToggle.addEventListener('click', function () { if (menuIsOpen()) closeMenu(false); else openMenu(); });

  /* ---------- contents: highlight the section in view ---------- */
  var side = document.querySelector('.mf-side');
  var links = Array.prototype.slice.call(document.querySelectorAll('.mf-toc__list a'));
  var sections = links.map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); });
  var barNum = document.querySelector('.mf-bar__num');
  var barTitle = document.querySelector('.mf-bar__title');
  var current = -1;

  function setCurrent(i) {
    if (i === current || i < 0) return;
    current = i;
    links.forEach(function (a, k) {
      if (k === i) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
    });
    barNum.textContent = links[i].querySelector('.mf-toc__num').textContent;
    barTitle.textContent = links[i].querySelector('.mf-toc__title').textContent;
    // Keep the highlighted item visible when the sidebar list is taller than the screen.
    var list = document.querySelector('.mf-toc');
    var item = links[i];
    if (list.scrollHeight > list.clientHeight && getComputedStyle(list).position !== 'absolute') {
      var top = item.offsetTop - list.clientHeight / 2 + item.offsetHeight / 2;
      list.scrollTo({ top: top, behavior: 'auto' });
    }
  }

  // A thin band 30% down the screen: the section crossing it is the current one.
  var crossing = sections.map(function () { return false; });
  var atEnd = false;
  function update() {
    if (atEnd) { setCurrent(sections.length - 1); return; }
    for (var i = crossing.length - 1; i >= 0; i--) { if (crossing[i]) { setCurrent(i); return; } }
  }
  if ('IntersectionObserver' in window) {
    var bandObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { crossing[sections.indexOf(e.target)] = e.isIntersecting; });
      update();
    }, { rootMargin: '-30% 0px -69% 0px', threshold: 0 });
    sections.forEach(function (s) { bandObserver.observe(s); });

    // At the very bottom the last section (Sources) may never reach the band, so mark it when the page end shows.
    var end = document.createElement('div');
    end.setAttribute('aria-hidden', 'true');
    document.querySelector('.mf-text').appendChild(end);
    new IntersectionObserver(function (entries) {
      atEnd = entries[0].isIntersecting;
      update();
    }, { threshold: 0 }).observe(end);
  }
  setCurrent(0);

  /* ---------- phone: contents dropdown ---------- */
  var barToggle = document.querySelector('.mf-bar__toggle');
  function listIsOpen() { return side.classList.contains('is-open'); }
  function openList() { side.classList.add('is-open'); barToggle.setAttribute('aria-expanded', 'true'); }
  function closeList(returnFocus) {
    side.classList.remove('is-open');
    barToggle.setAttribute('aria-expanded', 'false');
    if (returnFocus) barToggle.focus();
  }
  barToggle.addEventListener('click', function () { if (listIsOpen()) closeList(false); else openList(); });
  links.forEach(function (a) { a.addEventListener('click', function () { if (listIsOpen()) closeList(false); }); });
  document.addEventListener('click', function (e) { if (listIsOpen() && !side.contains(e.target)) closeList(false); });

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (menuIsOpen()) closeMenu(true);
    else if (listIsOpen()) closeList(true);
  });

  // Leaving the phone layout closes anything that only exists there.
  var phoneMq = window.matchMedia('(max-width: 767px)');
  var narrowMq = window.matchMedia('(max-width: 899px)');
  function onResize() {
    if (!phoneMq.matches && menuIsOpen()) closeMenu(false);
    if (!narrowMq.matches && listIsOpen()) closeList(false);
  }
  [phoneMq, narrowMq].forEach(function (mq) {
    if (mq.addEventListener) mq.addEventListener('change', onResize); else mq.addListener(onResize);
  });
})();
