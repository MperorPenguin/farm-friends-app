/* Farm Friends — v0.4.6-beta
   Fixes/Features:
   - Restores FEEDBACK POPUPS (correct/incorrect) with big friendly overlay
   - On correct → “Next” advances to next round (Match/Feed/Find)
   - On incorrect → “Keep trying” and replay options where relevant
   - Keeps: 3 choices in Feed, image fallback for food, entrance animations,
     menu puff, confetti, exclusive audio, autoplay after first interaction.
   - NEW: Find the Animal game with farmyard background (assets/img/scenes/farmyard.png)
*/

(() => {
  const $ = (sel, parent = document) => parent?.querySelector(sel);

  // Elements
  const appEl   = $('#app');
  const homeEl  = $('#home');
  const sceneEl = $('#scene');
  const matchEl = $('#match');
  const feedEl  = $('#feed');
  const findEl  = $('#find');           // NEW
  const btnBack = $('#btn-back');

  // Home buttons
  const btnExplore = $('#btn-explore');
  const btnMatch   = $('#btn-match');
  const btnFeed    = $('#btn-feed');
  const btnFind    = $('#btn-find');    // NEW

  // Match controls
  const playSoundBtn = $('#play-sound');
  const choicesEl    = $('#choices');
  const resultEl     = $('#result');
  const matchCard    = $('.match-card', matchEl);

  // Feed controls
  const feedImg      = $('#feed-img');
  const feedName     = $('#feed-name');
  const feedPlayBtn  = $('#feed-play');
  const foodChoicesEl= $('#food-choices');
  const feedResultEl = $('#feed-result');
  const feedCard     = $('.feed-card', feedEl);

  // Find controls (NEW)
  const findQuestionEl = $('#find-question');
  const findPlayBtn    = $('#find-play');
  const farmyardEl     = $('#farmyard');
  const findResultEl   = $('#find-result');

  // Modal (Explore)
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

  // State
  const audioMap = new Map();
  let currentRound = null; // Guess the Sound (answer id)
  let currentFeed  = null; // Feed the Animal (animal id)
  let currentFind  = null; // Find the Animal (answer id)  // NEW
  let lastFocused  = null;
  let currentId    = null;
  let fadeInterval = null;

  // User gesture unlock (needed for autoplay on mobile)
  let userInteracted = false;

  // Recent animals memory (avoid immediate repeats)
  const LS_RECENT_KEY = 'ff_recent_answers';
  const LS_FEED_RECENT_KEY = 'ff_feed_recent';
  const RECENT_SIZE = Math.max(2, Math.min(4, (ANIMALS?.length||8)-1));

  let recentAnswers = loadRecent(LS_RECENT_KEY);
  let recentFeed    = loadRecent(LS_FEED_RECENT_KEY);

  const getAnimal = (id) => ANIMALS.find(a=>a.id===id);

  function loadRecent(key){
    try {
      const raw = localStorage.getItem(key);
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr.slice(0,8) : [];
    } catch { return []; }
  }
  function updateRecent(key,list,id){
    const updated = [id,...list.filter(x=>x!==id)].slice(0,RECENT_SIZE);
    try { localStorage.setItem(key,JSON.stringify(updated)); }catch{}
    return updated;
  }

  /* ============== AUDIO (exclusive) ============== */
  function createAudio(src){
    const a = new Audio(src);
    a.preload='auto'; a.autoplay=false;
    a.setAttribute('aria-hidden','true');
    return a;
  }
  function preloadAudio(){
    (ANIMALS||[]).forEach(animal=>{
      if(!audioMap.has(animal.id)) audioMap.set(animal.id, createAudio(animal.sound));
    });
  }
  function fade(audio,from,to,ms,done){
    if(!audio){ done&&done(); return; }
    if(fadeInterval) clearInterval(fadeInterval);
    const steps=10, step=(to-from)/steps, interval=Math.max(10, ms/steps);
    let i=0; audio.volume=from;
    fadeInterval=setInterval(()=>{
      i++; audio.volume=Math.max(0,Math.min(1,from+step*i));
      if(i>=steps){ clearInterval(fadeInterval); audio.volume=to; done&&done(); }
    }, interval);
  }
  function stopCurrent(smooth=true){
    if(!currentId) return;
    const a=audioMap.get(currentId);
    if(!a){ currentId=null; return; }
    if(smooth) fade(a, a.volume??1, 0,120, ()=>{ try{a.pause();a.currentTime=0;}catch{} });
    else { try{a.pause();a.currentTime=0;}catch{} }
    currentId=null;
  }
  function playAnimalSound(id, fromUser=false){
    if(!userInteracted && !fromUser) return Promise.resolve();
    const next=audioMap.get(id);
    if(!next) return Promise.resolve();
    if(currentId===id) stopCurrent(false); else stopCurrent(true);
    try{
      next.currentTime=0; next.volume=0; currentId=id;
      return next.play().then(()=>fade(next,0,1,120));
    }catch(e){ return Promise.reject(e); }
  }

  document.addEventListener('visibilitychange',()=>{
    if(document.hidden) stopCurrent(false);
  });

  /* ============== USER INTERACTION UNLOCK ============== */
  function markInteracted(){
    if(userInteracted) return;
    userInteracted=true;
    const first=audioMap.values().next().value;
    if(first){
      const wasMuted=first.muted;
      try{ first.muted=true; first.play().then(()=>first.pause()).finally(()=>{first.muted=wasMuted;}); }catch{}
    }
  }
  ['pointerdown','mousedown','touchstart','keydown'].forEach(evt=>{
    window.addEventListener(evt,markInteracted,{passive:true});
  });

  /* ============== UI FLOURISHES (menu puff + confetti) ============== */
  function menuPuff(btn){
    if(!btn) return;
    const puff=document.createElement('div'); puff.className='menu-burst';
    const rect=btn.getBoundingClientRect(); const w=rect.width,h=rect.height,count=14;
    for(let i=0;i<count;i++){
      const s=document.createElement('span'); s.className='menu-spark';
      const x=Math.random()*w*0.8+w*0.1, y=Math.random()*h*0.6+h*0.2;
      const tx=(Math.random()-0.5)*140, ty=-(40+Math.random()*90);
      const size=8+Math.random()*12;
      s.style.setProperty('--x',Math.round(x)+'px'); s.style.setProperty('--y',Math.round(y)+'px');
      s.style.setProperty('--tx',Math.round(tx)+'px'); s.style.setProperty('--ty',Math.round(ty)+'px');
      s.style.setProperty('--sz',Math.round(size)+'px'); s.style.setProperty('--d',(420+Math.random()*280)+'ms');
      puff.appendChild(s);
    }
    btn.appendChild(puff); setTimeout(()=>puff.remove(),720);
  }

  function confettiBurst(container){
    if(!container) return;
    const layer = document.createElement('div');
    layer.className = 'confetti';
    const rect = container.getBoundingClientRect();
    const w = rect.width, h = rect.height;
    const count = 22;
    for(let i=0;i<count;i++){
      const iEl = document.createElement('i');
      const x = Math.random()*w*0.9 + w*0.05;
      const y = Math.random()*h*0.4 + h*0.15;
      const tx = (Math.random()-0.5)*200;
      const ty = -(60 + Math.random()*120);
      const size = 8 + Math.random()*10;
      const dur = 600 + Math.random()*400;
      iEl.style.setProperty('--x', Math.round(x)+'px');
      iEl.style.setProperty('--y', Math.round(y)+'px');
      iEl.style.setProperty('--tx', Math.round(tx)+'px');
      iEl.style.setProperty('--ty', Math.round(ty)+'px');
      iEl.style.setProperty('--sz', Math.round(size)+'px');
      iEl.style.setProperty('--d', Math.round(dur)+'ms');
      layer.appendChild(iEl);
    }
    container.appendChild(layer);
    setTimeout(()=>layer.remove(), 1100);
  }

  /* ============== FEEDBACK OVERLAY (restored) ============== */
  let fbOverlayEl;
  function ensureFeedbackOverlay(){
    if(fbOverlayEl) return fbOverlayEl;
    fbOverlayEl=document.createElement('div');
    fbOverlayEl.className='feedback-overlay hidden';
    fbOverlayEl.innerHTML=`
      <div class="feedback-card" role="dialog" aria-modal="true" aria-live="assertive">
        <div class="fb-title" id="fb-title"></div>
        <div class="fb-message" id="fb-message"></div>
        <div class="fb-actions">
          <button id="fb-secondary" class="btn btn-hero btn-lg hidden"></button>
          <button id="fb-primary" class="btn btn-hero btn-lg"></button>
        </div>
      </div>`;
    document.body.appendChild(fbOverlayEl);
    return fbOverlayEl;
  }
  function showFeedback({correct,title,message,primaryLabel,onPrimary,secondaryLabel,onSecondary}){
    const el=ensureFeedbackOverlay();
    const titleEl=$('#fb-title',el);
    const msgEl=$('#fb-message',el);
    const primary=$('#fb-primary',el);
    const secondary=$('#fb-secondary',el);
    const card=$('.feedback-card',el);

    el.classList.remove('hidden');
    el.classList.toggle('correct',!!correct);
    el.classList.toggle('incorrect',!correct);
    card?.classList.remove('out');

    titleEl.textContent = title || (correct ? 'Well done!' : 'Not quite!');
    msgEl.innerHTML = message || '';

    primary.textContent = primaryLabel || (correct ? 'Next' : 'OK');
    primary.onclick = ()=>{ onPrimary && onPrimary(); hideFeedback(); };

    if(secondaryLabel){
      secondary.classList.remove('hidden');
      secondary.textContent = secondaryLabel;
      secondary.onclick = ()=>{ onSecondary && onSecondary(); hideFeedback(false); };
    }else{
      secondary.classList.add('hidden');
      secondary.onclick = null;
    }

    if(correct) confettiBurst(card);
    setTimeout(()=>primary.focus(), 10);
  }
  function hideFeedback(animateOut=true){
    if(!fbOverlayEl) return;
    const card=$('.feedback-card',fbOverlayEl);
    if(animateOut){
      card.classList.add('out');
      setTimeout(()=>fbOverlayEl.classList.add('hidden'), 200);
    }else{
      fbOverlayEl.classList.add('hidden');
    }
  }

  /* ============== EXPLORE MODAL ============== */
  function openModal(animal, triggerEl){
    if(!animal) return; stopCurrent(false);
    lastFocused=triggerEl||document.activeElement;
    document.body.classList.add('modal-open');
    overlay.classList.remove('hidden','closing');
    overlay.setAttribute('aria-hidden','false');

    modalTitle.textContent=animal.name||'';
    modalImg.src=animal.image; modalImg.alt=animal.name;
    factType.textContent=animal.type||'';
    factHabitat.textContent=animal.habitat||'';
    factDiet.textContent=animal.diet||'';
    factHome.textContent=animal.home||'';
    factFun.textContent=animal.fun||'';
    modalPlay.onclick=()=>{ stopCurrent(false); playAnimalSound(animal.id,true); };
  }
  function closeModal(){
    stopCurrent(false);
    overlay.classList.add('closing');
    setTimeout(()=>{
      overlay.classList.add('hidden');
      overlay.setAttribute('aria-hidden','true');
      overlay.classList.remove('closing');
      document.body.classList.remove('modal-open');
      if(lastFocused && lastFocused.focus) lastFocused.focus();
    },200);
  }

  /* ============== EXPLORE SCENE ============== */
  function buildScene(){
    if(!sceneEl) return;
    sceneEl.innerHTML='';
    ANIMALS.forEach(animal=>{
      const btn=document.createElement('button');
      btn.className='animal';
      btn.dataset.id=animal.id;
      btn.style.background=animal.color;
      btn.innerHTML=`<img src="${animal.image}" alt="${animal.name}"><div class="animal-name">${animal.name}</div>`;
      btn.addEventListener('click', ()=>{
        markInteracted();
        btn.classList.add('selected'); btn.classList.remove('pop'); void btn.offsetWidth; btn.classList.add('pop');
        openModal(animal,btn);
      });
      sceneEl.appendChild(btn);
    });
  }

  /* ============== HELPERS ============== */
  function randInt(n){ return Math.floor(Math.random()*n); }
  function shuffle(arr){ const a=arr.slice(); for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }
  function chooseAvoiding(ids, avoid){
    const pool = ids.filter(id=>!avoid.includes(id));
    if(pool.length>0) return pool[randInt(pool.length)];
    return ids[randInt(ids.length)];
  }
  function btnPlayHTML(label='Play Sound'){ return `
    <span class="btn-ico" aria-hidden="true">
      <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" focusable="false" aria-hidden="true">
        <path d="M8 5v14l11-7z"></path>
      </svg>
    </span>
    <span class="btn-label">${label}</span>`; }

  /* ============== MATCH (Guess the Sound) ============== */
  function newRound(){
    stopCurrent(false);
    if(!choicesEl) return;

    // pick answer avoiding repeats
    const ids = ANIMALS.map(a=>a.id);
    const answerId = chooseAvoiding(ids, recentAnswers);
    recentAnswers = updateRecent(LS_RECENT_KEY, recentAnswers, answerId);
    const answer = getAnimal(answerId);

    // build 3 choices
    const wrong = ANIMALS.filter(a=>a.id!==answerId);
    const opts = shuffle([answer, wrong[randInt(wrong.length)], wrong[randInt(wrong.length)]]);

    choicesEl.innerHTML='';
    opts.forEach(opt=>{
      const btn=document.createElement('button');
      btn.className='choice';
      btn.dataset.id=opt.id;
      btn.innerHTML=`<img src="${opt.image}" alt="${opt.name}">`;
      btn.onclick=()=>{
        markInteracted();
        stopCurrent(false);
        if(opt.id===answerId){
          btn.classList.add('correct');
          const msg=`You picked the <b>${answer.name}</b> — great listening!`;
          showFeedback({
            correct:true,
            title:'Well done!',
            message:msg,
            primaryLabel:'Next',
            onPrimary:()=>{ stopCurrent(false); newRound(); }
          });
          confettiBurst(matchCard);
          playAnimalSound(answerId, true).catch(()=>{});
        }else{
          btn.classList.add('incorrect');
          const msg=`That was the <b>${answer.name}</b>.<br>Let’s listen again and find it!`;
          showFeedback({
            correct:false,
            title:'Not quite!',
            message:msg,
            primaryLabel:'Keep trying',
            onPrimary:()=>{},
            secondaryLabel:'Play Sound',
            onSecondary:()=>{ stopCurrent(false); playAnimalSound(answerId, true).catch(()=>{}); }
          });
        }
      };
      choicesEl.appendChild(btn);
    });

    // UI text + autoplay after interaction
    if(resultEl) resultEl.textContent='Tap “Play Sound” to hear the clue.';
    if(playSoundBtn){
      playSoundBtn.classList.add('btn','btn-hero','btn-lg');
      playSoundBtn.innerHTML = btnPlayHTML('Play Sound');
      playSoundBtn.setAttribute('aria-label','Play Sound');
      playSoundBtn.onclick=()=>{ markInteracted(); stopCurrent(false); playAnimalSound(answerId,true); };
    }
    playAnimalSound(answerId /* auto */, false).catch(()=>{});
  }

  /* ============== FEED (with image fallback + feedback popups) ============== */
  const FOOD_EMOJI = {
    grass:'🌿', hay:'🟨', grains:'🌾', seeds:'🌰', insects:'🐞', plants:'🌱', leaves:'🍃', veggies:'🥕', oats:'🥣'
  };
  const FOOD_LABELS = window.FOOD_LABELS || {
    grass:'Grass', hay:'Hay', grains:'Grains', seeds:'Seeds', insects:'Insects', plants:'Plants', leaves:'Leaves', veggies:'Vegetables', oats:'Oats'
  };

  function newFeedRound(){
    stopCurrent(false);

    const ids = ANIMALS.map(a=>a.id);
    const animalId = chooseAvoiding(ids, recentFeed);
    recentFeed = updateRecent(LS_FEED_RECENT_KEY, recentFeed, animalId);
    const animal = getAnimal(animalId);
    if(!animal) return;

    currentFeed = animalId;
    if(feedImg){ feedImg.src=animal.image; feedImg.alt=animal.name; }
    if(feedName){ feedName.textContent=animal.name; }

    const correct = animal.food;
    const allFoods = Array.from(new Set(ANIMALS.map(a=>a.food)));
    const decoyPool = allFoods.filter(f=>f!==correct);
    const decoys = shuffle(decoyPool).slice(0,2);
    const choiceIds = shuffle([correct, ...decoys]);

    renderFoodChoices(choiceIds, correct, animal);

    if(feedCard){
      feedCard.classList.remove('entering','focused','show-choices');
      void feedCard.offsetWidth;
      feedCard.classList.add('entering');
      setTimeout(()=>feedCard.classList.add('focused'), 520);
      setTimeout(()=>feedCard.classList.add('show-choices'), 820);
    }

    setTimeout(()=>{ playAnimalSound(animalId /* auto */, false).catch(()=>{}); }, 880);

    if(feedPlayBtn){
      feedPlayBtn.onclick=()=>{ markInteracted(); stopCurrent(false); playAnimalSound(animalId,true); };
    }
  }

  function renderFoodChoices(ids, correctId, animal){
    if(!foodChoicesEl) return;
    foodChoicesEl.innerHTML='';

    ids.forEach(fid=>{
      const label = FOOD_LABELS[fid] || (fid.charAt(0).toUpperCase()+fid.slice(1));
      const imgPath = `assets/img/animal-food/${fid}food.png`;

      const btn = document.createElement('button');
      btn.className='food-choice';
      btn.setAttribute('aria-label', label);

      const img = document.createElement('img');
      img.className='food-img';
      img.alt = label;
      img.src = imgPath;
      img.onerror = () => {
        btn.innerHTML = `<div class="food-emoji" aria-hidden="true" style="font-size:2.2rem;line-height:1">${FOOD_EMOJI[fid]||'🍽️'}</div><div>${label}</div>`;
      };

      btn.appendChild(img);
      const cap = document.createElement('div'); cap.textContent = label; btn.appendChild(cap);

      btn.addEventListener('click', ()=>{
        markInteracted();
        stopCurrent(false);
        if(fid===correctId){
          btn.classList.add('correct');
          const msg = `<b>${animal.name}</b> loves ${label.toLowerCase()}!`;
          showFeedback({
            correct:true,
            title:'Yum!',
            message:msg,
            primaryLabel:'Next',
            onPrimary:()=>{ stopCurrent(false); newFeedRound(); }
          });
          confettiBurst(feedCard);
          playAnimalSound(animal.id, true).catch(()=>{});
        }else{
          btn.classList.add('incorrect');
          const correctLabel = FOOD_LABELS[correctId] || correctId;
          const msg = `${label} isn’t the best choice.<br>Try feeding <b>${animal.name}</b> some <b>${correctLabel}</b>!`;
          showFeedback({
            correct:false,
            title:'Not quite!',
            message:msg,
            primaryLabel:'Keep trying',
            onPrimary:()=>{},
            secondaryLabel:'Play Sound',
            onSecondary:()=>{ stopCurrent(false); playAnimalSound(animal.id, true).catch(()=>{}); }
          });
        }
      });

      foodChoicesEl.appendChild(btn);
    });
  }

  /* ============== FIND THE ANIMAL (NEW) ============== */
  function randomFarmPos(){
    // Keep within visible area; tweak ranges if your background has specific props/fences.
    return {
      left: 6 + Math.random()*88,   // 6% .. 94%
      top:  10 + Math.random()*76   // 10% .. 86%
    };
  }

  function newFindRound(){
    stopCurrent(false);
    if(!farmyardEl) return;

    // Clear previous icons
    farmyardEl.innerHTML = '';

    // Choose answer
    const ids = ANIMALS.map(a=>a.id);
    const answerId = ids[randInt(ids.length)];
    const answer = getAnimal(answerId);
    currentFind = answerId;

    // Prompt + sound
    if(findQuestionEl) findQuestionEl.textContent = `Can you find the ${answer.name}?`;
    if(findPlayBtn){
      findPlayBtn.classList.add('btn','btn-hero','btn-lg');
      findPlayBtn.innerHTML = btnPlayHTML('Play Sound');
      findPlayBtn.setAttribute('aria-label','Play Sound');
      findPlayBtn.onclick = ()=>{ markInteracted(); stopCurrent(false); playAnimalSound(answerId,true); };
    }
    playAnimalSound(answerId /* auto */, false).catch(()=>{});

    // Place all animals around the scene
    ANIMALS.forEach(animal=>{
      const img = document.createElement('img');
      img.src = animal.image;
      img.alt = animal.name;
      img.className = 'farm-animal';
      const pos = randomFarmPos();
      img.style.left = pos.left + '%';
      img.style.top  = pos.top  + '%';
      img.style.position = 'absolute';
      img.style.transform = 'translate(-50%,-50%)';

      img.addEventListener('click', ()=>{
        markInteracted();
        stopCurrent(false);
        if(animal.id === answerId){
          showFeedback({
            correct:true,
            title:'You found it!',
            message:`That’s the <b>${animal.name}</b>! Great job.`,
            primaryLabel:'Next',
            onPrimary:()=>{ stopCurrent(false); newFindRound(); }
          });
          playAnimalSound(answerId, true).catch(()=>{});
        }else{
          showFeedback({
            correct:false,
            title:'Try again!',
            message:`That was the <b>${animal.name}</b>. Look again for the ${answer.name}.`,
            primaryLabel:'OK',
            onPrimary:()=>{}
          });
        }
      });

      farmyardEl.appendChild(img);
    });

    // clear any residual result text
    if(findResultEl) findResultEl.textContent = '';
  }

  /* ============== ROUTING ============== */
  function showHome(){
    stopCurrent(false);
    document.body.classList.remove('route-explore','route-match','route-feed','route-find');
    document.body.classList.add('route-home');
    homeEl.classList.remove('hidden');
    appEl.classList.remove('hidden');
    sceneEl.classList.add('hidden');
    matchEl.classList.add('hidden');
    feedEl.classList.add('hidden');
    findEl?.classList.add('hidden');
    btnBack.classList.add('hidden');
  }
  function showExplore(){
    stopCurrent(false);
    document.body.classList.remove('route-home','route-match','route-feed','route-find');
    document.body.classList.add('route-explore');
    homeEl.classList.add('hidden');
    sceneEl.classList.remove('hidden');
    matchEl.classList.add('hidden');
    feedEl.classList.add('hidden');
    findEl?.classList.add('hidden');
    btnBack.classList.remove('hidden');
  }
  function showMatch(){
    stopCurrent(false);
    document.body.classList.remove('route-home','route-explore','route-feed','route-find');
    document.body.classList.add('route-match');
    homeEl.classList.add('hidden');
    sceneEl.classList.add('hidden');
    feedEl.classList.add('hidden');
    findEl?.classList.add('hidden');
    matchEl.classList.remove('hidden');
    btnBack.classList.remove('hidden');
    newRound();
  }
  function showFeed(){
    stopCurrent(false);
    document.body.classList.remove('route-home','route-explore','route-match','route-find');
    document.body.classList.add('route-feed');
    homeEl.classList.add('hidden');
    sceneEl.classList.add('hidden');
    matchEl.classList.add('hidden');
    findEl?.classList.add('hidden');
    feedEl.classList.remove('hidden');
    btnBack.classList.remove('hidden');
    newFeedRound();
  }
  function showFind(){ // NEW
    stopCurrent(false);
    document.body.classList.remove('route-home','route-explore','route-match','route-feed');
    document.body.classList.add('route-find');
    homeEl.classList.add('hidden');
    sceneEl.classList.add('hidden');
    matchEl.classList.add('hidden');
    feedEl.classList.add('hidden');
    findEl?.classList.remove('hidden');
    btnBack.classList.remove('hidden');
    newFindRound();
  }

  /* ============== INIT ============== */
  function init(){
    overlay?.classList.add('hidden'); document.body.classList.remove('modal-open');
    preloadAudio();
    buildScene();

    // Home buttons
    btnExplore?.addEventListener('click', (e)=>{ e.preventDefault(); markInteracted(); menuPuff(btnExplore); setTimeout(showExplore,100); });
    btnMatch  ?.addEventListener('click', (e)=>{ e.preventDefault(); markInteracted(); menuPuff(btnMatch);   setTimeout(showMatch,100);   });
    btnFeed   ?.addEventListener('click', (e)=>{ e.preventDefault(); markInteracted(); menuPuff(btnFeed);    setTimeout(showFeed,100);    });
    btnFind   ?.addEventListener('click', (e)=>{ e.preventDefault(); markInteracted(); menuPuff(btnFind);    setTimeout(showFind,100);    }); // NEW

    // Back + modal
    btnBack  ?.addEventListener('click', (e)=>{ e.preventDefault(); showHome(); });
    modalClose?.addEventListener('click',(e)=>{ e.preventDefault(); closeModal(); });
    overlay   ?.addEventListener('click',(e)=>{ if(e.target===overlay) closeModal(); });
    document.addEventListener('keydown',(e)=>{ if(e.key==='Escape' && !overlay.classList.contains('hidden')) closeModal(); });

    showHome();
  }
  document.addEventListener('DOMContentLoaded', init);
})();
