import { agentsAPI } from './api';
import { useVocabularyStore } from '@/stores/vocabularyStore';

// Small core CS local dictionary for instant boot fallback
export const LOCAL_DICTIONARY: Record<string, string[]> = {
  "abstraction": ["تجريد", "تبسيط المفاهيم"],
  "access": ["وصول", "دخول"],
  "accumulator": ["مركم", "مسجل تجميع القيم بالمعالج"],
  "accuracy": ["دقة النموذج", "نسبة الصحة"],
  "activation": ["دالة التنشيط", "تفعيل العصبونات"],
  "adapter": ["مهيئ", "مهايئ لتوافق المكونات"],
  "address": ["عنوان الذاكرة", "عنوان الموقع"],
  "agent": ["وكيل", "عميل برمي مستقل"],
  "agentic": ["عميل ذكي ذو صلاحيات مستقلة"],
  "algorithm": ["خوارزمية", "خطوات حل المشكلة"],
  "api": ["واجهة برمجة التطبيقات لتواصل الأنظمة"],
  "application": ["تطبيق برمي", "برنامج"],
  "array": ["مصفوفة"],
  "bug": ["علة خطأ برمي"],
  "code": ["كود وشفرة برمجية"],
  "compiler": ["مترجم يحول الكود للغة الآلة كاملاً"],
  "computer": ["حاسوب كمبيوتر للجهاز"],
  "database": ["قاعدة بيانات لتخزين المعلومات"],
  "error": ["خطأ", "خلل"],
  "framework": ["إطار عمل", "بنية برمجية جاهزة"],
  "function": ["دالة", "تابع", "وظيفة برمجة"],
  "null": ["قيمة فارغة", "لاشيء", "نول"]
};

// In-memory runtime cache for dynamically resolved words
const dynamicCache: Record<string, string[]> = {};

export const FULL_DICTIONARY: Record<string, string[]> = {};

export async function initializeDictionary() {
  try {
    const response = await fetch('/dictionary.json');
    if (response.ok) {
      const data = await response.json();
      Object.assign(FULL_DICTIONARY, data);
      console.log(`[Dictionary] Loaded ${Object.keys(FULL_DICTIONARY).length} words from local assets.`);
    }
  } catch (e) {
    console.warn('[Dictionary] Failed to load local dictionary.json:', e);
  }
}

// Initialize in the background
initializeDictionary();

interface TranslationResult {
  meanings: string[];
  text: string;
  isInstant: boolean;
}

/**
 * Morphological stemmer and dictionary translator mapping inflected forms (plurals, past tense,
 * adverbs, continuous actions) to base dictionary roots. This dynamic resolution core covers
 * over 100,000+ derived English words instantly and locally.
 */
export function stemAndTranslate(word: string): TranslationResult | null {
  const w = word.trim().toLowerCase();
  if (!w) return null;

  // 1. Direct match
  if (FULL_DICTIONARY[w]) {
    const meanings = FULL_DICTIONARY[w];
    return { meanings, text: meanings.join("، "), isInstant: true };
  }
  if (LOCAL_DICTIONARY[w]) {
    const meanings = LOCAL_DICTIONARY[w];
    return { meanings, text: meanings.join("، "), isInstant: true };
  }

  // 2. Negative prefix stripping (un-, dis-, im-, in-, ir-, non-, mis-)
  let negative = false;
  let stem = w;
  const negPrefixes = ["un", "dis", "im", "in", "ir", "non", "mis"];
  for (const prefix of negPrefixes) {
    if (w.startsWith(prefix) && w.length > prefix.length + 2) {
      const remaining = w.slice(prefix.length);
      if (FULL_DICTIONARY[remaining] || LOCAL_DICTIONARY[remaining]) {
        stem = remaining;
        negative = true;
        break;
      }
    }
  }

  if (negative && (FULL_DICTIONARY[stem] || LOCAL_DICTIONARY[stem])) {
    const baseMeanings = FULL_DICTIONARY[stem] || LOCAL_DICTIONARY[stem];
    const meanings = baseMeanings.map(m => "غير " + m);
    return { meanings, text: meanings.join("، "), isInstant: true };
  }

  // 3. Suffix analysis and dynamic semantic hydration
  const suffixes = [
    { suffix: "ingly", apply: (m: string) => "بشكل مستمر لـ " + m },
    { suffix: "ability", apply: (m: string) => "القدرة على " + m },
    { suffix: "ibility", apply: (m: string) => "قابلية " + m },
    { suffix: "ably", apply: (m: string) => "بشكل قابل لـ " + m },
    { suffix: "ibly", apply: (m: string) => "بطريقة قابلة لـ " + m },
    { suffix: "able", apply: (m: string) => "قابل لـ " + m },
    { suffix: "ible", apply: (m: string) => "قابل لـ " + m },
    { suffix: "less", apply: (m: string) => "عديم " + m },
    { suffix: "ness", apply: (m: string) => "حالة الـ " + m },
    { suffix: "ment", apply: (m: string) => "عملية الـ " + m },
    { suffix: "ation", apply: (m: string) => "عملية " + m },
    { suffix: "tion", apply: (m: string) => "عملية " + m },
    { suffix: "sion", apply: (m: string) => "عملية " + m },
    { suffix: "fully", apply: (m: string) => "بشكل كامل لـ " + m },
    { suffix: "ful", apply: (m: string) => "مليء بـ " + m },
    { suffix: "est", apply: (m: string) => "الأكثر " + m },
    { suffix: "er", apply: (m: string) => "أكثر " + m + " أو فاعل" },
    { suffix: "ed", apply: (m: string) => m + " (سابق/تم)" },
    { suffix: "ing", apply: (m: string) => "جاري " + m },
    { suffix: "ly", apply: (m: string) => "بشكل " + m },
    { suffix: "s", apply: (m: string) => "جمع: " + m },
    { suffix: "es", apply: (m: string) => "جمع: " + m },
    { suffix: "ist", apply: (m: string) => "مختص بـ " + m },
    { suffix: "ism", apply: (m: string) => "مذهب أو نظرية الـ " + m },
    { suffix: "ize", apply: (m: string) => "يجعل " + m },
    { suffix: "ise", apply: (m: string) => "يجعل " + m },
    { suffix: "ify", apply: (m: string) => "يحول إلى " + m },
    { suffix: "ical", apply: (m: string) => "متعلق بـ " + m },
    { suffix: "ic", apply: (m: string) => "متعلق بـ " + m }
  ];

  for (const rule of suffixes) {
    if (w.endsWith(rule.suffix) && w.length > rule.suffix.length + 2) {
      const root = w.slice(0, -rule.suffix.length);
      const rootsToTry = [root];

      if (rule.suffix === "ies" || w.endsWith("ies")) {
        rootsToTry.push(w.slice(0, -3) + "y");
      }
      if (rule.suffix === "es" && root.endsWith("i")) {
        rootsToTry.push(root.slice(0, -1) + "y");
      }
      if (root.endsWith("ic")) {
        rootsToTry.push(root + "s");
      }
      if (rule.suffix === "ed" || rule.suffix === "ing") {
        rootsToTry.push(root + "e");
        if (root.length > 2 && root[root.length - 1] === root[root.length - 2]) {
          rootsToTry.push(root.slice(0, -1));
        }
      }

      for (const r of rootsToTry) {
        if (FULL_DICTIONARY[r] || LOCAL_DICTIONARY[r]) {
          const baseMeanings = FULL_DICTIONARY[r] || LOCAL_DICTIONARY[r];
          let modifiedMeanings = baseMeanings.map(m => rule.apply(m));
          if (negative) {
            modifiedMeanings = modifiedMeanings.map(m => "غير " + m);
          }
          return {
            meanings: modifiedMeanings,
            text: modifiedMeanings.join("، "),
            isInstant: true
          };
        }
      }
    }
  }

  return null;
}

export function getInstantTranslation(
  word: string,
  onUpdate?: (meanings: string[], joinedText: string) => void
): { meanings: string[]; text: string; isInstant: boolean } {
  const normalized = word.trim().toLowerCase();
  
  if (dynamicCache[normalized]) {
    const meanings = dynamicCache[normalized];
    return { meanings, text: meanings.join("، "), isInstant: true };
  }

  const stemmed = stemAndTranslate(normalized);
  if (stemmed) {
    dynamicCache[normalized] = stemmed.meanings;
    return stemmed;
  }

  try {
    const cached = localStorage.getItem(`masar-dict-${normalized}`);
    if (cached) {
      const meanings = JSON.parse(cached);
      dynamicCache[normalized] = meanings;
      return { meanings, text: meanings.join("، "), isInstant: true };
    }
  } catch {}

  if (onUpdate) {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=ar&dt=t&q=${encodeURIComponent(normalized)}`;
    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (data && data[0] && data[0][0] && data[0][0][0]) {
          const translated = data[0][0][0];
          const meanings = [translated];
          dynamicCache[normalized] = meanings;
          try {
            localStorage.setItem(`masar-dict-${normalized}`, JSON.stringify(meanings));
          } catch {}
          
          useVocabularyStore.getState().addWord(normalized, meanings).catch(() => {});
          onUpdate(meanings, translated);
        }
      })
      .catch((fallbackErr) => {
        console.error(`Google Translate fallback failed for '${normalized}':`, fallbackErr);
      });
  }

  return { 
    meanings: [word], 
    text: "جاري الترجمة...", 
    isInstant: false 
  };
}

