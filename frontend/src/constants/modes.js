export const GENERATION_MODES = [
  { key: 'text', label: '文生视频' },
  { key: 'first_frame', label: '首帧 / 图参考' },
  { key: 'first_last', label: '首尾帧' },
  { key: 'multi_image', label: '多图参考' },
  { key: 'multimodal', label: '多模态' },
]

export function getModeLabel(key) {
  return GENERATION_MODES.find((m) => m.key === key)?.label || key
}

export const MODE_HINTS = {
  text: '只需文字描述，AI 将从零生成视频，最适合新手入门。',
  first_frame: '提供一张参考图作为起始画面，按提示词延展成动态视频。',
  first_last: '分别指定开始和结束画面，AI 自动生成中间过渡动画。',
  multi_image: '上传多张参考图，融合它们的风格与元素生成视频。',
  multimodal: '支持图片、视频、音频混合参考，适合复杂创意场景。',
}

/** 新手模式：顶部步骤引导 */
export const BEGINNER_STEPS = [
  { step: 1, title: '选创作方式', desc: '文生视频最简单，有图可选「图片变视频」' },
  { step: 2, title: '描述画面', desc: '写清楚主体、动作和风格，越具体越好' },
  { step: 3, title: '开始生成', desc: '右侧可实时看进度，完成后记得下载' },
]

/** 新手模式：创作方式卡片 */
export const BEGINNER_MODE_CARDS = [
  {
    key: 'text',
    label: '文生视频',
    tag: '推荐',
    tier: 'basic',
    icon: 'mingcute:text-2-line',
    desc: '只用文字，AI 从零画出一支视频',
    scenario: '第一次使用？选这个就对了',
  },
  {
    key: 'first_frame',
    label: '图片变视频',
    tier: 'basic',
    icon: 'mingcute:pic-2-line',
    desc: '给一张图，让它按描述动起来',
    scenario: '有照片、插画或截图时适用',
  },
  {
    key: 'first_last',
    label: '首尾帧过渡',
    tier: 'advanced',
    icon: 'mingcute:film-line',
    desc: '指定开始和结束画面，生成中间动画',
    scenario: '想精确控制起止画面时使用',
  },
  {
    key: 'multi_image',
    label: '多图参考',
    tier: 'advanced',
    icon: 'mingcute:grid-2-line',
    desc: '多张图共同影响风格和元素',
    scenario: '需要融合多种视觉参考时',
  },
  {
    key: 'multimodal',
    label: '多模态参考',
    tier: 'advanced',
    icon: 'mingcute:magic-2-line',
    desc: '图片 + 视频 + 音频混合参考',
    scenario: '复杂创意，适合有经验的用户',
  },
]

/** 新手模式：各字段说明 */
export const BEGINNER_FIELD_HINTS = {
  model: '快速版出片更快、适合试效果；标准版画质更好，但等待更久。',
  resolution: '数字越大越清晰，生成也越慢。新手建议先用 720p 看效果。',
  ratio: '横屏适合电脑观看，竖屏适合抖音、小红书等手机短视频。',
  duration: '时长越长等待越久。第一次建议 4 秒，满意后再加长。',
  prompt: '建议写清：谁 / 在哪 / 做什么 / 什么风格。描述越具体，效果越稳定。',
  firstFrameUrl: '需要一张可公开访问的图片链接。右键图片 → 复制图片地址，或上传到图床后粘贴链接。',
  lastFrameUrl: '结束画面的图片链接，需与首帧风格相近，过渡会更自然。',
  refImageList: '可添加多张参考图，AI 会综合它们的风格与元素。',
  refImageUrl: '人物或场景参考图，帮助 AI 理解你想要的视觉风格。',
  refVideoUrl: '参考视频的动作、节奏或镜头运动（可选）。',
  refAudioUrl: '参考背景音乐或音效氛围，需配合图片或视频一起使用。',
  imageRole: '「首帧」表示从这张图开始动起来；「参考图」表示借鉴其风格但不固定起始画面。',
}

/** 新手模式：画幅比例友好名称 */
export const RATIO_LABELS = {
  '16:9': '横屏 16:9',
  '9:16': '竖屏 9:16',
  '1:1': '方形 1:1',
  '4:3': '横屏 4:3',
  '3:4': '竖屏 3:4',
  '21:9': '超宽 21:9',
  adaptive: '自动适配',
}

/** 新手模式：清晰度友好名称 */
export const RESOLUTION_LABELS = {
  '480p': '480p — 流畅预览',
  '720p': '720p — 清晰推荐',
  '1080p': '1080p — 高清（仅标准版）',
}

/** 新手模式：开关说明 */
export const BEGINNER_OPTION_HINTS = {
  generateAudio: { title: '生成音频', desc: '为视频配上 AI 生成的背景音乐或环境音' },
  watermark: { title: '添加水印', desc: '在视频角落显示平台水印，正式作品可关闭' },
}

/** 新手模式：提示词写作技巧 */
export const PROMPT_WRITING_TIPS = [
  '写清楚主体：谁或什么（人物、动物、物品）',
  '描述动作：在做什么、怎么动（走、跑、转头、飘动）',
  '补充环境：在哪里、什么光线（海边日落、雨夜街道）',
  '点明风格：电影感、动漫、写实、治愈、赛博朋克等',
]

/** 新手模式：一键填入的示例提示词 */
export const PROMPT_EXAMPLES = [
  { label: '萌宠', text: '一只橘猫在阳光下伸懒腰，毛发蓬松，温馨治愈风格，慢镜头特写' },
  { label: '风景', text: '雪山湖泊清晨，薄雾缭绕，镜头缓缓推进，电影感航拍' },
  { label: '人物', text: '女孩站在樱花树下，微风吹动发丝，日系清新风格，浅景深' },
  { label: '科幻', text: '未来城市夜景，霓虹灯光倒映在雨水中，赛博朋克风格，镜头横移' },
]

/** 新手模式：各创作方式的详细说明 */
export const BEGINNER_MODE_DETAILS = {
  text: {
    title: '文生视频 — 从零开始创作',
    points: [
      '不需要准备任何图片或素材',
      '在提示词里描述你想要的画面即可',
      '适合快速验证创意、探索不同风格',
    ],
  },
  first_frame: {
    title: '图片变视频 — 让静态图动起来',
    points: [
      '准备一张公开可访问的图片链接',
      '图片内容会成为视频的起始画面',
      '配合提示词描述「怎么动」，效果更可控',
    ],
  },
  first_last: {
    title: '首尾帧 — 控制起止画面',
    points: [
      '分别提供开始和结束两张图',
      'AI 自动生成中间的过渡动画',
      '两张图风格越接近，过渡越自然',
    ],
  },
  multi_image: {
    title: '多图参考 — 融合多种视觉元素',
    points: [
      '可添加 2 张以上的参考图',
      'AI 会综合各图的风格、色彩与元素',
      '提示词中说明想保留哪些特征',
    ],
  },
  multimodal: {
    title: '多模态 — 图 + 视频 + 音频',
    points: [
      '可同时参考图片、视频片段和音频',
      '适合模仿特定动作、节奏或氛围',
      '参数较多，建议熟悉基础模式后再试',
    ],
  },
}

/** 新手模式：常见错误友好提示 */
export const BEGINNER_ERROR_TIPS = {
  model_price_error: 'API Key 需要属于 seedance 分组，请检查 Key 是否正确。',
  unauthorized: 'API Key 无效或已过期，请到「API 配置」重新填写。',
  default: '可检查：API Key 是否配置、网络是否正常，或在配置页开启「同源代理转发」后重试。',
}