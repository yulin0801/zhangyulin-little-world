import {audioWorks,audioWorkCard,audioWorkPage} from './audio-works.js?v=30.0';
import {certificateGroups} from './certificates.js?v=30.0';
import {projects,videos} from './projects.js?v=24.0';
import {readers} from './readers.js?v=22.1';
import {metadata,topics,kinds,order} from './catalogue.js?v=22.1';
import './motion.js?v=36.0';
import './navigation.js?v=16.0';
import {setIslandHomeActive} from './island-home.js?v=37.0';
import {academicIntro,awardsPage,worksPage,worksRoute,lifeOverview,performancesPage,livePhotos} from './academic.js?v=37.0';
import {mountPaperLibrary,paperEntry} from './works-library.js?v=37.0';
import {renderTravel,mountTravel,destroyTravel} from './travel.js?v=29.0';
import {travelData} from './travel-data.js?v=29.0';
import {internshipPage,internshipWorkPage,mountInternship,destroyInternship} from './internship.js?v=30.0';
import {educationPage,skillsPage,contactPage,mountProfile,destroyProfile} from './profile.js?v=35.0';
import {mountEducationJourney,destroyEducationJourney} from './education-journey.js?v=30.0';
import {mountHonors,destroyHonors} from './honors-motion.js?v=30.0';

const home=document.getElementById('home'),view=document.getElementById('page-view'),viewer=document.getElementById('image-viewer');
const viewerImage=document.getElementById('viewer-image'),viewerScroll=viewer.querySelector('.viewer-scroll');
const paperDialog=document.getElementById('paper-reader-dialog');
const paperBody=document.getElementById('paper-dialog-body');
const paperScroll=document.getElementById('paper-dialog-scroll');
const e=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let catalogueRoute='academic/works?format=text',reader=null,viewerGallery=[],viewerIndex=0,viewerHeading='',savedFocus=null,readingObserver=null,viewerLocationOnly=false;
let unmountLibrary=null,paperOpener=null;
try{const saved=sessionStorage.getItem('yulin-catalogue-route');if(saved&&/^academic\/works(?:\?[^#]*)?$/.test(saved))catalogueRoute=saved;}catch{}
const link=(route,label,cls='text-link')=>`<a class="${cls}" href="#/${e(route)}">${label}</a>`;
const back=(route,label)=>link(route,`← ${e(label)}`,'back-link');
const heading=title=>`<div class="page-heading"><h1 tabindex="-1">${e(title)}</h1></div>`;
const allProjects=()=>order.map(id=>projects[id]||videos.find(v=>v.id===id)).filter(Boolean);
const readDocs=id=>readers[id]?.documents||[];
const kindLabel=id=>kinds.find(k=>k[0]===metadata[id]?.kind)?.[1]||'作品';

function projectCard(p){
 if(audioWorks.some(work=>work.id===p.id))return audioWorkCard(p);
 const film=metadata[p.id]?.kind==='video';
 const preview=p.image||p.previewImage||readDocs(p.id)[0]?.pages[0]?.src;
 const documentPreview=!p.image;
 const title=`<h2${p.language?` lang="${e(p.language)}"`:''}>${e(p.title)}</h2>`;
 const art=`<img src="${e(preview)}" ${film?`style="--still-top:${e(p.top||'0')}"`:''} alt="${e(p.title)}${documentPreview?'原稿预览':'作品预览'}" loading="lazy" decoding="async">`;
 const cls=film?`video-still ${p.titleStill?'video-title-still':''}`:documentPreview?`document-preview tone-${e(p.tone||'sage')}`:'';
 const picture=p.id==='aejmc'?`<button class="card-image poster-card" data-poster="aejmc" type="button" aria-label="放大 AEJMC 研究海报">${art}<span class="image-hint" aria-hidden="true">⤢</span></button>`:`<a class="card-image ${cls}" href="#/project/${e(p.id)}" aria-label="阅读${e(p.title)}">${art}</a>`;
 return `<article class="work-card ${film?'video-card':''}">${picture}<div class="card-caption"><span class="card-kind">${e(p.type||'论文')}</span><a href="#/project/${e(p.id)}">${title}<span class="work-open" aria-hidden="true">↗</span></a></div></article>`;
}
function researchPage(params){
 const format=['video','audio'].includes(params.get('format'))?params.get('format'):'text';
 const topic=topics.some(t=>t[0]===params.get('topic'))?params.get('topic'):'all';
 catalogueRoute=worksRoute(format,topic,(params.get('q')||'').slice(0,120));
 try{sessionStorage.setItem('yulin-catalogue-route',catalogueRoute);}catch{}
 return worksPage(params,projectCard);
}
function stagePhotos(){return `<div class="stage-photos"><div class="stage-panel"><img src="assets/stage-moments.jpg" alt="第五次春天舞台谢幕，伙伴们牵手举起双臂" loading="lazy"></div><div class="stage-panel"><img src="assets/stage-moments.jpg" alt="第五次春天舞台上，伙伴们一起鞠躬谢幕" loading="lazy"></div></div><p class="stage-label">《第五次春天》· 舞台谢幕</p>`;}
function lifePage(){return lifeOverview();}
function createProjectReader(p,params,isDialog=false){
 const docs=readDocs(p.id),documentIndex=Math.max(0,docs.findIndex(d=>d.id===params.get('doc'))),current=docs[documentIndex];
 const requestedPage=Number.parseInt(params.get('page')||'1',10);
 const fromAwards=params.get('from')==='awards';
 reader=current?{project:p,docs,documentIndex,fromAwards,isDialog,index:Math.min(Math.max(Number.isFinite(requestedPage)?requestedPage-1:0,0),current.pages.length-1),mode:params.get('mode')==='all'?'all':'page'}:null;
}
function projectContent(p,isDialog=false){
 const titleTag=isDialog?'h2':'h1';
 return `<header class="detail-heading">
   <span class="card-kind">${e(p.type||'论文')}</span>
   <${titleTag} tabindex="-1"${isDialog?' id="paper-dialog-title"':''}${p.language?` lang="${e(p.language)}"`:''}>${e(p.title)}</${titleTag}>
 </header><div class="reader-layout"><section class="document-reader" aria-label="作品全文阅读">
   <div class="document-tabs" aria-label="选择文稿">${(reader?.docs||[]).map((doc,index)=>`<button type="button" data-document="${index}" aria-pressed="${index===reader.documentIndex}">${e(doc.title)}<span>${doc.pages.length} 页</span></button>`).join('')}</div>
   <div id="reader-body">${reader?readerBody():'<p>暂无正文。</p>'}</div>
 </section></div>`;
}
function projectPage(p,params){
 createProjectReader(p,params);
 const fromAwards=params.get('from')==='awards';
 return `<article class="page project-page">${back(fromAwards?'academic/awards':catalogueRoute,fromAwards?'返回荣誉':'返回作品列表')}${projectContent(p)}</article>`;
}
function openPaperDialog(p,opener){
 paperOpener=opener;
 createProjectReader(p,new URLSearchParams(),true);
 paperBody.innerHTML=projectContent(p,true);
 document.getElementById('paper-reader-direct').href=`#/project/${encodeURIComponent(p.id)}`;
 paperScroll.scrollTop=0;
 paperDialog.showModal();
 document.body.classList.add('paper-dialog-open');
}
function closePaperDialog(){
 if(paperDialog.open)paperDialog.close();
}
paperDialog.addEventListener('close',()=>{
 if(paperDialog.open)return;
 if(reader?.isDialog){
  readingObserver?.disconnect();
  readingObserver=null;
  reader=null;
 }
 paperBody.replaceChildren();
 document.body.classList.remove('paper-dialog-open');
 if(paperOpener?.isConnected)paperOpener.focus({preventScroll:true});
 paperOpener=null;
});
paperDialog.addEventListener('click',event=>{
 if(event.target===paperDialog)closePaperDialog();
});
document.getElementById('paper-reader-close').addEventListener('click',closePaperDialog);
document.getElementById('paper-reader-direct').addEventListener('click',event=>{
 if(!event.ctrlKey&&!event.metaKey&&!event.shiftKey&&!event.altKey)closePaperDialog();
});
const readerRoot=()=>reader?.isDialog?paperBody:view;
function jumpToReader(){
 readerRoot().querySelector('.document-reader')?.scrollIntoView({block:'start',behavior:'instant'});
}
const currentDoc=()=>reader?.docs[reader.documentIndex];
const pageCaption=(page,index,doc)=>page.caption||`${doc.title} · 第 ${index+1} 页`;
function readerImage(page,index,doc,lazy=false){return `<button type="button" class="reader-page" data-reader-image="${index}" aria-label="放大${e(pageCaption(page,index,doc))}"><img src="${e(page.src)}" alt="${e(pageCaption(page,index,doc))}" ${page.width&&page.height?`width="${page.width}" height="${page.height}"`:''} ${lazy?'loading="lazy"':'fetchpriority="high"'} decoding="async"></button>`;}
function readerBody(){
 const doc=currentDoc();if(!doc)return '';const n=doc.pages.length;
 return `<div class="reader-toolbar"><div class="reader-mode" aria-label="阅读方式"><button type="button" data-mode="page" aria-pressed="${reader.mode==='page'}">翻页阅读</button><button type="button" data-mode="all" aria-pressed="${reader.mode==='all'}">连续阅读</button></div><div class="reader-navigation"><button type="button" id="reader-prev" aria-label="上一页" ${reader.index===0?'disabled':''}>←</button><label class="reader-page-label"><select id="reader-page-select" aria-label="跳转到页码">${doc.pages.map((_,i)=>`<option value="${i}" ${i===reader.index?'selected':''}>${i+1}</option>`).join('')}</select><span>/ ${n}</span></label><button type="button" id="reader-next" aria-label="下一页" ${reader.index===n-1?'disabled':''}>→</button></div><button type="button" id="reader-enlarge" class="reader-enlarge" aria-label="放大当前页">放大 ⤢</button></div><p class="reader-document-note">${e(doc.note||'完整原文')}${doc.kind==='slides'?' · 可向右翻阅全部幻灯片':''}<span aria-live="polite">${reader.mode==='all'?'共 '+n+' 页':'第 '+(reader.index+1)+' 页，共 '+n+' 页'}</span></p><div class="reader-pages ${doc.kind==='slides'?'slides-document':''} ${reader.mode==='all'?'continuous-pages':''}" id="reader-pages">${reader.mode==='all'?doc.pages.map((p,i)=>`<figure id="document-page-${i}">${readerImage(p,i,doc,i>0)}<figcaption>${i+1} / ${n}</figcaption></figure>`).join(''):readerImage(doc.pages[reader.index],reader.index,doc)}</div><div class="reader-end"><span>${e(doc.title)} · 共 ${n} 页</span>${reader.mode==='page'?`<button type="button" id="reader-next-bottom" ${reader.index===n-1?'disabled':''}>下一页 →</button>`:''}</div>`;
}
function updateReaderURL(){if(!reader||reader.isDialog)return;const q=new URLSearchParams();if(reader.fromAwards)q.set('from','awards');if(reader.documentIndex)q.set('doc',currentDoc().id);if(reader.index)q.set('page',reader.index+1);if(reader.mode==='all')q.set('mode','all');history.replaceState(null,'',`#/project/${reader.project.id}${q.size?'?'+q:''}`);}
function syncPageControls(){
 if(!reader)return;
 const root=readerRoot();
 root.querySelector('#reader-page-select').value=String(reader.index);
 root.querySelector('#reader-prev').disabled=reader.index===0;
 root.querySelector('#reader-next').disabled=reader.index===currentDoc().pages.length-1;
 updateReaderURL();
}
function observeReading(){
 readingObserver?.disconnect();readingObserver=null;
 if(!reader||reader.mode!=='all')return;
 const pages=[...readerRoot().querySelectorAll('.continuous-pages figure')];
 const scrollRoot=reader.isDialog?paperScroll:null;
 readingObserver=new IntersectionObserver(()=>{
  if(!reader||reader.mode!=='all')return;
  const viewport=scrollRoot?.getBoundingClientRect();
  const anchor=(viewport?.top||0)+(scrollRoot?75:170);
  const bottom=(viewport?.top||0)+(viewport?.height||innerHeight)*.65;
  const visible=pages.filter(page=>{const rect=page.getBoundingClientRect();return rect.bottom>anchor&&rect.top<bottom;});
  visible.sort((a,b)=>Math.abs(a.getBoundingClientRect().top-anchor)-Math.abs(b.getBoundingClientRect().top-anchor));
  if(!visible.length)return;
  const index=pages.indexOf(visible[0]);
  if(index!==reader.index){reader.index=index;syncPageControls();}
 },{root:scrollRoot,rootMargin:`${scrollRoot?'-75px':'-170px'} 0px -35% 0px`,threshold:0});
 pages.forEach(page=>readingObserver.observe(page));
}
function scrollReaderPage(){
 readerRoot().querySelector('#document-page-'+reader.index)?.scrollIntoView({block:'start',behavior:'instant'});
}
function refreshReader(){
 readingObserver?.disconnect();
 const root=readerRoot();
 root.querySelector('#reader-body').innerHTML=readerBody();
 root.querySelectorAll('[data-document]').forEach(button=>button.setAttribute('aria-pressed',String(Number(button.dataset.document)===reader.documentIndex)));
 updateReaderURL();
 if(reader.mode==='all'&&reader.index>0)scrollReaderPage();
 observeReading();
}
function selectPage(index){
 if(!reader)return;
 const focusId=document.activeElement?.id;
 reader.index=Math.min(Math.max(index,0),currentDoc().pages.length-1);
 if(reader.mode==='all'){
  syncPageControls();
  scrollReaderPage();
 }else{
  refreshReader();
  jumpToReader();
  const root=readerRoot();
  const target=focusId?root.querySelector('#'+CSS.escape(focusId)):null;
  (target&&!target.disabled?target:root.querySelector('#reader-page-select'))?.focus({preventScroll:true});
 }
}
function videoPage(v,fromLife=false){return `<article class="page video-detail">${back(fromLife?'life/performances':catalogueRoute,fromLife?'返回观影记录':'返回作品列表')}<header class="detail-heading"><span class="card-kind">${e(v.type)}</span><h1 tabindex="-1">${e(v.title)}</h1></header><div class="video-detail-media"><div class="video-detail-still ${v.titleStill?'title-still':''}"><img src="${e(v.image)}" style="--still-top:${e(v.top||'0')}" alt="${e(v.title)}画面"></div>${v.id==='fifth-spring'?stagePhotos():''}</div></article>`;}
function render(){
 closeViewer();closePaperDialog();unmountLibrary?.();unmountLibrary=null;
 destroyTravel();destroyInternship();destroyProfile();destroyEducationJourney();destroyHonors();readingObserver?.disconnect();reader=null;
 const [route,query='']=location.hash.replace(/^#\/?/,'').split('?');let path=route||'home';const params=new URLSearchParams(query);
 const aliases={downloads:'academic/works',aejmc:'project/aejmc',challenge:'project/challenge',works:'academic/works',research:'academic','research/courses':'academic/works'};
 if(path==='works'||params.get('kind')==='video')params.set('format','video');
 if(path==='research'&&(params.has('kind')||params.has('topic')))path='academic/works';
 path=Object.hasOwn(aliases,path)?aliases[path]:path;
 let nav=path.split('/')[0],html='';
 if(path==='home'){}else if(path==='academic')html=academicIntro();else if(path==='academic/works')html=researchPage(params);else if(path==='academic/awards')html=awardsPage();else if(path==='life')html=lifePage();else if(path==='life/performances')html=performancesPage();else if(path==='life/travel'||path.startsWith('life/travel/'))html=renderTravel(path,params);else if(path==='internships')html=internshipPage();else if(path.startsWith('internships/work/'))html=internshipWorkPage(path.slice('internships/work/'.length));else if(path==='education')html=educationPage();else if(path==='skills')html=skillsPage();else if(path==='contact')html=contactPage();else if(path.startsWith('project/')){const id=path.slice(8),p=Object.hasOwn(projects,id)?projects[id]:null,v=videos.find(x=>x.id===id),a=audioWorks.find(x=>x.id===id);if(a){html=audioWorkPage(a,params.get('from')==='awards');nav='academic';}else if(p){html=projectPage(p,params);nav='academic';}else if(v){const fromLife=params.get('from')==='life';html=videoPage(v,fromLife);nav=fromLife?'life':'academic';}else html='<section class="page">'+back('academic/works?format=text','返回作品列表')+heading('暂未找到这个作品')+'</section>';}else{path='home';nav='home';}
 home.hidden=path!=='home';view.hidden=path==='home';view.innerHTML=html;document.body.dataset.view=nav;
 setIslandHomeActive(path==='home');
 document.querySelectorAll('[data-nav]').forEach(a=>{if(a.dataset.nav===nav)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
 window.scrollTo({top:0,behavior:'instant'});const h=view.querySelector('h1');if(h)h.focus({preventScroll:true});document.title=path==='home'?'张渝琳 · 我的小世界':(path==='academic'?'学业探索':h?.textContent||'作品')+' · 张渝琳';
 if(reader){if(reader.mode==='all'&&reader.index>0)document.getElementById('document-page-'+reader.index)?.scrollIntoView({block:'start',behavior:'instant'});observeReading();}
 if(path==='life/travel'||path.startsWith('life/travel/'))mountTravel({openViewer});
 if(nav==='internships')mountInternship({openViewer});
 if(['education','skills','contact'].includes(nav))mountProfile();
 if(path==='education')mountEducationJourney();
 if(path==='academic/awards')mountHonors();
 if(view.querySelector('.paper-library')){
  const initialTopic=topics.some(([id])=>id===params.get('topic'))?params.get('topic'):'all';
  const entries=order.filter(id=>projects[id]).map(id=>paperEntry(projects[id],metadata[id],topics.find(([topic])=>topic===metadata[id]?.topic)?.[1]||'',readDocs(id)));
  unmountLibrary=mountPaperLibrary(view.querySelector('.paper-library'),entries,initialTopic,(topic,query)=>{
   catalogueRoute=worksRoute('text',topic,query);
   if(location.hash!=='#/'+catalogueRoute)history.replaceState(null,'','#/'+catalogueRoute);
   try{sessionStorage.setItem('yulin-catalogue-route',catalogueRoute);}catch{}
  });
 }
}
function openViewer(images,index,title,options={}){savedFocus=document.activeElement;viewerGallery=images;viewerIndex=index;viewerHeading=title;viewerLocationOnly=options.locationOnly===true||images[index]?.locationOnly===true;viewerScroll.classList.remove('is-zoomed');document.getElementById('viewer-zoom').textContent='放大 ＋';document.getElementById('viewer-zoom').setAttribute('aria-label','放大图片');updateViewer();viewer.showModal();document.body.classList.add('viewer-open');document.getElementById('viewer-close').focus();}
function updateViewer(){const image=viewerGallery[viewerIndex];if(!image)return;viewerImage.src=image.src;viewerImage.alt=image.caption||`${viewerHeading} · 第 ${viewerIndex+1} 页`;document.getElementById('viewer-title').textContent=viewerHeading;document.getElementById('viewer-caption').textContent=`${image.caption||viewerHeading}${!viewerLocationOnly&&viewerGallery.length>1?' · '+(viewerIndex+1)+' / '+viewerGallery.length:''}`;document.getElementById('viewer-prev').hidden=viewerGallery.length===1;document.getElementById('viewer-next').hidden=viewerGallery.length===1;document.getElementById('viewer-prev').disabled=viewerIndex===0;document.getElementById('viewer-next').disabled=viewerIndex===viewerGallery.length-1;viewerScroll.scrollTo(0,0);}
function closeViewer(){if(viewer.open)viewer.close();document.body.classList.remove('viewer-open');}
view.addEventListener('click',event=>{const t=event.target.closest('button');if(!t)return;if(t.dataset.certificateGroup){const group=certificateGroups[t.dataset.certificateGroup],index=Number(t.dataset.certificateIndex);if(group&&Number.isInteger(index)&&group[index])openViewer(group,index,t.dataset.certificateGroup==='educationRank'?'成绩排名':t.dataset.certificateGroup==='educationTranscript'?'成绩单':t.dataset.certificateGroup==='english'?'英语成绩证明':t.dataset.certificateGroup==='project'?'项目证明':t.dataset.certificateGroup==='volunteer'?'志愿服务证明':t.dataset.certificateGroup==='educationMcu'?'研习證書':t.dataset.certificateGroup==='oceanSelection'?'海洋杯入选材料':t.dataset.certificateGroup.startsWith('internship')?'实习鉴定':'荣誉');}else if(t.hasAttribute('data-live-photo')){const index=Number(t.dataset.livePhoto);if(Number.isInteger(index)&&livePhotos[index])openViewer(livePhotos,index,'观影记录');}else if(t.dataset.poster){const p=projects[t.dataset.poster];openViewer(p.gallery,0,p.title);}else handleReaderClick(t);});
view.addEventListener('click',event=>{
 const link=event.target.closest('a[data-paper-id]');
 if(event.defaultPrevented||!link||event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
 const id=link.dataset.paperId;
 if(!Object.hasOwn(projects,id))return;
 event.preventDefault();
 openPaperDialog(projects[id],link);
});
paperBody.addEventListener('click',event=>{
 const button=event.target.closest('button');
 if(!reader?.isDialog||!button)return;
 handleReaderClick(button);
});
function handleReaderClick(button){
 if(!reader)return;
 if(button.hasAttribute('data-document')){
  reader.documentIndex=Number(button.dataset.document);
  reader.index=0;
  refreshReader();
  readerRoot().querySelector(`[data-document="${reader.documentIndex}"]`)?.focus({preventScroll:true});
 }else if(button.hasAttribute('data-mode')){
  reader.mode=button.dataset.mode;
  refreshReader();
  readerRoot().querySelector(`[data-mode="${reader.mode}"]`)?.focus({preventScroll:true});
 }else if(button.id==='reader-next'||button.id==='reader-next-bottom')selectPage(reader.index+1);
 else if(button.id==='reader-prev')selectPage(reader.index-1);
 else if(button.hasAttribute('data-reader-image'))openViewer(currentDoc().pages,Number(button.dataset.readerImage),currentDoc().title);
 else if(button.id==='reader-enlarge')openViewer(currentDoc().pages,reader.index,currentDoc().title);
}
for(const root of [view,paperBody]){
 root.addEventListener('change',event=>{
  if(event.target.id==='reader-page-select')selectPage(Number(event.target.value));
 });
}
document.getElementById('viewer-close').addEventListener('click',closeViewer);
viewer.addEventListener('close',()=>{document.body.classList.remove('viewer-open');if(savedFocus?.isConnected)savedFocus.focus({preventScroll:true});});
document.getElementById('viewer-prev').addEventListener('click',()=>{viewerIndex=Math.max(0,viewerIndex-1);updateViewer();});
document.getElementById('viewer-next').addEventListener('click',()=>{viewerIndex=Math.min(viewerGallery.length-1,viewerIndex+1);updateViewer();});
document.getElementById('viewer-zoom').addEventListener('click',()=>{const zoom=viewerScroll.classList.toggle('is-zoomed');document.getElementById('viewer-zoom').textContent=zoom?'适合屏幕 −':'放大 ＋';document.getElementById('viewer-zoom').setAttribute('aria-label',zoom?'图片适合屏幕':'放大图片');if(zoom)viewerScroll.focus({preventScroll:true});});
document.addEventListener('keydown',event=>{if(!viewer.open||(viewerScroll.classList.contains('is-zoomed')&&document.activeElement===viewerScroll))return;if(event.key==='ArrowRight'){event.preventDefault();viewerIndex=Math.min(viewerGallery.length-1,viewerIndex+1);updateViewer();}if(event.key==='ArrowLeft'){event.preventDefault();viewerIndex=Math.max(0,viewerIndex-1);updateViewer();}});
window.addEventListener('hashchange',render);render();
