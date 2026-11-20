import {certificateGroups} from './certificates.js?v=30.0';

const e=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function honorsWall(){
  return `<section class="honor-wall" aria-label="荣誉证书展示墙">
    <div class="honor-wall-grid">${certificateGroups.awards.map((award,index)=>`
      <button type="button" class="honor-wall-piece ${index===0?'honor-wall-landscape':''}" data-certificate-group="awards" data-certificate-index="${index}" aria-label="查看${e(award.title)}，${e(award.period)}">
        <span class="honor-wall-mat"><img src="${e(award.src)}" alt="${e(award.title)}" loading="eager" decoding="async"><span class="honor-wall-zoom" aria-hidden="true">↗</span></span>
        <span class="honor-wall-label"><span>${e(award.period)}</span><strong>${e(award.title)}</strong></span>
      </button>`).join('')}
    </div>
    <p class="honor-wall-help">点击奖状查看大图</p>
  </section>`;
}

let mounted=null;

export function mountHonors(root=document.getElementById('page-view')){
  destroyHonors();
  const page=root?.querySelector('.academic-awards');
  if(!page)return;
  const controller=new AbortController();
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const state={page,controller,animations:new Set(),observer:null};
  mounted=state;
  const targets=[...page.querySelectorAll('.awards-heading,.honor-wall,.award-section-heading,.challenge-award-feature,.award-record,.award-project,.campus-certificate-grid .certificate-card')];
  const reveal=element=>{
    if(element.dataset.honorRevealed)return;
    element.dataset.honorRevealed='true';
    element.classList.add('honors-in-view');
    if(reduced.matches||typeof element.animate!=='function')return;
    const animation=element.animate([
      {opacity:.5,transform:'translateY(14px)'},
      {opacity:1,transform:'translateY(0)'},
    ],{duration:600,easing:'cubic-bezier(.16,1,.3,1)'});
    state.animations.add(animation);
    const remove=()=>state.animations.delete(animation);
    animation.addEventListener('finish',remove,{once:true});
    animation.addEventListener('cancel',remove,{once:true});
  };
  if('IntersectionObserver' in window){
    state.observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
      if(entry.isIntersecting){reveal(entry.target);state.observer.unobserve(entry.target);}
    }),{threshold:.06});
    targets.forEach(element=>state.observer.observe(element));
  }else{
    targets.forEach(reveal);
  }
  reduced.addEventListener('change',()=>{
    state.animations.forEach(animation=>animation.cancel());
    state.animations.clear();
  },{signal:controller.signal});
  page.classList.add('honors-motion-ready');
}

export function destroyHonors(){
  if(!mounted)return;
  const state=mounted;
  mounted=null;
  state.controller.abort();
  state.observer?.disconnect();
  state.animations.forEach(animation=>animation.cancel());
  state.animations.clear();
  state.page.classList.remove('honors-motion-ready');
  state.page.querySelectorAll('[data-honor-revealed]').forEach(element=>{
    delete element.dataset.honorRevealed;
    element.classList.remove('honors-in-view');
  });
}
