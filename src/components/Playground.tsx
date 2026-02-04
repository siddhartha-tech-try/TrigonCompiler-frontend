'use client';

import { useState, useRef, useEffect } from "react"
import EditorPanel from "./EditorPanel"
import OutputPanel from "./OutputPanel"
import { useFileSystem } from "@/hooks/useFileSystem"
import { useStreamExecution } from "@/hooks/useStreamExecution"
import type { Language } from "@/hooks/useLanguages"

interface PlaygroundProps {
    selectedLanguage?: Language | null
}

export default function Playground({ selectedLanguage }: PlaygroundProps) {
    const [dividerX, setDividerX] = useState(50)
    const [code, setCode] = useState("")
    const [stdin, setStdin] = useState("")
    const [entryFile, setEntryFile] = useState<string | null>(null)

    const { updateFile, createFile } = useFileSystem()
    const { outputs, isRunning, execute } = useStreamExecution()

    const containerRef = useRef<HTMLDivElement>(null)
    const isDraggingRef = useRef(false)

    // Initialize with code preview when language changes
    useEffect(() => {
        if (selectedLanguage?.code_preview) {
            setCode(selectedLanguage.code_preview)
            // Backend will determine entry file name   
            setEntryFile(null)
        }
    }, [selectedLanguage?.id])

    const handleMouseDown = () => {
        isDraggingRef.current = true
    }

    const handleRun = async () => {
        if (!selectedLanguage) return

        // Determine entry file path
        const currentEntryFile = entryFile || selectedLanguage.file_name || `main.${selectedLanguage.file_extension}`
        console.log("[v0] Entry file:", currentEntryFile)

        // Step 1: Create entry file if it doesn't exist
        console.log("[v0] Ensuring entry file exists...")
        const createSuccess = await createFile(currentEntryFile, 'file')
        
        if (!createSuccess) {
            console.error("[v0] File creation failed, aborting execution")
            return
        }

        // Step 2: Sync editor content to entry file
        console.log("[v0] Syncing editor content to entry file...")
        const syncSuccess = await updateFile(currentEntryFile, code)

        if (!syncSuccess) {
            console.error("[v0] File sync failed, aborting execution")
            return
        }

        console.log("[v0] File synced successfully")

        // Step 3: Format stdin with newlines
        const formattedStdin = stdin.split('\n').join('\n')
        console.log("[v0] Stdin formatted:", JSON.stringify(formattedStdin))

        // Step 4: Execute with streaming
        console.log("[v0] Starting execution...")
        await execute(selectedLanguage.language_name, formattedStdin)
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
                    code={code} 
                    onCodeChange={setCode}
                    stdin={stdin}
                    onStdinChange={setStdin}
                    onRun={handleRun} 
                    isRunning={isRunning} 
                />
            </div>

            {/* Divider */}
            <div
                onMouseDown={handleMouseDown}
                className="w-1 bg-border hover:bg-primary cursor-col-resize transition-colors duration-150 flex-shrink-0"
            />

            {/* Right Panel: Output */}
            <div
                style={{ width: `${100 - dividerX}%` }}
                className="flex flex-col bg-background"
            >
                <OutputPanel outputs={outputs} />
            </div>
        </div>
    )
}
