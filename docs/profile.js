import {certificateCard} from './certificates.js?v=30.0';
import { profile } from './profile-data.js?v=35.0';
import {educationJourney} from './education-journey.js?v=30.0';
import {mountContactLanyard} from './contact-lanyard.js?v=35.0';

const e = value => String(value ?? '').replace(/[&<>"']/g, c => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[c]));
const homeLink = '<a class="back-link" href="#/home">← 首页</a>';
const routeLink = (route, label, cls = 'profile-text-link') =>
  `<a class="${cls}" href="#/${e(route)}">${e(label)} <span aria-hidden="true">↗</span></a>`;
const header = (eyebrow, title, description = '') => `<header class="profile-heading">
  <p class="profile-eyebrow">${e(eyebrow)}</p><h1 tabindex="-1">${e(title)}</h1>
  ${description ? `<p class="profile-lead">${e(description)}</p>` : ''}
</header>`;

export function educationPage(data = profile) {
  return educationJourney(data);
}

export function skillsPage(data = profile) {
  return `<section class="page profile-page skills-page">${homeLink}
    ${header('SKILLS / 技能工具', '技能工具')}
    <div class="skills-main-grid">
      <section class="skill-panel research-skill" aria-labelledby="research-skill-title"><div class="skill-panel-top"><span class="profile-mini-label">01 / 研究方法</span><span aria-hidden="true">↗</span></div><h2 id="research-skill-title">质性与量化结合</h2><p class="skill-summary">在研究与课程作品中，通过实验、问卷、访谈和公开文本观察，梳理问题与材料之间的关系。</p><ul class="method-tags">${data.methods.map(method => `<li>${e(method)}</li>`).join('')}</ul><div class="skill-evidence">${data.researchEvidence.map(item => `<a href="#/${e(item.route)}"><span><b>${e(item.title)}</b><small>${e(item.work)}</small></span><span aria-hidden="true">↗</span></a>`).join('')}</div></section>
      <section class="skill-panel tools-skill" aria-labelledby="tools-skill-title"><div class="skill-panel-top"><span class="profile-mini-label">02 / 分析工具</span><span aria-hidden="true">＋</span></div><h2 id="tools-skill-title">我的研究工具箱</h2><ul class="tool-list">${data.tools.map(tool => `<li>${e(tool)}</li>`).join('')}</ul><div class="tool-rule" aria-hidden="true"></div>${routeLink('academic/works?format=text', '查看研究与课程作品')}</section>
    </div>
    <section class="practice-skills" aria-labelledby="practice-skills-title"><div class="profile-section-top"><div><span class="profile-mini-label">03 / 内容实践</span><h2 id="practice-skills-title">采访、采编与内容策划</h2></div>${routeLink('internships', '实习经历')}</div><div class="practice-evidence-grid">${data.practice.map(item => `<article><span class="practice-period">${e(item.period)}</span><h3>${e(item.organization)}</h3><p class="practice-role">${e(item.role)}</p><p>${e(item.work)}</p></article>`).join('')}</div><div class="practice-work-links">${routeLink('project/painter', '人物采访作品')}${routeLink('internships', '实习稿件与工作记录')}</div></section>
    <section class="language-skills" aria-labelledby="language-skills-title"><div><span class="profile-mini-label">04 / 语言</span><h2 id="language-skills-title">英语成绩</h2></div><dl>${data.languages.map(language => `<div><dt>${e(language.exam)}</dt><dd>${e(language.score)}</dd></div>`).join('')}</dl><div class="certificate-grid language-certificate-grid">${[0,1,2].map(index=>certificateCard('english',index)).join('')}</div></section>
  </section>`;
}

export function contactPage(data = profile) {
  const phoneLabel = data.phone?.replace(/^(\d{3})(\d{4})(\d{4})$/,'$1 $2 $3');
  return `<section class="contact-lanyard-page" aria-labelledby="contact-badge-name">
    <div class="contact-lanyard-stage" data-contact-lanyard>
      <span class="lanyard-rest" data-lanyard-rest aria-hidden="true"></span>
      <svg class="lanyard-rope" data-lanyard-rope aria-hidden="true">
        <defs>
          <linearGradient id="lanyard-metal" x1="0" x2="1" y1="0" y2="1" gradientUnits="objectBoundingBox">
            <stop stop-color="#e0cfdf"/><stop offset=".27" stop-color="#74647c"/><stop offset=".51" stop-color="#f8eaf3"/><stop offset=".73" stop-color="#8d809d"/><stop offset="1" stop-color="#c6bad4"/>
          </linearGradient>
          <linearGradient id="lanyard-wrap" x2="0" y2="1"><stop stop-color="#ad719d"/><stop offset="1" stop-color="#583952"/></linearGradient>
        </defs>
        <g class="lanyard-cord-shadow"><path data-cord-left/><path data-cord-right/></g>
        <g class="lanyard-cord-color"><path data-cord-left/><path data-cord-right/></g>
        <g class="lanyard-cord-texture"><path data-cord-left/><path data-cord-right/></g>
        <g data-lanyard-knot>
          <rect x="-11" y="-34" width="22" height="19" rx="6" fill="url(#lanyard-wrap)" stroke="#5f3f65" stroke-width="1"/>
          <path d="M-10 -29L10 -31M-10 -24L10 -26M-9 -19L9 -21" stroke="#dba3ca" stroke-opacity=".52" stroke-width="1.3" stroke-linecap="round"/>
          <path d="M-5 -16L-5 -7Q-5 -2 0 -2Q5 -2 5 -7L5 -16" stroke="url(#lanyard-metal)" stroke-width="4" fill="none"/>
          <path d="M0 -3L0 3C7 6 7 15 0 15C-6 15 -6 8 -2 6" stroke="url(#lanyard-metal)" stroke-width="3.3" stroke-linecap="round" fill="none"/>
        </g>
      </svg>
      <article class="lanyard-badge" data-lanyard-card>
        <button class="lanyard-grip" type="button" data-lanyard-grip aria-label="拖动工牌" aria-describedby="lanyard-keyboard"><span aria-hidden="true"></span></button>
        <p class="lanyard-sr-only" id="lanyard-keyboard">方向键可拨动工牌，Home 键可让工牌复位。</p>
        <div class="lanyard-badge-main">
          <figure class="lanyard-portrait">
            <img src="assets/profile/zhang-yulin-contact.jpg" alt="${e(data.name)}的个人照片" width="1280" height="1792" decoding="async" draggable="false">
          </figure>
          <div class="lanyard-details">
            <div class="lanyard-identity">
              <h1 id="contact-badge-name" tabindex="-1">${e(data.name)}</h1>
              <p lang="en">Zhang Yulin</p>
            </div>
            ${phoneLabel?`<div class="lanyard-tel"><span>电话</span><a href="tel:${e(data.phone)}">${e(phoneLabel)}</a></div>`:''}
          </div>
        </div>
      </article>
    </div>
    <div class="lanyard-contact-actions" aria-label="联系操作">
      <a class="lanyard-email" data-profile-email href="mailto:${e(data.email)}">${e(data.email)}</a>
      <div class="lanyard-buttons">
        <button type="button" class="lanyard-copy" data-copy-email="${e(data.email)}">复制邮箱</button>
        <a class="lanyard-resume" href="assets/documents/zhang-yulin-resume.pdf" target="_blank" rel="noopener noreferrer">查看我的简历</a>
      </div>
      <p class="lanyard-status" data-copy-status role="status"></p>
    </div>
  </section>`;
}

let mounted = null;

/** Call after page-view.innerHTML changes. Safe on pages without a copy button. */
export function mountProfile(root = document.getElementById('page-view')) {
  destroyProfile();
  const button = root?.querySelector('[data-copy-email]');
  if (!button) return;
  const stage = root.querySelector('[data-contact-lanyard]');
  const state = { root, button, timer: 0, aborted: false, busy: false, onClick: null, unmountLanyard: stage && mountContactLanyard(stage) };
  mounted = state;
  const status = root.querySelector('[data-copy-status]');
  const defaultLabel = button.textContent;
  state.onClick = async () => {
    if (state.busy || state.aborted) return;
    state.busy = true;
    button.disabled = true;
    clearTimeout(state.timer);
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(button.dataset.copyEmail);
      if (mounted !== state || state.aborted) return;
      button.textContent = '已复制 ✓';
      if (status) status.textContent = '邮箱已复制。';
    } catch {
      if (mounted !== state || state.aborted) return;
      // Leave a useful, selectable address if browser clipboard permissions fail.
      const email = root.querySelector('[data-profile-email]');
      const selection = window.getSelection();
      if (email && selection) {
        const range = document.createRange();
        range.selectNodeContents(email);
        selection.removeAllRanges();
        selection.addRange(range);
      }
      if (status) status.textContent = '邮箱已选中，请使用设备的复制操作。';
      button.textContent = defaultLabel;
    } finally {
      if (mounted === state && !state.aborted) {
        state.busy = false;
        button.disabled = false;
        state.timer = setTimeout(() => {
          if (mounted === state && !state.aborted) button.textContent = defaultLabel;
        }, 2200);
      }
    }
  };
  button.addEventListener('click', state.onClick);
}

/** Call before replacing a route's DOM. Pending clipboard promises cannot edit the next route. */
export function destroyProfile() {
  if (!mounted) return;
  mounted.aborted = true;
  clearTimeout(mounted.timer);
  mounted.button.removeEventListener('click', mounted.onClick);
  mounted.unmountLanyard?.();
  mounted = null;
}
