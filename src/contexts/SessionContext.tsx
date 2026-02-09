'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

interface SessionContextType {
  sessionInitialized: boolean;
  sessionError: string | null;
  cleanupSession: () => void;
  registerTeardown: (fn: () => void) => void;
}

const SessionContext = createContext<SessionContextType>({
  sessionInitialized: false,
  sessionError: null,
  cleanupSession: () => { },
  registerTeardown: () => { },
});

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [sessionInitialized, setSessionInitialized] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);

  const cleanupTriggeredRef = useRef(false);

  const teardownCallbacksRef = useRef<(() => void)[]>([]);

  const registerTeardown = (fn: () => void) => {
    teardownCallbacksRef.current.push(fn);
  };


  const getBaseUrl = () =>
    import.meta.env.VITE_BACKEND_API_BASE_URL ||
    'http://127.0.0.1:8000/api';

  /**
   * 🔥 Cleanup coordinator
   * Safe to call multiple times
   */
  const cleanupSession = () => {
    if (cleanupTriggeredRef.current) return;
    cleanupTriggeredRef.current = true;

    // 🔴 1. Stop interactive execution FIRST
    teardownCallbacksRef.current.forEach(fn => {
      try {
        fn();
      } catch { }
    });

    // 🔵 2. Backend cleanup (best effort)
    try {
      navigator.sendBeacon(
        `${getBaseUrl()}/sessions/cleanup`,
        JSON.stringify({})
      );
    } catch { }
  };


  /**
   * Bootstrap session (existing logic)
   */
  useEffect(() => {
    const bootstrapSession = async () => {
      try {
        console.log('[v0] Bootstrapping session...');

        const response = await fetch(`${getBaseUrl()}/sessions/bootstrap`, {
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

  /**
   * ⚠️ Tab close / refresh warning
   */
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      cleanupSession(); // fire best-effort cleanup

      e.preventDefault();
      e.returnValue = ''; // required for Chrome
      return '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  return (
    <SessionContext.Provider
      value={{ sessionInitialized, sessionError, cleanupSession, registerTeardown, }}>
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
