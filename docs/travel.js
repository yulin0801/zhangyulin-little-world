import {travelData} from './travel-data.js?v=29.0';
import {mountGlobe} from './travel-globe.js?v=10.0';

const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const cities=travelData.cities||[];
const route=(city,album,area)=>`#/life/travel${city?'/'+encodeURIComponent(city.id):''}${album?'?album='+encodeURIComponent(album.id):area?'?area='+encodeURIComponent(area):''}`;
const allPhotos=city=>(city.albums||[]).flatMap(album=>(album.photos||[]).map(photo=>({...photo,album,city})));
const locationOf=p=>p.location||[p.city.name,p.album.name===p.city.name?'':p.album.name].filter(Boolean).join(' · ');
let active=null;

// Album IDs remain stable for existing links. The optional area query groups
// albums without changing their stored names or the order of their photos.
function albumGroups(city){
  const groups=[];
  for(const album of city.albums||[]){
    const parts=String(album.name||city.name).split(/[/／]/).map(part=>part.trim()).filter(Boolean);
    const name=parts[0]||city.name;
    let group=groups.find(item=>item.name===name);
    if(!group){group={name,albums:[]};groups.push(group);}
    group.albums.push({album,label:parts.slice(1).join(' / '),nested:parts.length>1});
  }
  return groups;
}
function selectAlbums(city,params){
  const groups=albumGroups(city),hierarchical=groups.some(group=>group.albums.some(item=>item.nested));
  const selected=(city.albums||[]).find(album=>album.id===params.get('album'));
  const group=hierarchical?groups.find(item=>selected?item.albums.some(entry=>entry.album.id===selected.id):item.name===params.get('area')):null;
  const photos=allPhotos(city).filter(photo=>selected?photo.album.id===selected.id:!group||group.albums.some(entry=>entry.album.id===photo.album.id));
  return {groups,hierarchical,selected,group,photos};
}
function albumFilter(city,selection){
  const {groups,hierarchical,selected,group}=selection;
  if((city.albums||[]).length<2)return '';
  if(!hierarchical)return `<nav class="travel-album-filter" aria-label="按地点浏览"><a href="${route(city)}" ${!selected?'aria-current="page"':''}>全部风景</a>${city.albums.map(album=>`<a href="${route(city,album)}" ${selected?.id===album.id?'aria-current="page"':''}>${esc(album.name===city.name?'沿途':album.name)}</a>`).join('')}</nav>`;
  const children=group&&(group.albums.length>1||group.albums.some(item=>item.nested));
  return `<nav class="travel-album-filter travel-album-hierarchy" aria-label="按地点浏览"><div class="travel-filter-level"><span class="travel-filter-label">地点</span><div class="travel-filter-links"><a href="${route(city)}" ${!group?'aria-current="page"':''}>全部风景</a>${groups.map(item=>{const direct=item.albums.length===1&&!item.albums[0].nested;return `<a href="${direct?route(city,item.albums[0].album):route(city,null,item.name)}" ${group===item?'aria-current="location"':''}>${esc(item.name===city.name?'沿途':item.name)}</a>`;}).join('')}</div></div>${children?`<div class="travel-filter-level travel-filter-sublevel"><span class="travel-filter-label">景点</span><div class="travel-filter-links"><a href="${route(city,null,group.name)}" ${!selected?'aria-current="page"':''}>全部景点</a>${group.albums.map(item=>`<a href="${route(city,item.album)}" ${selected?.id===item.album.id?'aria-current="page"':''}>${esc(item.label||'沿途')}</a>`).join('')}</div></div>`:''}</nav>`;
}

function photoButton(photo,index,cls='travel-photo',group='gallery'){
  return `<button type="button" class="${cls}" style="aspect-ratio:${photo.width}/${photo.height}" data-travel-photo="${index}" data-photo-group="${group}" aria-label="查看${esc(locationOf(photo))}的照片"><img src="${esc(photo.thumbnail||photo.large)}" alt="${esc(locationOf(photo))}" width="${photo.width}" height="${photo.height}" loading="lazy" decoding="async"><span>${esc(locationOf(photo))}</span></button>`;
}
function buildRiver(){
  const perCity=cities.map(city=>{const photos=allPhotos(city);const step=Math.max(1,Math.floor(photos.length/5));return photos.filter((_,i)=>i%step===0).slice(0,5);});
  const mixed=[];for(let i=0;i<5;i++)perCity.forEach(list=>{if(list[i])mixed.push(list[i]);});return mixed.slice(0,32);
}
function riverHTML(){const river=buildRiver(),rows=[[],[]];river.forEach((p,i)=>rows[i%2].push({...p,riverIndex:i}));return `<section class="travel-river" aria-label="旅行照片流"><div class="travel-section-line"><h2>一些路过的风景</h2><button type="button" class="travel-motion-toggle" data-travel-motion aria-pressed="false">暂停流动 <span aria-hidden="true">Ⅱ</span></button></div>${rows.map((row,r)=>`<div class="travel-river-row"><div class="travel-river-track ${r?'reverse':''}">${[0,1].map(copy=>`<div class="travel-river-group" ${copy?'aria-hidden="true"':''}>${row.map(p=>{const button=photoButton(p,p.riverIndex,'travel-river-photo','river');return copy?button.replace('<button','<button tabindex="-1"'):button;}).join('')}</div>`).join('')}</div></div>`).join('')}</section>`;}
function globeHTML(){return `<section class="travel-globe" aria-label="目的地地球"><div class="travel-globe-stage"><canvas tabindex="0" role="img" aria-label="可旋转的旅行地球" aria-describedby="travel-globe-help">旅行地点也可以在下方列表中打开。</canvas><div class="travel-globe-markers">${cities.map(c=>`<a class="travel-globe-marker" data-globe-city="${esc(c.id)}" href="${route(c)}" aria-label="打开${esc(c.name)}相册" hidden style="display:none"><img src="${esc(c.cover)}" alt="" loading="lazy"><span>${esc(c.name)}</span></a>`).join('')}</div></div><div class="travel-globe-bottom"><p id="travel-globe-help">拖动地球，点亮一个目的地。<span>也可用方向键转动，＋／− 缩放。</span></p><div class="travel-globe-controls" aria-label="地球控制"><button type="button" data-globe-action="left" aria-label="向左旋转地球">←</button><button type="button" data-globe-action="right" aria-label="向右旋转地球">→</button><button type="button" data-globe-action="in" aria-label="放大地球">＋</button><button type="button" data-globe-action="out" aria-label="缩小地球">−</button><button type="button" data-globe-action="reset">回到这里</button></div></div></section>`;}
function credit(){return `<p class="travel-credit">旅行相册设计参考 <a href="https://github.com/kaipengfang/travel-shots" target="_blank" rel="noopener noreferrer">TravelShots</a> · <a href="assets/vendor/TRAVELSHOTS-LICENSE.txt" target="_blank" rel="noopener">MIT</a></p>`;}
function landing(){return `<section class="page travel-page" data-travel-page="landing"><a class="back-link" href="#/life">← 生活足迹</a><header class="travel-heading"><div><span class="page-label">旅行相册</span><h1 tabindex="-1">走走，<em>看看。</em></h1></div><p>把路过的风景，<br>慢慢收进我的小世界。</p></header><div class="travel-atlas">${globeHTML()}<aside class="travel-destinations"><span class="page-label">去过的地方</span><nav aria-label="目的地相册">${cities.map((c,i)=>`<a href="${route(c)}"><img src="${esc(c.cover)}" alt="" loading="lazy"><span>${esc(c.name)}</span><span aria-hidden="true">↗</span></a>`).join('')}</nav><p>从地图，也从一张照片出发。</p></aside></div>${riverHTML()}${credit()}</section>`;}
function cityPage(city,params){
  const selection=selectAlbums(city,params),{selected,group,photos}=selection;
  return `<section class="page travel-page travel-city-page" data-travel-page="city" data-city="${esc(city.id)}" data-album="${esc(selected?.id||'')}" data-area="${esc(group?.name||'')}"><a class="back-link" href="${route()}">← 返回旅行地图</a><header class="travel-heading"><div><span class="page-label">旅行相册</span><h1 tabindex="-1">${esc(city.name)}</h1></div><p>${selected?esc(selected.name):group?esc(group.name):'走过的地方，留在照片里。'}</p></header>${albumFilter(city,selection)}<div class="travel-gallery" aria-label="${esc(selected?.name||group?.name||city.name)}照片">${photos.map((p,i)=>`<figure>${photoButton(p,i)}<figcaption>${esc(locationOf(p))}</figcaption></figure>`).join('')}</div><nav class="travel-city-footer" aria-label="继续旅行"><a href="${route()}">← 回到地图</a><div>${cities.filter(c=>c.id!==city.id).map(c=>`<a href="${route(c)}">${esc(c.name)} ↗</a>`).join('')}</div></nav>${credit()}</section>`;
}
export function renderTravel(path='life/travel',params=new URLSearchParams()){
  if(!(params instanceof URLSearchParams))params=new URLSearchParams(params||'');
  const parts=String(path).replace(/^#?\//,'').split('/');let id='';try{id=decodeURIComponent(parts[2]||'');}catch{}
  if(!id)return landing();const city=cities.find(c=>c.id===id);
  return city?cityPage(city,params):`<section class="page travel-page" data-travel-page="missing"><a class="back-link" href="${route()}">← 返回旅行地图</a><h1 tabindex="-1">还没找到这个地方</h1><p>从地图上的目的地继续逛逛吧。</p></section>`;
}

export function mountTravel({openViewer}={}){
  destroyTravel();const root=document.querySelector('[data-travel-page]');if(!root)return;
  const controller=new AbortController(),signal=controller.signal;let globe=null,observer=null,resizeRAF=0,paused=false;
  const mq=matchMedia('(prefers-reduced-motion: reduce)');
  const city=cities.find(c=>c.id===root.dataset.city);
  const gallery=city?selectAlbums(city,new URLSearchParams({album:root.dataset.album||'',area:root.dataset.area||''})).photos:[];const river=buildRiver();
  const launch=(photos,index)=>{if(!photos[index]||typeof openViewer!=='function')return;const images=photos.map(p=>({src:p.large||p.thumbnail,caption:locationOf(p),locationOnly:true}));const title=photos.every(p=>p.city.id===photos[index].city.id)?photos[index].city.name:'旅行相册';openViewer(images,index,title,{locationOnly:true});};
  root.addEventListener('click',ev=>{const b=ev.target.closest('[data-travel-photo]');if(b&&root.contains(b))launch(b.dataset.photoGroup==='river'?river:gallery,Number(b.dataset.travelPhoto));const toggle=ev.target.closest('[data-travel-motion]');if(toggle){paused=!paused;root.classList.toggle('travel-motion-paused',paused);toggle.setAttribute('aria-pressed',String(paused));toggle.innerHTML=paused?'继续流动 <span aria-hidden="true">▷</span>':'暂停流动 <span aria-hidden="true">Ⅱ</span>';globe?.setPlaying(!paused);}}, {signal});
  globe=mountGlobe(root.querySelector('.travel-globe'),cities);
  // Keep source/keyboard order stable, while positioning each original-ratio
  // image in the shortest column (adapted from TravelShots PhotoGallery).
  const galleryEl=root.querySelector('.travel-gallery');
  function masonry(){if(!galleryEl)return;const width=galleryEl.clientWidth,columns=width<520?2:width<850?3:4,gap=width<520?10:18,cw=(width-gap*(columns-1))/columns,heights=Array(columns).fill(0);galleryEl.classList.add('is-masonry');[...galleryEl.children].forEach((figure,i)=>{const p=gallery[i],col=heights.indexOf(Math.min(...heights));figure.style.width=cw+'px';figure.style.transform=`translate(${col*(cw+gap)}px,${heights[col]}px)`;const textHeight=figure.querySelector('figcaption')?.offsetHeight||26;heights[col]+=cw*(p.height/p.width)+textHeight+gap;});galleryEl.style.height=Math.max(...heights,0)+'px';}
  if(galleryEl){observer=new ResizeObserver(()=>{cancelAnimationFrame(resizeRAF);resizeRAF=requestAnimationFrame(masonry);});observer.observe(galleryEl);masonry();}
  const applyMotion=()=>{root.classList.toggle('travel-reduced-motion',mq.matches);const button=root.querySelector('[data-travel-motion]');if(button)button.hidden=mq.matches;};mq.addEventListener('change',applyMotion,{signal});applyMotion();
  active={root,destroy(){controller.abort();observer?.disconnect();globe?.destroy?.();cancelAnimationFrame(resizeRAF);}};
}
export function destroyTravel(){active?.destroy();active=null;}
