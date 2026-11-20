import {land} from './assets/vendor/travel-world.js?v=6.0';

// Approximate destination centres only, never positions read from photo GPS.
// Jeju uses the island centre, not a specific photographed landmark:
// https://ijto.or.kr/chinese/?cid=10
const centres={云南:[102.7,25.0],北京:[116.4,39.9],台湾:[121.0,23.7],深圳:[114.1,22.55],重庆:[106.55,29.56],香港:[114.17,22.3],黄山:[118.34,29.71],成都:[104.07,30.67],青岛:[120.38,36.07],西昌:[102.27,27.90],济州岛:[126.53,33.36],上海:[121.47,31.23],苏州:[120.58,31.30],桂林:[110.29,25.27],海南:[109.8,19.2],西安:[108.94,34.34],宝鸡:[107.24,34.36],北海:[109.12,21.48],湖南:[111.8,28.2],自贡:[104.78,29.34],乐山:[103.76,29.55],峨眉山:[103.33,29.55],恩施:[109.49,30.27],新疆:[85.6,42.5],澳门:[113.54,22.20],广州:[113.26,23.13],泰国:[100.5,13.75],马来西亚:[102.2,4.3]};
const offsets={云南:[-120,105],北京:[-74,-150],台湾:[90,65],深圳:[-55,145],重庆:[-150,-50],香港:[50,135],黄山:[90,10],成都:[-145,-100],青岛:[70,-150],西昌:[-155,0],济州岛:[105,-100],上海:[115,-45],苏州:[130,-25],桂林:[-120,80],海南:[85,170],西安:[-125,-170],宝鸡:[-145,-190],北海:[120,155],湖南:[100,35],自贡:[-130,-20],乐山:[-160,-65],峨眉山:[-160,-85],恩施:[100,-5],新疆:[-80,-210],澳门:[130,115],广州:[110,95],泰国:[-100,200],马来西亚:[95,230]};
const RAD=Math.PI/180;
const sphere=land.map(ring=>ring.map(([lng,lat])=>[lng*RAD,lat*RAD]));
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));

// Keep each label on its preferred side of the globe, then pack each column
// vertically. Separate column bounds prevent overlaps across both groups.
function layoutLabels(items,width,height){
  const margin=8,middle=width/2,columnGap=12,placed=[];
  for(const side of [-1,1]){
    const column=items.filter(item=>item.side===side).sort((a,b)=>a.targetY-b.targetY||a.order-b.order);
    if(!column.length)continue;
    const totalHeight=column.reduce((sum,item)=>sum+item.h*2,0);
    const gap=column.length>1?Math.min(8,Math.max(0,(height-margin*2-totalHeight)/(column.length-1))):0;
    // The current destinations fit at 240×300 and above. On unusually tall
    // text settings, leave overflow destinations in the always-visible list.
    let used=0;
    const fitting=column.filter(item=>{if(used+item.h*2>height-margin*2+1e-6)return false;used+=item.h*2+gap;return true;});
    fitting.forEach((item,index)=>{
      const minX=side<0?margin+item.w:middle+columnGap/2+item.w;
      const maxX=side<0?middle-columnGap/2-item.w:width-margin-item.w;
      item.lx=clamp(item.targetX,minX,maxX);
      item.ly=Math.max(clamp(item.targetY,margin+item.h,height-margin-item.h),index?fitting[index-1].ly+fitting[index-1].h+item.h+gap:margin+item.h);
    });
    for(let i=fitting.length-1;i>=0;i--){
      const item=fitting[i],next=fitting[i+1];
      item.ly=Math.min(item.ly,next?next.ly-next.h-item.h-gap:height-margin-item.h);
      placed.push(item);
    }
  }
  return placed;
}

export function mountGlobe(root,cities){
  if(!root)return null;
  const canvas=root.querySelector('canvas'),ctx=canvas?.getContext('2d');
  if(!ctx)return null;
  const stage=root.querySelector('.travel-globe-stage');
  const mq=matchMedia('(prefers-reduced-motion: reduce)');
  let width=600,height=530,lon=108,lat=25,zoom=1,raf=0,dead=false,drag=null;
  let touched=false,playing=!mq.matches,last=0,start=0,visible=true;
  const signal=new AbortController(),on=(el,type,fn,options={})=>el.addEventListener(type,fn,{...options,signal:signal.signal});
  const links=[...root.querySelectorAll('[data-globe-city]')].map((el,order)=>{
    el.hidden=true;el.style.display='none';
    return {el,order,city:cities.find(c=>c.id===el.dataset.globeCity)};
  }).filter(x=>x.city&&centres[x.city.name]);
  try{const saved=JSON.parse(sessionStorage.getItem('yulin-travel-globe')||'null');if(saved&&[saved.lon,saved.lat,saved.zoom].every(Number.isFinite)){lon=saved.lon;lat=clamp(saved.lat,-65,65);zoom=clamp(saved.zoom,.9,2.4);touched=true;}}catch{}
  function save(){try{sessionStorage.setItem('yulin-travel-globe',JSON.stringify({lon,lat,zoom}));}catch{}}
  function project(lng,phi){const d=lng-lon*RAD,p=lat*RAD,cp=Math.cos(phi),sp=Math.sin(phi);return [cp*Math.sin(d),Math.cos(p)*sp-Math.sin(p)*cp*Math.cos(d),Math.sin(p)*sp+Math.cos(p)*cp*Math.cos(d)];}
  function draw(){
    if(dead)return;
    const dpr=Math.min(devicePixelRatio||1,2);ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,width,height);
    const cx=width/2,cy=height/2,r=Math.min(width*.39,height*.43)*zoom;
    const shade=ctx.createRadialGradient(cx-r*.32,cy-r*.32,r*.05,cx,cy,r);shade.addColorStop(0,'#fffdf9');shade.addColorStop(.68,'#f6e7e8');shade.addColorStop(1,'#e9cdd8');
    ctx.save();ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fillStyle=shade;ctx.shadowColor='#a3738b20';ctx.shadowBlur=30;ctx.fill();ctx.shadowBlur=0;ctx.clip();
    ctx.strokeStyle='#c897ad3b';ctx.lineWidth=.55;
    const line=points=>{ctx.beginPath();let active=false;points.forEach(([l,p])=>{const [x,y,z]=project(l,p);if(z>0){if(!active)ctx.moveTo(cx+x*r,cy-y*r);else ctx.lineTo(cx+x*r,cy-y*r);active=true;}else active=false;});ctx.stroke();};
    for(let la=-60;la<=60;la+=30)line(Array.from({length:181},(_,i)=>[i*2*RAD-Math.PI,la*RAD]));
    for(let lo=-180;lo<180;lo+=30)line(Array.from({length:91},(_,i)=>[lo*RAD,(i*2-90)*RAD]));
    ctx.fillStyle='#d7acbb';ctx.strokeStyle='#ba879e';ctx.lineWidth=.45;
    for(const ring of sphere){const pts=ring.map(([l,p])=>project(l,p));if(!pts.some(p=>p[2]>0))continue;ctx.beginPath();pts.forEach(([x,y,z],i)=>{if(z<0){const norm=Math.hypot(x,y)||1;x/=norm;y/=norm;}const px=cx+x*r,py=cy-y*r;if(!i)ctx.moveTo(px,py);else ctx.lineTo(px,py);});ctx.closePath();ctx.fill();ctx.stroke();}
    ctx.restore();ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.strokeStyle='#c69bb44d';ctx.lineWidth=1;ctx.stroke();
    const visibleLabels=[];
    links.forEach(({el,city,order})=>{
      const coord=centres[city.name],[x,y,z]=project(coord[0]*RAD,coord[1]*RAD);
      const px=cx+x*r,py=cy-y*r,shown=z>.03&&px>10&&px<width-10&&py>10&&py<height-10;
      // Explicit display also overrides the marker's CSS display:flex when
      // hidden, so back-facing/unknown destinations cannot receive clicks.
      el.hidden=!shown;el.style.display=shown?'flex':'none';
      if(!shown)return;
      const off=offsets[city.name],scale=Math.min(1,width/620);
      visibleLabels.push({el,order,px,py,side:off[0]<0?-1:1,w:(el.offsetWidth||82)/2,h:(el.offsetHeight||36)/2,targetX:px+off[0]*scale,targetY:py+off[1]*scale});
    });
    const placed=layoutLabels(visibleLabels,width,height),placedElements=new Set(placed.map(item=>item.el));
    visibleLabels.forEach(({el})=>{if(!placedElements.has(el)){el.hidden=true;el.style.display='none';}});
    placed.forEach(({el,px,py,lx,ly,w,side})=>{
      el.style.left=lx+'px';el.style.top=ly+'px';
      ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(lx-side*(w-3),ly);ctx.strokeStyle='#aa688fa6';ctx.lineWidth=.8;ctx.stroke();
      ctx.beginPath();ctx.arc(px,py,3,0,Math.PI*2);ctx.fillStyle='#a85880';ctx.fill();
    });
  }
  function frame(t){raf=0;if(dead||!playing||!visible||mq.matches||touched)return;if(!start)start=t;if(t-last>40){lon=108+Math.sin((t-start)/13000)*6;draw();last=t;}raf=requestAnimationFrame(frame);}
  function animate(){if(!raf&&playing&&visible&&!mq.matches&&!touched)raf=requestAnimationFrame(frame);}
  function stop(){touched=true;if(raf)cancelAnimationFrame(raf);raf=0;}
  function resize(){const b=stage.getBoundingClientRect();width=Math.max(240,b.width);height=Math.max(300,b.height);const dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);draw();}
  const ro=new ResizeObserver(resize);ro.observe(stage);
  const io=new IntersectionObserver(entries=>{visible=entries[0]?.isIntersecting??true;if(visible)animate();else{cancelAnimationFrame(raf);raf=0;}},{threshold:.05});io.observe(root);
  on(canvas,'pointerdown',ev=>{if(ev.button!==0)return;stop();drag={x:ev.clientX,y:ev.clientY,lon,lat};canvas.setPointerCapture(ev.pointerId);canvas.classList.add('is-dragging');});
  on(canvas,'pointermove',ev=>{if(!drag)return;lon=drag.lon-(ev.clientX-drag.x)*.26/zoom;lat=clamp(drag.lat+(ev.clientY-drag.y)*.22/zoom,-65,65);draw();});
  const end=()=>{if(drag){drag=null;canvas.classList.remove('is-dragging');save();}};on(canvas,'pointerup',end);on(canvas,'pointercancel',end);
  function control(action){stop();if(action==='left')lon-=12;if(action==='right')lon+=12;if(action==='up')lat=clamp(lat+10,-65,65);if(action==='down')lat=clamp(lat-10,-65,65);if(action==='in')zoom=clamp(zoom+.22,.9,2.4);if(action==='out')zoom=clamp(zoom-.22,.9,2.4);if(action==='reset'){lon=108;lat=25;zoom=1;}draw();save();}
  on(root,'click',ev=>{const b=ev.target.closest('[data-globe-action]');if(b)control(b.dataset.globeAction);});
  on(root,'focusin',ev=>{if(ev.target.closest('[data-globe-city]'))stop();});
  on(canvas,'keydown',ev=>{const action={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up',ArrowDown:'down','+':'in','=':'in','-':'out',Home:'reset'}[ev.key];if(action){ev.preventDefault();control(action);}});
  on(mq,'change',()=>{if(mq.matches){cancelAnimationFrame(raf);raf=0;}else animate();draw();});
  resize();animate();
  return {destroy(){dead=true;save();signal.abort();ro.disconnect();io.disconnect();cancelAnimationFrame(raf);},setPlaying(value){playing=value;if(!value){cancelAnimationFrame(raf);raf=0;}else animate();}};
}
