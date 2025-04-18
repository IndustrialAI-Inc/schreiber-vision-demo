'use client';

import useSWR, { mutate } from 'swr';
import { useCallback, useEffect, useMemo } from 'react';
import { fetcher } from '@/lib/utils';

// Define the timeline step status type
export type TimelineStepStatus = 'completed' | 'in-progress' | 'pending';

// Define the timeline step interface
export interface TimelineStep {
  id: string;
  label: string;
  status: TimelineStepStatus;
  timestamp?: string;
}

// Timeline state interface
export interface TimelineState {
  id?: string;
  isVisible: boolean;
  steps: TimelineStep[];
  chatId: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

// Initial timeline data
export const initialTimelineData: TimelineState = {
  isVisible: false,
  steps: [
    {
      id: 'prepare',
      label: 'Prepare specifications',
      status: 'pending',
    },
    {
      id: 'review',
      label: 'Internal review',
      status: 'pending',
    },
    {
      id: 'send',
      label: 'Send to supplier',
      status: 'pending',
    },
    {
      id: 'feedback',
      label: 'Supplier feedback',
      status: 'pending',
    },
    {
      id: 'finalize',
      label: 'Finalize specifications',
      status: 'pending',
    },
  ],
  chatId: null,
};

type Selector<T> = (state: TimelineState) => T;

// Selector hook to access parts of the timeline state
export function useSupplierTimelineSelector<Selected>(selector: Selector<Selected>) {
  const { data: timelineData } = useSWR<TimelineState>(
    '/api/timeline',
    fetcher,
    {
      fallbackData: initialTimelineData,
      refreshInterval: 5000, // Poll for updates every 5 seconds
    }
  );

  // For debugging
  useEffect(() => {
    console.log('Current visible timeline data:', timelineData);
  }, [timelineData]);

  const selectedValue = useMemo(() => {
    if (!timelineData) return selector(initialTimelineData);
    return selector(timelineData);
  }, [timelineData, selector]);

  return selectedValue;
}

// Main hook to get and set timeline state for a specific chat
export function useSupplierTimeline(chatId?: string) {
  // Fetch the timeline for this chat if chatId is provided
  const { data: timelineData, mutate: setTimelineData } = useSWR<TimelineState>(
    chatId ? `/api/timeline?chatId=${chatId}` : null,
    fetcher,
    {
      fallbackData: chatId ? {...initialTimelineData, chatId} : initialTimelineData,
      refreshInterval: 5000, // Poll for updates every 5 seconds
    }
  );

  // Also fetch the current visible timeline
  const { data: visibleTimeline } = useSWR<TimelineState>(
    '/api/timeline',
    fetcher,
    {
      fallbackData: initialTimelineData,
      refreshInterval: 5000, // Poll for updates every 5 seconds
    }
  );

  const timeline = useMemo(() => {
    if (!timelineData) return initialTimelineData;
    return timelineData;
  }, [timelineData]);

  const setTimeline = useCallback(
    async (updaterFn: TimelineState | ((currentTimeline: TimelineState) => TimelineState), chatId?: string) => {
      if (!chatId && !timeline.chatId) {
        console.error('No chatId provided for timeline update');
        return;
      }
      
      const timelineToUpdate = timeline || initialTimelineData;
      const newState = typeof updaterFn === 'function'
        ? updaterFn(timelineToUpdate)
        : updaterFn;
      
      try {
        // Update the local state immediately
        setTimelineData(newState, false);
        
        // Send the update to the server
        const response = await fetch('/api/timeline', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chatId: chatId || timeline.chatId,
            isVisible: newState.isVisible,
            steps: newState.steps,
          }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to update timeline');
        }
        
        // Get the updated state from the server
        const updatedTimeline = await response.json();
        
        // Update the local state with the server response
        setTimelineData(updatedTimeline, false);
        
        // Revalidate the visible timeline if needed
        if (newState.isVisible) {
          // Force a revalidation of the visible timeline
          mutate('/api/timeline');
        }
      } catch (error) {
        console.error('Error updating timeline:', error);
        // Revert to the previous state
        setTimelineData(timelineToUpdate, false);
      }
    },
    [timeline, setTimelineData]
  );

  // Helper functions for common timeline operations
  const showTimeline = useCallback((chatId: string) => {
    setTimeline((current) => {
      // If we have an existing timeline for this chat, use its steps
      // Otherwise use the initial steps
      const steps = current.steps;
      
      return {
        ...current,
        isVisible: true,
        chatId,
        steps: steps.map(step => 
          step.id === 'send' 
            ? { ...step, status: 'in-progress' as const, timestamp: new Date().toISOString() } 
          : step.id === 'prepare' 
            ? { ...step, status: 'completed' as const, timestamp: new Date().toISOString() }
            : step.id === 'review'
              ? { ...step, status: 'completed' as const, timestamp: new Date().toISOString() }
              : step
        )
      };
    }, chatId);
  }, [setTimeline]);

  const hideTimeline = useCallback(() => {
    if (!timeline.chatId) return;
    
    setTimeline((current) => ({
      ...current,
      isVisible: false,
    }));
  }, [setTimeline, timeline.chatId]);

  const updateStepStatus = useCallback((stepId: string, status: TimelineStepStatus) => {
    if (!timeline.chatId) return;
    
    setTimeline((current) => ({
      ...current,
      steps: current.steps.map(step => 
        step.id === stepId 
          ? { ...step, status, timestamp: status !== 'pending' ? new Date().toISOString() : step.timestamp } 
          : step
      )
    }));
  }, [setTimeline, timeline.chatId]);

  // Function to check if this timeline is currently visible
  const isTimelineVisible = useMemo(() => {
    if (!chatId) return false;
    
    // Add debug information
    console.log('Checking visibility:', {
      chatId,
      timelineChatId: timeline?.chatId,
      isVisible: timeline?.isVisible
    });
    
    // It should be visible if:
    // 1. The timeline belongs to this chat
    // 2. The timeline is set to visible
    return Boolean(timeline?.chatId === chatId && timeline?.isVisible);
  }, [chatId, timeline]);

  return {
    timeline,
    setTimeline,
    showTimeline,
    hideTimeline,
    updateStepStatus,
    isTimelineVisible
  };
} 