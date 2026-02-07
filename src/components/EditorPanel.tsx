'use client';

import { Button } from "@/components/ui/button"

interface EditorPanelProps {
    code: string
    onCodeChange: (code: string) => void
    stdin: string
    onStdinChange: (stdin: string) => void
    executionMode: 'batch' | 'interactive'
    onExecutionModeChange: (mode: 'batch' | 'interactive') => void
    onRun: () => void
    isRunning: boolean
}

export default function EditorPanel({code, onCodeChange, stdin, onStdinChange, executionMode, onExecutionModeChange, onRun, isRunning,}: EditorPanelProps) {
    return (
        <div className="flex flex-col h-full">
            {/* Panel Header */}
            <div className="px-4 py-3 border-b border-border bg-card flex items-center justify-between gap-4">
                <h2 className="text-sm font-semibold text-foreground">Editor</h2>
                
                {/* Execution Mode Toggle */}
                <div className="flex gap-2">
                    <Button
                        onClick={() => onExecutionModeChange('batch')}
                        disabled={isRunning}
                        size="sm"
                        variant={executionMode === 'batch' ? 'default' : 'ghost'}
                        className="text-xs"
                    >
                        Batch
                    </Button>
                    <Button
                        onClick={() => onExecutionModeChange('interactive')}
                        disabled={isRunning}
                        size="sm"
                        variant={executionMode === 'interactive' ? 'default' : 'ghost'}
                        className="text-xs"
                    >
                        Interactive
                    </Button>
                </div>

                <Button
                    onClick={onRun}
                    disabled={isRunning}
                    size="sm"
                    className="bg-primary hover:bg-primary/90"
                >
                    {isRunning ? "Running..." : "Run"}
                </Button>
            </div>

            {/* Code Editor */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <textarea
                    value={code}
                    onChange={(e) => onCodeChange(e.target.value)}
                    disabled={isRunning}
                    className="flex-1 bg-background text-foreground font-mono text-sm resize-none focus:outline-none p-4 border-0"
                    placeholder="Write your code here..."
                    spellCheck="false"
                />
            </div>

            {/* Stdin Input - Bottom Section (only show in batch mode) */}
            {executionMode === 'batch' && (
                <div className="border-t border-border flex flex-col" style={{ height: '30%' }}>
                    <div className="px-4 py-2 text-xs font-semibold text-muted-foreground bg-card border-b border-border">
                        Input (stdin)
                    </div>
                    <textarea
                        value={stdin}
                        onChange={(e) => onStdinChange(e.target.value)}
                        disabled={isRunning}
                        className="flex-1 bg-background text-foreground font-mono text-sm resize-none focus:outline-none p-4 border-0"
                        placeholder="Enter input here (one per line)..."
                        spellCheck="false"
                    />
                </div>
            )}
        </div>
    )
}
