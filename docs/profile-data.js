/**
 * Contact details shown on the portfolio's contact page.
 * Resume facts were checked against the supplied one-page resume.
 * Education dates and SJTU admission status were updated by the user in chat.
 */
export const profile = {
  name: '张渝琳',
  nickname: '小章鱼',
  email: 'zhangyulin_10@foxmail.com',
  phone: '18223018043',
  education: [
    {
      id: 'chongqing-one', mark: '一中', city: '重庆', tone: 'rose',
      image: 'assets/education/chongqing-no1.jpg',
      school: '重庆市第一中学校', level: '高中',
      period: '2020.09—2023.06', department: '',
      state: 'completed', stateLabel: '高中阶段',
    },
    {
      id: 'cuc', mark: '传媒', city: '北京', tone: 'lilac',
      image: 'assets/education/cuc.jpg',
      school: '中国传媒大学', level: '本科',
      period: '2023.09—2027.07', department: '新闻学院 · 传播学',
      state: 'current', stateLabel: '本科在读',
    },
    {
      id: 'mcu', city: '台湾', tone: 'blue',
      image: 'assets/education/mcu.png',
      school: '铭传大学', level: '短期交流',
      period: '2026.01—2026.02', department: '2026兩岸新媒體與傳播研習營',
      state: 'completed', stateLabel: '短期交流',
    },
    {
      id: 'sjtu', mark: '交大', city: '上海', tone: 'mint',
      image: 'assets/education/sjtu.png',
      school: '上海交通大学', level: '硕士',
      period: '2027.09—2029.03', department: '媒体与传播学院 · 传播学',
      state: 'admitted', stateLabel: '硕士',
    },
  ],
  academic: {
    gpa: '3.91', gpaScale: '4.0', rank: '1', rankTotal: '45',
    honors: ['一等奖学金', '三好学生', '优秀团干部'],
    courseHighlights: [
      { title: '社会科学研究方法', score: '97' },
      { title: '传播统计学', score: '97' },
      { title: '新媒体写作', score: '98' },
    ],
  },
  tools: ['Python', 'SPSS', 'NVivo', '爬虫工具'],
  methods: ['实验研究', '问卷调查', '半结构访谈', '线上田野观察'],
  researchEvidence: [
    { title: '实验研究', work: '数字人主播与 AI 身份披露', route: 'project/aejmc' },
    { title: '访谈分析', work: '粉丝周边消费行为', route: 'project/fan-consumption' },
    { title: '媒介观察', work: '数字时代的亲密重构：关于人机亲密关系的社会学考察', route: 'project/human-ai-intimacy' },
  ],
  practice: [
    {
      organization: '重庆广播电视总台（集团）', period: '2025.07—2025.09',
      role: '新闻采编实习',
      work: '独立编写《晚间新闻》新闻稿件 20 余篇，参与《走遍重庆》广播栏目策划与执行 6 期。',
    },
    {
      organization: '中国日报 · 新媒体中心', period: '2025.10—2026.03',
      role: '内容策划与执行实习',
      work: '独立完成 50 期英文网站选稿，并参与视频翻译审查、软推广文案撰写及现场拍摄。',
    },
  ],
  languages: [
    { exam: 'IELTS', score: '6.5' },
    { exam: 'CET-6', score: '521' },
    { exam: 'CET-4', score: '597' },
  ],
  // Deliberately null: never point at the original resume PDF, which contains
  // private fields and outdated education information. A sanitized on-site
  // overview can be configured later; the current contact page links to education.
  overviewRoute: null,
};
