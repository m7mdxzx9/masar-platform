import { storage } from '../utils/asyncStorage';
import apiClient from '../api/client';

const STORAGE_KEYS = {
  SUBJECTS: 'masar-mobile-subjects',
  NOTES: 'masar-mobile-notes',
  SCHEDULE_COURSES: 'masar-mobile-schedule-courses',
  VOCABULARY: 'masar-mobile-vocabulary',
  DELETED_SUBJECTS: 'masar-mobile-deleted-subjects',
  DELETED_NOTES: 'masar-mobile-deleted-notes',
  DELETED_SCHEDULE_COURSES: 'masar-mobile-deleted-schedule-courses',
  LAB_CODE: 'masar-mobile-lab-code',
};

export interface VocabularyWord {
  id?: number;
  word: string;
  meanings: string[];
  updated_at?: string;
  is_local_only?: boolean;
}

// Generates a safe 32-bit signed integer ID for database insertion
export const generateSafeIntId = (): number => {
  return Math.floor(1000000000 + Math.random() * 1147483647);
};

export interface Subject {
  id: number;
  name: string;
  code?: string | null;
  instructor?: string | null;
  schedule_day?: string | null;
  schedule_time?: string | null;
  room?: string | null;
  color?: string | null;
  notes?: string | null;
  updated_at?: string;
  is_local_only?: boolean;
}

export interface Note {
  id: number;
  title: string;
  content?: string | null;
  type: string;
  audio_file_path?: string | null;
  duration?: number | null;
  updated_at?: string;
  created_at?: string;
  is_local_only?: boolean;
}

export interface ScheduleCourse {
  id: string;
  name: string;
  code?: string | null;
  time: string;
  day: string;
  room?: string | null;
  instructor?: string | null;
  is_template: boolean;
  updated_at?: string;
  is_local_only?: boolean;
}

class SyncManager {
  private subjects: Subject[] = [];
  private notes: Note[] = [];
  private scheduleCourses: ScheduleCourse[] = [];
  private vocabularyWords: VocabularyWord[] = [];
  private deletedSubjects: number[] = [];
  private deletedNotes: number[] = [];
  private deletedScheduleCourses: string[] = [];
  
  private listeners: Set<() => void> = new Set();
  private wsListeners: Set<(msg: any) => void> = new Set();
  private socket: WebSocket | null = null;
  private isSyncing = false;
  private pushTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private labCode = '';

  /**
   * Initialize sync manager. Loads local cache, runs pull, and connects WS.
   */
  public async initialize() {
    console.log('[SyncManager] Initializing Mobile Sync Manager...');
    try {
      const cachedSubs = storage.getString(STORAGE_KEYS.SUBJECTS);
      const cachedNotes = storage.getString(STORAGE_KEYS.NOTES);
      const cachedSched = storage.getString(STORAGE_KEYS.SCHEDULE_COURSES);
      const cachedVocab = storage.getString(STORAGE_KEYS.VOCABULARY);
      const cachedDelSubs = storage.getString(STORAGE_KEYS.DELETED_SUBJECTS);
      const cachedDelNotes = storage.getString(STORAGE_KEYS.DELETED_NOTES);
      const cachedDelSched = storage.getString(STORAGE_KEYS.DELETED_SCHEDULE_COURSES);

      if (cachedSubs) this.subjects = JSON.parse(cachedSubs);
      if (cachedNotes) this.notes = JSON.parse(cachedNotes);
      if (cachedSched) this.scheduleCourses = JSON.parse(cachedSched);
      if (cachedVocab) this.vocabularyWords = JSON.parse(cachedVocab);
      if (cachedDelSubs) this.deletedSubjects = JSON.parse(cachedDelSubs);
      if (cachedDelNotes) this.deletedNotes = JSON.parse(cachedDelNotes);
      if (cachedDelSched) this.deletedScheduleCourses = JSON.parse(cachedDelSched);
      const cachedLabCode = storage.getString(STORAGE_KEYS.LAB_CODE);
      if (cachedLabCode) this.labCode = cachedLabCode;

      this.notifyListeners();
    } catch (e) {
      console.warn('[SyncManager] Failed to load local cache:', e);
    }

    // Initial pull
    this.pull().catch(() => {});

    // Setup real-time signaling
    this.connectWebSocket();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((l) => l());
  }

  /**
   * Pull changes from FastAPI backend and merge them using "latest timestamp wins" strategy.
   */
  public async pull() {
    if (this.isSyncing) return;
    this.isSyncing = true;
    try {
      console.log('[SyncManager] Pulling latest state from backend...');
      const res = await apiClient.get<any>('/sync/pull');
      if (res.ok && res.data) {
        const { subjects, notes, schedule_courses, vocabulary, lab_code } = res.data;
        if (lab_code !== undefined && lab_code !== null) {
          this.labCode = lab_code;
        }

        // Filter out items that are marked as deleted locally and not yet synced
        const filteredSubjects = subjects.filter((s: any) => !this.deletedSubjects.includes(s.id));
        const filteredNotes = notes.filter((n: any) => !this.deletedNotes.includes(n.id));
        const filteredSchedule = schedule_courses.filter((sc: any) => !this.deletedScheduleCourses.includes(sc.id));

        // Merge Subjects
        this.subjects = this.mergeLists(this.subjects, filteredSubjects);
        // Merge Notes
        this.notes = this.mergeLists(this.notes, filteredNotes);
        // Merge Schedule Courses
        this.scheduleCourses = this.mergeLists(this.scheduleCourses, filteredSchedule);
        // Merge Vocabulary
        if (vocabulary) {
          this.vocabularyWords = this.mergeVocabulary(this.vocabularyWords, vocabulary);
        }

        await this.persistLocalData();
        this.notifyListeners();
        console.log('[SyncManager] Pull successful. Data merged.');
      }
    } catch (err) {
      console.warn('[SyncManager] Pull failed:', err);
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Push current local state to the backend database.
   */
  public async push() {
    if (this.isSyncing) return;
    this.isSyncing = true;
    try {
      console.log('[SyncManager] Pushing local state to backend...');
      const payload = {
        lab_code: this.labCode,
        subjects: this.subjects.map(s => {
          const { is_local_only, ...rest } = s as any;
          return { ...rest, updated_at: s.updated_at || new Date().toISOString() };
        }),
        notes: this.notes.map(n => {
          const { is_local_only, ...rest } = n as any;
          return { ...rest, updated_at: n.updated_at || new Date().toISOString() };
        }),
        courses: [],
        schedule_courses: this.scheduleCourses.map(sc => {
          const { is_local_only, ...rest } = sc as any;
          return { ...rest, updated_at: sc.updated_at || new Date().toISOString() };
        }),
        vocabulary: this.vocabularyWords.map(v => ({
          id: v.id ?? 0,
          word: v.word,
          meanings: v.meanings,
          updated_at: v.updated_at || new Date().toISOString()
        })),
        deleted_subjects: this.deletedSubjects,
        deleted_notes: this.deletedNotes,
        deleted_courses: [],
        deleted_schedule_courses: this.deletedScheduleCourses,
      };

      const res = await apiClient.post<any>('/sync/push', payload);
      if (res.ok) {
        console.log('[SyncManager] Push successful.');

        // Clear local only flags
        this.subjects = this.subjects.map(s => {
          if (s.is_local_only) {
            const { is_local_only, ...rest } = s;
            return rest;
          }
          return s;
        });
        this.notes = this.notes.map(n => {
          if (n.is_local_only) {
            const { is_local_only, ...rest } = n;
            return rest;
          }
          return n;
        });
        this.scheduleCourses = this.scheduleCourses.map(sc => {
          if (sc.is_local_only) {
            const { is_local_only, ...rest } = sc;
            return rest;
          }
          return sc;
        });

        // Clear deleted queues
        this.deletedSubjects = [];
        this.deletedNotes = [];
        this.deletedScheduleCourses = [];

        await this.persistLocalData();
        this.notifyListeners();

        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
          this.socket.send(JSON.stringify({ type: 'SYNC_TRIGGER', sender: 'mobile' }));
        }
      }
    } catch (err) {
      console.warn('[SyncManager] Push failed:', err);
    } finally {
      this.isSyncing = false;
    }
  }

  public triggerDebouncedPush() {
    if (this.pushTimer) clearTimeout(this.pushTimer);
    this.pushTimer = setTimeout(() => {
      this.push();
    }, 2000);
  }

  private mergeLists<T extends { id: any; updated_at?: string; is_local_only?: boolean }>(local: T[], remote: T[]): T[] {
    const remoteMap = new Map<any, T>();
    remote.forEach(item => remoteMap.set(item.id, item));

    const resultMap = new Map<any, T>();

    // 1. Process local items
    local.forEach(localItem => {
      const remoteItem = remoteMap.get(localItem.id);
      if (remoteItem) {
        // Exists in both, merge by timestamp
        const localTime = localItem.updated_at ? new Date(localItem.updated_at).getTime() : 0;
        const remoteTime = remoteItem.updated_at ? new Date(remoteItem.updated_at).getTime() : 0;
        if (remoteTime >= localTime) {
          resultMap.set(localItem.id, remoteItem);
        } else {
          resultMap.set(localItem.id, localItem);
        }
      } else {
        // Local item is NOT present in remote list
        if (localItem.is_local_only) {
          // Keep local only item
          resultMap.set(localItem.id, localItem);
        } else {
          // Sync deletion from server
          console.log(`[SyncManager] Item ${localItem.id} was deleted on server.`);
        }
      }
    });

    // 2. Process remaining remote items
    remote.forEach(remoteItem => {
      if (!resultMap.has(remoteItem.id)) {
        resultMap.set(remoteItem.id, remoteItem);
      }
    });

    return Array.from(resultMap.values());
  }

  private mergeVocabulary(local: VocabularyWord[], remote: VocabularyWord[]): VocabularyWord[] {
    const map = new Map<string, VocabularyWord>();
    local.forEach(item => map.set(item.word.toLowerCase(), item));

    remote.forEach(item => {
      const key = item.word.toLowerCase();
      const existing = map.get(key);
      if (!existing) {
        map.set(key, item);
      } else {
        const localTime = existing.updated_at ? new Date(existing.updated_at).getTime() : 0;
        const remoteTime = item.updated_at ? new Date(item.updated_at).getTime() : 0;
        if (remoteTime > localTime) {
          map.set(key, item);
        } else {
          // Merge meanings list without duplicates
          const mergedMeanings = Array.from(new Set([...existing.meanings, ...item.meanings]));
          map.set(key, {
            ...existing,
            ...item,
            meanings: mergedMeanings,
            is_local_only: existing.is_local_only && item.is_local_only
          });
        }
      }
    });

    return Array.from(map.values());
  }

  private async persistLocalData() {
    try {
      storage.set(STORAGE_KEYS.SUBJECTS, JSON.stringify(this.subjects));
      storage.set(STORAGE_KEYS.NOTES, JSON.stringify(this.notes));
      storage.set(STORAGE_KEYS.SCHEDULE_COURSES, JSON.stringify(this.scheduleCourses));
      storage.set(STORAGE_KEYS.VOCABULARY, JSON.stringify(this.vocabularyWords));
      storage.set(STORAGE_KEYS.DELETED_SUBJECTS, JSON.stringify(this.deletedSubjects));
      storage.set(STORAGE_KEYS.DELETED_NOTES, JSON.stringify(this.deletedNotes));
      storage.set(STORAGE_KEYS.DELETED_SCHEDULE_COURSES, JSON.stringify(this.deletedScheduleCourses));
      storage.set(STORAGE_KEYS.LAB_CODE, this.labCode);
    } catch (e) {
      console.warn('[SyncManager] Failed to persist data to MMKV:', e);
    }
  }

  // --- WebSocket Connection ---

  private getWebSocketUrl(): string {
    const httpUrl = apiClient.getBaseUrl();
    if (!httpUrl) {
      return 'wss://masar-backend-v72t.onrender.com/api/v1/sync/ws';
    }
    let wsUrl = httpUrl;
    if (wsUrl.startsWith('https://')) {
      wsUrl = wsUrl.replace('https://', 'wss://');
    } else if (wsUrl.startsWith('http://')) {
      wsUrl = wsUrl.replace('http://', 'ws://');
    }
    if (wsUrl.endsWith('/')) {
      wsUrl = wsUrl.slice(0, -1);
    }
    return `${wsUrl}/sync/ws`;
  }

  public reconnect() {
    console.log('[SyncManager] Reconnecting WebSocket due to server change...');
    if (this.socket) {
      try {
        this.socket.close();
      } catch {}
      this.socket = null;
    } else {
      this.connectWebSocket();
    }
  }

  private connectWebSocket() {
    const wsUrl = this.getWebSocketUrl();
    console.log(`[SyncManager] Connecting Mobile Sync WS to ${wsUrl}`);
    try {
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        console.log('[SyncManager] Mobile Sync WS Connected.');
        this.reconnectAttempts = 0;
      };

      this.socket.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          if (msg.type === 'SYNC_TRIGGER' && msg.sender !== 'mobile') {
            console.log('[SyncManager] Broadcast received. Pulling...');
            this.pull();
          }
          if (msg.type === 'LAB_CODE_UPDATE' && msg.sender !== 'mobile') {
            if (msg.code !== undefined) {
              this.labCode = msg.code;
              this.persistLocalData().catch(() => {});
            }
          }
          this.wsListeners.forEach(listener => listener(msg));
        } catch {}
      };

      this.socket.onclose = () => {
        console.log('[SyncManager] Mobile Sync WS Closed. Reconnecting...');
        this.handleReconnect();
      };

      this.socket.onerror = () => {
        console.log('[SyncManager] Mobile Sync WS Error.');
      };
    } catch (err) {
      console.warn('[SyncManager] WS connection failed:', err);
      this.handleReconnect();
    }
  }

  private handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) return;
    this.reconnectAttempts++;
    const delay = Math.min(2000 * Math.pow(2, this.reconnectAttempts), 30000);
    setTimeout(() => this.connectWebSocket(), delay);
  }

  // --- CRUD API for Local Offline DB ---

  // 1. Subjects
  public getSubjects(): Subject[] {
    return this.subjects;
  }

  public async addSubject(name: string, code?: string, instructor?: string, room?: string, color?: string, notes?: string) {
    const newSub: Subject = {
      id: generateSafeIntId(),
      name,
      code,
      instructor,
      room,
      color: color || '#6366f1',
      notes,
      updated_at: new Date().toISOString(),
      is_local_only: true
    };
    this.subjects.push(newSub);
    await this.persistLocalData();
    this.notifyListeners();
    this.triggerDebouncedPush();
    return newSub;
  }

  public async updateSubject(id: number, updates: Partial<Omit<Subject, 'id'>>) {
    this.subjects = this.subjects.map(s => {
      if (s.id === id) {
        return { ...s, ...updates, updated_at: new Date().toISOString() };
      }
      return s;
    });
    await this.persistLocalData();
    this.notifyListeners();
    this.triggerDebouncedPush();
  }

  public async deleteSubject(id: number) {
    const item = this.subjects.find(s => s.id === id);
    if (item && !item.is_local_only) {
      if (!this.deletedSubjects.includes(id)) {
        this.deletedSubjects.push(id);
      }
    }
    this.subjects = this.subjects.filter(s => s.id !== id);
    await this.persistLocalData();
    this.notifyListeners();
    apiClient.delete(`/subjects/${id}`).catch(() => {});
    this.triggerDebouncedPush();
  }

  // 2. Notes
  public getNotes(): Note[] {
    return this.notes;
  }

  public async addNote(content: string, title?: string) {
    const newNote: Note = {
      id: generateSafeIntId(),
      title: title || 'ملاحظة سريعة',
      content,
      type: 'text',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_local_only: true
    };
    this.notes.unshift(newNote);
    await this.persistLocalData();
    this.notifyListeners();
    this.triggerDebouncedPush();
    return newNote;
  }

  public async deleteNote(id: number) {
    const item = this.notes.find(n => n.id === id);
    if (item && !item.is_local_only) {
      if (!this.deletedNotes.includes(id)) {
        this.deletedNotes.push(id);
      }
    }
    this.notes = this.notes.filter(n => n.id !== id);
    await this.persistLocalData();
    this.notifyListeners();
    apiClient.delete(`/notes/${id}`).catch(() => {});
    this.triggerDebouncedPush();
  }

  public async updateNote(id: number, updates: Partial<Omit<Note, 'id'>>) {
    this.notes = this.notes.map(n => {
      if (n.id === id) {
        return { ...n, ...updates, updated_at: new Date().toISOString() };
      }
      return n;
    });
    await this.persistLocalData();
    this.notifyListeners();
    apiClient.put(`/notes/${id}`, updates).catch(() => {});
    this.triggerDebouncedPush();
  }

  // 3. Schedule Courses
  public getScheduleCourses(): ScheduleCourse[] {
    return this.scheduleCourses;
  }

  public async addScheduleCourse(course: Omit<ScheduleCourse, 'updated_at'>) {
    const newCourse: ScheduleCourse = {
      ...course,
      updated_at: new Date().toISOString(),
      is_local_only: true
    };
    this.scheduleCourses.push(newCourse);
    await this.persistLocalData();
    this.notifyListeners();
    this.triggerDebouncedPush();
  }

  public async removeScheduleCourse(id: string) {
    const item = this.scheduleCourses.find(sc => sc.id === id);
    if (item && !item.is_local_only) {
      if (!this.deletedScheduleCourses.includes(id)) {
        this.deletedScheduleCourses.push(id);
      }
    }
    this.scheduleCourses = this.scheduleCourses.filter(sc => sc.id !== id);
    await this.persistLocalData();
    this.notifyListeners();
    this.triggerDebouncedPush();
  }

  // 4. Vocabulary
  public getVocabulary(): VocabularyWord[] {
    return this.vocabularyWords;
  }

  public async addVocabularyWord(word: string, meanings: string[]) {
    const normalized = word.trim().toLowerCase();
    if (!normalized) return;

    const existingIdx = this.vocabularyWords.findIndex(w => w.word.toLowerCase() === normalized);
    if (existingIdx !== -1) {
      const currentMeanings = new Set(this.vocabularyWords[existingIdx].meanings);
      meanings.forEach(m => { if (m.trim()) currentMeanings.add(m.trim()) });
      this.vocabularyWords[existingIdx] = {
        ...this.vocabularyWords[existingIdx],
        meanings: Array.from(currentMeanings),
        is_local_only: true,
        updated_at: new Date().toISOString()
      };
    } else {
      this.vocabularyWords.push({
        word: normalized,
        meanings: meanings.filter(m => m.trim()),
        is_local_only: true,
        updated_at: new Date().toISOString()
      });
    }

    await this.persistLocalData();
    this.notifyListeners();
    this.triggerDebouncedPush();
  }

  public async restoreLocalBackup(data: any) {
    if (data.subjects && Array.isArray(data.subjects)) this.subjects = data.subjects;
    if (data.notes && Array.isArray(data.notes)) this.notes = data.notes;
    if (data.scheduleCourses && Array.isArray(data.scheduleCourses)) this.scheduleCourses = data.scheduleCourses;
    if (data.vocabularyWords && Array.isArray(data.vocabularyWords)) this.vocabularyWords = data.vocabularyWords;
    
    await this.persistLocalData();
    this.notifyListeners();
    this.triggerDebouncedPush();
  }
  public subscribeWS(listener: (msg: any) => void): () => void {
    this.wsListeners.add(listener);
    return () => {
      this.wsListeners.delete(listener);
    };
  }

  public sendWSMessage(msg: any) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(msg));
    }
  }

  public getLabCode(): string {
    return this.labCode;
  }

  public async updateLabCode(code: string, sender: 'web' | 'mobile') {
    this.labCode = code;
    await this.persistLocalData();
    this.sendWSMessage({ type: 'LAB_CODE_UPDATE', code, sender });
    this.triggerDebouncedPush();
  }
}


export const syncManager = new SyncManager();
