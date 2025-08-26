/* Farm Friends — v0.3.0-beta
   - "Play Sound" wording everywhere
   - No audio until user interacts
   - iOS audio unlock is muted
   - Stop audio when tab backgrounded
   - Route classes: route-home / route-explore / route-match
   - Guess the Sound: no immediate repeats + cooldown via localStorage
*/
(() => {
  const $ = (sel, parent = document) => parent?.querySelector(sel);

  // Elements
  const appEl   = $('#app');
  const homeEl  = $('#home');
  const sceneEl = $('#scene');
  const matchEl = $('#match');
  const btnBack = $('#btn-back');

  // Home buttons
  const btnExplore = $('#btn-explore');
  const btnMatch   = $('#btn-match');

  // Match controls
  const playSoundBtn = $('#play-sound');
  const choicesEl    = $('#choices');
  const resultEl     = $('#result');
  const matchCard    = $('.match-card', matchEl);

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
  let currentRound = null;
  let lastFocused = null;
  let currentId = null;
  let fadeInterval = null;

  // User gesture gate
  let userInteracted = false;
  let justNavigatedToMatch = false;

  // Anti-repeat (Guess the Sound)
  const LS_RECENT_KEY = 'ff_recent_answers';
  const RECENT_SIZE = Math.max(2, Math.min(4, (window.ANIMALS?.length || 8) - 1)); // ~3 by default
  let recentAnswers = loadRecent();

  const getAnimal = (id) => ANIMALS.find(a => a.id === id);

  function loadRecent(){
    try {
      const raw = localStorage.getItem(LS_RECENT_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr.slice(0, 8) : [];
    } catch { return []; }
  }
  function pushRecent(id){
    if(!id) return;
    recentAnswers = [id, ...recentAnswers.filter(x => x !== id)].slice(0, RECENT_SIZE);
    try { localStorage.setItem(LS_RECENT_KEY, JSON.stringify(recentAnswers)); } catch {}
  }

  /* ============== AUDIO (exclusive) ============== */
  function createAudio(src){
    const a = new Audio(src);
    a.preload = 'auto';
    a.autoplay = false;
    a.setAttribute('aria-hidden','true');
    a.volume = 1;
    return a;
  }
  function preloadAudio(){
    (ANIMALS||[]).forEach(animal=>{
      if(!audioMap.has(animal.id)) audioMap.set(animal.id, createAudio(animal.sound));
    });
  }
  function fade(audio, from, to, ms, done){
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
    if(smooth) fade(a, a.volume??1, 0, 120, ()=>{ try{ a.pause(); a.currentTime=0; }catch{} });
    else { try{ a.pause(); a.currentTime=0; }catch{} }
    currentId=null;
  }
  function playAnimalSound(id, fromUser=false){
    if(!userInteracted && !fromUser){
      return Promise.resolve(); // block non-gesture playback until first interaction
    }
    const next = audioMap.get(id);
    if(!next) return Promise.resolve();

    if(currentId === id) stopCurrent(false); else stopCurrent(true);

    try{
      next.currentTime = 0;
      next.volume = 0;
      currentId = id;
      return next.play()
        .then(()=>fade(next,0,1,120))
        .catch(err=>{ throw err; });
    }catch(e){ return Promise.reject(e); }
  }

  // Pause audio if app/tab goes to background
  document.addEventListener('visibilitychange', ()=>{
    if(document.hidden) stopCurrent(false);
  });

  /* ============== USER INTERACTION UNLOCK ============== */
  function markInteracted(){
    if(userInteracted) return;
    userInteracted = true;

    // iOS unlock trick but MUTED so there's no click/pop
    const first = audioMap.values().next().value;
    if(first){
      const wasMuted = first.muted;
      try{
        first.muted = true;
        first.play().then(()=>first.pause()).finally(()=>{ first.muted = wasMuted; });
      }catch{ first.muted = wasMuted; }
    }
  }
  ['pointerdown','mousedown','touchstart','keydown'].forEach(evt=>{
    window.addEventListener(evt, markInteracted, { passive:true, once:false });
  });

  /* ============== UI FLOURISHES ============== */
  function menuPuff(btn){
    if(!btn) return; const puff=document.createElement('div'); puff.className='menu-burst';
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
  function sparkBurst(card){
    if(!card) return; const burst=document.createElement('div'); burst.className='burst';
    const rect=card.getBoundingClientRect(); const w=rect.width,h=rect.height,count=12;
    for(let i=0;i<count;i++){
      const s=document.createElement('span'); s.className='spark';
      const x=Math.random()*w*0.9+w*0.05, y=Math.random()*h*0.7+h*0.15;
      const tx=(Math.random()-0.5)*120, ty=-(40+Math.random()*80);
      const size=6+Math.random()*10;
      s.style.setProperty('--x',Math.round(x)+'px'); s.style.setProperty('--y',Math.round(y)+'px');
      s.style.setProperty('--tx',Math.round(tx)+'px'); s.style.setProperty('--ty',Math.round(ty)+'px');
      s.style.setProperty('--sz',Math.round(size)+'px'); s.style.setProperty('--d',(450+Math.random()*250)+'ms');
      burst.appendChild(s);
    }
    card.appendChild(burst); setTimeout(()=>burst.remove(),700);
  }

  /* ============== EXPLORE MODAL ============== */
  function openModal(animal, triggerEl){
    if(!animal) return; stopCurrent(false);
    lastFocused = triggerEl || document.activeElement;
    document.body.classList.add('modal-open');
    overlay?.classList.remove('hidden','closing');
    overlay?.setAttribute('aria-hidden','false');

    if(modalTitle) modalTitle.textContent = animal.name || '';
    if(modalImg){ modalImg.src = animal.image || ''; modalImg.alt = animal.name || ''; }
    if(factType)    factType.textContent    = animal.type    || '';
    if(factHabitat) factHabitat.textContent = animal.habitat || '';
    if(factDiet)    factDiet.textContent    = animal.diet    || '';
    if(factHome)    factHome.textContent    = animal.home    || '';
    if(factFun)     factFun.textContent     = animal.fun     || '';

    if(modalPlay){
      modalPlay.onclick = ()=>{ stopCurrent(false); playAnimalSound(animal.id, true); };
      modalPlay.setAttribute('aria-label','Play Sound');
      modalPlay.innerHTML = btnPlayHTML('Play Sound');
    }

    playAnimalSound(animal.id, true).catch(()=>{});
    modalClose?.focus();
  }
  function closeModal(){
    stopCurrent(false);
    if(!overlay) return;
    overlay.classList.add('closing');
    setTimeout(()=>{
      overlay.classList.add('hidden');
      overlay.setAttribute('aria-hidden','true');
      document.body.classList.remove('modal-open');
      if(lastFocused && lastFocused.focus) lastFocused.focus();
    },200);
  }

  /* ============== EXPLORE SCENE ============== */
  function renderScene(){
    if(!sceneEl) return; sceneEl.innerHTML='';
    (ANIMALS||[]).forEach(a=>{
      const card=document.createElement('button'); card.className='animal';
      card.style.background = a.color || 'var(--card)'; card.dataset.id=a.id;
      card.setAttribute('aria-label',`${a.name} — open card`);
      const img=document.createElement('img'); img.src=a.image; img.alt=a.name;
      const name=document.createElement('div'); name.className='animal-name'; name.textContent=a.name;
      card.appendChild(img); card.appendChild(name);
      card.addEventListener('click', ()=>{
        markInteracted();
        card.classList.add('selected'); card.classList.remove('pop'); void card.offsetWidth; card.classList.add('pop');
        sparkBurst(card); setTimeout(()=>card.classList.remove('selected'),550);
        openModal(a, card);
      });
      sceneEl.appendChild(card);
    });
  }

  /* ============== FEEDBACK POPUP (Match) ============== */
  let fbOverlayEl;
  function ensureFeedbackOverlay(){
    if(fbOverlayEl) return fbOverlayEl;
    fbOverlayEl=document.createElement('div'); fbOverlayEl.className='feedback-overlay hidden';
    fbOverlayEl.innerHTML=`
      <div class="feedback-card" role="dialog" aria-modal="true" aria-live="assertive">
        <div class="fb-icon" aria-hidden="true"></div>
        <div class="fb-title" id="fb-title"></div>
        <div class="fb-message" id="fb-message"></div>
        <div class="fb-actions">
          <button id="fb-secondary" class="btn btn-hero btn-lg hidden"></button>
          <button id="fb-primary" class="btn btn-hero btn-lg"></button>
        </div>
      </div>`;
    document.body.appendChild(fbOverlayEl); return fbOverlayEl;
  }
  function showFeedback({correct,title,message,primaryLabel,onPrimary,secondaryLabel,onSecondary}){
    const el=ensureFeedbackOverlay(); const titleEl=$('#fb-title',el);
    const msgEl=$('#fb-message',el); const primary=$('#fb-primary',el);
    const secondary=$('#fb-secondary',el); const card=$('.feedback-card',el);
    el.classList.remove('hidden'); el.classList.toggle('correct',!!correct); el.classList.toggle('incorrect',!correct);
    card?.classList.remove('out');
    if(titleEl) titleEl.textContent = title || (correct?'Well done!':'Nice try!');
    if(msgEl)   msgEl.innerHTML    = message || '';
    if(primary){ primary.textContent = primaryLabel || (correct?'Next':'OK'); primary.onclick=()=>{ onPrimary&&onPrimary(); hideFeedback(); }; }
    if(secondaryLabel && secondary){
      secondary.classList.remove('hidden'); secondary.textContent=secondaryLabel;
      secondary.onclick=()=>{ onSecondary&&onSecondary(); hideFeedback(false); };
    }else if(secondary){ secondary.classList.add('hidden'); secondary.onclick=null; }
    setTimeout(()=>primary?.focus(),10);
  }
  function hideFeedback(animateOut=true){
    if(!fbOverlayEl) return; const card=$('.feedback-card',fbOverlayEl);
    if(animateOut){ card?.classList.add('out'); setTimeout(()=>fbOverlayEl.classList.add('hidden'),200); }
    else fbOverlayEl.classList.add('hidden');
  }

  /* ============== MATCH GAME ============== */
  function randInt(n){ return Math.floor(Math.random()*n); }
  function sample(arr,count){
    const copy=arr.slice(); const out=[];
    while(copy.length && out.length<count){ out.push(copy.splice(randInt(copy.length),1)[0]); }
    return out;
  }
  function shuffle(arr){
    const copy=arr.slice();
    for(let i=copy.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); const t=copy[i]; copy[i]=copy[j]; copy[j]=t; }
    return copy;
  }
  function chooseAnswer(pool){
    const notRecent = pool.filter(a => !recentAnswers.includes(a.id));
    if(notRecent.length > 0) return notRecent[randInt(notRecent.length)];
    return pool[randInt(pool.length)];
  }
  function animateMatchSwap(cb){
    if(!matchCard){ cb&&cb(); return; }
    matchCard.classList.add('swap-out');
    setTimeout(()=>{
      cb&&cb();
      matchCard.classList.remove('swap-out');
      matchCard.classList.add('swap-in');
      setTimeout(()=>matchCard.classList.remove('swap-in'),200);
    },200);
  }
  function newRound(){
    stopCurrent(false);
    if(resultEl) resultEl.textContent='';

    const choicesCount=Math.min(3,(ANIMALS||[]).length);
    const pool=sample(ANIMALS, choicesCount);

    const answer=chooseAnswer(pool);
    currentRound={ answerId: answer.id, choiceIds: pool.map(a=>a.id) };

    renderChoices(pool);

    setTimeout(()=>{
      stopCurrent(false);
      if(justNavigatedToMatch && userInteracted){
        playAnimalSound(answer.id, true).catch(()=>{ if(resultEl) resultEl.textContent='Tap “Play Sound” to hear the clue.'; });
      } else {
        if(resultEl) resultEl.textContent='Tap “Play Sound” to hear the clue.';
      }
      if(playSoundBtn){
        playSoundBtn.innerHTML = btnPlayHTML('Play Sound');
        playSoundBtn.setAttribute('aria-label','Play Sound');
      }
      justNavigatedToMatch = false;

      // record chosen answer into cooldown history
      pushRecent(answer.id);
    }, 200);
  }
  function renderChoices(animals){
    if(!choicesEl) return; choicesEl.innerHTML='';
    shuffle(animals).forEach(a=>{
      const btn=document.createElement('button'); btn.className='choice'; btn.setAttribute('aria-label',a.name); btn.dataset.id=a.id;
      const img=document.createElement('img'); img.src=a.image; img.alt=a.name; btn.appendChild(img);
      btn.addEventListener('click', ()=>{
        markInteracted();
        const answer = getAnimal(currentRound?.answerId); if(!answer) return;
        stopCurrent(false);
        if(a.id===answer.id){
          btn.classList.add('correct'); playAnimalSound(answer.id, true).catch(()=>{});
          const msg=`You chose the <b>${answer.name}</b> — great listening! ${answer.fun}`;
          showFeedback({ correct:true, title:'Well done!', message:msg, primaryLabel:'Next',
            onPrimary:()=>{ stopCurrent(false); animateMatchSwap(()=>newRound()); } });
        }else{
          btn.classList.add('incorrect');
          const msg=`That was the <b>${a.name}</b> — ${a.fun}<br>Let’s listen again and find the <b>${answer.name}</b>!`;
          showFeedback({
            correct:false, title:'Nice try!', message:msg, primaryLabel:'Keep guessing', onPrimary:()=>{},
            secondaryLabel:'Play Sound', onSecondary:()=>{ stopCurrent(false); playAnimalSound(answer.id, true).catch(()=>{}); }
          });
        }
      });
      choicesEl.appendChild(btn);
    });
  }

  /* ============== Buttons & Navigation ============== */
  function btnPlayHTML(label='Play Sound'){ return `
    <span class="btn-ico" aria-hidden="true">
      <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" focusable="false" aria-hidden="true">
        <path d="M8 5v14l11-7z"></path>
      </svg>
    </span>
    <span class="btn-label">${label}</span>`; }
  function playCurrentPrompt(){
    if(!currentRound) return;
    markInteracted();
    stopCurrent(false);
    playAnimalSound(currentRound.answerId, true).catch(()=>{ if(resultEl) resultEl.textContent='Tap “Play Sound” to hear the clue.'; });
    if(playSoundBtn){
      playSoundBtn.innerHTML = btnPlayHTML('Play Sound');
      playSoundBtn.setAttribute('aria-label','Play Sound');
    }
  }

  function setRoute(route){
    document.body.classList.remove('route-home','route-explore','route-match');
    document.body.classList.add(route);
  }
  function showHome(){
    closeModal(); stopCurrent(false);
    setRoute('route-home');
    appEl?.classList.add('hidden');
    homeEl?.classList.remove('hidden');
    sceneEl?.classList.add('hidden');
    matchEl?.classList.add('hidden');
    btnBack?.classList.add('hidden');
  }
  function showExplore(){
    stopCurrent(false);
    setRoute('route-explore');
    appEl?.classList.remove('hidden');
    homeEl?.classList.add('hidden');
    matchEl?.classList.add('hidden');
    sceneEl?.classList.remove('hidden');
    btnBack?.classList.remove('hidden');
  }
  function showMatch(){
    stopCurrent(false);
    setRoute('route-match');
    appEl?.classList.remove('hidden');
    homeEl?.classList.add('hidden');
    sceneEl?.classList.add('hidden');
    matchEl?.classList.remove('hidden');
    btnBack?.classList.remove('hidden');
    if(playSoundBtn){
      playSoundBtn.innerHTML = btnPlayHTML('Play Sound');
      playSoundBtn.setAttribute('aria-label','Play Sound');
    }
    justNavigatedToMatch = true;
    newRound();
  }

  /* ============== INIT ============== */
  function init(){
    overlay?.classList.add('hidden'); document.body.classList.remove('modal-open');
    preloadAudio(); renderScene();
    showHome();

    // Home buttons + delegated fallback
    btnExplore?.addEventListener('click', (e)=>{ e.preventDefault(); markInteracted(); menuPuff(btnExplore); setTimeout(showExplore,120); });
    btnMatch  ?.addEventListener('click', (e)=>{ e.preventDefault(); markInteracted(); menuPuff(btnMatch);   setTimeout(showMatch,120); });
    document.addEventListener('click', (e)=>{
      const t=e.target.closest?.('#btn-explore,#btn-match,#btn-back');
      if(!t) return; e.preventDefault();
      if(t.id==='btn-explore'){ markInteracted(); menuPuff(t); setTimeout(showExplore,100); }
      else if(t.id==='btn-match'){ markInteracted(); menuPuff(t); setTimeout(showMatch,100); }
      else if(t.id==='btn-back'){ showHome(); }
    });

    // Back
    btnBack?.addEventListener('click', (e)=>{ e.preventDefault(); showHome(); });

    // Match controls
    if(playSoundBtn){
      playSoundBtn.classList.add('btn','btn-hero','btn-lg');
      playSoundBtn.innerHTML = btnPlayHTML('Play Sound');
      playSoundBtn.setAttribute('aria-label','Play Sound');
      playSoundBtn.addEventListener('click', (e)=>{ e.preventDefault(); playCurrentPrompt(); });
    }

    // Modal
    modalClose?.addEventListener('click', (e)=>{ e.preventDefault(); closeModal(); });
    overlay?.addEventListener('click', (e)=>{ if(e.target===overlay) closeModal(); });
    document.addEventListener('keydown', (e)=>{ if(e.key==='Escape' && !overlay?.classList.contains('hidden')) closeModal(); });
    if(modalPlay){
      modalPlay.classList.add('btn','btn-hero','btn-lg');
      modalPlay.innerHTML = btnPlayHTML('Play Sound');
      modalPlay.setAttribute('aria-label','Play Sound');
    }

    // iOS audio unlock (muted)
    window.addEventListener('touchstart', markInteracted, { once:true, passive:true });
  }

  document.addEventListener('DOMContentLoaded', init);
  window.addEventListener('load', init);
})();
