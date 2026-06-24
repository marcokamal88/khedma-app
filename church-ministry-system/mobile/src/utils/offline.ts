import AsyncStorage from '@react-native-async-storage/async-storage';

const PENDING_MUTATIONS_KEY = 'pending_mutations';

interface PendingMutation {
  id: string;
  endpoint: string;
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  data?: any;
  createdAt: string;
  retryCount: number;
}

export const offlineQueue = {
  async add(mutation: Omit<PendingMutation, 'id' | 'createdAt' | 'retryCount'>) {
    const queue = await this.getAll();
    queue.push({
      ...mutation,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      retryCount: 0,
    });
    await AsyncStorage.setItem(PENDING_MUTATIONS_KEY, JSON.stringify(queue));
  },

  async getAll(): Promise<PendingMutation[]> {
    const json = await AsyncStorage.getItem(PENDING_MUTATIONS_KEY);
    return json ? JSON.parse(json) : [];
  },

  async remove(id: string) {
    const queue = await this.getAll();
    const filtered = queue.filter((m) => m.id !== id);
    await AsyncStorage.setItem(PENDING_MUTATIONS_KEY, JSON.stringify(filtered));
  },

  async clear() {
    await AsyncStorage.removeItem(PENDING_MUTATIONS_KEY);
  },

  async size(): Promise<number> {
    const queue = await this.getAll();
    return queue.length;
  },
};
