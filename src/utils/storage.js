// src/utils/storage.js
export const storage = {
  async get(key) {
    try {
      const value = localStorage.getItem(key);
      return value ? { key, value } : null;
    } catch (error) {
      console.error('Storage get error:', error);
      return null;
    }
  },
  
  async set(key, value) {
    try {
      localStorage.setItem(key, value);
      return { key, value };
    } catch (error) {
      console.error('Storage set error:', error);
      return null;
    }
  },
  
  async delete(key) {
    try {
      localStorage.removeItem(key);
      return { key, deleted: true };
    } catch (error) {
      console.error('Storage delete error:', error);
      return null;
    }
  },
  
  async list(prefix) {
    try {
      const keys = Object.keys(localStorage).filter(k => 
        prefix ? k.startsWith(prefix) : true
      );
      return { keys };
    } catch (error) {
      console.error('Storage list error:', error);
      return { keys: [] };
    }
  }
};

// Make it available globally for compatibility
if (typeof window !== 'undefined') {
  window.storage = storage;
}