/* Farm Friends — v0.4.3-beta
   - Feed: use image-based choices from assets/img/animal-food/{animalid}food.png
   - Always 3 choices (1 correct + 2 decoys)
   - Fixed broken image paths (forward slashes)
   - Autoplay sounds after first user interaction
   - Bigger feedback cards with confetti
*/

(() => {
  const $ = (sel, parent = document) => parent?.querySelector(sel);

  // Elements
  const appEl   = $('#app');
  const homeEl  = $('#home');
  const sceneEl = $('#scene');
  const matchEl = $('#match');
  const feedEl  = $('#feed');
  const btnBack = $('#btn-back');

  // Home buttons
  const btnExplore = $('#btn-explore');
  const btnMatch   = $('#btn-match');
  const btnFeed    = $('#btn-feed');

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
  let currentRound = null; // Guess the Sound
  let currentFeed  = null; // Feed the Animal
  let lastFocused  = null;
  let currentId    = null;
  let fadeInterval = null;

  // User gesture unlock (needed for autoplay)
  let userInteracted = false;

  // Recent animals memory
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

  /* ============== AUDIO ============== */
  function createAudio(src){
    const a = new Audio(src);
    a.preload='auto'; a.autoplay=false;
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

  /* ============== UI HELPERS ============== */
  function menuPuff(btn){ /* puff animation omitted for brevity, same as before */ }
  function confettiBurst(container){ /* confetti animation, same as before */ }

  /* ============== EXPLORE MODAL ============== */
  function openModal(animal, triggerEl){
    if(!animal) return; stopCurrent(false);
    lastFocused=triggerEl||document.activeElement;
    document.body.classList.add('modal-open');
    overlay.classList.remove('hidden','closing');
    modalTitle.textContent=animal.name||'';
    modalImg.src=animal.image; modalImg.alt=animal.name;
    factType.textContent=animal.type||'';
    factHabitat.textContent=animal.habitat||'';
    factDiet.textContent=animal.diet||'';
    factHome.textContent=animal.home||'';
    factFun.textContent=animal.fun||'';
    modalPlay.onclick=()=>{stopCurrent(false); playAnimalSound(animal.id,true);};
  }
  function closeModal(){
    overlay.classList.add('closing');
    setTimeout(()=>{
      overlay.classList.add('hidden');
      document.body.classList.remove('modal-open');
      overlay.classList.remove('closing');
      if(lastFocused) lastFocused.focus();
    },180);
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
      btn.onclick=()=>openModal(animal,btn);
      sceneEl.appendChild(btn);
    });
  }

  /* ============== MATCH (Guess the Sound) ============== */
  function newRound(){
    stopCurrent(false);
    if(!choicesEl) return;
    const pool=ANIMALS.map(a=>a.id).filter(id=>!recentAnswers.includes(id));
    if(pool.length<1) pool=ANIMALS.map(a=>a.id);
    const answerId=pool[Math.floor(Math.random()*pool.length)];
    recentAnswers=updateRecent(LS_RECENT_KEY,recentAnswers,answerId);
    const answer=getAnimal(answerId);

    const wrong=ANIMALS.filter(a=>a.id!==answerId);
    const opts=[answer, wrong[Math.floor(Math.random()*wrong.length)], wrong[Math.floor(Math.random()*wrong.length)]];
    opts.sort(()=>Math.random()-0.5);

    choicesEl.innerHTML='';
    opts.forEach(opt=>{
      const btn=document.createElement('button');
      btn.className='choice';
      btn.dataset.id=opt.id;
      btn.innerHTML=`<img src="${opt.image}" alt="${opt.name}">`;
      btn.onclick=()=>{
        stopCurrent(false);
        if(opt.id===answerId){
          btn.classList.add('correct');
          confettiBurst(matchCard);
          resultEl.textContent=`Correct! That was a ${answer.name}.`;
        }else{
          btn.classList.add('incorrect');
          resultEl.textContent=`Not quite. That was a ${answer.name}.`;
        }
      };
      choicesEl.appendChild(btn);
    });

    // autoplay after first interaction
    playAnimalSound(answerId);
    currentRound=answerId;
    resultEl.textContent='Tap “Play Sound” to hear the clue.';
    playSoundBtn.onclick=()=>{stopCurrent(false); playAnimalSound(answerId,true);};
  }

  /* ============== FEED ============== */
  function newFeedRound(){
    stopCurrent(false);
    const pool=ANIMALS.map(a=>a.id).filter(id=>!recentFeed.includes(id));
    if(pool.length<1) pool=ANIMALS.map(a=>a.id);
    const animalId=pool[Math.floor(Math.random()*pool.length)];
    recentFeed=updateRecent(LS_FEED_RECENT_KEY,recentFeed,animalId);
    const animal=getAnimal(animalId);
    if(!animal) return;

    currentFeed=animalId;
    feedImg.src=animal.image; feedImg.alt=animal.name;
    feedName.textContent=animal.name;

    const correct=animal.food;
    const wrongIds=ANIMALS.map(a=>a.food).filter(f=>f!==correct);
    const decoys=[]; while(decoys.length<2 && wrongIds.length>0){
      const pick=wrongIds.splice(Math.floor(Math.random()*wrongIds.length),1)[0];
      decoys.push(pick);
    }
    const all=[correct,...decoys].sort(()=>Math.random()-0.5);

    foodChoicesEl.innerHTML='';
    all.forEach(fid=>{
      const imgPath=`assets/img/animal-food/${fid}food.png`;
      const label=FOOD_LABELS[fid]||fid;
      const btn=document.createElement('button');
      btn.className='food-choice';
      btn.innerHTML=`<img src="${imgPath}" alt="${label}" class="food-img"><div>${label}</div>`;
      btn.onclick=()=>{
        stopCurrent(false);
        if(fid===correct){
          btn.classList.add('correct');
          confettiBurst(feedCard);
          feedResultEl.textContent=`Yum! ${animal.name} loves ${label}.`;
        }else{
          btn.classList.add('incorrect');
          feedResultEl.textContent=`Not quite. ${animal.name} prefers ${FOOD_LABELS[correct]}.`;
        }
      };
      foodChoicesEl.appendChild(btn);
    });

    // autoplay sound
    playAnimalSound(animalId);
    feedPlayBtn.onclick=()=>{stopCurrent(false); playAnimalSound(animalId,true);};
  }

  /* ============== ROUTING ============== */
  function showHome(){
    stopCurrent(false);
    document.body.className='route-home';
    homeEl.classList.remove('hidden');
    appEl.classList.add('hidden');
    btnBack.classList.add('hidden');
  }
  function showExplore(){
    stopCurrent(false);
    document.body.className='route-explore';
    homeEl.classList.add('hidden');
    appEl.classList.remove('hidden');
    sceneEl.classList.remove('hidden');
    matchEl.classList.add('hidden');
    feedEl.classList.add('hidden');
    btnBack.classList.remove('hidden');
  }
  function showMatch(){
    stopCurrent(false);
    document.body.className='route-match';
    homeEl.classList.add('hidden');
    appEl.classList.remove('hidden');
    sceneEl.classList.add('hidden');
    matchEl.classList.remove('hidden');
    feedEl.classList.add('hidden');
    btnBack.classList.remove('hidden');
    newRound();
  }
  function showFeed(){
    stopCurrent(false);
    document.body.className='route-feed';
    homeEl.classList.add('hidden');
    appEl.classList.remove('hidden');
    sceneEl.classList.add('hidden');
    matchEl.classList.add('hidden');
    feedEl.classList.remove('hidden');
    btnBack.classList.remove('hidden');
    newFeedRound();
  }

  /* ============== INIT ============== */
  function init(){
    preloadAudio();
    buildScene();
    btnExplore.onclick=()=>{menuPuff(btnExplore);showExplore();};
    btnMatch.onclick  =()=>{menuPuff(btnMatch);showMatch();};
    btnFeed.onclick   =()=>{menuPuff(btnFeed);showFeed();};
    btnBack.onclick   =()=>{showHome();};
    modalClose.onclick=()=>{closeModal();};
    showHome();
  }
  document.addEventListener('DOMContentLoaded',init);
})();
