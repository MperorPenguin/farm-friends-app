/* Farm Friends — core logic with Home screen, exclusive audio, and puff/spark effects */
(() => {
  const $ = (sel, parent = document) => parent.querySelector(sel);

  // Elements
  const homeEl = $('#home');
  const sceneEl = $('#scene');
  const matchEl = $('#match');
  const btnBack = $('#btn-back');

  // Home buttons
  const btnExplore = $('#btn-explore');
  const btnMatch = $('#btn-match');
  // disabled/coming-soon: #btn-story, #btn-find, #btn-feed (already in HTML)

  // Match controls
  const playSoundBtn = $('#play-sound'); // this becomes "Replay"
  const choicesEl = $('#choices');
  const resultEl = $('#result');

  // Modal elements
  const overlay = $('#overlay');
  const modalClose = $('#modal-close');
  const modalImg = $('#modal-img');
  const modalPlay = $('#modal-play');
  const modalTitle = $('#modal-title');
  const factType = $('#fact-type');
  const factHabitat = $('#fact-habitat');
  const factDiet = $('#fact-diet');
  const factHome = $('#fact-home');
  const factFun = $('#fact-fun');

  // State
  let isMuted = false;
  let audioMap = new Map();       // id -> HTMLAudioElement
  let currentRound = null;        // { answerId, choiceIds: [] }
  let lastFocused = null;
  let currentId = null;           // which animal is currently playing
  let fadeInterval = null;

  // ========== Exclusive audio helpers ==========
  function createAudio(src) {
    const a = new Audio(src);
    a.preload = 'auto';
    a.setAttribute('aria-hidden', 'true');
    a.volume = 1;
    return a;
  }
  function preloadAudio() {
    ANIMALS.forEach(animal => {
      audioMap.set(animal.id, createAudio(animal.sound));
    });
  }
  function fade(audio, from, to, ms, done) {
    if (!audio) return done && done();
    if (fadeInterval) clearInterval(fadeInterval);
    const steps = 10;
    const step = (to - from) / steps;
    const interval = ms / steps;
    let i = 0;
    audio.volume = from;
    fadeInterval = setInterval(() => {
      i++;
      const v = from + step * i;
      audio.volume = Math.max(0, Math.min(1, v));
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
      fade(a, a.volume ?? 1, 0, 160, () => { try { a.pause(); a.currentTime = 0; } catch {} });
    } else {
      try { a.pause(); a.currentTime = 0; } catch {}
    }
    currentId = null;
  }
  function playAnimalSound(id) {
    if (isMuted) return;
    const next = audioMap.get(id);
    if (!next) return;

    // If the same sound is requested, restart cleanly.
    if (currentId === id) {
      stopCurrent(false);
    } else {
      stopCurrent(true);
    }

    try {
      next.currentTime = 0;
      next.volume = 0;
      currentId = id;
      next.play().then(() => fade(next, 0, 1, 160)).catch(()=>{});
    } catch {}
  }

  // ========== Fun UI effects ==========
  // Rainbow puff for menu buttons
  function menuPuff(btn) {
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

  // Straw/spark burst for animal cards (reused)
  function sparkBurst(card) {
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

  // ========== Modal ==========
  function openModal(animal, triggerEl) {
    lastFocused = triggerEl || document.activeElement;
    document.body.classList.add('modal-open');
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');

    modalTitle.textContent = animal.name;
    modalImg.src = animal.image;
    modalImg.alt = animal.name;

    factType.textContent = animal.type || '';
    factHabitat.textContent = animal.habitat || '';
    factDiet.textContent = animal.diet || '';
    factHome.textContent = animal.home || '';
    factFun.textContent = animal.fun || '';

    modalPlay.onclick = () => playAnimalSound(animal.id);
    modalClose.focus();
  }
  function closeModal() {
    overlay.classList.add('hidden');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  }

  // ========== Explore (scene) ==========
  function renderScene() {
    sceneEl.innerHTML = '';
    ANIMALS.forEach(a => {
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
        playAnimalSound(a.id);
      });

      sceneEl.appendChild(card);
    });
  }

  // ========== Match Game (audio-only guessing) ==========
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

  function newRound() {
    // stop anything currently playing before we set a new round
    stopCurrent(false);

    const choicesCount = Math.min(3, ANIMALS.length);
    const animals = sample(ANIMALS, choicesCount);
    const answer = animals[randInt(animals.length)];
    currentRound = { answerId: answer.id, choiceIds: animals.map(a => a.id) };
    resultEl.textContent = '';

    renderChoices(animals);
    // auto play the prompt once; button will say "Replay"
    setTimeout(() => {
      stopCurrent(false);
      playAnimalSound(answer.id);
      playSoundBtn.textContent = '▶ Replay';
    }, 200);
  }

  function renderChoices(animals) {
    choicesEl.innerHTML = '';
    shuffle(animals).forEach(a => {
      const btn = document.createElement('button');
      btn.className = 'choice';
      btn.setAttribute('aria-label', a.name); // accessible for parents; not visible
      btn.dataset.id = a.id;

      const img = document.createElement('img');
      img.src = a.image; img.alt = a.name;

      // IMPORTANT: we do NOT add the text label here (audio-only guessing)
      btn.appendChild(img);

      btn.addEventListener('click', () => {
        const correct = a.id === currentRound.answerId;

        // stop any currently playing sound before feedback
        stopCurrent(false);

        if (correct) {
          btn.classList.add('correct');
          resultEl.textContent = 'Great job!';
          playAnimalSound(a.id);
          setTimeout(() => newRound(), 1000);
        } else {
          btn.classList.add('incorrect');
          resultEl.textContent = 'Try again!';
        }
      });

      choicesEl.appendChild(btn);
    });
  }

  function playCurrentPrompt() {
    if (!currentRound) return;
    // ensure exclusivity: stop anything before replay
    stopCurrent(false);
    playAnimalSound(currentRound.answerId);
    playSoundBtn.textContent = '▶ Replay';
  }

  // ========== Navigation (Home ↔ Explore / Match) ==========
  function showHome() {
    closeModal();
    stopCurrent(false);
    homeEl.classList.remove('hidden');
    sceneEl.classList.add('hidden');
    matchEl.classList.add('hidden');
    btnBack.classList.add('hidden');
  }
  function showExplore() {
    homeEl.classList.add('hidden');
    matchEl.classList.add('hidden');
    sceneEl.classList.remove('hidden');
    btnBack.classList.remove('hidden');
    // Stop any carry-over audio from home animations or match
    stopCurrent(false);
  }
  function showMatch() {
    homeEl.classList.add('hidden');
    sceneEl.classList.add('hidden');
    matchEl.classList.remove('hidden');
    btnBack.classList.remove('hidden');
    // make sure no sounds overlap entering match
    stopCurrent(false);
    playSoundBtn.textContent = '▶ Replay';
    newRound();
  }

  // ========== Init ==========
  function init() {
    preloadAudio();
    renderScene();
    showHome();

    // Home buttons with puff + nav
    btnExplore.addEventListener('click', (e) => {
      menuPuff(btnExplore);
      setTimeout(showExplore, 150);
    });
    btnMatch.addEventListener('click', (e) => {
      menuPuff(btnMatch);
      setTimeout(showMatch, 150);
    });

    // Back to home
    btnBack.addEventListener('click', showHome);

    // Match handlers
    playSoundBtn.addEventListener('click', playCurrentPrompt);

    // Modal close events
    modalClose.addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !overlay.classList.contains('hidden')) closeModal(); });

    // iOS audio unlock
    window.addEventListener('touchstart', () => {
      const any = audioMap.values().next().value;
      if (any && any.paused) { any.play().then(() => any.pause()).catch(()=>{}); }
    }, { once: true });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
