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
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const sessionIdRef = useRef<string | null>(null);

  const getBaseUrl = () => {
    return import.meta.env.VITE_BACKEND_API_BASE_URL || 'http://127.0.0.1:8000/api';
  };

  const getWsUrl = () => {
    const baseUrl = getBaseUrl();
    // Convert http/https to ws/wss
    return baseUrl.replace(/^http/, 'ws');
  };

  const startInteractive = useCallback(async (language: string) => {
    setIsRunning(true);
    setOutputs([]);
    setError(null);

    try {
      // Step 1: Create interactive session
      console.log('[v0] Creating interactive session...');
      const response = await fetch(`${getBaseUrl()}/execute/interactive`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ language }),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to create interactive session: ${response.statusText}`);
      }

      const data = await response.json();
      const { session_id, ws_url } = data;

      if (!session_id || !ws_url) {
        throw new Error('Invalid response: missing session_id or ws_url');
      }

      sessionIdRef.current = session_id;
      console.log('[v0] Interactive session created:', session_id);

      // Step 2: Open WebSocket connection
      console.log('[v0] Connecting to WebSocket:', ws_url);
      const ws = new WebSocket(ws_url);

      ws.onopen = () => {
        console.log('[v0] WebSocket connected');
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('[v0] WebSocket message:', message);

          const { type, data: msgData, status } = message;

          // Map message to output line
          let outputType: 'stdout' | 'stderr' | 'system' = 'stdout';
          let content = '';

          if (type === 'stdout') {
            outputType = 'stdout';
            content = msgData || '';
          } else if (type === 'stderr') {
            outputType = 'stderr';
            content = msgData || '';
          } else if (type === 'system') {
            outputType = 'system';
            content = status || '';
          }

          if (content) {
            setOutputs((prev) => [
              ...prev,
              {
                id: crypto.randomUUID(),
                type: outputType,
                content,
              },
            ]);
          }

          // Handle execution completion
          if (type === 'system' && status === 'terminated') {
            console.log('[v0] Execution terminated');
            setIsRunning(false);
            if (ws) ws.close();
          }
        } catch (err) {
          console.error('[v0] Error parsing WebSocket message:', err);
        }
      };

      ws.onerror = (event) => {
        console.error('[v0] WebSocket error:', event);
        const message = 'WebSocket connection error';
        setError(message);
        setOutputs((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            type: 'system',
            content: message,
          },
        ]);
        setIsRunning(false);
      };

      ws.onclose = () => {
        console.log('[v0] WebSocket closed');
        setIsRunning(false);
      };

      wsRef.current = ws;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      setOutputs((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          type: 'system',
          content: message,
        },
      ]);
      console.error('[v0] Interactive execution error:', err);
      setIsRunning(false);
    }
  }, []);

  const sendInput = useCallback((data: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const message = { type: 'stdin', data };
      console.log('[v0] Sending stdin:', message);
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('[v0] WebSocket not connected');
    }
  }, []);

  const stop = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const message = { type: 'control', action: 'stop' };
      console.log('[v0] Stopping execution:', message);
      wsRef.current.send(JSON.stringify(message));
      wsRef.current.close();
    }
    setIsRunning(false);
    sessionIdRef.current = null;
  }, []);

  return {
    outputs,
    isRunning,
    error,
    startInteractive,
    sendInput,
    stop,
  };
}
