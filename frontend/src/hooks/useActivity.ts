import { useState, useEffect, useCallback } from 'react';
import { SecretActivity } from '@/types';

const STORAGE_KEY = 'secure-drop-activity';
const MAX_ACTIVITIES = 10;

export function useActivity() {
  const [activities, setActivities] = useState<SecretActivity[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(activities));
  }, [activities]);

  const addActivity = useCallback((id: string, url: string) => {
    const newActivity: SecretActivity = {
      id,
      url,
      createdAt: new Date().toISOString(),
    };

    setActivities((prev) => {
      const updated = [newActivity, ...prev].slice(0, MAX_ACTIVITIES);
      return updated;
    });
  }, []);

  const removeActivity = useCallback((id: string) => {
    setActivities((prev) => prev.filter((activity) => activity.id !== id));
  }, []);

  const clearActivities = useCallback(() => {
    setActivities([]);
  }, []);

  return {
    activities,
    addActivity,
    removeActivity,
    clearActivities,
  };
}
