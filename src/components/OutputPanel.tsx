'use client';

interface OutputLine {
    id: string
    type: "stdout" | "stderr" | "status" | "system" | "error"
    content: string
}

interface OutputPanelProps {
    outputs: OutputLine[]
}

export default function OutputPanel({ outputs }: OutputPanelProps) {
    const hasOutput = outputs.length > 0

    return (
        <div className="flex flex-col h-full">
            {/* Panel Header */}
            <div className="px-4 py-3 border-b border-border bg-card">
                <h2 className="text-sm font-semibold text-foreground">Output</h2>
            </div>

            {/* Output Area */}
            <div className="flex-1 overflow-auto bg-background">
                {hasOutput ? (
                    <div className="p-4 font-mono text-sm space-y-1">
                        {outputs.map((output) => (
                            <div
                                key={output.id}
                                className={
                                    output.type === "stderr"
                                        ? "text-destructive whitespace-pre-wrap"
                                        : output.type === "error"
                                            ? "text-destructive whitespace-pre-wrap"
                                            : output.type === "status" || output.type === "system"
                                                ? "text-muted-foreground whitespace-pre-wrap"
                                                : "text-foreground whitespace-pre-wrap"
                                }
                            >
                                {output.content}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                        <div className="text-center">
                            <div className="text-base mb-2">No output yet</div>
                            <div className="text-xs">Run your code to see results here</div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
