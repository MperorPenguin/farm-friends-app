/* Farm Friends — v0.2.4-alpha (stability tidy)
   - Fixes template string typo that broke navigation.
   - Adds tiny guards and cleanup (no feature changes).
   Baseline features kept from v0.2.3-alpha:
   * Guess the Sound! with Replay, themed popups (Correct/Incorrect) + Next button
   * No auto-cycling; advance only when child taps Next
   * Explore modal auto-plays on open; stops on close
*/
(() => {
  const $ = (sel, parent = document) => parent?.querySelector(sel);

  // Elements
  const homeEl   = $('#home');
  const sceneEl  = $('#scene');
  const matchEl  = $('#match');
  const btnBack  = $('#btn-back');

  // Home buttons
  const btnExplore = $('#btn-explore');
  const btnMatch   = $('#btn-match');

  // Match controls
  const playSoundBtn = $('#play-sound'); // Replay button
  const choicesEl    = $('#choices');
  const resultEl     = $('#result');
  const matchCard    = $('.match-card', matchEl);

  // Modal elements (Explore)
  const overlay    = $('#overlay');
  const modalClose = $('#modal-close');
  const modalImg   = $('#modal-img');
  const modalPlay  = $('#modal-play');
  const modalTitle = $('#modal-title');
  const factType   = $('#fact-type');
  const factHabitat= $('#fact-habitat');
  const factDiet   = $('#fact-diet');
  const factHome   = $('#fact-home');
  const factFun    = $('#fact-fun');

  // Feedback popup (created once and reused)
  let fbOverlay;

  // State
  let isMuted = false;
  const audioMap = new Map();     // id -> HTMLAudioElement
  let currentRound = null;        // { answerId, choiceIds: [] }
  let lastFocused = null;
  let currentId = null;           // which animal is currently playing
  let fadeInterval = null;

  const getAnimal = (id) => ANIMALS.find(a => a.id === id);

  // ===== Audio (exclusive with quick fade) =====
  function createAudio(src) {
    const a = new Audio(src);
    a.preload = 'auto';
    a.setAttribute('aria-hidden', 'true');
    a.volume = 1;
    return a;
  }
  function preloadAudio() {
    (ANIMALS || []).forEach(animal => {
      if (!audioMap.has(animal.id)) audioMap.set(animal.id, createAudio(animal.sound));
    });
  }
  function fade(audio, from, to, ms, done) {
    if (!audio) { if (done) done(); return; }
    if (fadeInterval) clearInterval(fadeInterval);
    const steps = 10;
    const step = (to - from) / steps;
    const interval = Math.max(10, ms / steps);
    let i = 0;
    audio.volume = from;
    fadeInterval = setInterval(() => {
      i++;
      audio.volume = Math.max(0, Math.min(1, from + step * i));
      if (i >= steps) {
        clearInterval(fadeInterval);
        audio.volume = to;
        if (done) done();
      }
    }, interval);
  }
  function stopCurrent(smooth = true) {
    if (!currentId) return;
    const a = audioMap.get(currentId);
    if (!a) { currentId = null; return; }
    if (smooth) {
      fade(a, a.volume ?? 1, 0, 140, () => { try { a.pause(); a.currentTime = 0; } catch {} });
    } else {
      try { a.pause(); a.currentTime = 0; } catch {}
    }
    currentId = null;
  }
  function playAnimalSound(id) {
    if (isMuted) return;
    const next = audioMap.get(id);
    if (!next) return;

    // Restart cleanly if same, or cross-fade if different.
    if (currentId === id) stopCurrent(false);
    else stopCurrent(true);

    try {
      next.currentTime = 0;
      next.volume = 0;
      currentId = id;
      next.play().then(() => fade(next, 0, 1, 140)).catch(()=>{});
    } catch {}
  }

  // ===== Visual flourishes =====
  function menuPuff(btn) {
    if (!btn) return;
    const puff = document.createElement('div');
    puff.className = 'menu-burst';
    const rect = btn.getBoundingClientRect();
    const w = rect.width, h = rect.height;
    const count = 14;
    for (let i = 0; i < count; i++) {
      const s = document.createElement('span');
      s.className = 'menu-spark';
      const x = Math.random() * w * 0.8 + w * 0.1;
      const y = Math.random() * h * 0.6 + h * 0.2;
      const tx = (Math.random() - 0.5) * 140;
      const ty = - (40 + Math.random() * 90);
      const size = 6 + Math.random() * 12;
      s.style.setProperty('--x', Math.round(x) + 'px');
      s.style.setProperty('--y', Math.round(y) + 'px');
      s.style.setProperty('--tx', Math.round(tx) + 'px');
      s.style.setProperty('--ty', Math.round(ty) + 'px');
      s.style.setProperty('--sz', Math.round(size) + 'px');
      s.style.setProperty('--d', (420 + Math.random()*280) + 'ms');
      puff.appendChild(s);
    }
    btn.appendChild(puff);
    setTimeout(() => puff.remove(), 720);
  }
  function sparkBurst(card) {
    if (!card) return;
    const burst = document.createElement('div');
    burst.className = 'burst';
    const rect = card.getBoundingClientRect();
    const w = rect.width, h = rect.height;
    const count = 12;
    for (let i = 0; i < count; i++) {
      const s = document.createElement('span');
      s.className = 'spark';
      const x = Math.random() * w * 0.9 + w * 0.05;
      const y = Math.random() * h * 0.7 + h * 0.15;
      const tx = (Math.random() - 0.5) * 120;
      const ty = - (40 + Math.random() * 80);
      const size = 6 + Math.random() * 10;
      s.style.setProperty('--x', Math.round(x) + 'px');
      s.style.setProperty('--y', Math.round(y) + 'px');
      s.style.setProperty('--tx', Math.round(tx) + 'px');
      s.style.setProperty('--ty', Math.round(ty) + 'px');
      s.style.setProperty('--sz', Math.round(size) + 'px');
      s.style.setProperty('--d', (450 + Math.random()*250) + 'ms');
      burst.appendChild(s);
    }
    card.appendChild(burst);
    setTimeout(() => burst.remove(), 700);
  }

  // ===== Explore modal =====
  function openModal(animal, triggerEl) {
    if (!animal) return;
    stopCurrent(false);

    lastFocused = triggerEl || document.activeElement;
    document.body.classList.add('modal-open');
    overlay?.classList.remove('hidden', 'closing');
    overlay?.setAttribute('aria-hidden', 'false');

    if (modalTitle) modalTitle.textContent = animal.name || '';
    if (modalImg) { modalImg.src = animal.image || ''; modalImg.alt = animal.name || ''; }

    if (factType)    factType.textContent = animal.type || '';
    if (factHabitat) factHabitat.textContent = animal.habitat || '';
    if (factDiet)    factDiet.textContent = animal.diet || '';
    if (factHome)    factHome.textContent = animal.home || '';
    if (factFun)     factFun.textContent = animal.fun || '';

    if (modalPlay) {
      modalPlay.onclick = () => { stopCurrent(false); playAnimalSound(animal.id); };
    }

    playAnimalSound(animal.id);
    modalClose?.focus();
  }
  function closeModal() {
    stopCurrent(false);
    if (!overlay) return;
    overlay.classList.add('closing');
    setTimeout(() => {
      overlay.classList.add('hidden');
      overlay.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('modal-open');
      if (lastFocused && lastFocused.focus) lastFocused.focus();
    }, 220);
  }

  // ===== Explore scene =====
  function renderScene() {
    if (!sceneEl) return;
    sceneEl.innerHTML = '';
    (ANIMALS || []).forEach(a => {
      const card = document.createElement('button');
      card.className = 'animal';
      card.style.background = a.color || 'var(--card)';
      card.setAttribute('aria-label', `${a.name} — open card`);
      card.dataset.id = a.id;

      const img = document.createElement('img');
      img.src = a.image; img.alt = a.name;
      const name = document.createElement('div');
      name.className = 'animal-name'; name.textContent = a.name;

      card.appendChild(img); card.appendChild(name);

      card.addEventListener('click', () => {
        card.classList.add('selected');
        card.classList.remove('pop'); void card.offsetWidth; card.classList.add('pop');
        sparkBurst(card);
        setTimeout(() => card.classList.remove('selected'), 550);
        openModal(a, card);
      });

      sceneEl.appendChild(card);
    });
  }

  // ===== Feedback popup for Match =====
  function ensureFeedbackOverlay() {
    if (fbOverlay) return fbOverlay;
    fbOverlay = document.createElement('div');
    fbOverlay.className = 'feedback-overlay hidden';
    fbOverlay.innerHTML = `
      <div class="feedback-card" role="dialog" aria-modal="true" aria-live="assertive">
        <div class="fb-icon" aria-hidden="true"></div>
        <div class="fb-title" id="fb-title"></div>
        <div class="fb-message" id="fb-message"></div>
        <div class="fb-actions">
          <button id="fb-secondary" class="btn btn-hero btn-lg hidden"></button>
          <button id="fb-primary" class="btn btn-hero btn-lg"></button>
        </div>
      </div>
    `;
    document.body.appendChild(fbOverlay);
    return fbOverlay;
  }
  function showFeedback({ correct, title, message, primaryLabel, onPrimary, secondaryLabel, onSecondary }) {
    const el = ensureFeedbackOverlay();
    const titleEl = $('#fb-title', el);
    const msgEl   = $('#fb-message', el);
    const primary = $('#fb-primary', el);
    const secondary = $('#fb-secondary', el);
    const card = $('.feedback-card', el);

    el.classList.remove('hidden');
    el.classList.toggle('correct', !!correct);
    el.classList.toggle('incorrect', !correct);
    card?.classList.remove('out');

    if (titleEl)   titleEl.textContent = title || (correct ? 'Well done!' : 'Nice try!');
    if (msgEl)     msgEl.innerHTML = message || '';
    if (primary) {
      primary.textContent = primaryLabel || (correct ? 'Next' : 'OK');
      primary.onclick = () => { if (onPrimary) onPrimary(); hideFeedback(); };
    }

    if (secondaryLabel && secondary) {
      secondary.classList.remove('hidden');
      secondary.textContent = secondaryLabel;
      secondary.onclick = () => { if (onSecondary) onSecondary(); hideFeedback(false); };
    } else if (secondary) {
      secondary.classList.add('hidden');
      secondary.onclick = null;
    }

    setTimeout(() => primary?.focus(), 10);
  }
  function hideFeedback(animateOut = true) {
    if (!fbOverlay) return;
    const card = $('.feedback-card', fbOverlay);
    if (animateOut) {
      card?.classList.add('out');
      setTimeout(() => fbOverlay.classList.add('hidden'), 200);
    } else {
      fbOverlay.classList.add('hidden');
    }
  }

  // ===== Match (audio-only; advance via Next) =====
  function randInt(n) { return Math.floor(Math.random() * n); }
  function sample(array, count) {
    const copy = array.slice(); const out = [];
    while (copy.length && out.length < count) out.push(copy.splice(randInt(copy.length), 1)[0]);
    return out;
  }
  function shuffle(array) {
    const copy = array.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }
  function animateMatchSwap(cb) {
    if (!matchCard) { if (cb) cb(); return; }
    matchCard.classList.add('swap-out');
    setTimeout(() => {
      if (cb) cb();
      matchCard.classList.remove('swap-out');
      matchCard.classList.add('swap-in');
      setTimeout(() => matchCard.classList.remove('swap-in'), 220);
    }, 220);
  }
  function newRound() {
    stopCurrent(false);
    if (resultEl) resultEl.textContent = '';

    const choicesCount = Math.min(3, (ANIMALS || []).length);
    const pool = sample(ANIMALS, choicesCount);
    const answer = pool[randInt(pool.length)];
    currentRound = { answerId: answer.id, choiceIds: pool.map(a => a.id) };

    renderChoices(pool);

    // Auto-play prompt once
    setTimeout(() => {
      stopCurrent(false);
      playAnimalSound(answer.id);
      if (playSoundBtn) playSoundBtn.innerHTML = btnPlayHTML('Replay sound');
    }, 200);
  }
  function renderChoices(animals) {
    if (!choicesEl) return;
    choicesEl.innerHTML = '';
    shuffle(animals).forEach(a => {
      const btn = document.createElement('button');
      btn.className = 'choice';
      btn.setAttribute('aria-label', a.name);
      btn.dataset.id = a.id;

      const img = document.createElement('img');
      img.src = a.image; img.alt = a.name;
      btn.appendChild(img);

      btn.addEventListener('click', () => {
        const answer = getAnimal(currentRound?.answerId);
        const picked = a;
        if (!answer) return;

        // Stop current audio before feedback
        stopCurrent(false);

        if (picked.id === answer.id) {
          btn.classList.add('correct');
          // Play the correct sound (celebration), child taps Next to continue
          playAnimalSound(answer.id);

          const msg = `You chose the <b>${answer.name}</b> — great listening! ${answer.fun}`;
          showFeedback({
            correct: true,
            title: 'Well done!',
            message: msg,
            primaryLabel: 'Next',
            onPrimary: () => { stopCurrent(false); animateMatchSwap(() => newRound()); }
          });
        } else {
          btn.classList.add('incorrect');
          // FIXED TEMPLATE STRING HERE (this typo previously broke the app)
          const msg = `That was the <b>${picked.name}</b> — ${picked.fun}<br>Let’s listen again and find the <b>${answer.name}</b>!`;
          showFeedback({
            correct: false,
            title: 'Nice try!',
            message: msg,
            primaryLabel: 'Keep guessing',
            onPrimary: () => { /* just close popup */ },
            secondaryLabel: 'Listen again',
            onSecondary: () => { stopCurrent(false); playAnimalSound(answer.id); }
          });
        }
      });

      choicesEl.appendChild(btn);
    });
  }

  // Themed play/replay button content (SVG + label)
  function btnPlayHTML(label = 'Play') {
    return `
      <span class="btn-ico" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" focusable="false" aria-hidden="true">
          <path d="M8 5v14l11-7z"></path>
        </svg>
      </span>
      <span class="btn-label">${label}</span>
    `;
  }
  function playCurrentPrompt() {
    if (!currentRound) return;
    stopCurrent(false);
    playAnimalSound(currentRound.answerId);
    if (playSoundBtn) playSoundBtn.innerHTML = btnPlayHTML('Replay sound');
  }

  // ===== Navigation =====
  function showHome() {
    closeModal();
    stopCurrent(false);
    homeEl?.classList.remove('hidden');
    sceneEl?.classList.add('hidden');
    matchEl?.classList.add('hidden');
    btnBack?.classList.add('hidden');
  }
  function showExplore() {
    stopCurrent(false);
    homeEl?.classList.add('hidden');
    matchEl?.classList.add('hidden');
    sceneEl?.classList.remove('hidden');
    btnBack?.classList.remove('hidden');
  }
  function showMatch() {
    stopCurrent(false);
    homeEl?.classList.add('hidden');
    sceneEl?.classList.add('hidden');
    matchEl?.classList.remove('hidden');
    btnBack?.classList.remove('hidden');
    if (playSoundBtn) playSoundBtn.innerHTML = btnPlayHTML('Replay sound');
    newRound();
  }

  // ===== Init =====
  function init() {
    if (!homeEl || !sceneEl || !matchEl) return; // basic DOM presence check

    preloadAudio();
    renderScene();
    showHome();

    // Home buttons
    btnExplore?.addEventListener('click', () => { menuPuff(btnExplore); setTimeout(showExplore, 150); });
    btnMatch?.addEventListener('click',   () => { menuPuff(btnMatch);   setTimeout(showMatch, 150); });

    // Back
    btnBack?.addEventListener('click', showHome);

    // Match
    if (playSoundBtn) {
      playSoundBtn.classList.add('btn', 'btn-hero', 'btn-lg');
      playSoundBtn.innerHTML = btnPlayHTML('Replay sound');
      playSoundBtn.addEventListener('click', playCurrentPrompt);
    }

    // Modal close / interactions
    modalClose?.addEventListener('click', closeModal);
    overlay?.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !overlay?.classList.contains('hidden')) closeModal(); });

    // Modal play theme
    if (modalPlay) {
      modalPlay.classList.add('btn', 'btn-hero', 'btn-lg');
      modalPlay.innerHTML = btnPlayHTML('Play sound');
    }

    // iOS audio unlock
    window.addEventListener('touchstart', () => {
      const any = audioMap.values().next().value;
      if (any && any.paused) { any.play().then(() => any.pause()).catch(()=>{}); }
    }, { once: true });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
