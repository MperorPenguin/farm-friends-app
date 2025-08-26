/* Farm Friends — v0.2.2-alpha
   Match: no auto-cycling; advance only after a correct pick,
   wait until audio finishes before swapping; friendly explanations.
   Explore modal: still auto-plays on open; stops on close.
*/
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

  // Match controls
  const playSoundBtn = $('#play-sound'); // themed "Replay" button from previous version
  const choicesEl = $('#choices');
  const resultEl = $('#result');
  const matchCard = $('.match-card', matchEl);

  // Modal elements (Explore)
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
  const audioMap = new Map();     // id -> HTMLAudioElement
  let currentRound = null;        // { answerId, choiceIds: [] }
  let lastFocused = null;
  let currentId = null;           // which animal is currently playing
  let fadeInterval = null;

  // ========== Helpers ==========
  const getAnimal = (id) => ANIMALS.find(a => a.id === id);

  // ========== Exclusive audio ==========
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
    if (currentId === id) {
      stopCurrent(false);
    } else {
      stopCurrent(true);
    }

    try {
      next.currentTime = 0;
      next.volume = 0;
      currentId = id;
      next.play().then(() => fade(next, 0, 1, 140)).catch(()=>{});
    } catch {}
  }

  // ========== Fun effects ==========
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

  // ========== Modal (Explore) ==========
  function openModal(animal, triggerEl) {
    // Ensure no overlap from other modes
    stopCurrent(false);

    lastFocused = triggerEl || document.activeElement;
    document.body.classList.add('modal-open');
    overlay.classList.remove('hidden', 'closing');
    overlay.setAttribute('aria-hidden', 'false');

    modalTitle.textContent = animal.name;
    modalImg.src = animal.image;
    modalImg.alt = animal.name;

    factType.textContent = animal.type || '';
    factHabitat.textContent = animal.habitat || '';
    factDiet.textContent = animal.diet || '';
    factHome.textContent = animal.home || '';
    factFun.textContent = animal.fun || '';

    modalPlay.onclick = () => {
      stopCurrent(false);
      playAnimalSound(animal.id);
    };

    // Auto-play when opened
    playAnimalSound(animal.id);

    modalClose.focus();
  }

  function closeModal() {
    // Stop immediately on close so it never leaks into other tiles
    stopCurrent(false);

    overlay.classList.add('closing');
    setTimeout(() => {
      overlay.classList.add('hidden');
      overlay.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('modal-open');
      if (lastFocused && lastFocused.focus) lastFocused.focus();
    }, 220);
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
      });

      sceneEl.appendChild(card);
    });
  }

  // ========== Match Game (audio-only; child must choose) ==========
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
    matchCard.classList.add('swap-out');
    setTimeout(() => {
      if (cb) cb();
      matchCard.classList.remove('swap-out');
      matchCard.classList.add('swap-in');
      setTimeout(() => matchCard.classList.remove('swap-in'), 220);
    }, 220);
  }

  function newRound() {
    // Reset audio; no auto-advance from audio end anymore
    stopCurrent(false);

    const choicesCount = Math.min(3, ANIMALS.length);
    const animals = sample(ANIMALS, choicesCount);
    const answer = animals[randInt(animals.length)];
    currentRound = { answerId: answer.id, choiceIds: animals.map(a => a.id) };
    resultEl.textContent = '';

    renderChoices(animals);

    // Auto-play the prompt once; button shows “Replay”
    setTimeout(() => {
      stopCurrent(false);
      playAnimalSound(answer.id);
      playSoundBtn.innerHTML = btnPlayHTML('Replay sound');
    }, 200);
  }

  function renderChoices(animals) {
    choicesEl.innerHTML = '';
    shuffle(animals).forEach(a => {
      const btn = document.createElement('button');
      btn.className = 'choice';
      btn.setAttribute('aria-label', a.name); // accessible only
      btn.dataset.id = a.id;

      const img = document.createElement('img');
      img.src = a.image; img.alt = a.name;

      // audio-only guessing: no text label
      btn.appendChild(img);

      btn.addEventListener('click', () => {
        const answer = getAnimal(currentRound.answerId);
        const picked = a;

        // If the prompt is still playing and the pick is correct, let it finish.
        // If it's incorrect, we stop and replay the prompt after feedback.
        const promptStillPlaying = currentId === answer.id;

        if (picked.id === answer.id) {
          btn.classList.add('correct');
          resultEl.textContent = '';
          resultEl.innerHTML = `Yes! That was the <b>${answer.name}</b>. ${answer.fun}`;

          // If the correct sound isn't currently playing, play it now; then advance after it ends.
          if (!promptStillPlaying) {
            stopCurrent(false);
            const ansAudio = audioMap.get(answer.id);
            // Play correct sound and wait for it to finish before moving on
            ansAudio.currentTime = 0;
            currentId = answer.id;
            ansAudio.play().catch(()=>{});
            ansAudio.onended = () => animateMatchSwap(() => newRound());
          } else {
            // Prompt is the correct sound and is already playing; wait for it to end first
            const ansAudio = audioMap.get(answer.id);
            if (ansAudio) {
              const handler = () => {
                ansAudio.removeEventListener('ended', handler);
                animateMatchSwap(() => newRound());
              };
              ansAudio.addEventListener('ended', handler, { once: true });
            } else {
              // Fallback: small delay then advance
              setTimeout(() => animateMatchSwap(() => newRound()), 600);
            }
          }
        } else {
          btn.classList.add('incorrect');
          // Friendly explanation using facts
          resultEl.innerHTML = `Nice try! You tapped the <b>${picked.name}</b> — ${picked.fun} <br>Listen again and find the <b>${answer.name}</b>!`;
          // Stop any audio, replay the prompt after a short beat
          setTimeout(() => {
            stopCurrent(false);
            playAnimalSound(answer.id);
          }, 400);
        }
      });

      choicesEl.appendChild(btn);
    });
  }

  function playCurrentPrompt() {
    if (!currentRound) return;
    stopCurrent(false);
    playAnimalSound(currentRound.answerId);
    playSoundBtn.innerHTML = btnPlayHTML('Replay sound');
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

  // ========== Navigation ==========
  function showHome() {
    closeModal();
    stopCurrent(false);
    homeEl.classList.remove('hidden');
    sceneEl.classList.add('hidden');
    matchEl.classList.add('hidden');
    btnBack.classList.add('hidden');
  }
  function showExplore() {
    stopCurrent(false);
    homeEl.classList.add('hidden');
    matchEl.classList.add('hidden');
    sceneEl.classList.remove('hidden');
    btnBack.classList.remove('hidden');
  }
  function showMatch() {
    stopCurrent(false);
    homeEl.classList.add('hidden');
    sceneEl.classList.add('hidden');
    matchEl.classList.remove('hidden');
    btnBack.classList.remove('hidden');
    playSoundBtn.innerHTML = btnPlayHTML('Replay sound');
    newRound();
  }

  // ========== Init ==========
  function init() {
    preloadAudio();
    renderScene();
    showHome();

    // Home buttons with puff + nav
    btnExplore.addEventListener('click', () => {
      menuPuff(btnExplore);
      setTimeout(showExplore, 150);
    });
    btnMatch.addEventListener('click', () => {
      menuPuff(btnMatch);
      setTimeout(showMatch, 150);
    });

    // Back to home
    btnBack.addEventListener('click', showHome);

    // Match handlers
    playSoundBtn.classList.add('btn', 'btn-hero'); // themed
    playSoundBtn.innerHTML = btnPlayHTML('Replay sound');
    playSoundBtn.addEventListener('click', playCurrentPrompt);

    // Modal close events
    modalClose.addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !overlay.classList.contains('hidden')) closeModal(); });

    // Modal play button theme
    modalPlay.classList.add('btn', 'btn-hero');
    modalPlay.innerHTML = btnPlayHTML('Play sound');

    // iOS audio unlock
    window.addEventListener('touchstart', () => {
      const any = audioMap.values().next().value;
      if (any && any.paused) { any.play().then(() => any.pause()).catch(()=>{}); }
    }, { once: true });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
