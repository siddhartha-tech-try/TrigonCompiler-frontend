'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

interface SessionContextType {
  sessionInitialized: boolean;
  sessionError: string | null;
}

const SessionContext = createContext<SessionContextType>({
  sessionInitialized: false,
  sessionError: null,
});

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [sessionInitialized, setSessionInitialized] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);

  useEffect(() => {
    const bootstrapSession = async () => {
      try {
        const baseUrl = import.meta.env.VITE_BACKEND_API_BASE_URL || 'http://127.0.0.1:8000/api';
        console.log('[v0] Bootstrapping session...');
        
        const response = await fetch(`${baseUrl}/sessions/bootstrap`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include', // Enable cookies
        });

        if (!response.ok) {
          throw new Error(`Bootstrap failed: ${response.statusText}`);
        }

        console.log('[v0] Session bootstrapped successfully');
        setSessionInitialized(true);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown session error';
        console.error('[v0] Session bootstrap error:', err);
        setSessionError(message);
        // Still mark as initialized to allow app to proceed
        setSessionInitialized(true);
      }
    };

    bootstrapSession();
  }, []);

  return (
    <SessionContext.Provider value={{ sessionInitialized, sessionError }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within SessionProvider');
  }
  return context;
}
