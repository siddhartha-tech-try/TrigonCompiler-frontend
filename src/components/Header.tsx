'use client';

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Language } from "@/hooks/useLanguages"

interface HeaderProps {
  languages: Language[]
  selectedLanguageId?: number | null
  onLanguageChange?: (languageId: number) => void
  onRun?: () => void
  isRunning?: boolean
  isLoading?: boolean
}

export default function Header({
  languages,
  selectedLanguageId,
  onLanguageChange,
  onRun,
  isRunning = false,
  isLoading = false,
}: HeaderProps) {
  const selectedLanguageName = languages
    .find((lang) => lang.id === selectedLanguageId)
    ?.language_name || "Select language"

  return (
    <header className="h-16 border-b border-border bg-background flex items-center px-6 gap-6">
      {/* Left: Branding */}
      <div className="flex items-center gap-2">
        <div className="flex flex-col gap-0">
          <div className="text-sm font-semibold text-foreground tracking-tight">
            Online Compiler
          </div>
          <div className="inline-flex">
            <span className="text-xs font-medium bg-muted text-muted-foreground px-2 py-0.5 rounded">
              Snippet Mode
            </span>
          </div>
        </div>
      </div>

      {/* Center: Language selector */}
      <div className="flex-1 flex justify-center">
        <Select 
          value={selectedLanguageId?.toString() || ""} 
          onValueChange={(value) => onLanguageChange?.(parseInt(value))}
          disabled={isLoading || languages.length === 0}
        >
          <SelectTrigger className="w-48 h-9 border border-border rounded-md bg-background text-foreground">
            <SelectValue placeholder={isLoading ? "Loading languages..." : selectedLanguageName} />
          </SelectTrigger>
          <SelectContent className="max-h-64 w-48">
            {languages.map((lang) => (
              <SelectItem key={lang.id} value={lang.id.toString()} className="py-2">
                {lang.language_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Right: Run button */}
      <div className="ml-auto">
        <Button
          onClick={onRun}
          disabled={isRunning}
          size="sm"
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
        >
          {isRunning ? (
            <>
              <span className="inline-block animate-spin mr-2">⏳</span>
              Running
            </>
          ) : (
            <>
              <span className="mr-2">▶</span>
              Run Code
            </>
          )}
        </Button>
      </div>
    </header>
  )
}
