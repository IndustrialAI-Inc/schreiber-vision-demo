'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { UserMode } from '@/lib/types';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface UserModeState {
  mode: UserMode;
  setMode: (mode: UserMode) => void;
}

export const useUserMode = create<UserModeState>()(
  persist(
    (set) => ({
      mode: 'schreiber',
      setMode: (mode) => set({ mode }),
    }),
    {
      name: 'user-mode-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export function ModeToggle() {
  const { mode, setMode } = useUserMode();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  // Ensure this component is only rendered on the client to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleMode = useCallback(() => {
    const newMode = mode === 'schreiber' ? 'supplier' : 'schreiber';
    setMode(newMode);
    router.refresh();
  }, [mode, setMode, router]);

  if (!mounted) {
    return null;
  }

  return (
    <div className="flex items-center space-x-2">
      <Switch 
        checked={mode === 'supplier'}
        onCheckedChange={toggleMode}
        id="mode-toggle"
      />
      <Label htmlFor="mode-toggle" className="font-medium">
        {mode === 'supplier' ? 'Supplier Mode' : 'Schreiber Mode'}
      </Label>
    </div>
  );
} 