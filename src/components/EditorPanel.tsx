'use client';

import { lazy, Suspense } from 'react';
import { Button } from "@/components/ui/button"
import { X, Plus, Play, Pause, Square } from 'lucide-react';
import type { Language } from '@/hooks/useLanguages';

const MonacoEditor = lazy(() => import('@monaco-editor/react'));

// Map backend language names to Monaco language identifiers
function getMonacoLanguage(languageName?: string): string {
    switch (languageName?.toLowerCase()) {
        case 'java': return 'java';
        case 'python': return 'python';
        case 'javascript': return 'javascript';
        case 'typescript': return 'typescript';
        case 'c': return 'c';
        case 'c++': return 'cpp';
        case 'go': return 'go';
        case 'php': return 'php';
        default: return 'plaintext';
    }
}

interface EditorPanelProps {
    activeFilePath: string | null
    fileContent: string
    openFiles: string[]
    onFileSelect: (path: string) => void
    onFileContentChange: (content: string) => void
    onFileClose: (path: string) => void
    onCreateFile: () => void
    entryFile: string | null
    selectedLanguage?: Language | null
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
    selectedLanguage,
    stdin, 
    onStdinChange, 
    executionMode, 
    onExecutionModeChange, 
    onRun, 
    isRunning, 
    onStop, 
}: EditorPanelProps) {
    const monacoLanguage = getMonacoLanguage(selectedLanguage?.language_name);
    return (
        <div className="flex flex-col h-full">
            {/* Top Header - Controls */}
            <div className="px-2 sm:px-4 py-2 sm:py-1.5 border-b border-border bg-card flex items-center justify-between gap-2 sm:gap-4 flex-wrap">
                <h2 className="text-xs sm:text-sm font-semibold text-foreground">Editor</h2>

                {/* Execution Mode Toggle */}
                <div className="flex gap-1 sm:gap-2">
                    <Button
                        onClick={() => onExecutionModeChange('interactive')}
                        disabled={isRunning}
                        size="sm"
                        variant={executionMode === 'interactive' ? 'default' : 'ghost'}
                        className="text-xs px-2 sm:px-3"
                    >
                        Interactive
                    </Button>
                </div>

                <div className="flex gap-1 sm:gap-2">
                    {executionMode === 'interactive' && isRunning && onStop && (
                        <Button
                            onClick={onStop}
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 hover:bg-destructive/20 hover:text-destructive"
                            title="Stop execution"
                        >
                            <Square className="w-4 h-4" />
                        </Button>
                    )}

                    <Button
                        onClick={onRun}
                        disabled={isRunning || !activeFilePath}
                        size="sm"
                        className="h-8 w-8 p-0 hover:bg-primary/20"
                        variant="ghost"
                        title={isRunning ? "Running..." : "Run code"}
                    >
                        {isRunning ? (
                            <Pause className="w-4 h-4" />
                        ) : (
                            <Play className="w-4 h-4" />
                        )}
                    </Button>
                </div>
            </div>

            {/* File Tabs */}
            <div className="flex items-center gap-1 sm:gap-2 px-1 sm:px-2 py-2 border-b border-border bg-background overflow-x-auto min-h-[36px]">
                <button
                    onClick={onCreateFile}
                    disabled={isRunning}
                    className="flex-shrink-0 p-1 hover:bg-card rounded text-muted-foreground hover:text-foreground disabled:opacity-50 transition-colors"
                    title="New file"
                >
                    <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                </button>

                <div className="flex gap-0.5 sm:gap-1 flex-1">
                    {openFiles.length > 0 ? (
                        openFiles.map((filePath) => {
                            const filename = filePath.split('/').pop() || filePath
                            const isActive = activeFilePath === filePath
                            const isEntry = filePath === entryFile
                            
                            return (
                                <div
                                    key={filePath}
                                    onClick={() => onFileSelect(filePath)}
                                    className={`flex items-center gap-0.5 sm:gap-1 px-2 sm:px-3 py-1 rounded cursor-pointer transition-colors flex-shrink-0 text-xs ${
                                        isActive
                                            ? 'bg-primary text-primary-foreground'
                                            : 'bg-card text-foreground hover:bg-card/80'
                                    }`}
                                >
                                    <span className="font-medium truncate max-w-[80px] sm:max-w-[150px]">{filename}</span>
                                    {isEntry && (
                                        <span className="opacity-70 flex-shrink-0" title="Entry file">•</span>
                                    )}
                                    {!isEntry && !isRunning && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                onFileClose(filePath)
                                            }}
                                            className="hover:opacity-70 flex-shrink-0"
                                        >
                                            <X className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                        </button>
                                    )}
                                </div>
                            )
                        })
                    ) : (
                        <div className="text-xs text-muted-foreground px-3 py-1">No files</div>
                    )}
                </div>
            </div>

            {/* Code Editor */}
            {activeFilePath ? (
                <div className="flex-1 flex flex-col overflow-hidden">
                    <Suspense fallback={
                        <div className="flex-1 bg-background flex items-center justify-center text-muted-foreground">
                            <span className="text-sm">Loading editor...</span>
                        </div>
                    }>
                        <MonacoEditor
                            height="100%"
                            value={fileContent}
                            language={monacoLanguage}
                            theme="vs-dark"
                            onChange={(value) => onFileContentChange(value ?? '')}
                            options={{
                                tabSize: 4,
                                insertSpaces: true,
                                autoIndent: 'advanced',
                                formatOnPaste: true,
                                formatOnType: true,
                                minimap: { enabled: false },
                                scrollBeyondLastLine: false,
                                wordWrap: 'on',
                                smoothScrolling: true,
                                readOnly: isRunning,
                            }}
                        />
                    </Suspense>
                </div>
            ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                    <span className="text-sm">Select a file to start editing</span>
                </div>
            )}

            {/* Stdin Input - Bottom Section (only show in batch mode) */}
            {executionMode === 'batch' && (
                <div className="border-t border-border flex flex-col" style={{ height: 'clamp(20%, 30%, 200px)' }}>
                    <div className="px-2 sm:px-4 py-2 text-xs font-semibold text-muted-foreground bg-card border-b border-border">
                        Input (stdin)
                    </div>
                    <textarea
                        value={stdin}
                        onChange={(e) => onStdinChange(e.target.value)}
                        disabled={isRunning}
                        className="flex-1 bg-background text-foreground font-mono text-xs sm:text-sm resize-none focus:outline-none p-2 sm:p-4 border-0"
                        placeholder="Enter input (one per line)..."
                        spellCheck="false"
                    />
                </div>
            )}
        </div>
    )
}
