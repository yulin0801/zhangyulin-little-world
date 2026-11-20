const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function educationJourney(data) {
  const e = escape;
  return `<section class="page profile-page education-page journey-page"><a class="back-link" href="#/home">← 首页</a>
    <header class="journey-heading"><div><p class="profile-eyebrow">EDUCATION / 教育经历</p><h1 tabindex="-1">我的学习坐标</h1></div><div class="journey-range"><span>2020</span><i aria-hidden="true"></i><span>2029</span><button class="journey-replay" type="button" aria-label="重播学习轨迹">↻</button></div></header>
    <div class="education-journey">
      <svg class="journey-route" aria-hidden="true"><defs><linearGradient id="journey-ink"><stop stop-color="#ed78b3"/><stop offset=".5" stop-color="#f2773e"/><stop offset="1" stop-color="#ed78b3"/></linearGradient></defs><path class="journey-ribbon"/><path class="journey-track"/><path class="journey-progress"/><path class="journey-flow"/><g class="journey-traveler"><circle r="15" class="traveler-halo"/><circle r="5" class="traveler-core"/></g></svg>
      <ol class="learning-path journey-stops" aria-label="学习经历，按开始时间排列">${data.education.map((school,index)=>`<li class="learning-stop journey-stop-${index%2===0?'above':'below'} tone-${e(school.tone)}" data-school="${e(school.id)}" data-education-state="${e(school.state)}" style="--step:${index}">
        <button class="journey-marker" type="button" data-journey-step="${index}" aria-pressed="${index===0}" aria-label="${e(school.period.slice(0,4))}年，${e(school.school)}"><span class="journey-year">${e(school.period.slice(0,4))}</span><span class="journey-city">${e(school.city)}</span><span class="journey-pin" aria-hidden="true"></span></button>
        <div class="journey-school-card"><div class="school-visual"><img class="school-emblem school-emblem--${e(school.id)}" src="${e(school.image)}" alt="${e(school.school)}校徽" width="640" height="640" decoding="async"></div>
          <div class="school-detail"><span class="school-period">${e(school.period)}</span><h2>${e(school.school)}</h2>${school.department?`<p class="school-department">${e(school.department)}</p>`:''}<span class="school-status">${e(school.stateLabel)}</span>
          ${school.id==='cuc'?`<div class="school-academic-record"><p class="school-grade-summary">GPA${e(data.academic.gpa)}/${e(data.academic.gpaScale)}，排名${e(data.academic.rank)}/${e(data.academic.rankTotal)}</p><div class="school-record-links"><button type="button" class="school-record-link" data-certificate-group="educationRank" data-certificate-index="0">成绩排名 ↗</button><button type="button" class="school-record-link" data-certificate-group="educationTranscript" data-certificate-index="0">成绩单 ↗</button></div></div>`:''}${school.id==='mcu'?`<div class="school-record-links"><button type="button" class="school-record-link" data-certificate-group="educationMcu" data-certificate-index="0">研习證書 ↗</button></div>`:''}</div></div>
      </li>`).join('')}</ol>
    </div>
  </section>`;
}

let dispose = null;
export function destroyEducationJourney(){ dispose?.(); dispose=null; }
export function mountEducationJourney(root=document.getElementById('page-view')) {
  destroyEducationJourney();
  const page=root?.querySelector('.journey-page'); if(!page)return;
  const container=page.querySelector('.education-journey'),svg=page.querySelector('.journey-route');
  const paths=[...svg.querySelectorAll('path')],progress=svg.querySelector('.journey-progress'),traveler=svg.querySelector('.journey-traveler');
  const stops=[...page.querySelectorAll('.learning-stop')],markers=[...page.querySelectorAll('.journey-marker')];
  const reduce=matchMedia('(prefers-reduced-motion: reduce)'),mobile=matchMedia('(max-width: 900px)');
  const abort=new AbortController();let frame=0,layoutFrame=0,current=0,length=0,positions=[],active=0,intro=false;
  const setActive=index=>{active=index;stops.forEach((s,i)=>s.classList.toggle('is-current',i===index));markers.forEach((m,i)=>m.setAttribute('aria-pressed',String(i===index)));};
  const draw=fraction=>{current=Math.max(0,Math.min(1,fraction));if(!length)return;progress.style.strokeDashoffset=String(length*(1-current));const point=progress.getPointAtLength(current*length);traveler.setAttribute('transform',`translate(${point.x} ${point.y})`);};
  function travelTo(target,duration=900,scan=false){
    cancelAnimationFrame(frame);const start=current,time=performance.now();
    if(reduce.matches){draw(target);if(scan){let i=0;positions.forEach((p,j)=>{if(target>=p-.015)i=j;});setActive(i);}intro=false;return;}
    const tick=now=>{const t=Math.min(1,(now-time)/duration),ease=1-Math.pow(1-t,3);draw(start+(target-start)*ease);if(scan){let i=0;positions.forEach((p,j)=>{if(current>=p-.015)i=j;});setActive(i);}if(t<1)frame=requestAnimationFrame(tick);else intro=false;};
    frame=requestAnimationFrame(tick);
  }
  function layout(){
    const box=container.getBoundingClientRect();if(!box.width)return;
    svg.setAttribute('viewBox',`0 0 ${box.width} ${box.height}`);
    const pts=markers.map(m=>{const b=m.querySelector('.journey-pin').getBoundingClientRect();return{x:b.left-box.left+b.width/2,y:b.top-box.top+b.height/2};});
    let d=mobile.matches?`M ${pts[0].x} ${Math.max(0,pts[0].y-24)}`:`M 0 ${pts[0].y+38}`;
    let previous=mobile.matches?{x:pts[0].x,y:Math.max(0,pts[0].y-24)}:{x:0,y:pts[0].y+38};
    pts.forEach((p,i)=>{if(mobile.matches){const mid=(previous.y+p.y)/2;d+=` C ${previous.x+(i%2?28:-15)} ${mid} ${p.x+(i%2?28:-15)} ${mid} ${p.x} ${p.y}`;}else{const mid=(previous.x+p.x)/2;d+=` C ${mid} ${previous.y} ${mid} ${p.y} ${p.x} ${p.y}`;}previous=p;});
    d+=mobile.matches?` Q ${previous.x+18} ${previous.y+22} ${previous.x} ${previous.y+48}`:` Q ${box.width-18} ${previous.y} ${box.width} ${previous.y-45}`;
    paths.forEach(p=>p.setAttribute('d',d));length=progress.getTotalLength();progress.style.strokeDasharray=`${length} ${length}`;
    positions=pts.map(p=>{let best=0,distance=Infinity;for(let s=0;s<=600;s++){const q=progress.getPointAtLength(length*s/600),delta=(q.x-p.x)**2+(q.y-p.y)**2;if(delta<distance){distance=delta;best=s/600;}}return best;});
    draw(current);page.classList.add('journey-ready');
  }
  const resize=new ResizeObserver(()=>{cancelAnimationFrame(layoutFrame);layoutFrame=requestAnimationFrame(layout);});resize.observe(container);
  const click=event=>{const button=event.target.closest('[data-journey-step]');if(button){intro=false;const i=Number(button.dataset.journeyStep);setActive(i);travelTo(positions[i]);}else if(event.target.closest('.journey-replay'))replay();};
  page.addEventListener('click',click,{signal:abort.signal});
  function replay(){layout();setActive(0);draw(0);intro=true;travelTo(mobile.matches?positions[0]:positions.at(-1),mobile.matches?1000:3800,!mobile.matches);}
  function onScroll(){if(!mobile.matches||intro||reduce.matches)return;const aim=innerHeight*.45;let closest=0,distance=Infinity;stops.forEach((s,i)=>{const b=s.getBoundingClientRect(),delta=Math.abs(b.top+Math.min(b.height,300)/2-aim);if(delta<distance){distance=delta;closest=i;}});if(window.scrollY+innerHeight>=document.documentElement.scrollHeight-3)closest=stops.length-1;if(closest!==active){setActive(closest);travelTo(positions[closest],650);}}
  window.addEventListener('scroll',onScroll,{passive:true,signal:abort.signal});
  reduce.addEventListener('change',()=>{cancelAnimationFrame(frame);intro=false;draw(positions[active]||0);},{signal:abort.signal});
  layout();replay();
  dispose=()=>{abort.abort();resize.disconnect();cancelAnimationFrame(frame);cancelAnimationFrame(layoutFrame);};
}
