import { useState, useEffect } from 'react';

export type TimelineStep = {
  id: string;
  content: string;
  timestamp: number;
  type: string;
};

export type Timeline = {
  chatId: string;
  steps: TimelineStep[];
  isVisible: boolean;
  lastUpdated: Date;
};

export function useTimeline(chatId: string) {
  const [timeline, setTimeline] = useState<Timeline | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!chatId) return;
    
    const fetchTimeline = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/timeline?chatId=${chatId}`);
        
        if (response.status === 404) {
          // Timeline doesn't exist yet, create an empty one
          setTimeline({
            chatId,
            steps: [],
            isVisible: false,
            lastUpdated: new Date(),
          });
          setLoading(false);
          return;
        }
        
        if (!response.ok) {
          throw new Error('Failed to fetch timeline');
        }
        
        const data = await response.json();
        setTimeline(data);
      } catch (err) {
        console.error('Error fetching timeline:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTimeline();
  }, [chatId]);

  const addStep = async (step: Omit<TimelineStep, 'id' | 'timestamp'>) => {
    if (!timeline) return;
    
    const newStep = {
      ...step,
      id: Math.random().toString(36).substring(2, 9),
      timestamp: Date.now(),
    };
    
    const newSteps = [...timeline.steps, newStep];
    
    // Update local state immediately for better UX
    setTimeline({
      ...timeline,
      steps: newSteps,
      lastUpdated: new Date(),
    });
    
    // Then update in database
    try {
      const response = await fetch('/api/timeline', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatId,
          steps: newSteps,
          isVisible: timeline.isVisible,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update timeline');
      }
    } catch (err) {
      console.error('Error updating timeline:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const removeStep = async (stepId: string) => {
    if (!timeline) return;
    
    const newSteps = timeline.steps.filter(step => step.id !== stepId);
    
    // Update local state immediately
    setTimeline({
      ...timeline,
      steps: newSteps,
      lastUpdated: new Date(),
    });
    
    // Then update in database
    try {
      const response = await fetch('/api/timeline', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatId,
          steps: newSteps,
          isVisible: timeline.isVisible,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update timeline');
      }
    } catch (err) {
      console.error('Error updating timeline:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const toggleVisibility = async () => {
    if (!timeline) return;
    
    const newVisibility = !timeline.isVisible;
    
    // Update local state immediately
    setTimeline({
      ...timeline,
      isVisible: newVisibility,
      lastUpdated: new Date(),
    });
    
    // Then update in database
    try {
      const response = await fetch('/api/timeline', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatId,
          steps: timeline.steps,
          isVisible: newVisibility,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update timeline visibility');
      }
    } catch (err) {
      console.error('Error updating timeline visibility:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  return {
    timeline,
    loading,
    error,
    addStep,
    removeStep,
    toggleVisibility,
  };
} 