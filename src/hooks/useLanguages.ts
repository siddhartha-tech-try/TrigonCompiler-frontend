'use client';

import { useState, useEffect } from "react"

export interface Language {
  id: number
  language_name: string
  file_extension: string
  file_name: string
  execution_type: "Compiled" | "Interpreted" | "Both"
  code_preview: string
}

export function useLanguages() {
  const [languages, setLanguages] = useState<Language[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        const baseUrl = import.meta.env.VITE_BACKEND_API_BASE_URL || "http://127.0.0.1:8000/api"
        const response = await fetch(`${baseUrl}/languages`, {
          credentials: 'include',
        })
        if (!response.ok) {
          throw new Error(`Failed to fetch languages: ${response.statusText}`)
        }
        const data = await response.json()
        setLanguages(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error")
        console.error("[v0] Error fetching languages:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchLanguages()
  }, [])

  return { languages, loading, error }
}
