import { GoogleGenAI, Type } from "@google/genai";
import { GameLevel } from "../types";

// --- Local Database (Fallback) ---
// Used when API key is missing or request fails.
// Contains multiple variations for each grammar pattern to ensure variety.

const LOCAL_SENTENCES = [
  // 1. A 把 B 给 C
  { text: "我把手机给妹妹了", pinyin: "Wǒ bǎ shǒu jī gěi mèi mei le", trans: "I gave the phone to my younger sister.", grammar: "把...给... (BA... give...)" },
  { text: "我把钱给售货员了", pinyin: "Wǒ bǎ qián gěi shòu huò yuán le", trans: "I gave the money to the salesperson.", grammar: "把...给... (BA... give...)" },
  { text: "我把照片给朋友看了", pinyin: "Wǒ bǎ zhào piàn gěi péng yǒu kàn le", trans: "I showed the photo to my friend.", grammar: "把...给... (BA... give...)" },

  // 2. A 把 B 放在 C 上
  { text: "我把电脑放在桌子上", pinyin: "Wǒ bǎ diàn nǎo fàng zài zhuō zi shàng", trans: "I put the computer on the desk.", grammar: "把...放在...上 (BA... put on...)" },
  { text: "我把手机放在书上", pinyin: "Wǒ bǎ shǒu jī fàng zài shū shàng", trans: "I put the phone on the book.", grammar: "把...放在...上 (BA... put on...)" },
  { text: "我把耳机放在床上", pinyin: "Wǒ bǎ ěr jī fàng zài chuáng shàng", trans: "I put the earphones on the bed.", grammar: "把...放在...上 (BA... put on...)" },

  // 3. A 用 B 来 C
  { text: "我用手机来听音乐", pinyin: "Wǒ yòng shǒu jī lái tīng yīn yuè", trans: "I use my phone to listen to music.", grammar: "用...来... (Use... to...)" },
  { text: "我用电脑来写作业", pinyin: "Wǒ yòng diàn nǎo lái xiě zuò yè", trans: "I use the computer to do homework.", grammar: "用...来... (Use... to...)" },
  { text: "我用微信来联系朋友", pinyin: "Wǒ yòng Wēi xìn lái lián xì péng yǒu", trans: "I use WeChat to contact friends.", grammar: "用...来... (Use... to...)" },

  // 4. A 让 B 更 Adj
  { text: "手机让生活更方便", pinyin: "Shǒu jī ràng shēng huó gèng fāng biàn", trans: "Phones make life more convenient.", grammar: "让...更... (Make... more...)" },
  { text: "互联网让学习更容易", pinyin: "Hù lián wǎng ràng xué xí gèng róng yì", trans: "The internet makes learning easier.", grammar: "让...更... (Make... more...)" },
  { text: "科技让世界更小", pinyin: "Kē jì ràng shì jiè gèng xiǎo", trans: "Technology makes the world smaller.", grammar: "让...更... (Make... more...)" },

  // 5. A 觉得 B 对 C 有 (正/负)面 影响
  { text: "我觉得手机对我有负面影响", pinyin: "Wǒ jué de shǒu jī duì wǒ yǒu fù miàn yǐng xiǎng", trans: "I think phones have a negative influence on me.", grammar: "对...有影响 (Have influence on...)" },
  { text: "我觉得运动对身体有正面影响", pinyin: "Wǒ jué de yùn dòng duì shēn tǐ yǒu zhèng miàn yǐng xiǎng", trans: "I think exercise has a positive influence on the body.", grammar: "对...有影响 (Have influence on...)" },
  { text: "我觉得游戏对学习有负面影响", pinyin: "Wǒ jué de yóu xì duì xué xí yǒu fù miàn yǐng xiǎng", trans: "I think games have a negative influence on studying.", grammar: "对...有影响 (Have influence on...)" },

  // 6. 如果...就...
  { text: "如果没有手机，我就不能给妈妈打电话", pinyin: "Rú guǒ méi yǒu shǒu jī, wǒ jiù bù néng gěi mā ma dǎ diàn huà", trans: "If I don't have a phone, I cannot call mom.", grammar: "如果...就... (If... then...)" },
  { text: "如果不充电，手机就不能用", pinyin: "Rú guǒ bù chōng diàn, shǒu jī jiù bù néng yòng", trans: "If I don't charge it, the phone cannot be used.", grammar: "如果...就... (If... then...)" },
  { text: "如果有很多钱，我就买新电脑", pinyin: "Rú guǒ yǒu hěn duō qián, wǒ jiù mǎi xīn diàn nǎo", trans: "If I have a lot of money, I will buy a new computer.", grammar: "如果...就... (If... then...)" },

  // 7. 跟...比，现在...更...
  { text: "跟以前比，现在上网更容易", pinyin: "Gēn yǐ qián bǐ, xiàn zài shàng wǎng gèng róng yì", trans: "Compared to before, going online is easier now.", grammar: "跟...比 (Compared to...)" },
  { text: "跟以前比，现在手机更贵", pinyin: "Gēn yǐ qián bǐ, xiàn zài shǒu jī gèng guì", trans: "Compared to before, phones are more expensive now.", grammar: "跟...比 (Compared to...)" },
  { text: "跟电脑比，手机更方便", pinyin: "Gēn diàn nǎo bǐ, shǒu jī gèng fāng biàn", trans: "Compared to computers, phones are more convenient.", grammar: "跟...比 (Compared to...)" },

  // 8. 我觉得...对我很重要，因为...
  { text: "我觉得手机对我很重要，因为我用手机刷抖音", pinyin: "Wǒ jué de shǒu jī duì wǒ hěn zhòng yào, yīn wèi wǒ yòng shǒu jī shuā Dǒu yīn", trans: "I think my phone is important because I use it to scroll TikTok.", grammar: "因为... (Because...)" },
  { text: "我觉得朋友对我很重要，因为我们互相帮助", pinyin: "Wǒ jué de péng yǒu duì wǒ hěn zhòng yào, yīn wèi wǒ men hù xiāng bāng zhù", trans: "I think friends are important because we help each other.", grammar: "因为... (Because...)" },
  { text: "我觉得网络对我很重要，因为我喜欢玩游戏", pinyin: "Wǒ jué de wǎng luò duì wǒ hěn zhòng yào, yīn wèi wǒ xǐ huan wán yóu xì", trans: "I think the internet is important because I like playing games.", grammar: "因为... (Because...)" }
];

// Helper to split Chinese sentences into logical chunks for the game
const splitSentence = (text: string, pinyin: string) => {
  // Simple heuristic splitter by characters/words for local data
  // In a real scenario, manual segmentation in data is better, but this works for simple sentences
  // We will split by spaces if pinyin has spaces, trying to map roughly.
  // Actually, for Chinese, just splitting by 2-3 chars or punctuation is often a good enough puzzle.
  
  // Strategy: Split by punctuation first, then split long segments.
  const segments = text.match(/[^，,。.]+|[，,。.]/g) || [text];
  const parts: { text: string; pinyin: string; order: number }[] = [];
  
  let pinyinParts = pinyin.split(' '); // Rough pinyin mapping
  let currentPinyinIndex = 0;

  segments.forEach((seg) => {
    // If segment is punctuation
    if (/[，,。.]/.test(seg)) {
       parts.push({ text: seg, pinyin: "", order: -1 }); // We usually don't make users sort punctuation in this specific game style, or we attach it.
       // For this game, let's attach punctuation to the previous part if possible, or make it a part.
       if(parts.length > 0) {
         parts[parts.length -1].text += seg;
       }
       return;
    }

    // Split segment into smaller chunks (randomly 1 to 3 chars)
    let i = 0;
    while(i < seg.length) {
      const len = Math.random() > 0.6 ? 2 : (Math.random() > 0.5 ? 3 : 1);
      const chunkText = seg.substr(i, len);
      
      // Try to grab pinyin (approximate)
      const chunkPinyin = pinyinParts.slice(currentPinyinIndex, currentPinyinIndex + len).join(' ');
      currentPinyinIndex += len;

      parts.push({
        text: chunkText,
        pinyin: chunkPinyin || "",
        order: parts.length
      });
      i += len;
    }
  });

  return parts.map((p, idx) => ({ ...p, order: idx }));
};

const getRandomLocalLevel = (): GameLevel => {
  const template = LOCAL_SENTENCES[Math.floor(Math.random() * LOCAL_SENTENCES.length)];
  const parts = splitSentence(template.text, template.pinyin).map((p, i) => ({
    id: `local-${Date.now()}-${i}`,
    text: p.text,
    pinyin: p.pinyin,
    order: i
  }));

  return {
    id: `level-local-${Date.now()}`,
    fullSentence: template.text,
    translation: template.trans,
    grammarPoint: template.grammar,
    parts: parts
  };
};

// --- Gemini API ---

export const generateLevel = async (): Promise<GameLevel> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("No API KEY found, using random local level.");
    await new Promise(r => setTimeout(r, 500)); // Simulate loading
    return getRandomLocalLevel();
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
    Generate a UNIQUE and RANDOM Chinese sentence puzzle for a language game. 
    Theme: Technology, Mobile Phones, Internet, Daily Life.
    Difficulty: HSK 3-4.

    CRITICAL: The sentence MUST strictly follow EXACTLY ONE of these grammar patterns:
    1. "A 把 B 给 C" (Subject BA Object GEI Recipient).
    2. "A 把 B 放在 C 上" (Subject BA Object FANG ZAI Location SHANG).
    3. "A 用 B 来 C" (Subject YONG Tool LAI Action).
    4. "A 让 B 更 Adj" (Thing A RANG Thing B GENG Adjective).
    5. "A 觉得 B 对 C 有 (正/负)面 影响" (Subj JUEDE Topic DUI Target YOU (ZHENG/FU) MIAN YINGXIANG).
    6. "如果 A 就 B" (RUGUO Condition, JIU Result).
    7. "跟 A 比，现在 B 更 Adj" (GEN A BI, XIANZAI B GENG Adj).
    8. "A 觉得 B 对 A 很重要，因为 C" (Subj JUEDE Object DUI Subj HEN ZHONGYAO, YINWEI Reason).

    INSTRUCTIONS:
    - Do NOT always use "手机" (Phone). Use words like 电脑 (Computer), 平板 (Tablet), 互联网 (Internet), APP, 社交媒体 (Social Media), 抖音 (TikTok), 微信 (WeChat).
    - Split the sentence into 6-10 chunks.
    - Punctuation should be attached to the preceding word, or be its own chunk.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            fullSentence: { type: Type.STRING },
            translation: { type: Type.STRING },
            grammarPoint: { type: Type.STRING },
            parts: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  text: { type: Type.STRING },
                  pinyin: { type: Type.STRING },
                },
                required: ["text", "pinyin"]
              }
            }
          },
          required: ["fullSentence", "translation", "parts", "grammarPoint"]
        }
      }
    });

    const data = JSON.parse(response.text || "{}");
    
    // Add IDs and Order to the parts
    const parts = data.parts.map((p: any, index: number) => ({
      ...p,
      id: `part-${Date.now()}-${index}`,
      order: index
    }));

    return {
      id: `level-${Date.now()}`,
      fullSentence: data.fullSentence,
      translation: data.translation,
      grammarPoint: data.grammarPoint,
      parts: parts
    };

  } catch (error) {
    console.error("Gemini API Error:", error);
    return getRandomLocalLevel();
  }
};
