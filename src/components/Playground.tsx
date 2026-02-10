'use client';

import { useState, useRef, useEffect } from "react"
import EditorPanel from "./EditorPanel"
import OutputPanel from "./OutputPanel"
import FileCreationModal from "./FileCreationModal"
import { useFileSystem } from "@/hooks/useFileSystem"
import { useFileCache } from "@/hooks/useFileCache"
import { useStreamExecution } from "@/hooks/useStreamExecution"
import { useInteractiveExecution } from "@/hooks/useInteractiveExecution"
import type { Language } from "@/hooks/useLanguages"
import InteractiveTerminal from './InteractiveTerminal';
import { useSession } from '@/contexts/SessionContext';


type ExecutionMode = 'batch' | 'interactive'

interface PlaygroundProps {
    selectedLanguage?: Language | null
}

export default function Playground({ selectedLanguage }: PlaygroundProps) {
    const [dividerX, setDividerX] = useState(50)
    const [stdin, setStdin] = useState("")
    const [entryFile, setEntryFile] = useState<string | null>(null)
    const [executionMode, setExecutionMode] = useState<ExecutionMode>('interactive')
    const [showFileModal, setShowFileModal] = useState(false)
    const { registerTeardown } = useSession();

    const { getFileTree, readFile, updateFile, createFile } = useFileSystem()
    const fileCache = useFileCache()
    const batchExecution = useStreamExecution()
    const interactiveExecution = useInteractiveExecution()

    // Use the appropriate execution hook based on mode
    const currentExecution = executionMode === 'batch' ? batchExecution : interactiveExecution
    const { outputs, isRunning } = currentExecution

    const containerRef = useRef<HTMLDivElement>(null)
    const isDraggingRef = useRef(false)

    useEffect(() => {
        registerTeardown(() => {
            if (executionMode === 'interactive') {
                interactiveExecution.stop();
            }
        });
    }, []);

    const handleStop = () => {
        if (executionMode === 'interactive') {
            interactiveExecution.stop();
        }
    };

    const handleFileSelect = async (path: string) => {
        // Check if file is already in cache
        if (!fileCache.cache[path]) {
            const content = await fileCache.loadFile(path, readFile)
            if (content === null) {
                console.error('[v0] Failed to load file:', path)
                return
            }
        }
        fileCache.setActive(path)
    };

    const handleFileClose = (path: string) => {
        // Don't allow closing entry file
        if (path === entryFile) return
        
        fileCache.removeFileFromCache(path)
        // If this was the active file, select first remaining open file
        if (fileCache.activeFilePath === path) {
            const remainingFiles = Object.keys(fileCache.cache).filter(f => f !== path)
            if (remainingFiles.length > 0) {
                fileCache.setActive(remainingFiles[0])
            } else {
                fileCache.setActive(null)
            }
        }
    };

    const handleCreateFile = async (filename: string) => {
        const fullPath = filename
        const success = await createFile(fullPath, 'file')
        if (success) {
            fileCache.addFileToCache(fullPath, '')
            fileCache.setActive(fullPath)
            await getFileTree()
            setShowFileModal(false)
        }
    };


    // Initialize file tree and entry file when language changes
    useEffect(() => {
        if (selectedLanguage) {
            fileCache.clearCache()
            setEntryFile(selectedLanguage.file_name)
            
            // Load file tree
            const loadTree = async () => {
                const treeData = await getFileTree()
                
                // Auto-load entry file from code preview
                if (selectedLanguage.code_preview && selectedLanguage.file_name) {
                    await createFile(selectedLanguage.file_name, 'file')
                    fileCache.addFileToCache(selectedLanguage.file_name, selectedLanguage.code_preview)
                    fileCache.setActive(selectedLanguage.file_name)
                }
            }
            
            loadTree()
        }
    }, [selectedLanguage?.id])

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault()
        isDraggingRef.current = true
    }

    const handleRun = async () => {
        if (!selectedLanguage || !fileCache.activeFilePath) return

        console.log("[v0] Starting execution...")

        // Step 1: Sync all dirty files to backend
        // const dirtyFiles = fileCache.getDirtyFiles()
        const filesToSync = Object.entries(fileCache.cache)
            .filter(([_, file]) => file.isDirty || !file.hasBeenSynced)
            .map(([path, file]) => ({
                path,
                content: file.content,
            }));
        console.log('[v0] Syncing', filesToSync.length, 'files...');

        for (const file of filesToSync) {
            await createFile(file.path, 'file'); // idempotent

            const ok = await updateFile(file.path, file.content);
            if (!ok) return;

            fileCache.markFileSynced(file.path);
        }


        const ensureFileExists = async (path: string) => {
            const created = await createFile(path, 'file');
            return created;
        };

        for (const file of filesToSync) {
            await ensureFileExists(file.path);
            const syncSuccess = await updateFile(file.path, file.content)
            if (syncSuccess) {
                fileCache.markFileClean(file.path)
            } else {
                console.error("[v0] Failed to sync file:", file.path)
                return
            }
        }

        console.log("[v0] All files synced successfully")

        // Step 2: Branch on execution mode
        if (executionMode === 'batch') {
            // Format stdin with newlines
            const formattedStdin = stdin.split('\n').join('\n')
            console.log("[v0] Stdin formatted:", JSON.stringify(formattedStdin))

            // Step 3: Execute batch with streaming
            console.log("[v0] Starting batch execution...")
            await batchExecution.execute(selectedLanguage.language_name, formattedStdin)
        } else if (executionMode === 'interactive') {
            // Step 3: Start interactive execution
            console.log("[v0] Starting interactive execution...")
            await interactiveExecution.startInteractive(selectedLanguage.language_name)
        }
    }

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDraggingRef.current || !containerRef.current) return

            const rect = containerRef.current.getBoundingClientRect()
            const newX = ((e.clientX - rect.left) / rect.width) * 100

            if (newX >= 30 && newX <= 70) {
                setDividerX(newX)
            }
        }

        const handleMouseUp = () => {
            isDraggingRef.current = false
        }

        if (isDraggingRef.current) {
            document.addEventListener("mousemove", handleMouseMove)
            document.addEventListener("mouseup", handleMouseUp)

            return () => {
                document.removeEventListener("mousemove", handleMouseMove)
                document.removeEventListener("mouseup", handleMouseUp)
            }
        }
    }, [])

    const openFiles = Object.keys(fileCache.cache)

    return (
        <div
            ref={containerRef}
            className="flex h-full overflow-hidden bg-background"
        >
            {/* Left Panel: Editor */}
            <div
                style={{ width: `${dividerX}%` }}
                className="flex flex-col border-r border-border"
            >
                <EditorPanel
                    activeFilePath={fileCache.activeFilePath}
                    fileContent={fileCache.getActiveContent()}
                    openFiles={openFiles}
                    onFileSelect={handleFileSelect}
                    onFileContentChange={fileCache.updateActiveContent}
                    onFileClose={handleFileClose}
                    onCreateFile={() => setShowFileModal(true)}
                    entryFile={entryFile}
                    stdin={stdin}
                    onStdinChange={setStdin}
                    executionMode={executionMode}
                    onExecutionModeChange={setExecutionMode}
                    onRun={handleRun}
                    isRunning={isRunning}
                    onStop={handleStop}
                />
            </div>

            {/* Divider */}
            <div
                onMouseDown={handleMouseDown}
                className="w-1 bg-border hover:bg-primary cursor-col-resize transition-colors duration-150 flex-shrink-0 active:bg-primary"
            />

            {/* Right Panel: Output */}
            <div
                style={{ width: `${100 - dividerX}%` }}
                className="flex flex-col bg-background">
                {executionMode === 'interactive' ? (
                    <InteractiveTerminal
                        outputs={outputs}
                        isRunning={isRunning}
                        onInput={(data) => interactiveExecution.sendInput(data)}
                        onCtrlC={() => interactiveExecution.sendInput('__CTRL_C__')}
                    />
                ) : (
                    <OutputPanel outputs={outputs} />
                )}
            </div>

            {/* File Creation Modal */}
            <FileCreationModal
                isOpen={showFileModal}
                onClose={() => setShowFileModal(false)}
                onCreate={handleCreateFile}
                fileExtension={selectedLanguage?.file_extension}
            />
        </div>
    )
}
