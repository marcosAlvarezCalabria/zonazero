(() => {
  'use strict';

  const header = document.querySelector('.site-header');
  const menuButton = document.querySelector('.menu-toggle');
  const mobileNav = document.querySelector('.mobile-nav');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const trapFocus = (event, container) => {
    if (event.key !== 'Tab' || !container) return;
    const focusable = [...container.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')]
      .filter((element) => !element.hidden && element.getClientRects().length);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  };

  if (document.body.classList.contains('home-page') && (window.scrollY > 2 || window.location.hash || reduceMotion.matches)) {
    document.body.classList.add('skip-home-intro');
  }

  const heroVideo = document.querySelector('.hero-video');
  if (heroVideo) {
    let videoStarted = false;
    heroVideo.muted = true;
    heroVideo.defaultMuted = true;
    heroVideo.playsInline = true;
    heroVideo.defaultPlaybackRate = 1.5;
    heroVideo.playbackRate = 1.5;

    const showFinalFrame = () => {
      if (Number.isFinite(heroVideo.duration)) heroVideo.currentTime = Math.max(0, heroVideo.duration - 0.05);
    };
    const startHeroVideo = () => {
      if (videoStarted || reduceMotion.matches) return;
      videoStarted = true;
      document.body.classList.add('hero-video-started');
      heroVideo.play().catch(() => {
        videoStarted = false;
        document.body.classList.remove('hero-video-started');
      });
    };

    if (reduceMotion.matches) {
      heroVideo.pause();
      if (heroVideo.readyState >= 1) showFinalFrame();
      else heroVideo.addEventListener('loadedmetadata', showFinalFrame, { once: true });
    } else {
      startHeroVideo();
      ['pointerdown', 'keydown', 'touchstart'].forEach((eventName) => {
        window.addEventListener(eventName, startHeroVideo, { passive: true, once: true });
      });
    }

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) heroVideo.pause();
      else if (videoStarted && !heroVideo.ended) heroVideo.play().catch(() => {});
    });
  }

  const wallSurfaces = [...document.querySelectorAll('.wall-parallax')];
  let parallaxFrame = 0;
  const updateWallParallax = () => {
    parallaxFrame = 0;
    if (reduceMotion.matches) return;
    const viewportCenter = window.innerHeight / 2;
    const amplitude = window.innerWidth < 700 ? 18 : 38;
    wallSurfaces.forEach((surface) => {
      const rect = surface.getBoundingClientRect();
      if (rect.bottom < -120 || rect.top > window.innerHeight + 120) return;
      const progress = Math.max(-1, Math.min(1, (rect.top + rect.height / 2 - viewportCenter) / (window.innerHeight + rect.height)));
      surface.style.setProperty('--wall-shift', `${Math.round(progress * amplitude)}px`);
    });
  };
  const requestWallParallax = () => {
    if (!parallaxFrame) parallaxFrame = window.requestAnimationFrame(updateWallParallax);
  };
  updateWallParallax();
  window.addEventListener('scroll', requestWallParallax, { passive: true });
  window.addEventListener('resize', requestWallParallax, { passive: true });

  const sequenceStage = document.querySelector('.artist-sequence-stage');
  if (sequenceStage) {
    const sequenceStory = sequenceStage.closest('.artist-scroll-story');
    const sticky = sequenceStage.querySelector('.artist-sequence-sticky');
    const canvas = sequenceStage.querySelector('.artist-sequence-canvas');
    const fallback = sequenceStage.querySelector('.artist-sequence-fallback');
    const progressLine = sequenceStage.querySelector('.artist-sequence-progress span');
    const context = canvas?.getContext('2d', { alpha: false });
    const frameTotal = Number(sequenceStage.dataset.frameCount) || 240;
    const frameSource = (index) => `artist-sequence/frame-${String(index + 1).padStart(4, '0')}.jpg`;
    const frameCache = new Array(frameTotal);
    let requestedFrame = 0;
    let renderedFrame = -1;
    let sequenceFrame = 0;
    let resizeFrame = 0;
    let sequenceActive = false;
    let lastProgress = 0;

    const drawCover = (image) => {
      if (!context || !canvas || !sticky || !image?.naturalWidth) return;
      const width = canvas.width;
      const height = canvas.height;
      const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
      const sourceWidth = width / scale;
      const sourceHeight = height / scale;
      const sourceX = (image.naturalWidth - sourceWidth) / 2;
      const sourceY = (image.naturalHeight - sourceHeight) / 2;
      context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, width, height);
    };
    const drawFrame = (index) => {
      const image = frameCache[index];
      if (!image || !image.complete || !image.naturalWidth) return false;
      drawCover(image);
      renderedFrame = index;
      sequenceStage.classList.add('is-ready');
      return true;
    };
    const loadFrame = (index) => {
      if (index < 0 || index >= frameTotal || frameCache[index] !== undefined) return;
      const image = new Image();
      frameCache[index] = image;
      image.decoding = 'async';
      image.onload = () => {
        if (index === requestedFrame || renderedFrame < 0) drawFrame(index);
      };
      image.onerror = () => {
        frameCache[index] = false;
        if (index === 0 && renderedFrame < 0) {
          sequenceStory?.classList.remove('is-enhanced');
          sequenceStage.classList.add('is-static');
        }
      };
      image.src = frameSource(index);
    };
    const preloadAround = (index, direction) => {
      const before = direction >= 0 ? 5 : 12;
      const after = direction >= 0 ? 12 : 5;
      for (let frame = index - before; frame <= index + after; frame += 1) loadFrame(frame);
      [0, Math.floor(frameTotal / 2), frameTotal - 1].forEach(loadFrame);
    };
    const pruneFrames = (index) => {
      frameCache.forEach((image, frame) => {
        if (!image || Math.abs(frame - index) <= 14 || frame === 0 || frame === frameTotal - 1) return;
        image.onload = null;
        image.onerror = null;
        image.src = '';
        frameCache[frame] = undefined;
      });
    };
    const resizeSequence = () => {
      resizeFrame = 0;
      if (!canvas || !sticky || !context) return;
      const bounds = sticky.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.round(bounds.width * ratio);
      const height = Math.round(bounds.height * ratio);
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        if (renderedFrame >= 0) drawFrame(renderedFrame);
      }
    };
    const updateSequence = () => {
      sequenceFrame = 0;
      if (!sequenceActive || reduceMotion.matches) return;
      const bounds = sequenceStage.getBoundingClientRect();
      const stickyTop = Number.parseFloat(window.getComputedStyle(sticky).top) || 0;
      const travel = Math.max(1, bounds.height - sticky.offsetHeight);
      const scrollProgress = Math.max(0, Math.min(1, (stickyTop - bounds.top) / travel));
      const copyEntrance = Math.max(0, Math.min(1, (scrollProgress - 0.1) / 0.16));
      const copyExit = Math.max(0, Math.min(1, (0.9 - scrollProgress) / 0.12));
      const copyReveal = Math.min(1 - Math.pow(1 - copyEntrance, 3), copyExit);
      const nextFrame = Math.round(scrollProgress * (frameTotal - 1));
      const direction = scrollProgress >= lastProgress ? 1 : -1;
      lastProgress = scrollProgress;
      requestedFrame = nextFrame;
      if (progressLine) progressLine.style.transform = `scaleX(${scrollProgress})`;
      sticky.style.setProperty('--sequence-copy-opacity', copyReveal.toFixed(3));
      sticky.style.setProperty('--sequence-copy-offset', `${Math.round((1 - copyReveal) * 36)}px`);
      sticky.style.setProperty('--sequence-copy-clip', `${Math.round((1 - copyReveal) * 100)}%`);
      if (!drawFrame(nextFrame)) {
        loadFrame(nextFrame);
        for (let offset = 1; offset <= 8; offset += 1) {
          if (drawFrame(nextFrame - offset) || drawFrame(nextFrame + offset)) break;
        }
      }
      preloadAround(nextFrame, direction);
      pruneFrames(nextFrame);
    };
    const requestSequence = () => {
      if (!sequenceFrame) sequenceFrame = window.requestAnimationFrame(updateSequence);
    };
    const requestSequenceResize = () => {
      if (!resizeFrame) resizeFrame = window.requestAnimationFrame(() => { resizeSequence(); updateSequence(); });
    };

    if (!canvas || !context || !sticky || !fallback) {
      sequenceStage.classList.add('is-static');
    } else if (reduceMotion.matches) {
      fallback.src = frameSource(frameTotal - 1);
      sequenceStage.classList.add('is-static');
    } else {
      sequenceStory?.classList.add('is-enhanced');
      loadFrame(0);
      const activateSequence = () => {
        if (sequenceActive) return;
        sequenceActive = true;
        resizeSequence();
        updateSequence();
      };
      activateSequence();
      window.addEventListener('scroll', requestSequence, { passive: true });
      window.addEventListener('resize', requestSequenceResize, { passive: true });
    }
  }

  const updateHeader = () => header?.classList.toggle('scrolled', window.scrollY > 20);
  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });

  const setMenu = (open) => {
    if (!menuButton || !mobileNav) return;
    document.body.classList.toggle('menu-open', open);
    mobileNav.classList.toggle('open', open);
    mobileNav.inert = !open;
    mobileNav.setAttribute('aria-hidden', String(!open));
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    if (open) mobileNav.querySelector('a')?.focus();
  };
  if (mobileNav) mobileNav.inert = true;
  const desktopQuery = window.matchMedia('(min-width: 981px)');
  desktopQuery.addEventListener('change', (event) => { if (event.matches) setMenu(false); });
  menuButton?.addEventListener('click', () => setMenu(!mobileNav.classList.contains('open')));
  mobileNav?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (event) => {
    if (mobileNav?.classList.contains('open')) {
      if (event.key === 'Escape') { setMenu(false); menuButton?.focus(); }
      else trapFocus(event, mobileNav);
    }
  });

  const filters = [...document.querySelectorAll('.filter')];
  const works = [...document.querySelectorAll('.work')];
  const filterStatus = document.querySelector('#filter-status');
  filters.forEach((filter) => {
    filter.addEventListener('click', () => {
      const category = filter.dataset.filter;
      filters.forEach((item) => item.setAttribute('aria-pressed', String(item === filter)));
      works.forEach((work) => { work.hidden = category !== 'all' && work.dataset.category !== category; });
      const visibleCount = works.filter((work) => !work.hidden).length;
      if (filterStatus) filterStatus.textContent = `${visibleCount} ${visibleCount === 1 ? 'trabajo disponible' : 'trabajos disponibles'}`;
    });
  });

  const lightbox = document.querySelector('.lightbox');
  const lightboxImage = lightbox?.querySelector('img');
  const lightboxCaption = lightbox?.querySelector('figcaption');
  const lightboxClose = lightbox?.querySelector('.lightbox-close');
  let lightboxTrigger = null;

  const closeLightbox = () => {
    if (!lightbox) return;
    lightboxTrigger?.focus();
    lightbox.classList.remove('open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('overlay-open');
  };
  const openLightbox = (work) => {
    if (!lightbox || !lightboxImage || !lightboxCaption) return;
    const source = work.querySelector('img');
    lightboxTrigger = work;
    lightboxImage.src = source.src;
    lightboxImage.alt = source.alt;
    lightboxCaption.textContent = work.querySelector('.work-caption')?.textContent || source.alt;
    lightbox.classList.add('open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.classList.add('overlay-open');
    lightboxClose?.focus();
  };
  works.forEach((work) => {
    work.addEventListener('click', () => openLightbox(work));
  });
  lightboxClose?.addEventListener('click', closeLightbox);
  lightbox?.addEventListener('click', (event) => { if (event.target === lightbox) closeLightbox(); });
  document.addEventListener('keydown', (event) => {
    if (!lightbox?.classList.contains('open')) return;
    if (event.key === 'Escape') closeLightbox();
    else trapFocus(event, lightbox);
  });

  const form = document.querySelector('#booking-form');
  if (!form) return;

  const steps = [...form.querySelectorAll('.form-step')];
  const progress = [...form.querySelectorAll('.progress span')];
  const progressBar = form.querySelector('.progress');
  const summary = form.querySelector('#booking-summary');
  let currentStep = 0;

  const value = (name) => {
    const field = form.elements[name];
    if (!field) return '';
    if (field instanceof RadioNodeList) return field.value.trim();
    return String(field.value || '').trim();
  };
  const setError = (message) => {
    const area = steps[currentStep].querySelector('.error-message');
    if (area) area.textContent = message;
  };
  const validate = () => {
    setError('');
    [...steps[currentStep].querySelectorAll('[aria-invalid="true"]')].forEach((field) => field.setAttribute('aria-invalid', 'false'));
    if (currentStep === 0 && !value('service')) {
      const fields = [...form.querySelectorAll('input[name="service"]')];
      fields.forEach((field) => field.setAttribute('aria-invalid', 'true'));
      setError('Elige una opción para poder continuar.');
      fields[0]?.focus();
      return false;
    }
    if (currentStep === 1 && !value('bodyZone')) {
      form.elements.bodyZone.setAttribute('aria-invalid', 'true');
      setError('Escribe la zona del cuerpo. Si no la sabes, indícalo así.');
      form.elements.bodyZone.focus();
      return false;
    }
    if (currentStep === 1 && !value('size')) {
      form.elements.size.setAttribute('aria-invalid', 'true');
      setError('Selecciona un tamaño aproximado.');
      form.elements.size.focus();
      return false;
    }
    if (currentStep === 2 && value('idea').length < 12) {
      form.elements.idea.setAttribute('aria-invalid', 'true');
      setError('Cuéntanos un poco más: motivo, estilo o referencia principal.');
      form.elements.idea.focus();
      return false;
    }
    return true;
  };
  const buildSummary = () => {
    const lines = [
      `Servicio: ${value('service')}`,
      `Zona: ${value('bodyZone')}`,
      `Tamaño: ${value('size')}`,
      `Artista: ${value('artist')}`,
      `Idea: ${value('idea')}`
    ];
    if (summary) summary.textContent = lines.join('\n');
    return lines;
  };
  const showStep = (index) => {
    currentStep = Math.max(0, Math.min(index, steps.length - 1));
    steps.forEach((step, position) => step.classList.toggle('active', position === currentStep));
    progress.forEach((bar, position) => bar.classList.toggle('active', position <= currentStep));
    progressBar?.setAttribute('aria-valuenow', String(currentStep + 1));
    progressBar?.setAttribute('aria-valuetext', `Paso ${currentStep + 1} de ${steps.length}`);
    setError('');
    if (currentStep === 3) buildSummary();
    steps[currentStep].querySelector('h3')?.setAttribute('tabindex', '-1');
    steps[currentStep].querySelector('h3')?.focus({ preventScroll: true });
  };

  form.querySelectorAll('.next').forEach((button) => button.addEventListener('click', () => { if (validate()) showStep(currentStep + 1); }));
  form.querySelectorAll('.prev').forEach((button) => button.addEventListener('click', () => showStep(currentStep - 1)));
  form.addEventListener('input', (event) => {
    if (event.target instanceof HTMLElement && event.target.matches('input, select, textarea')) {
      event.target.setAttribute('aria-invalid', 'false');
      if (event.target.matches('input[name="service"]')) {
        form.querySelectorAll('input[name="service"]').forEach((field) => field.setAttribute('aria-invalid', 'false'));
      }
    }
    setError('');
  });

  const params = new URLSearchParams(window.location.search);
  const requestedArtist = params.get('artist');
  if (requestedArtist && [...form.elements.artist.options].some((option) => option.value === requestedArtist)) form.elements.artist.value = requestedArtist;

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const submitButton = form.querySelector('[type="submit"]');
    const originalLabel = submitButton?.textContent;
    form.setAttribute('aria-busy', 'true');
    if (submitButton) { submitButton.disabled = true; submitButton.textContent = 'Abriendo WhatsApp…'; }
    const lines = buildSummary();
    const message = ['Hola, Zona Zero. Quiero consultar una idea:', '', ...lines, '', 'Puedo enviar referencias por aquí.'].join('\n');
    const url = `https://wa.me/34604904003?text=${encodeURIComponent(message)}`;
    const popup = window.open(url, '_blank', 'noopener,noreferrer');
    if (!popup) {
      const error = steps[currentStep].querySelector('.error-message');
      if (error) error.textContent = 'El navegador bloqueó la ventana. Escríbenos al 604 90 40 03.';
    }
    window.setTimeout(() => {
      form.removeAttribute('aria-busy');
      if (submitButton) { submitButton.disabled = false; submitButton.textContent = originalLabel; }
    }, 900);
  });
})();
