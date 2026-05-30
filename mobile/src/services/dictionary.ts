import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';
import * as SQLite from 'expo-sqlite';
import AsyncStorage from '../utils/asyncStorage';
import { translate } from '../api/endpoints';
import { syncManager } from './syncManager';

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

let db: SQLite.SQLiteDatabase | null = null;

export async function initializeDictionary() {
  const dbName = "masar_dict.db";
  const dbPath = `${FileSystem.documentDirectory}SQLite/${dbName}`;
  
  try {
    const fileInfo = await FileSystem.getInfoAsync(dbPath);
    if (!fileInfo.exists) {
      const dbDir = `${FileSystem.documentDirectory}SQLite/`;
      const dirInfo = await FileSystem.getInfoAsync(dbDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(dbDir, { intermediates: true });
      }
      
      const asset = Asset.fromModule(require('../../assets/masar_dict.db'));
      await asset.downloadAsync();
      if (asset.localUri) {
        await FileSystem.copyAsync({
          from: asset.localUri,
          to: dbPath
        });
        console.log('[Dictionary] Copied masar_dict.db from assets.');
      }
    }
    
    db = SQLite.openDatabaseSync(dbName);
    
    // Create the vocabulary view and table if not exist
    db.execSync(`
      CREATE TABLE IF NOT EXISTS dictionary (
        word TEXT PRIMARY KEY,
        meanings TEXT NOT NULL
      );
      CREATE VIEW IF NOT EXISTS vocabulary AS 
      SELECT word, meanings, word AS root FROM dictionary;
    `);
    console.log('[Dictionary] SQLite database initialized successfully.');
  } catch (e) {
    console.warn('[Dictionary] Error initializing SQLite database:', e);
  }
}

// Start initialization in background
initializeDictionary();

export async function initializeDictionaryCache() {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const dictKeys = keys.filter(k => k.startsWith('masar-dict-'));
    const pairs = await AsyncStorage.multiGet(dictKeys);
    for (const [key, value] of pairs) {
      if (value) {
        const word = key.replace('masar-dict-', '');
        dynamicCache[word] = JSON.parse(value);
      }
    }
  } catch (e) {
    console.warn('Failed to load dictionary cache:', e);
  }
}

initializeDictionaryCache();

interface TranslationResult {
  meanings: string[];
  text: string;
  isInstant: boolean;
}

// Morphological stemmer rules helper
function getStems(w: string): string[] {
  const stems: string[] = [w];
  
  // 1. Negative prefixes
  const negPrefixes = ["un", "dis", "im", "in", "ir", "non", "mis"];
  for (const prefix of negPrefixes) {
    if (w.startsWith(prefix) && w.length > prefix.length + 2) {
      stems.push(w.slice(prefix.length));
    }
  }
  
  // 2. Suffixes
  const suffixes = [
    "ingly", "ability", "ibility", "ably", "ibly", "able", "ible",
    "less", "ness", "ment", "ation", "tion", "sion", "fully", "ful",
    "est", "er", "ed", "ing", "ly", "s", "es", "ist", "ism", "ize",
    "ise", "ify", "ical", "ic"
  ];
  
  for (const suffix of suffixes) {
    if (w.endsWith(suffix) && w.length > suffix.length + 2) {
      const root = w.slice(0, -suffix.length);
      stems.push(root);
      if (suffix === "ies" || w.endsWith("ies")) {
        stems.push(w.slice(0, -3) + "y");
      }
      if (suffix === "es" && root.endsWith("i")) {
        stems.push(root.slice(0, -1) + "y");
      }
      if (suffix === "ed" || suffix === "ing") {
        stems.push(root + "e");
        if (root.length > 2 && root[root.length - 1] === root[root.length - 2]) {
          stems.push(root.slice(0, -1));
        }
      }
    }
  }
  
  return Array.from(new Set(stems));
}

let fallbackJsonDict: Record<string, string[]> | null = null;
function getJsonFallback(word: string): string[] | null {
  if (!fallbackJsonDict) {
    try {
      fallbackJsonDict = require('../assets/dictionary.json');
      console.log('[Dictionary] Loaded fallback dictionary JSON.');
    } catch (e) {
      console.warn('[Dictionary] Failed to load fallback dictionary.json:', e);
      fallbackJsonDict = {};
    }
  }
  return fallbackJsonDict ? fallbackJsonDict[word] || null : null;
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

  if (LOCAL_DICTIONARY[normalized]) {
    const meanings = LOCAL_DICTIONARY[normalized];
    return { meanings, text: meanings.join("، "), isInstant: true };
  }

  // Query SQLite DB if open
  if (db) {
    try {
      const stems = getStems(normalized);
      for (const stem of stems) {
        const row = db.getFirstSync<any>(
          'SELECT * FROM vocabulary WHERE root = ? OR word = ? LIMIT 1',
          [stem, stem]
        );
        if (row && row.meanings) {
          const parsed = JSON.parse(row.meanings);
          let meanings = parsed;
          if (normalized !== stem && (normalized.startsWith("un") || normalized.startsWith("dis") || normalized.startsWith("non"))) {
            meanings = parsed.map((m: string) => "غير " + m);
          }
          dynamicCache[normalized] = meanings;
          return { meanings, text: meanings.join("، "), isInstant: true };
        }
      }
    } catch (e) {
      console.warn('[Dictionary] SQLite query failed:', e);
    }
  }

  // Query the offline JSON dictionary fallback
  try {
    const jsonMeanings = getJsonFallback(normalized);
    if (jsonMeanings && jsonMeanings.length > 0) {
      dynamicCache[normalized] = jsonMeanings;
      // Persist to SQLite in background if possible
      if (db) {
        try {
          db.runSync(
            'INSERT OR REPLACE INTO dictionary (word, meanings) VALUES (?, ?)',
            [normalized, JSON.stringify(jsonMeanings)]
          );
        } catch {}
      }
      return { meanings: jsonMeanings, text: jsonMeanings.join("، "), isInstant: true };
    }
  } catch (e) {
    console.warn('[Dictionary] JSON fallback check failed:', e);
  }

  try {
    const syncWords = syncManager.getVocabulary();
    const ledgerWord = syncWords.find(w => w.word.toLowerCase() === normalized);
    if (ledgerWord && ledgerWord.meanings.length > 0) {
      dynamicCache[normalized] = ledgerWord.meanings;
      return { meanings: ledgerWord.meanings, text: ledgerWord.meanings.join("، "), isInstant: true };
    }
  } catch {}

  if (onUpdate) {
    // Instant Google Translate fallback
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=ar&dt=t&q=${encodeURIComponent(normalized)}`;
    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (data && data[0] && data[0][0] && data[0][0][0]) {
          const translated = data[0][0][0];
          const meanings = [translated];
          dynamicCache[normalized] = meanings;
          AsyncStorage.setItem(`masar-dict-${normalized}`, JSON.stringify(meanings)).catch(() => {});
          syncManager.addVocabularyWord(normalized, meanings).catch(() => {});
          
          if (db) {
            try {
              db.runSync(
                'INSERT OR REPLACE INTO dictionary (word, meanings) VALUES (?, ?)',
                [normalized, JSON.stringify(meanings)]
              );
            } catch (sqliteErr) {
              console.warn('[Dictionary] Failed to insert newly translated word to SQLite:', sqliteErr);
            }
          }
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

