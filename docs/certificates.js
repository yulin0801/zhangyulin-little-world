import {practiceEvidenceGroups} from './practice-evidence.js?v=30.0';
const base = 'assets/certificates/';
const e = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export const certificateGroups = {
  ...practiceEvidenceGroups,
  educationMcu: [
    {src:'assets/evidence/mcu-camp-certificate.jpg',title:'铭传大学研习證書',period:'2026.01.26—2026.02.04',detail:'2026兩岸新媒體與傳播研習營'},
  ],
  oceanSelection: [
    {src:'assets/evidence/ocean-selection-notice.jpg',title:'“中国海油杯”入选通知',period:'优秀作品',detail:'海洋哺乳动物保护创意作品征集活动'},
    {src:'assets/evidence/ocean-selection-list.jpg',title:'入选作品名单',period:'海洋精灵-保护海洋动物音乐 AI 创作',detail:'张渝琳'},
  ],
  educationRank: [
    {src:base+'education-record-01.webp',title:'学习成绩证明',period:'前六学期',detail:'成绩排名'},
  ],
  educationTranscript: [
    {src:base+'education-record-02.webp',title:'中国传媒大学学生成绩单',period:'前六学期',detail:'课程成绩'},
  ],
  awards: [
    {src:base+'challenge-cup.webp',title:'“青创北京”2025挑战杯课外学术科技作品竞赛主赛道一等奖',period:'2025',detail:'获奖证书'},
    {src:base+'scholarship-first.jpg',title:'一等奖学金',period:'2024—2025 学年',detail:'中国传媒大学 · 优秀本科生奖学金'},
    {src:base+'scholarship-third.jpg',title:'三等奖学金',period:'2023—2024 学年',detail:'中国传媒大学 · 优秀本科生奖学金'},
    {src:base+'merit-2025.jpg',title:'校三好学生',period:'2024—2025 学年',detail:'中国传媒大学'},
    {src:base+'merit-2024.jpg',title:'校三好学生',period:'2023—2024 学年',detail:'中国传媒大学'},
    {src:base+'youth-leader.jpg',title:'优秀团干部',period:'2025—2026 学年',detail:'共青团中国传媒大学委员会'},
    {src:base+'youth-member.jpg',title:'优秀团员',period:'2024—2025 学年',detail:'共青团中国传媒大学委员会'},
  ],
  project: [
    {src:base+'dachuang.svg',title:'大学生创新创业训练计划 · 优秀结题',period:'2026.05',detail:'北京市级立项 · 中国鲎公益保护中面向闽台文化共同体的环境传播创新研究'},
  ],
  english: [
    {src:base+'ielts.webp',title:'雅思 IELTS',period:'总分 6.5',detail:'成绩单'},
    {src:base+'cet6.webp',title:'大学英语六级 CET-6',period:'521 分',detail:'成绩报告单'},
    {src:base+'cet4.webp',title:'大学英语四级 CET-4',period:'597 分',detail:'成绩报告单'},
  ],
};
for (const group of Object.values(certificateGroups)) {
  for (const item of group) item.caption = `${item.title} · ${item.period}`;
}

export function certificateCard(group, index, modifier = '') {
  const item = certificateGroups[group]?.[index];
  if (!item) return '';
  return `<button type="button" class="certificate-card ${e(modifier)}" data-certificate-group="${e(group)}" data-certificate-index="${index}" aria-label="查看${e(item.title)}，${e(item.period)}">
    <span class="certificate-frame"><img src="${e(item.src)}" alt="${e(item.caption)}" loading="lazy"><span class="certificate-open" aria-hidden="true">查看大图 ↗</span></span>
    <span class="certificate-info"><span class="certificate-period">${e(item.period)}</span><strong>${e(item.title)}</strong><span class="certificate-detail">${e(item.detail)}</span></span>
  </button>`;
}
