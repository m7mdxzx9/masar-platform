import { createMMKV } from 'react-native-mmkv';

const storage = createMMKV({
  id: 'masar-storage'
});

const AsyncStorage = {
  getItem: async (key: string): Promise<string | null> => {
    return storage.getString(key) ?? null;
  },
  setItem: async (key: string, value: string): Promise<void> => {
    storage.set(key, value);
  },
  removeItem: async (key: string): Promise<void> => {
    storage.remove(key);
  },
  getAllKeys: async (): Promise<string[]> => {
    return storage.getAllKeys();
  },
  multiGet: async (keys: string[]): Promise<[string, string | null][]> => {
    return keys.map(key => [key, storage.getString(key) ?? null]);
  },
  clear: async (): Promise<void> => {
    storage.clearAll();
  }
};

export default AsyncStorage;
export { storage };
