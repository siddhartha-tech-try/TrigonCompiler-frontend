'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, File, Folder } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { FileSystemItem } from '@/hooks/useFileSystem';

interface FileTreeProps {
    tree: FileSystemItem[];
    activeFilePath: string | null;
    onFileSelect: (path: string) => void;
    onCreateFile: () => void;
    loading: boolean;
}

function TreeNode({
    item,
    activeFilePath,
    onFileSelect,
    path,
}: {
    item: FileSystemItem;
    activeFilePath: string | null;
    onFileSelect: (path: string) => void;
    path: string;
}) {
    const [isExpanded, setIsExpanded] = useState(true);

    const isFile = item.type === 'file';
    const isActive = isFile && path === activeFilePath;

    if (isFile) {
        return (
            <div
                onClick={() => onFileSelect(path)}
                className={`flex items-center gap-2 px-2 py-1 cursor-pointer rounded text-sm ${isActive
                        ? 'bg-primary/20 text-primary font-semibold'
                        : 'text-foreground hover:bg-muted'
                    }`}
            >
                <File className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{item.name}</span>
            </div>
        );
    }

    return (
        <div>
            <div
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-2 px-2 py-1 cursor-pointer rounded text-sm text-foreground hover:bg-muted"
            >
                {isExpanded ? (
                    <ChevronDown className="w-4 h-4 flex-shrink-0" />
                ) : (
                    <ChevronRight className="w-4 h-4 flex-shrink-0" />
                )}
                <Folder className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{item.name}</span>
            </div>
            {isExpanded && item.children && (
                <div className="ml-2 border-l border-border">
                    {item.children.map((child, idx) => (
                        <TreeNode
                            key={idx}
                            item={child}
                            activeFilePath={activeFilePath}
                            onFileSelect={onFileSelect}
                            path={path ? `${path}/${child.name}` : child.name}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default function FileTree({
    tree,
    activeFilePath,
    onFileSelect,
    onCreateFile,
    loading,
}: FileTreeProps) {
    return (
        <div className="flex flex-col h-full bg-card border-r border-border">
            {/* Header */}
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">Files</h3>
                <Button
                    onClick={onCreateFile}
                    disabled={loading}
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
                    title="Create new file"
                >
                    +
                </Button>
            </div>

            {/* Tree Content */}
            <div className="flex-1 overflow-auto p-2">
                {loading ? (
                    <div className="text-xs text-muted-foreground px-2 py-1">
                        Loading files...
                    </div>
                ) : tree.length === 0 ? (
                    <div className="text-xs text-muted-foreground px-2 py-1">
                        No files
                    </div>
                ) : (
                    <div className="space-y-1">
                        {tree.map((item, idx) => (
                            <TreeNode
                                key={idx}
                                item={item}
                                activeFilePath={activeFilePath}
                                onFileSelect={onFileSelect}
                                path={item.name}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
