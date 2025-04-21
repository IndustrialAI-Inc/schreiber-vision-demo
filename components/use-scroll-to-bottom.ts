import { useEffect, useRef, useState, type RefObject } from 'react';

export function useScrollToBottom<T extends HTMLElement>(): [
  RefObject<T>,
  RefObject<T>,
] {
  const containerRef = useRef<T>(null);
  const endRef = useRef<T>(null);
  const [userScrolled, setUserScrolled] = useState(false);
  const [lastScrollHeight, setLastScrollHeight] = useState(0);

  // Function to track user scroll position
  const handleScroll = () => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
    
    // Set userScrolled to true if user scrolls up, false if at bottom
    setUserScrolled(!isAtBottom);
  };

  // Initial setup for scroll events
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);

  // Handle mutations and scroll behavior
  useEffect(() => {
    const container = containerRef.current;
    const end = endRef.current;

    if (container && end) {
      // Store initial scroll height
      setLastScrollHeight(container.scrollHeight);
      
      const observer = new MutationObserver(() => {
        // Check if content has actually increased
        const heightIncreased = container.scrollHeight > lastScrollHeight;
        setLastScrollHeight(container.scrollHeight);
        
        // Only auto-scroll if:
        // 1. User hasn't scrolled up OR
        // 2. User is already at the bottom
        if (!userScrolled || 
            (container.scrollHeight - container.scrollTop - container.clientHeight < 100)) {
          end.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
      });

      observer.observe(container, {
        childList: true,
        subtree: true,
        attributes: true,
        characterData: true,
      });

      return () => observer.disconnect();
    }
  }, [userScrolled, lastScrollHeight]);

  return [containerRef, endRef];
}
