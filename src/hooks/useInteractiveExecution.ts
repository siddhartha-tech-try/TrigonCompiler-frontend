'use client';

import { useState, useCallback, useRef } from 'react';

export interface InteractiveOutputLine {
  id: string;
  type: 'stdout' | 'stderr' | 'system';
  content: string;
}

export function useInteractiveExecution() {
  const [outputs, setOutputs] = useState<InteractiveOutputLine[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);

  const getBaseUrl = () =>
    import.meta.env.VITE_BACKEND_API_BASE_URL || 'http://127.0.0.1:8000/api';

  const startInteractive = useCallback(async (language: string) => {
    if (isRunning) return;

    setIsRunning(true);
    setSessionEnded(false);
    setOutputs([]);
    setError(null);

    try {
      const response = await fetch(`${getBaseUrl()}/execute/interactive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language }),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to start interactive session`);
      }

      const { ws_url } = await response.json();
      const ws = new WebSocket(ws_url);
      wsRef.current = ws;

      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);

        if (msg.type === 'stdout' || msg.type === 'stderr') {
          setOutputs((prev) => [
            ...prev,
            {
              id: crypto.randomUUID(),
              type: msg.type,
              content: msg.data,
            },
          ]);
        }

        if (msg.type === 'system') {
          setOutputs((prev) => [
            ...prev,
            {
              id: crypto.randomUUID(),
              type: 'system',
              content: msg.status,
            },
          ]);

          if (msg.status === 'program_exited') {
            setIsRunning(false);
            setSessionEnded(true);
            ws.close();
          }
        }

      };

      ws.onerror = () => {
        setError('WebSocket error');
        setIsRunning(false);
        setSessionEnded(true);
      };

      ws.onclose = () => {
        wsRef.current = null;
        setIsRunning(false);
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setIsRunning(false);
      setSessionEnded(true);
    }
  }, [isRunning]);

  const sendInput = useCallback((data: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ type: 'stdin', data }));
  }, []);

  const stop = useCallback(() => {
    if (wsRef.current) {
      try {
        if (wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(
            JSON.stringify({ type: 'control', action: 'stop' })
          );
        }
        wsRef.current.close();
      } catch (e) {
        console.warn('[v0] WS stop failed', e);
      }
    }
    wsRef.current = null;
    setIsRunning(false);
    setSessionEnded(true);
  }, []);

  return {
    outputs,
    isRunning,
    sessionEnded,
    error,
    startInteractive,
    sendInput,
    stop,
  };
}
