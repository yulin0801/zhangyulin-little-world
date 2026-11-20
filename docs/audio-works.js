const e=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

const originalNotes=["作品说明：AI 音乐创作——海洋哺乳动物保护宣传","创作背景与目标","本项目以中华白海豚、斑海豹、布氏鲸、东亚江豚等海洋哺乳动物的保护宣传为主题，结合先进的AIGC（人工智能生成内容）工具与独特的艺术思维，进行了两首音乐作品的创作。通过AI技术，我们不仅希望能够创造出具有感染力的艺术作品，更希望通过这些作品唤起公众对海洋生态保护的关注和支持。","作品介绍","《海洋精灵》","在波涛的呼唤中","中华白海豚轻哨","斑海豹低呜咽","布氏鲸悠扬歌","东亚江豚点击间","倾听海洋的哀歌","别让家园变荒漠","别让歌声随风散","守护这片蔚蓝","唤起心中的怜悯","《海洋精灵》这首歌通过富有诗意的语言和动人的旋律，生动地展现了海洋生物在波涛中的自然行为和声音。歌词中的“倾听海洋的哀歌”和“别让家园变荒漠”直接呼吁听众关注海洋生态的破坏和生物多样性的丧失，而“别让歌声随风散”则强调了保护海洋生物多样性的紧迫性。","《守护这片海》","在波涛的怀抱里","中华白海豚跃","斑海豹轻游憩","布氏鲸悠然行","守护这片海的心意","晨曦的光辉里","海风传递着秘密","守护海洋的梦想","永不停息","《守护这片海》以简洁而深刻的歌词，描绘了中华白海豚在波涛中跳跃、斑海豹悠闲游憩、布氏鲸悠然行进的和谐画面。歌词中的“守护这片海的心意”和“守护海洋的梦想”强调了人类对海洋生态保护的承诺和愿景。歌曲在晨曦的光辉和海风的秘密中传递出对海洋的深情和对保护海洋哺乳动物的坚定决心。《守护这片海》旨在唤起人们对海洋哺乳动物保护的重视，通过音乐的力量，激发公众的情感共鸣，促进社会对海洋生态保护的行动。"];

export const audioWorks=[{
  id:'ocean-spirit',
  title:'海洋精灵-保护海洋动物音乐 AI 创作',
  type:'“中国海油杯”入选优秀作品 · AI音乐创作',
  tracks:[
    {title:'海洋精灵',src:'assets/audio/ocean-spirit.mp3'},
    {title:'守护这片海',src:'assets/audio/guard-this-sea.mp3'},
  ],
}];

export function audioWorkCard(work){
  return `<article class="work-card audio-work-card"><a class="card-image audio-cover" href="#/project/${e(work.id)}" aria-label="收听${e(work.title)}"><span class="audio-record" aria-hidden="true"><span class="audio-record-label">海洋精灵</span></span><span class="audio-cover-corner" aria-hidden="true">♫</span><span class="audio-cover-play">收听作品 ↗</span></a><div class="card-caption"><span class="card-kind">${e(work.type)}</span><a href="#/project/${e(work.id)}"><h2>${e(work.title)}</h2><span class="work-open" aria-hidden="true">↗</span></a></div></article>`;
}

export function audioWorkPage(work,fromAwards=false){
  return `<article class="page audio-detail"><a class="back-link" href="#/${fromAwards?'academic/awards':'academic/works?format=audio'}">← ${fromAwards?'返回荣誉':'返回音频作品'}</a><header class="detail-heading"><span class="card-kind">${e(work.type)}</span><h1 tabindex="-1">${e(work.title)}</h1></header><div class="audio-track-list">${work.tracks.map((track,index)=>`<section class="audio-track" aria-labelledby="audio-track-${index}"><span class="audio-track-number" aria-hidden="true">${String(index+1).padStart(2,'0')}</span><div><h2 id="audio-track-${index}">${e(track.title)}</h2><audio controls preload="metadata" aria-label="播放${e(track.title)}"><source src="${e(track.src)}" type="audio/mpeg">您的浏览器不支持音频播放。</audio></div></section>`).join('')}</div><div class="audio-evidence-links"><button type="button" data-certificate-group="oceanSelection" data-certificate-index="0">查看入选通知 ↗</button><button type="button" data-certificate-group="oceanSelection" data-certificate-index="1">查看入选名单 ↗</button></div><details class="audio-original-notes"><summary>作品说明原文</summary><div>${originalNotes.map(line=>`<p>${e(line)}</p>`).join('')}</div></details></article>`;
}
