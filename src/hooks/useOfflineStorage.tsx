import { useState, useEffect } from 'react';

interface OfflineData {
  userProfile: any;
  rewards: any[];
  history: any[];
  lastUpdated: number;
}

export const useOfflineStorage = () => {
  const [offlineData, setOfflineData] = useState<OfflineData | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    // Listen for online/offline events
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Load offline data on startup
    loadOfflineData();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadOfflineData = () => {
    try {
      // Prefer the new Orpheon key; migrate from old Nectar key if present
      const newKey = 'orpheon-offline-data';
      const oldKey = 'nectar-offline-data';

      const storedNew = localStorage.getItem(newKey);
      if (storedNew) {
        setOfflineData(JSON.parse(storedNew));
        return;
      }

      const storedOld = localStorage.getItem(oldKey);
      if (storedOld) {
        const data = JSON.parse(storedOld);
        setOfflineData(data);
        // migrate to new key and remove old one
        localStorage.setItem(newKey, JSON.stringify(data));
        localStorage.removeItem(oldKey);
      }
    } catch (error) {
      console.error('Error loading offline data:', error);
    }
  };

  const saveOfflineData = (data: Partial<OfflineData>) => {
    try {
      const current = offlineData || { userProfile: null, rewards: [], history: [], lastUpdated: 0 };
      const updated = {
        ...current,
        ...data,
        lastUpdated: Date.now()
      };
      
      localStorage.setItem('orpheon-offline-data', JSON.stringify(updated));
      setOfflineData(updated);
    } catch (error) {
      console.error('Error saving offline data:', error);
    }
  };

  const clearOfflineData = () => {
    localStorage.removeItem('orpheon-offline-data');
    localStorage.removeItem('nectar-offline-data');
    setOfflineData(null);
  };

  return {
    offlineData,
    isOnline,
    saveOfflineData,
    clearOfflineData,
    loadOfflineData
  };
};