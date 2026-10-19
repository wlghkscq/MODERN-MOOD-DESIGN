/* =========================================================
   MMD — MODERN MOOD DESIGN
   인터랙션: 모바일 메뉴 / 스크롤 상태 / 갤러리 필터 / 라이트박스 / 등장 애니메이션
   외부 라이브러리 없이 바닐라 JavaScript로만 동작합니다.
   ========================================================= */
(function () {
  'use strict';

  var doc = document;

  /* ---------------------------------------------------------
     1. 헤더 스크롤 상태 + 현재 섹션 메뉴 강조
     --------------------------------------------------------- */
  var header = doc.getElementById('siteHeader');
  var navLinks = Array.prototype.slice.call(doc.querySelectorAll('.nav-link'));
  var sections = navLinks
    .map(function (link) {
      var id = link.getAttribute('href');
      return id && id.charAt(0) === '#' ? doc.querySelector(id) : null;
    })
    .filter(Boolean);

  var ticking = false;

  function onScroll() {
    if (ticking) return;
    ticking = true;

    window.requestAnimationFrame(function () {
      var y = window.scrollY || window.pageYOffset;

      /* 헤더 그림자 */
      if (header) header.classList.toggle('is-scrolled', y > 12);

      /* 현재 보고 있는 섹션 메뉴 강조 */
      if (sections.length) {
        var offset = y + (header ? header.offsetHeight : 0) + 80;
        var currentIndex = -1;

        for (var i = 0; i < sections.length; i++) {
          if (sections[i].offsetTop <= offset) currentIndex = i;
        }

        navLinks.forEach(function (link, i) {
          link.classList.toggle('is-active', i === currentIndex);
          if (i === currentIndex) {
            link.setAttribute('aria-current', 'true');
          } else {
            link.removeAttribute('aria-current');
          }
        });
      }

      ticking = false;
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------------------------------------------------------
     2. 모바일 메뉴 (햄버거)
     --------------------------------------------------------- */
  var navToggle = doc.getElementById('navToggle');
  var primaryNav = doc.getElementById('primaryNav');

  function closeNav() {
    if (!navToggle || !primaryNav) return;
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.setAttribute('aria-label', '메뉴 열기');
    primaryNav.classList.remove('is-open');
  }

  function openNav() {
    if (!navToggle || !primaryNav) return;
    navToggle.setAttribute('aria-expanded', 'true');
    navToggle.setAttribute('aria-label', '메뉴 닫기');
    primaryNav.classList.add('is-open');
  }

  if (navToggle && primaryNav) {
    navToggle.addEventListener('click', function () {
      var isOpen = navToggle.getAttribute('aria-expanded') === 'true';
      if (isOpen) {
        closeNav();
      } else {
        openNav();
      }
    });

    /* 메뉴 항목 클릭 시 닫기 */
    primaryNav.addEventListener('click', function (event) {
      if (event.target.closest('a')) closeNav();
    });

    /* 바깥 클릭 시 닫기 */
    doc.addEventListener('click', function (event) {
      if (!primaryNav.classList.contains('is-open')) return;
      if (primaryNav.contains(event.target) || navToggle.contains(event.target)) return;
      closeNav();
    });

    /* 데스크톱 폭으로 커지면 상태 초기화 */
    var mq = window.matchMedia('(min-width: 1024px)');
    var onChange = function (e) { if (e.matches) closeNav(); };
    if (mq.addEventListener) mq.addEventListener('change', onChange);
    else if (mq.addListener) mq.addListener(onChange);
  }

  /* ---------------------------------------------------------
     3. 시공 사례 필터
     --------------------------------------------------------- */
  var filterButtons = Array.prototype.slice.call(doc.querySelectorAll('.filter-btn'));
  var galleryItems = Array.prototype.slice.call(doc.querySelectorAll('.gallery-item'));
  var filterCount = doc.getElementById('filterCount');

  function applyFilter(filter) {
    var visible = 0;

    galleryItems.forEach(function (item) {
      var match = filter === 'all' || item.getAttribute('data-type') === filter;
      item.classList.toggle('is-hidden', !match);
      if (match) visible++;
    });

    if (filterCount) {
      var label = '전체';
      filterButtons.some(function (btn) {
        if (btn.getAttribute('data-filter') === filter) {
          label = btn.textContent.trim();
          return true;
        }
        return false;
      });
      filterCount.textContent = filter === 'all'
        ? '전체 ' + visible + '개의 시공 사례'
        : label + ' ' + visible + '개의 시공 사례';
    }

    /* 필터 후 보이는 항목만 라이트박스 목록에 반영 */
    rebuildLightboxList();
  }

  filterButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      filterButtons.forEach(function (other) {
        var active = other === btn;
        other.classList.toggle('is-active', active);
        other.setAttribute('aria-pressed', active ? 'true' : 'false');
      });
      applyFilter(btn.getAttribute('data-filter'));
    });
  });

  /* ---------------------------------------------------------
     4. 라이트박스 (시공 사례 확대 보기)
     --------------------------------------------------------- */
  var lightbox = doc.getElementById('lightbox');
  var lightboxImg = doc.getElementById('lightboxImg');
  var lightboxTitle = doc.getElementById('lightboxTitle');
  var lightboxSpec = doc.getElementById('lightboxSpec');
  var lightboxCounter = doc.getElementById('lightboxCounter');
  var lightboxClose = doc.getElementById('lightboxClose');
  var lightboxPrev = doc.getElementById('lightboxPrev');
  var lightboxNext = doc.getElementById('lightboxNext');

  var slides = [];
  var currentIndex = 0;
  var lastFocused = null;

  function rebuildLightboxList() {
    slides = galleryItems
      .filter(function (item) { return !item.classList.contains('is-hidden'); })
      .map(function (item) {
        var btn = item.querySelector('.gallery-btn');
        var img = item.querySelector('img');
        return {
          src: btn.getAttribute('data-src'),
          title: btn.getAttribute('data-title') || '',
          spec: btn.getAttribute('data-spec') || '',
          alt: img ? img.getAttribute('alt') : ''
        };
      });
  }

  function renderSlide() {
    var slide = slides[currentIndex];
    if (!slide) return;

    lightboxImg.setAttribute('src', slide.src);
    lightboxImg.setAttribute('alt', slide.alt || slide.title);
    lightboxTitle.textContent = slide.title;
    lightboxSpec.textContent = slide.spec;
    lightboxCounter.textContent = (currentIndex + 1) + ' / ' + slides.length;
  }

  function openLightbox(index) {
    if (!lightbox || !slides.length) return;

    lastFocused = doc.activeElement;
    currentIndex = (index + slides.length) % slides.length;
    renderSlide();

    lightbox.hidden = false;
    /* display: none -> flex 전환 후 트랜지션을 위해 한 프레임 대기 */
    window.requestAnimationFrame(function () {
      lightbox.classList.add('is-open');
    });
    doc.body.classList.add('is-locked');

    if (lightboxClose) lightboxClose.focus();
  }

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.classList.remove('is-open');
    doc.body.classList.remove('is-locked');

    var finish = function () {
      lightbox.hidden = true;
      lightbox.removeEventListener('transitionend', finish);
    };
    lightbox.addEventListener('transitionend', finish);
    /* 트랜지션이 발생하지 않는 환경 대비 */
    window.setTimeout(finish, 340);

    if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
  }

  function step(delta) {
    if (!slides.length) return;
    currentIndex = (currentIndex + delta + slides.length) % slides.length;
    renderSlide();
  }

  /* 갤러리 버튼 클릭 -> 해당 사진을 라이트박스로 */
  galleryItems.forEach(function (item) {
    var btn = item.querySelector('.gallery-btn');
    if (!btn) return;

    btn.addEventListener('click', function () {
      rebuildLightboxList();
      var index = slides.findIndex(function (slide) {
        return slide.src === btn.getAttribute('data-src');
      });
      openLightbox(index < 0 ? 0 : index);
    });
  });

  if (lightbox) {
    if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
    if (lightboxPrev) lightboxPrev.addEventListener('click', function () { step(-1); });
    if (lightboxNext) lightboxNext.addEventListener('click', function () { step(1); });

    /* 배경(사진 바깥) 클릭 시 닫기 */
    lightbox.addEventListener('click', function (event) {
      if (event.target === lightbox) closeLightbox();
    });

    /* 키보드 조작 */
    doc.addEventListener('keydown', function (event) {
      if (lightbox.hidden) return;

      if (event.key === 'Escape') {
        closeLightbox();
      } else if (event.key === 'ArrowLeft') {
        step(-1);
      } else if (event.key === 'ArrowRight') {
        step(1);
      } else if (event.key === 'Tab') {
        /* 포커스를 라이트박스 안에 가둡니다 */
        var focusables = [lightboxClose, lightboxPrev, lightboxNext].filter(Boolean);
        if (!focusables.length) return;

        var first = focusables[0];
        var last = focusables[focusables.length - 1];

        if (event.shiftKey && doc.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && doc.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    });

    /* 모바일 스와이프 */
    var touchStartX = 0;
    var touchStartY = 0;

    lightbox.addEventListener('touchstart', function (event) {
      if (!event.changedTouches.length) return;
      touchStartX = event.changedTouches[0].clientX;
      touchStartY = event.changedTouches[0].clientY;
    }, { passive: true });

    lightbox.addEventListener('touchend', function (event) {
      if (!event.changedTouches.length) return;

      var dx = event.changedTouches[0].clientX - touchStartX;
      var dy = event.changedTouches[0].clientY - touchStartY;

      if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy)) {
        step(dx < 0 ? 1 : -1);
      }
    }, { passive: true });
  }

  /* ---------------------------------------------------------
     5. 스크롤 등장 애니메이션
     --------------------------------------------------------- */
  var revealTargets = Array.prototype.slice.call(
    doc.querySelectorAll(
      '.section-title, .section-lead, .about-copy, .about-figure, .strength-card, .product-card, .gallery-item, .contact-card, .contact-cta'
    )
  );

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!reduceMotion && 'IntersectionObserver' in window && revealTargets.length) {
    revealTargets.forEach(function (el, i) {
      el.classList.add('reveal');
      /* 같은 묶음 안에서 살짝 시차를 두어 자연스럽게 나타나게 합니다 */
      el.style.transitionDelay = (Math.min(i % 6, 5) * 55) + 'ms';
    });

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    revealTargets.forEach(function (el) { observer.observe(el); });
  }

  /* ---------------------------------------------------------
     6. 문의 전화 버튼 — 전화번호 입력 전에는 안내만 표시
     --------------------------------------------------------- */
  var callBtn = doc.getElementById('callBtn');
  var phoneHref = callBtn ? callBtn.getAttribute('href') : '';

  if (callBtn && (!phoneHref || phoneHref === 'tel:')) {
    callBtn.addEventListener('click', function (event) {
      event.preventDefault();
      window.alert('전화번호를 입력한 뒤 사용할 수 있습니다.\n\nindex.html 에서 [여기에 입력] 부분을 실제 전화번호로 바꿔 주세요.\n(예: href="tel:010-0000-0000")');
    });
  }

  /* ---------------------------------------------------------
     7. 최초 실행
     --------------------------------------------------------- */
  rebuildLightboxList();
})();
