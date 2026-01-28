'use client';

import { useState, useEffect } from "react"
import Header from "@/components/Header"
import Playground from "@/components/Playground"
import { useLanguages, type Language } from "@/hooks/useLanguages"

function App() {
  const { languages, loading, error } = useLanguages()
  const [selectedLanguageId, setSelectedLanguageId] = useState<number | null>(null)
  const selectedLanguage = languages.find((lang) => lang.id === selectedLanguageId)

  // Set first language as default when languages load
  useEffect(() => {
    if (languages.length > 0 && selectedLanguageId === null) {
      setSelectedLanguageId(languages[0].id)
    }
  }, [languages, selectedLanguageId])

  return (
    <div className="h-screen flex flex-col bg-background">
      <Header
        languages={languages}
        selectedLanguageId={selectedLanguageId}
        onLanguageChange={setSelectedLanguageId}
        isLoading={loading}
      />
      {error && (
        <div className="px-4 py-2 bg-destructive/10 text-destructive text-sm">
          Error loading languages: {error}
        </div>
      )}
      <Playground selectedLanguage={selectedLanguage} />
    </div>
  )
}

export default App
