'use client';

import { useState, useCallback } from 'react';

export interface FileCache {
    [path: string]: {
        content: string;
        isDirty: boolean;
        hasBeenSynced: boolean;
    };
}

export function useFileCache() {
    const [cache, setCache] = useState<FileCache>({});
    const [activeFilePath, setActiveFilePath] = useState<string | null>(null);

    // Get file content from cache or initialize empty
    const getFileContent = useCallback((path: string): string => {
        return cache[path]?.content ?? '';
    }, [cache]);

    // Update file content in cache
    const updateFileContent = useCallback((path: string, content: string) => {
        setCache((prev) => ({
            ...prev,
            [path]: {
                content,
                isDirty: true,
            },
        }));
    }, []);

    // Load file into cache from backend
    const loadFile = useCallback(
        async (path: string, readFile: (path: string) => Promise<string | null>) => {
            const content = await readFile(path);
            if (content !== null) {
                setCache((prev) => ({
                    ...prev,
                    [path]: {
                        content,
                        isDirty: false,
                    },
                }));
            }
            return content;
        },
        []
    );

    // Set active file
    const setActive = useCallback((path: string | null) => {
        setActiveFilePath(path);
    }, []);

    // Get active file content
    const getActiveContent = useCallback((): string => {
        if (!activeFilePath) return '';
        return cache[activeFilePath]?.content ?? '';
    }, [activeFilePath, cache]);

    // Update active file content
    const updateActiveContent = useCallback((content: string) => {
        if (!activeFilePath) return;
        updateFileContent(activeFilePath, content);
    }, [activeFilePath, updateFileContent]);

    // Get all dirty files (files that have been modified)
    const getDirtyFiles = useCallback((): Array<{ path: string; content: string }> => {
        return Object.entries(cache)
            .filter(([_, file]) => file.isDirty)
            .map(([path, file]) => ({
                path,
                content: file.content,
            }));
    }, [cache]);

    // Mark file as clean after sync
    const markFileClean = useCallback((path: string) => {
        setCache((prev) => ({
            ...prev,
            [path]: {
                ...prev[path],
                isDirty: false,
            },
        }));
    }, []);

    // Add file to cache
    const addFileToCache = useCallback((path: string, content: string = '') => {
        setCache((prev) => ({
            ...prev,
            [path]: {
                content,
                isDirty: false,
                hasBeenSynced: false,
            },
        }));
    }, []);

    const markFileSynced = useCallback((path: string) => {
        setCache(prev => ({
            ...prev,
            [path]: {
            ...prev[path],
            isDirty: false,
            hasBeenSynced: true,
            },
        }));
    }, []);


    // Remove file from cache
    const removeFileFromCache = useCallback((path: string) => {
        setCache((prev) => {
            const newCache = { ...prev };
            delete newCache[path];
            return newCache;
        });
        // If deleted file was active, clear active
        if (activeFilePath === path) {
            setActiveFilePath(null);
        }
    }, [activeFilePath]);

    // Clear entire cache
    const clearCache = useCallback(() => {
        setCache({});
        setActiveFilePath(null);
    }, []);

    return {
        cache,
        activeFilePath,
        getFileContent,
        updateFileContent,
        loadFile,
        setActive,
        getActiveContent,
        updateActiveContent,
        getDirtyFiles,
        markFileClean,
        addFileToCache,
        removeFileFromCache,
        clearCache,
        markFileSynced,
    };
}
