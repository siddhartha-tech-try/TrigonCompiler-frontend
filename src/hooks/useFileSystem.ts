'use client';

import { useState, useCallback } from 'react';

export interface FileSystemItem {
    type: 'file' | 'directory';
    name: string;
    children?: FileSystemItem[];
    path?: string;
}

export function useFileSystem() {
    const [tree, setTree] = useState<FileSystemItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const getBaseUrl = () => {
        return import.meta.env.VITE_BACKEND_API_BASE_URL || 'http://127.0.0.1:8000/api';
    };

    const getFileTree = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${getBaseUrl()}/files/tree`, {
                credentials: 'include',
            });
            if (!response.ok) {
                throw new Error(`Failed to fetch file tree: ${response.statusText}`);
            }
            const data = await response.json();
            setTree(data.tree || []);
            return data.tree || [];
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            setError(message);
            console.error('[v0] Error fetching file tree:', err);
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    const readFile = useCallback(async (path: string): Promise<string | null> => {
        try {
            const response = await fetch(`${getBaseUrl()}/files/read?path=${encodeURIComponent(path)}`, {
                credentials: 'include',
            });
            if (!response.ok) {
                throw new Error(`Failed to read file: ${response.statusText}`);
            }
            const data = await response.json();
            return data.content || '';
        } catch (err) {
            console.error('[v0] Error reading file:', err);
            return null;
        }
    }, []);

    const updateFile = useCallback(async (path: string, content: string): Promise<boolean> => {
        try {
            const response = await fetch(`${getBaseUrl()}/files`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ path, content }),
                credentials: 'include',
            });
            if (!response.ok) {
                throw new Error(`Failed to update file: ${response.statusText}`);
            }
            console.log('[v0] File synced:', path);
            return true;
        } catch (err) {
            console.error('[v0] Error updating file:', err);
            return false;
        }
    }, []);

    const createFile = useCallback(async (path: string, type: 'file' | 'directory'): Promise<boolean> => {
        try {
            const response = await fetch(`${getBaseUrl()}/files`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ path, type }),
                credentials: 'include',
            });
            if (!response.ok) {
                throw new Error(`Failed to create: ${response.statusText}`);
            }
            // Refresh file tree after creation
            await getFileTree();
            return true;
        } catch (err) {
            console.error('[v0] Error creating file:', err);
            return false;
        }
    }, [getFileTree]);

    const deleteFile = useCallback(async (path: string, language?: string): Promise<boolean> => {
        try {
            const response = await fetch(`${getBaseUrl()}/files`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ path, language }),
                credentials: 'include',
            });
            if (!response.ok) {
                throw new Error(`Failed to delete: ${response.statusText}`);
            }
            // Refresh file tree after deletion
            await getFileTree();
            return true;
        } catch (err) {
            console.error('[v0] Error deleting file:', err);
            return false;
        }
    }, [getFileTree]);

    return {
        tree,
        loading,
        error,
        getFileTree,
        readFile,
        updateFile,
        createFile,
        deleteFile,
    };
}
