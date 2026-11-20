import {projects,videos} from './projects.js?v=6.0';
import {readers} from './readers.js?v=6.0';
import {metadata,topics,kinds,order} from './catalogue.js?v=6.0';
import './motion.js?v=6.0';
import './navigation.js?v=6.0';
import {academicIntro,worksPage,worksRoute,lifeOverview,performancesPage} from './academic.js?v=6.0';
import {renderTravel,mountTravel,destroyTravel} from './travel.js?v=6.0';
import {travelData} from './travel-data.js?v=6.0';

const home=document.getElementById('home'),view=document.getElementById('page-view'),viewer=document.getElementById('image-viewer');
const viewerImage=document.getElementById('viewer-image'),viewerScroll=viewer.querySelector('.viewer-scroll');
const e=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let catalogueRoute='academic/works?format=text',reader=null,viewerGallery=[],viewerIndex=0,viewerHeading='',savedFocus=null,readingObserver=null,viewerLocationOnly=false;
try{const saved=sessionStorage.getItem('yulin-catalogue-route');if(saved&&/^academic\/works(?:\?[^#]*)?$/.test(saved))catalogueRoute=saved;}catch{}
const link=(route,label,cls='text-link')=>`<a class="${cls}" href="#/${e(route)}">${label}</a>`;
const back=(route,label)=>link(route,`← ${e(label)}`,'back-link');
const heading=title=>`<div class="page-heading"><h1 tabindex="-1">${e(title)}</h1></div>`;
const allProjects=()=>order.map(id=>projects[id]||videos.find(v=>v.id===id)).filter(Boolean);
const readDocs=id=>readers[id]?.documents||[];
const kindLabel=id=>kinds.find(k=>k[0]===metadata[id]?.kind)?.[1]||'作品';

function projectCard(p){
 const film=metadata[p.id]?.kind==='video';
 const art=p.image?`<img src="${e(p.image)}" ${film?`style="--still-top:${e(p.top||'0')}"`:''} alt="${e(p.title)}作品预览" loading="lazy" decoding="async">`:`<small>${e(p.tag||'课程作品')}</small><strong>${e(p.artText||p.title).replaceAll('\n','<br>')}</strong><span>${e(p.methods||'论文与报告')}</span>`;
 const cls=film?`video-still ${p.titleStill?'video-title-still':''}`:p.image?'':'essay-art tone-'+e(p.tone||'sage');
 const picture=p.id==='aejmc'?`<button class="card-image poster-card" data-poster="aejmc" type="button" aria-label="放大 AEJMC 研究海报">${art}<span class="image-hint">查看海报 ⤢</span></button>`:`<a class="card-image ${cls}" href="#/project/${e(p.id)}" aria-label="阅读${e(p.title)}">${art}${p.image?`<span class="image-hint">${film?'查看作品':'阅读全文'} ↗</span>`:''}</a>`;
 return `<article class="work-card ${film?'video-card':''}">${picture}<div class="card-caption"><div class="card-meta"><span>${e(film?"影像创作":p.tag)}</span><span>${e(p.type)}</span></div><h2><a href="#/project/${e(p.id)}">${e(p.title)}</a></h2><p>${e(p.summary)}</p>${link('project/'+p.id,film?'查看作品 ↗':'阅读全文 ↗')}</div></article>`;
}
function researchPage(params){
 const format=params.get('format')==='video'?'video':'text';
 const topic=topics.some(t=>t[0]===params.get('topic'))?params.get('topic'):'all';
 catalogueRoute=worksRoute(format,topic);
 try{sessionStorage.setItem('yulin-catalogue-route',catalogueRoute);}catch{}
 return worksPage(params,projectCard);
}
function stagePhotos(){return `<div class="stage-photos"><div class="stage-panel"><img src="assets/stage-moments.jpg" alt="第五次春天舞台谢幕，伙伴们牵手举起双臂" loading="lazy"></div><div class="stage-panel"><img src="assets/stage-moments.jpg" alt="第五次春天舞台上，伙伴们一起鞠躬谢幕" loading="lazy"></div></div><p class="stage-label">《第五次春天》· 舞台谢幕</p>`;}
function lifePage(){return lifeOverview(travelData.cities?.[0]?.cover);}
function contactPage(){return `<section class="page contact-page">${back('home','首页')}<div class="contact-content"><span class="page-label">CONTACT</span><h1 tabindex="-1">联系我</h1><p>张渝琳 · 小章鱼</p><a class="email-link" href="mailto:zhangyulin_10@foxmail.com">zhangyulin_10@foxmail.com <span aria-hidden="true">↗</span></a></div><div class="contact-links">${link('research','学业探索 ↗')}${link('life','生活足迹 ↗')}</div></section>`;}
function projectPage(p,params){
 const docs=readDocs(p.id),documentIndex=Math.max(0,docs.findIndex(d=>d.id===params.get('doc'))),current=docs[documentIndex];
 const requestedPage=Number.parseInt(params.get('page')||'1',10);
 reader=current?{project:p,docs,documentIndex,index:Math.min(Math.max(Number.isFinite(requestedPage)?requestedPage-1:0,0),current.pages.length-1),mode:params.get('mode')==='all'?'all':'page'}:null;
 const origin=metadata[p.id]?.origin;
 return `<article class="page project-page">${back(catalogueRoute,'返回作品列表')}<header class="detail-heading"><div class="card-meta"><span>${e(p.tag)}</span><span>${e(p.type)}</span></div><h1 tabindex="-1">${e(p.title)}</h1>${p.fullTitle&&p.fullTitle!==p.title?`<p class="original-title">${e(p.fullTitle)}</p>`:''}</header><div class="reader-layout"><aside class="project-context"><p class="context-summary">${e(p.summary)}</p>${origin?`<section class="project-origin"><span class="page-label">这个问题的起点</span><p>${e(origin)}</p></section>`:''}${p.facts?`<dl class="context-facts">${p.facts.map(([n,l])=>`<div><dt>${e(n)}</dt><dd>${e(l)}</dd></div>`).join('')}</dl>`:''}<details class="context-details"><summary>摘要与思考 <span aria-hidden="true">＋</span></summary><div class="reading-content">${(p.sections||[]).map(s=>`<section><h2>${e(s.title)}</h2><p>${e(s.text)}</p></section>`).join('')}</div></details>${p.id==='human-ai-intimacy'?'<p class="exploration-note">这是一份课程中的探索，也留下了我希望在智能传播方向继续追问的人机关系问题。</p>':''}</aside><section class="document-reader" aria-label="作品全文阅读"><div class="document-tabs" aria-label="选择文稿">${docs.map((d,i)=>`<button type="button" data-document="${i}" aria-pressed="${i===documentIndex}">${e(d.title)}<span>${d.pages.length} 页</span></button>`).join('')}</div><div id="reader-body">${reader?readerBody():'<p>暂无正文。</p>'}</div></section></div></article>`;
}
const currentDoc=()=>reader?.docs[reader.documentIndex];
const pageCaption=(page,index,doc)=>page.caption||`${doc.title} · 第 ${index+1} 页`;
function readerImage(page,index,doc,lazy=false){return `<button type="button" class="reader-page" data-reader-image="${index}" aria-label="放大${e(pageCaption(page,index,doc))}"><img src="${e(page.src)}" alt="${e(pageCaption(page,index,doc))}" ${page.width&&page.height?`width="${page.width}" height="${page.height}"`:''} ${lazy?'loading="lazy"':'fetchpriority="high"'} decoding="async"></button>`;}
function readerBody(){
 const doc=currentDoc();if(!doc)return '';const n=doc.pages.length;
 return `<div class="reader-toolbar"><div class="reader-mode" aria-label="阅读方式"><button type="button" data-mode="page" aria-pressed="${reader.mode==='page'}">翻页阅读</button><button type="button" data-mode="all" aria-pressed="${reader.mode==='all'}">连续阅读</button></div><div class="reader-navigation"><button type="button" id="reader-prev" aria-label="上一页" ${reader.index===0?'disabled':''}>←</button><label class="reader-page-label"><select id="reader-page-select" aria-label="跳转到页码">${doc.pages.map((_,i)=>`<option value="${i}" ${i===reader.index?'selected':''}>${i+1}</option>`).join('')}</select><span>/ ${n}</span></label><button type="button" id="reader-next" aria-label="下一页" ${reader.index===n-1?'disabled':''}>→</button></div><button type="button" id="reader-enlarge" class="reader-enlarge" aria-label="放大当前页">放大 ⤢</button></div><p class="reader-document-note">${e(doc.note||'完整原文')}${doc.kind==='slides'?' · 可向右翻阅全部幻灯片':''}<span aria-live="polite">${reader.mode==='all'?'共 '+n+' 页':'第 '+(reader.index+1)+' 页，共 '+n+' 页'}</span></p><div class="reader-pages ${doc.kind==='slides'?'slides-document':''} ${reader.mode==='all'?'continuous-pages':''}" id="reader-pages">${reader.mode==='all'?doc.pages.map((p,i)=>`<figure id="document-page-${i}">${readerImage(p,i,doc,i>0)}<figcaption>${i+1} / ${n}</figcaption></figure>`).join(''):readerImage(doc.pages[reader.index],reader.index,doc)}</div><div class="reader-end"><span>${e(doc.title)} · 共 ${n} 页</span>${reader.mode==='page'?`<button type="button" id="reader-next-bottom" ${reader.index===n-1?'disabled':''}>下一页 →</button>`:''}</div>`;
}
function updateReaderURL(){if(!reader)return;const q=new URLSearchParams();if(reader.documentIndex)q.set('doc',currentDoc().id);if(reader.index)q.set('page',reader.index+1);if(reader.mode==='all')q.set('mode','all');history.replaceState(null,'',`#/project/${reader.project.id}${q.size?'?'+q:''}`);}
function syncPageControls(){if(!reader)return;document.getElementById('reader-page-select').value=String(reader.index);document.getElementById('reader-prev').disabled=reader.index===0;document.getElementById('reader-next').disabled=reader.index===currentDoc().pages.length-1;updateReaderURL();}
function observeReading(){
 readingObserver?.disconnect();readingObserver=null;
 if(!reader||reader.mode!=='all')return;
 readingObserver=new IntersectionObserver(()=>{if(!reader||reader.mode!=='all')return;const pages=[...document.querySelectorAll('.continuous-pages figure')].filter(p=>{const r=p.getBoundingClientRect();return r.bottom>170&&r.top<innerHeight*.65;}).sort((a,b)=>Math.abs(a.getBoundingClientRect().top-180)-Math.abs(b.getBoundingClientRect().top-180));if(pages.length){const index=Number(pages[0].id.replace('document-page-',''));if(index!==reader.index){reader.index=index;syncPageControls();}}},{rootMargin:'-170px 0px -35% 0px',threshold:0});
 document.querySelectorAll('.continuous-pages figure').forEach(p=>readingObserver.observe(p));
}
function refreshReader(){readingObserver?.disconnect();document.getElementById('reader-body').innerHTML=readerBody();document.querySelectorAll('[data-document]').forEach(b=>b.setAttribute('aria-pressed',Number(b.dataset.document)===reader.documentIndex?'true':'false'));updateReaderURL();if(reader.mode==='all'&&reader.index>0)document.getElementById('document-page-'+reader.index)?.scrollIntoView({block:'start',behavior:'instant'});observeReading();}
function selectPage(index){if(!reader)return;const focusId=document.activeElement?.id;reader.index=Math.min(Math.max(index,0),currentDoc().pages.length-1);updateReaderURL();if(reader.mode==='all'){syncPageControls();document.getElementById('document-page-'+reader.index)?.scrollIntoView({block:'start',behavior:'instant'});}else{refreshReader();document.querySelector('.document-reader')?.scrollIntoView({block:'start',behavior:'instant'});const target=document.getElementById(focusId);(target&&!target.disabled?target:document.getElementById('reader-page-select'))?.focus({preventScroll:true});}}
function videoPage(v,fromLife=false){return `<article class="page video-detail">${back(fromLife?'life/performances':catalogueRoute,fromLife?'返回演出与舞台':'返回作品列表')}<header class="detail-heading"><div class="card-meta"><span>${e(v.type)}</span></div><h1 tabindex="-1">${e(v.title)}</h1></header><div class="detail-layout"><div><div class="video-detail-still ${v.titleStill?'title-still':''}"><img src="${e(v.image)}" style="--still-top:${e(v.top||'0')}" alt="${e(v.title)}画面"></div>${v.id==='fifth-spring'?stagePhotos():''}</div><div class="reading-content"><section><h2>关于作品</h2><p>${e(v.summary)}</p></section><section><p>完整视频统一收录在「视频类作品」页的作品合集。</p></section>${link('academic/works?format=video','返回影像作品与合集 ↗')}</div></div></article>`;}
function render(){
 closeViewer();destroyTravel();readingObserver?.disconnect();reader=null;
 const [route,query='']=location.hash.replace(/^#\/?/,'').split('?');let path=route||'home';const params=new URLSearchParams(query);
 const aliases={downloads:'academic/works',aejmc:'project/aejmc',challenge:'project/challenge',works:'academic/works',research:'academic','research/courses':'academic/works'};
 if(path==='works'||params.get('kind')==='video')params.set('format','video');
 if(path==='research'&&(params.has('kind')||params.has('topic')))path='academic/works';
 path=Object.hasOwn(aliases,path)?aliases[path]:path;
 let nav=path.split('/')[0],html='';
 if(path==='home'){}else if(path==='academic')html=academicIntro();else if(path==='academic/works')html=researchPage(params);else if(path==='life')html=lifePage();else if(path==='life/performances')html=performancesPage();else if(path==='life/travel'||path.startsWith('life/travel/'))html=renderTravel(path,params);else if(path==='contact')html=contactPage();else if(path.startsWith('project/')){const id=path.slice(8),p=Object.hasOwn(projects,id)?projects[id]:null,v=videos.find(x=>x.id===id);if(p){html=projectPage(p,params);nav='academic';}else if(v){const fromLife=params.get('from')==='life';html=videoPage(v,fromLife);nav=fromLife?'life':'academic';}else html='<section class="page">'+back('academic/works?format=text','返回作品列表')+heading('暂未找到这个作品')+'</section>';}else{path='home';nav='home';}
 home.hidden=path!=='home';view.hidden=path==='home';view.innerHTML=html;document.body.dataset.view=nav;
 document.querySelectorAll('[data-nav]').forEach(a=>{if(a.dataset.nav===nav)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
 window.scrollTo({top:0,behavior:'instant'});const h=view.querySelector('h1');if(h)h.focus({preventScroll:true});document.title=path==='home'?'张渝琳 · 我的小世界':(path==='academic'?'学业探索':h?.textContent||'作品')+' · 张渝琳';
 if(reader){if(reader.mode==='all'&&reader.index>0)document.getElementById('document-page-'+reader.index)?.scrollIntoView({block:'start',behavior:'instant'});observeReading();}
 if(path==='life/travel'||path.startsWith('life/travel/'))mountTravel({openViewer});
}
function openViewer(images,index,title,options={}){savedFocus=document.activeElement;viewerGallery=images;viewerIndex=index;viewerHeading=title;viewerLocationOnly=options.locationOnly===true||images[index]?.locationOnly===true;viewerScroll.classList.remove('is-zoomed');document.getElementById('viewer-zoom').textContent='放大 ＋';document.getElementById('viewer-zoom').setAttribute('aria-label','放大图片');updateViewer();viewer.showModal();document.body.classList.add('viewer-open');document.getElementById('viewer-close').focus();}
function updateViewer(){const image=viewerGallery[viewerIndex];if(!image)return;viewerImage.src=image.src;viewerImage.alt=image.caption||`${viewerHeading} · 第 ${viewerIndex+1} 页`;document.getElementById('viewer-title').textContent=viewerHeading;document.getElementById('viewer-caption').textContent=`${image.caption||viewerHeading}${!viewerLocationOnly&&viewerGallery.length>1?' · '+(viewerIndex+1)+' / '+viewerGallery.length:''}`;document.getElementById('viewer-prev').hidden=viewerGallery.length===1;document.getElementById('viewer-next').hidden=viewerGallery.length===1;document.getElementById('viewer-prev').disabled=viewerIndex===0;document.getElementById('viewer-next').disabled=viewerIndex===viewerGallery.length-1;viewerScroll.scrollTo(0,0);}
function closeViewer(){if(viewer.open)viewer.close();document.body.classList.remove('viewer-open');}
view.addEventListener('click',event=>{const t=event.target.closest('button');if(!t)return;if(t.dataset.poster){const p=projects[t.dataset.poster];openViewer(p.gallery,0,p.title);}else if(t.hasAttribute('data-document')&&reader){reader.documentIndex=Number(t.dataset.document);reader.index=0;refreshReader();document.querySelector(`[data-document="${reader.documentIndex}"]`)?.focus({preventScroll:true});}else if(t.hasAttribute('data-mode')&&reader){reader.mode=t.dataset.mode;refreshReader();document.querySelector(`[data-mode="${reader.mode}"]`)?.focus({preventScroll:true});}else if((t.id==='reader-next'||t.id==='reader-next-bottom')&&reader)selectPage(reader.index+1);else if(t.id==='reader-prev'&&reader)selectPage(reader.index-1);else if(t.hasAttribute('data-reader-image')&&reader)openViewer(currentDoc().pages,Number(t.dataset.readerImage),currentDoc().title);else if(t.id==='reader-enlarge'&&reader)openViewer(currentDoc().pages,reader.index,currentDoc().title);});
view.addEventListener('change',event=>{if(event.target.id==='reader-page-select')selectPage(Number(event.target.value));});
document.getElementById('viewer-close').addEventListener('click',closeViewer);
viewer.addEventListener('close',()=>{document.body.classList.remove('viewer-open');if(savedFocus?.isConnected)savedFocus.focus({preventScroll:true});});
document.getElementById('viewer-prev').addEventListener('click',()=>{viewerIndex=Math.max(0,viewerIndex-1);updateViewer();});
document.getElementById('viewer-next').addEventListener('click',()=>{viewerIndex=Math.min(viewerGallery.length-1,viewerIndex+1);updateViewer();});
document.getElementById('viewer-zoom').addEventListener('click',()=>{const zoom=viewerScroll.classList.toggle('is-zoomed');document.getElementById('viewer-zoom').textContent=zoom?'适合屏幕 −':'放大 ＋';document.getElementById('viewer-zoom').setAttribute('aria-label',zoom?'图片适合屏幕':'放大图片');if(zoom)viewerScroll.focus({preventScroll:true});});
document.addEventListener('keydown',event=>{if(!viewer.open||(viewerScroll.classList.contains('is-zoomed')&&document.activeElement===viewerScroll))return;if(event.key==='ArrowRight'){event.preventDefault();viewerIndex=Math.min(viewerGallery.length-1,viewerIndex+1);updateViewer();}if(event.key==='ArrowLeft'){event.preventDefault();viewerIndex=Math.max(0,viewerIndex-1);updateViewer();}});
window.addEventListener('hashchange',render);render();
