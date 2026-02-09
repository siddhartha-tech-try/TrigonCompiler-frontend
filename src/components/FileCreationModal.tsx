'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface FileCreationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (filename: string) => Promise<void>;
    fileExtension?: string;
}

export default function FileCreationModal({
    isOpen,
    onClose,
    onCreate,
    fileExtension = '.txt',
}: FileCreationModalProps) {
    const [filename, setFilename] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleCreate = async () => {
        if (!filename.trim()) {
            setError('Filename cannot be empty');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            await onCreate(filename);
            setFilename('');
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create file');
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !isLoading) {
            handleCreate();
        } else if (e.key === 'Escape') {
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-card border border-border rounded-lg p-6 w-96 shadow-lg">
                <h2 className="text-lg font-semibold text-foreground mb-4">
                    Create New File
                </h2>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            Filename
                        </label>
                        <input
                            type="text"
                            value={filename}
                            onChange={(e) => setFilename(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="e.g., main.py"
                            autoFocus
                            disabled={isLoading}
                            className="w-full px-3 py-2 bg-background border border-border rounded text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                    </div>

                    {error && (
                        <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
                            {error}
                        </div>
                    )}

                    <div className="flex gap-2 justify-end">
                        <Button
                            onClick={onClose}
                            disabled={isLoading}
                            variant="ghost"
                            size="sm"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleCreate}
                            disabled={isLoading}
                            size="sm"
                            className="bg-primary hover:bg-primary/90"
                        >
                            {isLoading ? 'Creating...' : 'Create'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
