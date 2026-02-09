'use client';

import { Button } from "@/components/ui/button"
import { X, Plus } from 'lucide-react';

interface EditorPanelProps {
    activeFilePath: string | null
    fileContent: string
    openFiles: string[]
    onFileSelect: (path: string) => void
    onFileContentChange: (content: string) => void
    onFileClose: (path: string) => void
    onCreateFile: () => void
    entryFile: string | null
    stdin: string
    onStdinChange: (stdin: string) => void
    executionMode: 'interactive' | 'batch'
    onExecutionModeChange: (mode: 'interactive' | 'batch') => void
    onRun: () => void
    onStop?: () => void
    isRunning: boolean
}

export default function EditorPanel({ 
    activeFilePath, 
    fileContent, 
    openFiles,
    onFileSelect,
    onFileContentChange, 
    onFileClose,
    onCreateFile,
    entryFile,
    stdin, 
    onStdinChange, 
    executionMode, 
    onExecutionModeChange, 
    onRun, 
    isRunning, 
    onStop, 
}: EditorPanelProps) {
    return (
        <div className="flex flex-col h-full">
            {/* Top Header - Controls */}
            <div className="px-4 py-3 border-b border-border bg-card flex items-center justify-between gap-4">
                <h2 className="text-sm font-semibold text-foreground">Editor</h2>

                {/* Execution Mode Toggle */}
                <div className="flex gap-2">
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

                <div className="flex gap-2">
                    {executionMode === 'interactive' && isRunning && onStop && (
                        <Button
                            onClick={onStop}
                            size="sm"
                            variant="destructive"
                        >
                            Stop
                        </Button>
                    )}

                    <Button
                        onClick={onRun}
                        disabled={isRunning || !activeFilePath}
                        size="sm"
                        className="bg-primary hover:bg-primary/90"
                    >
                        {isRunning ? "Running..." : "Run"}
                    </Button>
                </div>
            </div>

            {/* File Tabs */}
            <div className="flex items-center gap-2 px-2 py-2 border-b border-border bg-background overflow-x-auto min-h-[36px]">
                <button
                    onClick={onCreateFile}
                    disabled={isRunning}
                    className="flex-shrink-0 p-1 hover:bg-card rounded text-muted-foreground hover:text-foreground disabled:opacity-50 transition-colors"
                    title="New file"
                >
                    <Plus className="w-4 h-4" />
                </button>

                <div className="flex gap-1 flex-1">
                    {openFiles.length > 0 ? (
                        openFiles.map((filePath) => {
                            const filename = filePath.split('/').pop() || filePath
                            const isActive = activeFilePath === filePath
                            const isEntry = filePath === entryFile
                            
                            return (
                                <div
                                    key={filePath}
                                    onClick={() => onFileSelect(filePath)}
                                    className={`flex items-center gap-1 px-3 py-1 rounded cursor-pointer transition-colors flex-shrink-0 ${
                                        isActive
                                            ? 'bg-primary text-primary-foreground'
                                            : 'bg-card text-foreground hover:bg-card/80'
                                    }`}
                                >
                                    <span className="text-xs font-medium truncate max-w-[150px]">{filename}</span>
                                    {isEntry && (
                                        <span className="text-xs opacity-70" title="Entry file">•</span>
                                    )}
                                    {!isEntry && !isRunning && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                onFileClose(filePath)
                                            }}
                                            className="hover:opacity-70 flex-shrink-0"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    )}
                                </div>
                            )
                        })
                    ) : (
                        <div className="text-xs text-muted-foreground px-3 py-1">No files open</div>
                    )}
                </div>
            </div>

            {/* Code Editor */}
            {activeFilePath ? (
                <div className="flex-1 flex flex-col overflow-hidden">
                    <textarea
                        value={fileContent}
                        onChange={(e) => onFileContentChange(e.target.value)}
                        disabled={isRunning}
                        className="flex-1 bg-background text-foreground font-mono text-sm resize-none focus:outline-none p-4 border-0"
                        placeholder="Write your code here..."
                        spellCheck="false"
                    />
                </div>
            ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                    <span className="text-sm">Select a file to start editing</span>
                </div>
            )}

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
