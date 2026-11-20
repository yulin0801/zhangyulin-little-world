import {internshipWorks} from './internship-data.js?v=7.0';
import {practiceEvidenceGroups} from './practice-evidence.js?v=30.0';

const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const works=Array.isArray(internshipWorks)?internshipWorks:[];
const workRoute=id=>'#/internships/work/'+encodeURIComponent(id);
let cleanup=null;
const stages=[
  {id:'internship-chongqing',key:'chongqing',name:'重庆广播电视台',period:'2025.07 — 09',year:'2025',number:'01'},
  {id:'internship-chinadaily',key:'china-daily',name:'中国日报',period:'2025.10 — 2026.03',year:'2025–26',number:'02'},
  {id:'internship-bugong',key:'bugong',name:'不恭文化',period:'2026.10 — 至今',year:'2026',number:'03'}
];
function journeyNav(){return `<nav class="internship-local-nav career-track" aria-label="实习时间线"><div class="career-track-caption"><span>我的实践轨迹</span><span data-career-count>01 / 03</span></div><div class="career-stops">${stages.map((stage,index)=>`<button type="button" data-internship-jump="${stage.id}" ${index===0?'aria-current="step"':''}><span class="career-stop-dot" aria-hidden="true">${stage.number}</span><span class="career-stop-copy"><small>${stage.period}</small><strong>${stage.name}</strong></span><img src="assets/internships/${stage.key}-logo.webp" alt="" width="48" height="48"></button>`).join('')}</div><div class="career-track-progress" aria-hidden="true"><span></span></div></nav>`;}


function manuscriptBody(work){
  const paragraphs=Array.isArray(work.paragraphs)?work.paragraphs:[];
  const images=Array.isArray(work.images)?work.images:[];
  const imageAt=count=>images.map((image,index)=>{
    const position=Math.max(0,Math.min(paragraphs.length,Number(image.afterParagraph)||0));
    if(position!==count)return '';
    const width=Number(image.width),height=Number(image.height);
    return `<figure class="internship-work-figure"><button type="button" data-internship-image="${index}" aria-label="放大查看：${esc(image.alt||image.caption||'原稿附图')}"><img src="${esc(image.src)}" alt="${esc(image.alt||'原稿附图')}" ${width>0&&height>0?`width="${width}" height="${height}"`:''} loading="lazy" decoding="async"><span>查看大图 <span aria-hidden="true">↗</span></span></button>${image.caption?`<figcaption>${esc(image.caption)}</figcaption>`:''}</figure>`;
  }).join('');
  return imageAt(0)+paragraphs.map((text,index)=>`<p>${esc(text)}</p>${imageAt(index+1)}`).join('');
}

function metrics(items){return `<dl class="internship-metrics">${items.map(([value,label])=>`<div><dt>${esc(value)}</dt><dd>${esc(label)}</dd></div>`).join('')}</dl>`;}
function paperDesk(){
  return `<aside class="internship-evidence internship-desk" aria-label="重庆广播电视台我的稿件"><div class="manuscript-desk-heading"><div><span class="page-label">MY SCRIPTS</span><h3>我的稿件</h3></div><div class="manuscript-desk-controls"><button type="button" data-paper-reset hidden>取消固定</button><button type="button" data-paper-scroll="-1" aria-label="向左浏览稿件">←</button><button type="button" data-paper-scroll="1" aria-label="向右浏览稿件">→</button></div></div><p class="manuscript-desk-hint">悬停展开 · 点击固定阅读 · 左右滑动浏览</p><div class="manuscript-rail" aria-label="我的五篇实习稿件">${works.map((work,index)=>`<article class="manuscript-card" data-paper="${esc(work.id)}"><button class="manuscript-card-title" type="button" aria-expanded="false" aria-controls="preview-${esc(work.id)}" aria-label="展开并固定：${esc(work.title)}"><span class="manuscript-number">${String(index+1).padStart(2,'0')}</span><span class="manuscript-category">${esc(work.category||'实习稿件')}</span><h4><span class="manuscript-short-title">${esc(work.title.split("：").pop())}</span><span class="manuscript-full-title">${esc(work.title)}</span></h4><span class="manuscript-card-mark" aria-hidden="true">＋</span></button><div class="manuscript-card-content" id="preview-${esc(work.id)}" hidden><div class="manuscript-excerpt" tabindex="0" role="region" aria-label="${esc(work.title)}原文">${(work.paragraphs||[]).map(text=>`<p>${esc(text)}</p>`).join('')}</div><div class="manuscript-card-bottom"><a href="${workRoute(work.id)}">打开原稿 ↗</a><span class="manuscript-pin-state"></span></div></div></article>`).join('')}</div><span class="manuscript-status sr-only" role="status" aria-live="polite"></span></aside>`;
}
function internshipProof(group,label){
  const item=practiceEvidenceGroups[group]?.[0];
  if(!item)return '';
  return `<button type="button" class="internship-proof" data-certificate-group="${esc(group)}" data-certificate-index="0" aria-label="查看${esc(item.title)}"><span class="internship-proof-thumbnail"><img src="${esc(item.src)}" alt="${esc(item.title)}" loading="lazy" decoding="async"></span><span class="internship-proof-copy"><strong>${esc(label)}</strong><span>查看盖章材料 <span aria-hidden="true">↗</span></span></span></button>`;
}
function campusPractice(){
  const records=[
    {index:0,title:'蓝信封志愿服务',period:'2023.12.15 — 2026.11.13',description:'通信大使，与乡村儿童一对一书信陪伴。',detail:'36 小时',label:'查看志愿证书'},
    {index:1,title:'旷野音乐节志愿服务',period:'2024.09.07 — 09.08',description:'北京音乐产业园。',detail:'24 小时',label:'查看志愿证书'},
    {index:2,title:'校园志愿服务',period:'2023 — 2025',description:'新闻学院志愿活动、口述历史展馆讲解及文字整理、招生宣讲。',detail:'',label:'查看完整记录'},
  ];
  return `<section class="campus-practice" aria-labelledby="campus-practice-title"><header class="campus-practice-heading"><h2 id="campus-practice-title">校园与志愿</h2><span>CAMPUS & VOLUNTEERING</span></header><div class="campus-leadership"><span class="campus-period">2023.09 — 2026.09</span><h3>新闻学院团委</h3><p>活动部部长</p></div><div class="campus-practice-records campus-proof-records">${records.map(record=>{const item=practiceEvidenceGroups.volunteer[record.index];return `<article class="campus-proof-record"><div class="campus-proof-copy"><span class="campus-period">${esc(record.period)}</span><h3>${esc(record.title)}</h3><p>${esc(record.description)}</p>${record.detail?`<span class="campus-proof-hours">${esc(record.detail)}</span>`:''}</div><button type="button" class="campus-proof-button${record.index===2?' campus-proof-long':''}" data-certificate-group="volunteer" data-certificate-index="${record.index}" aria-label="${esc(record.label)}：${esc(item.title)}"><span class="campus-proof-thumbnail"><img src="${esc(item.src)}" alt="${esc(item.title)}" loading="lazy" decoding="async"></span><span class="campus-proof-open">${esc(record.label)} <span aria-hidden="true">↗</span></span></button></article>`;}).join('')}</div></section>`;
}
function companyVisual(key,name,subtitle,date,footer='',current=false){
  const stage=stages.find(item=>item.key===key);
  const proof=key==='chongqing'?internshipProof('internshipChongqing','实习考核表'):key==='china-daily'?internshipProof('internshipChinaDaily','实习鉴定表'):'';
  return `<aside class="internship-evidence internship-brand internship-brand-${key}"><div class="career-year${stage.year.length>4?' career-year-range':''}">${stage.year}</div><div class="internship-date">${esc(date)}${current?'<span class="internship-current-badge">进行中</span>':''}</div><div class="internship-brand-image"><img src="assets/internships/${key}-logo.webp" alt="${esc(name)}标志" loading="eager" decoding="async"></div><div class="internship-brand-caption"><span>${esc(name)}</span><small>${esc(subtitle)}</small></div>${footer}${proof}</aside>`;
}
function filmVisual(){return companyVisual('china-daily','中国日报','CHINA DAILY','2025.10.14 — 2026.03.09',`<a class="internship-film-link" href="https://weixin.qq.com/sph/AYeXgaeRly" target="_blank" rel="noopener noreferrer">观看《小关没有超人》 <span aria-hidden="true">↗</span></a><div class="internship-craft-tags"><span>英文网站选稿</span><span>视频翻译审查</span><span>推广文案</span><span>微电影拍摄</span></div>`);}
function currentNotes(){return companyVisual('bugong','不恭文化','用影像传递能量','2026.10.13 — 至今',`<div class="internship-craft-tags"><span>客户研究</span><span>需求与会议记录</span><span>招投标材料</span><span>案例文案</span></div>`,true);}

export function internshipPage(){return `<section class="internship-page" data-internship-page="timeline"><div class="internship-shell"><a class="back-link" href="#/home">← 首页</a><header class="internship-heading"><div class="career-heading-copy"><span class="page-label">实习经历 / FIELD NOTES</span><h1 tabindex="-1">我在真实现场<br>做过什么</h1></div><div class="career-total"><span>2025 — 至今</span><strong>03</strong><span>段实习</span></div></header>${journeyNav()}<div class="internship-timeline">
<section class="internship-row" id="internship-chongqing" aria-labelledby="internship-chongqing-title"><div class="internship-timeline-point" aria-hidden="true">01</div>${companyVisual('chongqing','重庆广播电视台','重庆广播电视总台（集团）','2025.07.01 — 2025.09.01')}<div class="internship-story internship-story-cream"><h2 id="internship-chongqing-title" tabindex="-1">重庆广播电视台</h2><p class="internship-organization-note">重庆广播电视总台（集团）</p><p class="internship-role">广播新闻采编实习</p>${metrics([['20 余篇','独立撰写《晚间新闻》稿件'],['6 期','全程策划执行《走遍重庆》']])}<div class="internship-story-copy"><h3>工作内容</h3><p>独立撰写《晚间新闻》稿件20余篇，全程参与《走遍重庆》栏目6期的策划与执行。工作从新闻素材的筛选、稿件撰写，延伸到栏目策划和具体执行。</p><h3>从实践中理解新闻</h3><p>这段地方媒体实践让我逐渐熟悉广播新闻采编的基本流程，也更加具体地理解：新闻采编需要在真实社会现场中发现问题、提炼信息，并以准确、凝练的方式完成公共表达。</p></div>${paperDesk()}</div></section>
<section class="internship-row internship-row-reverse" id="internship-chinadaily" aria-labelledby="internship-chinadaily-title"><div class="internship-timeline-point" aria-hidden="true">02</div>${filmVisual()}<div class="internship-story internship-story-mint"><h2 id="internship-chinadaily-title" tabindex="-1">中国日报社</h2><p class="internship-organization-note">新媒体中心 · 专题策划组</p><p class="internship-role">内容策划与执行实习</p>${metrics([['50 期','英文网站选稿'],['2.9k','《小关没有超人》点赞与转发']])}<div class="internship-story-copy"><h3>工作内容</h3><p>完成50期英文网站选稿，参与视频翻译审查及推广文案撰写，深度参与微电影《小关没有超人》的拍摄与社会议题叙事。</p><h3>从信息选择到平台呈现</h3><p>从英文网站内容筛选、跨语种视频审校到新媒体文案生产，我更加直观地接触到国际传播内容从信息选择、语言转换到平台呈现的完整过程。</p><div class="internship-film-reflection"><h3>关于《小关没有超人》的体会</h3><p>在创作实践中，我进一步参与以普通人物为切口呈现社会议题，体会到影像叙事如何通过个体经验连接更广泛的社会情绪与公共议题，也对“如何讲述真实、具体而具有共情力的中国故事”有了更加深入的理解。</p></div></div></div></section>
<section class="internship-row" id="internship-bugong" aria-labelledby="internship-bugong-title"><div class="internship-timeline-point internship-point-current" aria-hidden="true">03</div>${currentNotes()}<div class="internship-story internship-story-lilac"><h2 id="internship-bugong-title" tabindex="-1">不恭文化</h2><p class="internship-organization-note">北京不恭文化传媒有限公司 · 商业增长中心</p><p class="internship-role">商务支持与内容协作实习</p><div class="internship-story-copy"><h3>目前参与的工作</h3><p>参与客户研究与资料整理，协助记录需求和会议内容，并围绕具体任务整理招投标材料、支持案例文案。</p><p>这段实习仍在进行，当前的工作主要是为团队提供资料、记录与内容协作支持。</p><h3>正在积累的经验</h3><p>我也在学习把信息整理清楚、把需求记录准确，理解内容如何进入团队协作与商业沟通。新的观察和体会，会随着实践继续积累。</p></div></div></section>
</div>${campusPractice()}<footer class="internship-page-footer"><a href="#/academic">继续看看学业探索 <span aria-hidden="true">↗</span></a></footer></div></section>`;}

export function internshipWorkPage(id){
  const index=works.findIndex(work=>work.id===id),work=works[index];
  if(!work)return `<section class="page internship-work-page" data-internship-page="work"><a class="back-link" href="#/internships">← 返回实习经历</a><h1 tabindex="-1">暂未找到这篇稿件</h1><p>可以回到实习经历，从“我的稿件”继续阅读。</p></section>`;
  const previous=works[index-1],next=works[index+1];
  return `<article class="page internship-work-page" data-internship-page="work" data-internship-work="${esc(work.id)}"><a class="back-link" href="#/internships">← 返回实习经历</a><header class="internship-work-heading"><span class="page-label">重庆广播电视台 · ${esc(work.category||'实习稿件')}</span><h1 tabindex="-1">${esc(work.title)}</h1>${work.summary?`<p>${esc(work.summary)}</p>`:''}</header><div class="internship-work-layout"><aside class="internship-work-index"><span class="page-label">同组稿件</span><nav aria-label="实习稿件索引">${works.map(item=>`<a href="${workRoute(item.id)}" ${item.id===id?'aria-current="page"':''}>${esc(item.title)}</a>`).join('')}</nav><a class="internship-return-link" href="#/internships">返回实习时间线 ↗</a></aside><div class="internship-work-main"><div class="internship-work-body">${manuscriptBody(work)}</div><nav class="internship-work-pagination" aria-label="继续阅读">${previous?`<a href="${workRoute(previous.id)}"><small>上一篇</small><span>← ${esc(previous.title)}</span></a>`:'<span></span>'}${next?`<a href="${workRoute(next.id)}"><small>下一篇</small><span>${esc(next.title)} →</span></a>`:'<a href="#/internships"><small>读到这里</small><span>返回实习经历 ↗</span></a>'}</nav></div></div></article>`;
}

export function mountInternship({openViewer}={}){
  destroyInternship();const root=document.querySelector('[data-internship-page]');if(!root)return;
  const controller=new AbortController();let frame=0;
  root.addEventListener('click',event=>{
    const imageTrigger=event.target.closest('[data-internship-image]');
    if(imageTrigger&&root.contains(imageTrigger)){
      const work=works.find(item=>item.id===root.dataset.internshipWork),index=Number(imageTrigger.dataset.internshipImage);
      const images=(work?.images||[]).map(image=>({src:image.src,caption:image.caption||image.alt||'原稿附图'}));
      if(images[index]&&typeof openViewer==='function')openViewer(images,index,work.title);
      return;
    }
    const trigger=event.target.closest('[data-internship-jump]');
    if(!trigger||!root.contains(trigger))return;
    const section=root.querySelector('#'+trigger.dataset.internshipJump);if(!section)return;
    section.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
    section.querySelector('h2')?.focus({preventScroll:true});
  },{signal:controller.signal});
  const rail=root.querySelector('.manuscript-rail');
  if(rail){
    const cards=[...rail.querySelectorAll('[data-paper]')],reset=root.querySelector('[data-paper-reset]'),status=root.querySelector('.manuscript-status');
    let active=null,pinned=null;
    const show=card=>{
      active=card;
      cards.forEach(item=>{
        const expanded=item===card,locked=item===pinned;
        item.classList.toggle('is-expanded',expanded);item.classList.toggle('is-pinned',locked);
        item.querySelector('button').setAttribute('aria-expanded',String(expanded));
        item.querySelector('.manuscript-card-content').hidden=!expanded;
        item.querySelector('.manuscript-pin-state').textContent=locked?'已固定 · 再次点击取消':'';
      });
      reset.hidden=!pinned;
    };
    const release=()=>{
      if(active&&(active.querySelector('.manuscript-card-content').contains(document.activeElement)||document.activeElement===reset))active.querySelector('button').focus({preventScroll:true});
      pinned=null;show(null);status.textContent='已取消固定，稿件全部收起。';
    };
    const revealPinned=()=>{
      if(!pinned)return;
      const left=pinned.offsetLeft;
      if(left<rail.scrollLeft||left+pinned.offsetWidth>rail.scrollLeft+rail.clientWidth)rail.scrollTo({left:Math.max(0,left-1),behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
    };
    const pin=card=>{
      if(pinned===card){release();return;}
      pinned=card;show(card);status.textContent=works.find(work=>work.id===card.dataset.paper)?.title+'已固定。';
      // Reveal only inside the horizontal rail; keep the page's vertical position.
      revealPinned();
    };
    cards.forEach(card=>{
      card.addEventListener('pointerenter',event=>{if(event.pointerType==='mouse'&&!pinned)show(card);},{signal:controller.signal});
      card.addEventListener('focusin',()=>{if(!pinned)show(card);},{signal:controller.signal});
      card.addEventListener('click',event=>{
        if(event.target.closest('a')||window.getSelection()?.toString())return;
        if(event.target.closest('.manuscript-excerpt')&&pinned===card)return;
        pin(card);
      },{signal:controller.signal});
    });
    rail.addEventListener('pointerleave',()=>{if(!pinned&&!rail.contains(document.activeElement))show(null);},{signal:controller.signal});
    rail.addEventListener('focusout',event=>{if(!pinned&&!rail.contains(event.relatedTarget))show(null);},{signal:controller.signal});
    rail.addEventListener('transitionend',event=>{if(event.target===pinned&&event.propertyName==='flex-basis')revealPinned();},{signal:controller.signal});
    root.addEventListener('keydown',event=>{if(event.key==='Escape'&&(active||pinned)){release();}},{signal:controller.signal});
    reset.addEventListener('click',release,{signal:controller.signal});
    root.querySelectorAll('[data-paper-scroll]').forEach(button=>button.addEventListener('click',()=>{rail.scrollBy({left:Number(button.dataset.paperScroll)*rail.clientWidth*.65,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});},{signal:controller.signal}));
    rail.addEventListener('wheel',event=>{
      if(event.target.closest('.manuscript-excerpt')||event.ctrlKey||Math.abs(event.deltaX)>=Math.abs(event.deltaY))return;
      const canMove=event.deltaY>0?rail.scrollLeft+rail.clientWidth<rail.scrollWidth-1:rail.scrollLeft>0;
      if(canMove){event.preventDefault();rail.scrollLeft+=event.deltaY;}
    },{passive:false,signal:controller.signal});
  }
  const sections=[...root.querySelectorAll('.internship-row')],track=root.querySelector('.career-track');
  const updateJourney=()=>{
    frame=0;if(!sections.length||!track)return;
    const marker=Math.max(track.getBoundingClientRect().bottom+72,window.innerHeight*.36);
    let index=0;sections.forEach((section,i)=>{if(section.getBoundingClientRect().top<=marker)index=i;});
    sections.forEach((section,i)=>section.classList.toggle('is-current',i===index));
    track.querySelectorAll('[data-internship-jump]').forEach((button,i)=>{if(i===index)button.setAttribute('aria-current','step');else button.removeAttribute('aria-current');});
    track.querySelector('[data-career-count]').textContent=String(index+1).padStart(2,'0')+' / 03';
    track.style.setProperty('--career-progress',((index+1)/sections.length*100)+'%');
    track.classList.toggle('is-docked',track.getBoundingClientRect().top<=100);
  };
  const queueJourney=()=>{if(!frame)frame=requestAnimationFrame(updateJourney);};
  if(sections.length){window.addEventListener('scroll',queueJourney,{passive:true,signal:controller.signal});window.addEventListener('resize',queueJourney,{passive:true,signal:controller.signal});updateJourney();}
  cleanup=()=>{controller.abort();if(frame)cancelAnimationFrame(frame);};
}
export function destroyInternship(){cleanup?.();cleanup=null;}
