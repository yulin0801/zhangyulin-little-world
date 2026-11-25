import {mountWorksRack} from './works-rack.js?v=37.0';
import {renderSubjectShelf} from './subject-shelf.js?v=35.0';

const escape = value => String(value ?? '').replace(/[&<>"']/g, char =>
  ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

export function paperLibraryMarkup(topics, initialTopic, query) {
  return `<section class="paper-library" aria-label="文字作品书架">
    <div class="paper-library-tools">
      <nav class="paper-topics" aria-label="按传播学主题筛选">
        ${topics.map(([id,label])=>`<button type="button" data-paper-topic="${escape(id)}" aria-pressed="${id===initialTopic}">${escape(label)} <small aria-hidden="true"></small></button>`).join('')}
      </nav>
      <label class="paper-search"><span>检索作品</span><input type="search" name="q" maxlength="120" autocomplete="off" placeholder="输入标题或关键词" value="${escape(query)}"></label>
    </div>
    <div class="paper-library-body">
      <p class="paper-count" role="status"></p>
      <div class="paper-library-shelf" data-paper-rack hidden></div>
      <div class="paper-empty" hidden><p>没有找到符合条件的作品。</p><button type="button" data-clear-paper-filters>清除筛选</button></div>
    </div>
  </section>`;
}

const normalize = value => String(value ?? '').normalize('NFKC').toLocaleLowerCase();

export function mountPaperLibrary(root, entries, initialTopic, onState) {
  if (!root) return () => {};
  const input = root.querySelector('input[type=search]');
  const topicBar = root.querySelector('.paper-topics');
  const buttons = [...topicBar.querySelectorAll('[data-paper-topic]')];
  const labels = new Map(buttons.map(button=>[button.dataset.paperTopic,button.firstChild.textContent.trim()]));
  const rack = root.querySelector('[data-paper-rack]');
  const empty = root.querySelector('.paper-empty');
  const count = root.querySelector('.paper-count');
  const controller = new AbortController();
  let topic = initialTopic;
  let teardownRack;
  let mountedKey;

  function showActiveTopic() {
    const button=buttons.find(item=>item.dataset.paperTopic===topic);
    if(!button)return;
    const left=button.offsetLeft;
    const right=left+button.offsetWidth;
    if(left<topicBar.scrollLeft)topicBar.scrollLeft=left;
    if(right>topicBar.scrollLeft+topicBar.clientWidth)topicBar.scrollLeft=right-topicBar.clientWidth;
  }

  function update() {
    const query = input.value.trim();
    const terms = normalize(query).split(/\s+/).filter(Boolean);
    const matches = entries.filter(entry=>terms.every(term=>entry.search.includes(term)));
    const visible = matches.filter(entry=>topic==='all'||entry.topic===topic);
    for (const button of buttons) {
      const key = button.dataset.paperTopic;
      button.setAttribute('aria-pressed',String(topic===key));
      button.querySelector('small').textContent=key==='all'
        ? matches.length
        : matches.filter(entry=>entry.topic===key).length;
    }
    count.textContent=`${labels.get(topic)}，${visible.length} 件作品`;
    empty.hidden=Boolean(visible.length);
    const nextKey=topic+':'+visible.map(entry=>entry.id).join(',');
    if(nextKey!==mountedKey) {
      teardownRack?.();
      teardownRack=undefined;
      rack.replaceChildren();
      const rotating=topic==='all'&&CSS.supports('transform-style','preserve-3d');
      rack.classList.toggle('works-rack-stage',rotating);
      rack.hidden=!visible.length;
      if(visible.length) {
        if(rotating)teardownRack=mountWorksRack(rack,visible);
        else rack.innerHTML=renderSubjectShelf(visible,labels.get(topic));
      }
      mountedKey=nextKey;
    }
    onState(topic,query);
  }

  input.addEventListener('input', update, {signal:controller.signal});
  root.addEventListener('click', event=>{
    const filter=event.target.closest('[data-paper-topic]');
    if (filter) {
      topic=filter.dataset.paperTopic;
      update();
      showActiveTopic();
    } else if (event.target.closest('[data-clear-paper-filters]')) {
      topic='all';
      input.value='';
      update();
      showActiveTopic();
      input.focus();
    }
  }, {signal:controller.signal});
  update();
  showActiveTopic();

  return ()=>{
    controller.abort();
    teardownRack?.();
  };
}

export function paperEntry(project, meta, topicLabel, documents) {
  const firstPage=documents[0]?.pages[0]?.src;
  const title=[project.title,project.subtitle,project.summary,project.description,project.type,topicLabel,
    ...(Array.isArray(project.keywords)?project.keywords:[])].filter(Boolean).join(' ');
  return {
    id:project.id,
    title:project.title,
    type:project.type||'论文',
    topic:meta?.topic,
    topicLabel,
    lang:project.language,
    cover:project.image||project.previewImage||firstPage,
    href:`#/project/${encodeURIComponent(project.id)}`,
    search:normalize(title)
  };
}
