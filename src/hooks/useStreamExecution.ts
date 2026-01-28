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
          const { done, value } = await reader.read();

          if (done) {
            // Final status
            setOutputs((prev) => [
              ...prev,
              {
                id: `line-${++lineId}`,
                type: 'status',
                content: 'Process completed',
              },
            ]);
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');

          // Keep the last incomplete line in buffer
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.trim()) continue;

            // Parse SSE format: event: type\ndata: content
            if (line.startsWith('event:')) {
              // Handle multi-line events if needed
              continue;
            }

            if (line.startsWith('data:')) {
              const content = line.slice(5).trim();

              // Try to parse as JSON first (for structured events)
              try {
                const json = JSON.parse(content);
                const eventType = json.event || 'stdout';

                if (eventType === 'done') {
                  setOutputs((prev) => [
                    ...prev,
                    {
                      id: `line-${++lineId}`,
                      type: 'status',
                      content: `Process finished with exit code ${json.exitCode || 0}`,
                    },
                  ]);
                } else if (eventType === 'error' || eventType === 'timeout') {
                  setOutputs((prev) => [
                    ...prev,
                    {
                      id: `line-${++lineId}`,
                      type: 'error',
                      content: json.message || 'Execution error',
                    },
                  ]);
                } else {
                  // stdout or stderr
                  setOutputs((prev) => [
                    ...prev,
                    {
                      id: `line-${++lineId}`,
                      type: eventType as 'stdout' | 'stderr',
                      content: json.content || '',
                    },
                  ]);
                }
              } catch {
                // Plain text output
                if (content) {
                  setOutputs((prev) => [
                    ...prev,
                    {
                      id: `line-${++lineId}`,
                      type: 'stdout',
                      content,
                    },
                  ]);
                }
              }
            }
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
