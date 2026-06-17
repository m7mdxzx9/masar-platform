import { useSubjectsStore } from '../stores/subjectsStore';
import { useNotesStore } from '../stores/notesStore';
import { useScheduleStore, Course } from '../stores/scheduleStore';
import { useVocabularyStore } from '../stores/vocabularyStore';
import { API_BASE_URL, api } from './api';

const getWsUrl = () => {
  if (API_BASE_URL.startsWith('http')) {
    return API_BASE_URL.startsWith('https')
      ? API_BASE_URL.replace(/^https/, 'wss') + '/sync/ws'
      : API_BASE_URL.replace(/^http/, 'ws') + '/sync/ws';
  }
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;
  return `${protocol}//${host}${API_BASE_URL}/sync/ws`;
};

class SyncManager {
  private socket: WebSocket | null = null;
  private isSyncing = false;
  private debounceTimer: number | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private wsListeners: Set<(msg: any) => void> = new Set();
  private labCode = '';

  private deletedSubjects: number[] = [];
  private deletedNotes: number[] = [];
  private deletedScheduleCourses: string[] = [];

  constructor() {
    this.loadDeletions();
  }

  private loadDeletions() {
    try {
      const subs = localStorage.getItem('masar-web-deleted-subjects');
      const notes = localStorage.getItem('masar-web-deleted-notes');
      const sched = localStorage.getItem('masar-web-deleted-schedule-courses');
      if (subs) this.deletedSubjects = JSON.parse(subs);
      if (notes) this.deletedNotes = JSON.parse(notes);
      if (sched) this.deletedScheduleCourses = JSON.parse(sched);
    } catch {}
  }

  private saveDeletions() {
    try {
      localStorage.setItem('masar-web-deleted-subjects', JSON.stringify(this.deletedSubjects));
      localStorage.setItem('masar-web-deleted-notes', JSON.stringify(this.deletedNotes));
      localStorage.setItem('masar-web-deleted-schedule-courses', JSON.stringify(this.deletedScheduleCourses));
    } catch {}
  }

  public queueDeletion(type: 'subject' | 'note' | 'schedule_course', id: any) {
    if (type === 'subject') {
      if (!this.deletedSubjects.includes(id)) {
        this.deletedSubjects.push(id);
      }
    } else if (type === 'note') {
      if (!this.deletedNotes.includes(id)) {
        this.deletedNotes.push(id);
      }
    } else if (type === 'schedule_course') {
      if (!this.deletedScheduleCourses.includes(id)) {
        this.deletedScheduleCourses.push(id);
      }
    }
    this.saveDeletions();
  }

  private mergeLists<T extends { id: any; updated_at?: string | null; is_local_only?: boolean }>(local: T[], remote: T[]): T[] {
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
          resultMap.set(localItem.id, localItem);
        } else {
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

  /**
   * Pulls the latest state from the backend and updates the Zustand stores.
   */
  public async pull() {
    if (this.isSyncing) return;
    this.isSyncing = true;
    try {
      console.log('[SyncManager] Pulling latest state from backend...');
      const response = await api.get<{
        subjects: any[];
        notes: any[];
        courses: any[];
        schedule_courses: any[];
        vocabulary?: any[];
        lab_code?: string;
      }>('/sync/pull');

      const { subjects, notes, schedule_courses, vocabulary, lab_code } = response.data;
      if (lab_code !== undefined && lab_code !== null) {
        this.labCode = lab_code;
      }

      // Filter out items queued for deletion
      const filteredSubjects = subjects.filter((s: any) => !this.deletedSubjects.includes(s.id));
      const filteredNotes = notes.filter((n: any) => !this.deletedNotes.includes(n.id));
      const filteredSchedule = schedule_courses.filter((sc: any) => !this.deletedScheduleCourses.includes(sc.id));

      const localSubjects = useSubjectsStore.getState().subjects;
      const localNotes = useNotesStore.getState().notes;
      
      const scheduleState = useScheduleStore.getState();
      const localScheduleCourses = [
        ...scheduleState.courses.map(c => ({ ...c, is_template: true } as any)),
        ...scheduleState.gridCourses.map(c => ({ ...c, is_template: false } as any))
      ];

      const mergedSubjects = this.mergeLists(localSubjects, filteredSubjects);
      const mergedNotes = this.mergeLists(localNotes, filteredNotes);
      const mergedSchedule = this.mergeLists(localScheduleCourses, filteredSchedule);

      // Update Subjects Store
      useSubjectsStore.setState({
        subjects: mergedSubjects.map(s => ({
          ...s,
          file_count: s.file_count ?? 0,
          created_at: s.created_at ?? null,
          updated_at: s.updated_at ?? null
        }))
      });

      // Update Notes Store
      useNotesStore.setState({
        notes: mergedNotes.map(n => ({
          ...n,
          created_at: n.created_at ?? null,
          updated_at: n.updated_at ?? null
        }))
      });

      // Update Schedule Store (separate template palette courses and placed grid courses)
      const courses: Course[] = mergedSchedule
        .filter(sc => sc.is_template)
        .map(sc => ({
          id: sc.id,
          name: sc.name,
          code: sc.code ?? '',
          time: sc.time,
          day: sc.day,
          room: sc.room ?? '',
          instructor: sc.instructor ?? '',
          isTemplate: true
        }));

      const gridCourses: Course[] = mergedSchedule
        .filter(sc => !sc.is_template)
        .map(sc => ({
          id: sc.id,
          name: sc.name,
          code: sc.code ?? '',
          time: sc.time,
          day: sc.day,
          room: sc.room ?? '',
          instructor: sc.instructor ?? '',
          isTemplate: false
        }));

      useScheduleStore.setState({ courses, gridCourses });

      // Update Vocabulary Store
      if (vocabulary) {
        useVocabularyStore.setState({
          words: vocabulary.map(v => ({
            id: v.id,
            word: v.word,
            meanings: v.meanings ?? [],
            updated_at: v.updated_at ?? null,
            is_local_only: false
          }))
        });
      }

      console.log('[SyncManager] State pulled and stores updated successfully.');
    } catch (error) {
      console.error('[SyncManager] Failed to pull state:', error);
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Pushes the current local Zustand stores' states to the backend.
   */
  public async push() {
    if (this.isSyncing) return;
    this.isSyncing = true;
    try {
      console.log('[SyncManager] Pushing local state to backend...');
      
      const subjectsState = useSubjectsStore.getState().subjects;
      const notesState = useNotesStore.getState().notes;
      const scheduleState = useScheduleStore.getState();
      const vocabularyState = useVocabularyStore.getState().words;

      const requestPayload = {
        lab_code: this.labCode,
        subjects: subjectsState.map(s => {
          const { is_local_only, ...rest } = s as any;
          return {
            id: s.id,
            name: s.name,
            code: s.code,
            instructor: s.instructor,
            schedule_day: s.schedule_day,
            schedule_time: s.schedule_time,
            room: s.room,
            color: s.color,
            notes: s.notes,
            updated_at: s.updated_at || new Date().toISOString()
          };
        }),
        notes: notesState.map(n => {
          const { is_local_only, ...rest } = n as any;
          return {
            id: n.id,
            title: n.title,
            content: n.content,
            type: n.type,
            audio_file_path: n.audio_file_path,
            duration: n.duration,
            updated_at: n.updated_at || new Date().toISOString()
          };
        }),
        courses: [], // Empty for now, managed by AI generated routes
        schedule_courses: [
          ...scheduleState.courses.map(c => {
            const { is_local_only, ...rest } = c as any;
            return {
              id: c.id,
              name: c.name,
              code: c.code,
              time: c.time,
              day: c.day,
              room: c.room,
              instructor: c.instructor,
              is_template: true,
              updated_at: new Date().toISOString()
            };
          }),
          ...scheduleState.gridCourses.map(c => {
            const { is_local_only, ...rest } = c as any;
            return {
              id: c.id,
              name: c.name,
              code: c.code,
              time: c.time,
              day: c.day,
              room: c.room,
              instructor: c.instructor,
              is_template: false,
              updated_at: new Date().toISOString()
            };
          })
        ],
        vocabulary: vocabularyState.map(v => ({
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

      await api.post('/sync/push', requestPayload);
      console.log('[SyncManager] Local state pushed successfully.');

      // Clear local_only flag from merged items in stores
      useSubjectsStore.setState({
        subjects: subjectsState.map(s => {
          if (s.is_local_only) {
            const { is_local_only, ...rest } = s;
            return rest;
          }
          return s;
        })
      });

      useNotesStore.setState({
        notes: notesState.map(n => {
          if (n.is_local_only) {
            const { is_local_only, ...rest } = n;
            return rest;
          }
          return n;
        })
      });

      useScheduleStore.setState({
        courses: scheduleState.courses.map(c => {
          if ((c as any).is_local_only) {
            const { is_local_only, ...rest } = c as any;
            return rest;
          }
          return c;
        }),
        gridCourses: scheduleState.gridCourses.map(c => {
          if ((c as any).is_local_only) {
            const { is_local_only, ...rest } = c as any;
            return rest;
          }
          return c;
        })
      });

      // Clear deleted queues
      this.deletedSubjects = [];
      this.deletedNotes = [];
      this.deletedScheduleCourses = [];
      this.saveDeletions();

      // Broadcast sync signal via WebSocket to other devices
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify({ type: 'SYNC_TRIGGER', sender: 'web' }));
      }
    } catch (error) {
      console.error('[SyncManager] Failed to push state:', error);
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Debounces the push operation to prevent overloading the backend on rapid edits.
   */
  public triggerDebouncedPush() {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = window.setTimeout(() => {
      this.push();
    }, 1500); // 1.5 seconds delay
  }

  /**
   * Initializes the synchronization process: connects WebSocket,
   * performs initial pull, and subscribes to store changes.
   */
  public initialize() {
    console.log('[SyncManager] Initializing sync manager...');
    
    // 1. Run initial pull
    this.pull();

    // 2. Establish WebSocket connection for real-time updates
    this.connectWebSocket();

    // 3. Subscribe to Zustand store modifications
    // Skip triggering sync if we are in the middle of a pull sync
    useSubjectsStore.subscribe((state, prevState) => {
      if (this.isSyncing) return;
      if (JSON.stringify(state.subjects) !== JSON.stringify(prevState.subjects)) {
        // Detect deletions
        if (prevState.subjects.length > state.subjects.length) {
          prevState.subjects.forEach(oldSub => {
            if (!state.subjects.some(s => s.id === oldSub.id)) {
              if (!oldSub.is_local_only) {
                this.queueDeletion('subject', oldSub.id);
              }
            }
          });
        }
        this.triggerDebouncedPush();
      }
    });

    useNotesStore.subscribe((state, prevState) => {
      if (this.isSyncing) return;
      if (JSON.stringify(state.notes) !== JSON.stringify(prevState.notes)) {
        // Detect deletions
        if (prevState.notes.length > state.notes.length) {
          prevState.notes.forEach(oldNote => {
            if (!state.notes.some(n => n.id === oldNote.id)) {
              if (!(oldNote as any).is_local_only) {
                this.queueDeletion('note', oldNote.id);
              }
            }
          });
        }
        this.triggerDebouncedPush();
      }
    });

    useScheduleStore.subscribe((state, prevState) => {
      if (this.isSyncing) return;
      if (
        JSON.stringify(state.courses) !== JSON.stringify(prevState.courses) ||
        JSON.stringify(state.gridCourses) !== JSON.stringify(prevState.gridCourses)
      ) {
        // Detect deleted courses
        if (prevState.courses.length > state.courses.length) {
          prevState.courses.forEach(oldCourse => {
            if (!state.courses.some(c => c.id === oldCourse.id)) {
              if (!(oldCourse as any).is_local_only) {
                this.queueDeletion('schedule_course', oldCourse.id);
              }
            }
          });
        }
        // Detect deleted grid courses
        if (prevState.gridCourses.length > state.gridCourses.length) {
          prevState.gridCourses.forEach(oldCourse => {
            if (!state.gridCourses.some(c => c.id === oldCourse.id)) {
              if (!(oldCourse as any).is_local_only) {
                this.queueDeletion('schedule_course', oldCourse.id);
              }
            }
          });
        }
        this.triggerDebouncedPush();
      }
    });

    useVocabularyStore.subscribe((state, prevState) => {
      if (this.isSyncing) return;
      if (JSON.stringify(state.words) !== JSON.stringify(prevState.words)) {
        this.triggerDebouncedPush();
      }
    });
  }

  private connectWebSocket() {
    if (this.socket) {
      try {
        this.socket.onopen = null;
        this.socket.onmessage = null;
        this.socket.onclose = null;
        this.socket.onerror = null;
        this.socket.close();
      } catch {}
      this.socket = null;
    }
    const wsUrl = getWsUrl();
    console.log(`[SyncManager] Connecting to WebSocket at ${wsUrl}`);
    
    try {
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        console.log('[SyncManager] Sync WebSocket connected.');
        this.reconnectAttempts = 0;
      };

      this.socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'SYNC_TRIGGER' && message.sender !== 'web') {
            console.log('[SyncManager] Received sync broadcast. Pulling changes...');
            this.pull();
          }
          if (message.type === 'LAB_CODE_UPDATE' && message.sender !== 'web') {
            if (message.code !== undefined) {
              this.labCode = message.code;
            }
          }
          this.wsListeners.forEach(listener => listener(message));
        } catch (err) {
          console.error('[SyncManager] Error parsing WebSocket message:', err);
        }
      };

      this.socket.onclose = () => {
        console.log('[SyncManager] Sync WebSocket closed. Attempting reconnect...');
        this.handleReconnect();
      };

      this.socket.onerror = (error) => {
        console.error('[SyncManager] Sync WebSocket error:', error);
      };
    } catch (err) {
      console.error('[SyncManager] Failed to create WebSocket connection:', err);
      this.handleReconnect();
    }
  }

  private handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn('[SyncManager] Max WebSocket reconnect attempts reached. Giving up.');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    console.log(`[SyncManager] Reconnecting WebSocket in ${delay}ms...`);
    setTimeout(() => {
      this.connectWebSocket();
    }, delay);
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

  public updateLabCode(code: string, sender: 'web' | 'mobile') {
    this.labCode = code;
    this.sendWSMessage({ type: 'LAB_CODE_UPDATE', code, sender });
    this.triggerDebouncedPush();
  }
}

export const syncManager = new SyncManager();
