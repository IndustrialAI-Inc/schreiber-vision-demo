import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { useUserMode } from '@/components/mode-toggle';
import { SupplierAlert } from '@/components/supplier-alert';

export const Greeting = () => {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { mode } = useUserMode();
  
  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Don't render anything until mounted to prevent hydration mismatch
  if (!mounted) return null;
  
  const isDarkMode = theme === 'dark';
  const isSupplierMode = mode === 'supplier';
  
  return (
    <div
      key="overview"
      className="max-w-3xl mx-auto md:mt-20 px-8 size-full flex flex-col justify-center"
    >
      {!isSupplierMode ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ delay: 0.4 }}
          className="mb-6"
        >
          <img 
            src="/images/Schreiber-logo-dark.png" 
            alt="Schreiber Logo" 
            className="h-16 md:h-20 w-auto"
          />
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ delay: 0.4 }}
          className="mb-6"
        >
          <img 
            src="/images/Schreiber-logo-hi-res-color.png" 
            alt="Schreiber Logo" 
            className="h-16 md:h-20 w-auto"
          />
        </motion.div>
      )}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.5 }}
        className="text-2xl font-semibold"
      >
        {isSupplierMode 
          ? "Welcome to the Schreiber Supplier Portal" 
          : "Welcome to Endeavor AI for Schreiber"}
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.7 }}
        className="mt-4 text-base text-zinc-400"
      >
        {isSupplierMode 
          ? "Our AI assistant will guide you through completing all required fields and answer any questions you have about the process." 
          : "Select an option below to create supplier specifications, search your repository, or view analytics."}
      </motion.div>
      <div className="mt-6">
        <SupplierAlert />
      </div>
    </div>
  );
};
