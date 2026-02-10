'use client';

import { useState, useCallback } from 'react';

export interface OutputLine {
  id: string;
  type: 'stdout' | 'stderr' | 'status' | 'error';
  content: string;
}

export function useStreamExecution() {
  const [outputs, setOutputs] = useState<OutputLine[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getBaseUrl = () => {
    return import.meta.env.VITE_BACKEND_API_BASE_URL || 'http://127.0.0.1:8000/api';
  };

  const execute = useCallback(
    async (language: string, stdin: string = '') => {
      setIsRunning(true);
      setOutputs([]);
      setError(null);

      try {
        const response = await fetch(`${getBaseUrl()}/execute/stream`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            language,
            stdin,
          }),
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error(`Execution failed: ${response.statusText}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let lineId = 0;

        if (!reader) {
          throw new Error('No response stream available');
        }

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })

          const events = buffer.split('\n\n')
          buffer = events.pop() || ''

          for (const evt of events) {
            const lines = evt.split('\n')
            let eventType = 'stdout'
            let data = ''

            for (const line of lines) {
              if (line.startsWith('event:')) {
                eventType = line.replace('event:', '').trim()
              }
              if (line.startsWith('data:')) {
                data += line.replace('data:', '').trim()
              }
            }

            if (!data) continue

            setOutputs(prev => [
              ...prev,
              {
                id: crypto.randomUUID(),
                type:
                  eventType === 'stderr'
                    ? 'stderr'
                    : eventType === 'done'
                    ? 'status'
                    : 'stdout',
                content:
                  eventType === 'done'
                    ? `Process exited with code ${data}`
                    : JSON.parse(data),
              },
            ])
          }
        }

      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown execution error';
        setError(message);
        setOutputs((prev) => [
          ...prev,
          {
            id: `line-error`,
            type: 'error',
            content: message,
          },
        ]);
        console.error('[v0] Execution error:', err);
      } finally {
        setIsRunning(false);
      }
    },
    []
  );

  return {
    outputs,
    isRunning,
    error,
    execute,
  };
}
