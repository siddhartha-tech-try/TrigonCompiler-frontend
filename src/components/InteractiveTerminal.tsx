'use client';

import { useEffect, useRef } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';
import { useTheme } from '@/contexts/ThemeContext';

interface InteractiveTerminalProps {
    outputs: {
        type: 'stdout' | 'stderr' | 'system';
        content: string;
    }[];
    onInput: (data: string) => void;
    onCtrlC: () => void;
    isRunning: boolean;
}

export default function InteractiveTerminal({
    outputs,
    onInput,
    onCtrlC,
    isRunning,
}: InteractiveTerminalProps) {
    const { theme } = useTheme();
    const initializedRef = useRef(false);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const termRef = useRef<Terminal | null>(null);
    const fitAddonRef = useRef<FitAddon | null>(null);
    const lastOutputIndexRef = useRef(0);

    // Initialize terminal once
    useEffect(() => {
        if (!containerRef.current) return;
        if (initializedRef.current) return;

        initializedRef.current = true;

        const getTerminalTheme = (isDark: boolean) => {
            if (isDark) {
                return {
                    background: '#000000',
                    foreground: '#ffffff',
                    cursor: '#ffffff',
                    cursorAccent: '#000000',
                };
            } else {
                return {
                    background: '#ffffff',
                    foreground: '#000000',
                    cursor: '#000000',
                    cursorAccent: '#ffffff',
                };
            }
        };

        const term = new Terminal({
            cursorBlink: true,
            fontSize: 13,
            fontFamily: 'monospace',
            theme: getTerminalTheme(theme === 'dark'),
        });

        const fitAddon = new FitAddon();
        term.loadAddon(fitAddon);

        term.open(containerRef.current);
        fitAddon.fit();
        term.focus();

        // term.onData((data) => {
        //     if (data === '\x03') {
        //         onCtrlC();
        //         return;
        //     }
        //     onInput(data);
        // });

        let inputBuffer = '';

        term.onData((data) => {
            if (!isRunning) return;
            // Ctrl+C
            if (data === '\x03') {
                term.write('^C\r\n');
                inputBuffer = '';
                onCtrlC();
                return;
            }

            // Enter
            if (data === '\r') {
                term.write('\r\n');          // 👈 local echo
                onInput(inputBuffer + '\n'); // 👈 send full line
                inputBuffer = '';
                return;
            }

            // Backspace
            if (data === '\u007f') {
                if (inputBuffer.length > 0) {
                    inputBuffer = inputBuffer.slice(0, -1);
                    term.write('\b \b'); // 👈 erase character visually
                }
                return;
            }

            // Ignore ANSI escape sequences (arrows, home, end, etc.)
            if (data.startsWith('\x1b')) {
                return;
            }

            // Printable characters
            if (/^[\x20-\x7E]$/.test(data)) {
                inputBuffer += data;
                term.write(data); // 👈 immediate local echo
            }
        });



        termRef.current = term;
        fitAddonRef.current = fitAddon;

        const handleResize = () => fitAddon.fit();
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            term.dispose();
            termRef.current = null;
            initializedRef.current = false;
        };
    }, []);




    // Update terminal theme when theme changes
    useEffect(() => {
        const term = termRef.current;
        if (!term) return;

        const getTerminalTheme = (isDark: boolean) => {
            if (isDark) {
                return {
                    background: '#000000',
                    foreground: '#ffffff',
                    cursor: '#ffffff',
                    cursorAccent: '#000000',
                };
            } else {
                return {
                    background: '#ffffff',
                    foreground: '#000000',
                    cursor: '#000000',
                    cursorAccent: '#ffffff',
                };
            }
        };

        term.setOption('theme', getTerminalTheme(theme === 'dark'));
    }, [theme]);

    // Write new outputs to terminal
    useEffect(() => {
        const term = termRef.current;
        if (!term) return;

        const newOutputs = outputs.slice(lastOutputIndexRef.current);
        newOutputs.forEach((out) => {
            const text = out.content.endsWith('\n')
                ? out.content
                : out.content + '\r\n';
            term.write(text);
        });

        lastOutputIndexRef.current = outputs.length;
    }, [outputs]);

    return (
        <div className="flex flex-col h-full">
            <div className="px-4 py-3 border-b border-border bg-card">
                <h2 className="text-sm font-semibold text-foreground">Terminal</h2>
            </div>

            <div className={`flex-1 ${theme === 'dark' ? 'bg-black' : 'bg-white'}`}>
                <div ref={containerRef} className="w-full h-full" />
            </div>
        </div>
    );
}
