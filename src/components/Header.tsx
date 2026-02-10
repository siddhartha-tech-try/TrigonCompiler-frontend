'use client';

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Moon, Sun } from 'lucide-react'
import { useTheme } from "@/contexts/ThemeContext"
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
  const { theme, toggleTheme } = useTheme()
  const selectedLanguageName = languages
    .find((lang) => lang.id === selectedLanguageId)
    ?.language_name || "Select language"

  return (
    <header className="h-16 border-b border-border bg-background flex items-center px-3 sm:px-6 gap-3 sm:gap-6">
      {/* Left: Branding */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="flex flex-col gap-0">
          <div className="text-xs sm:text-sm font-semibold text-foreground tracking-tight">
            Online Compiler
          </div>
          <div className="hidden sm:inline-flex">
            <span className="text-xs font-medium bg-muted text-muted-foreground px-2 py-0.5 rounded">
              Snippet Mode
            </span>
          </div>
        </div>
      </div>

      {/* Center: Language selector */}
      <div className="flex-1 flex justify-center min-w-0">
        <Select 
          value={selectedLanguageId?.toString() || ""} 
          onValueChange={(value) => onLanguageChange?.(parseInt(value))}
          disabled={isLoading || languages.length === 0}
        >
          <SelectTrigger className="w-32 sm:w-48 h-9 border border-border rounded-md bg-background text-foreground text-xs sm:text-sm">
            <SelectValue placeholder={isLoading ? "Loading..." : selectedLanguageName} />
          </SelectTrigger>
          <SelectContent className="max-h-64 w-32 sm:w-48 text-xs sm:text-sm">
            {languages.map((lang) => (
              <SelectItem key={lang.id} value={lang.id.toString()} className="py-2">
                {lang.language_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Right: Theme toggle and Run button */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <Button
          onClick={toggleTheme}
          variant="ghost"
          size="sm"
          className="h-9 w-9 p-0 hover:bg-muted"
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4" />
          ) : (
            <Moon className="w-4 h-4" />
          )}
        </Button>
        
        <Button
          onClick={onRun}
          disabled={isRunning}
          size="sm"
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-xs sm:text-sm px-2 sm:px-4"
        >
          {isRunning ? (
            <>
              <span className="inline-block animate-spin mr-1 sm:mr-2 text-sm">⏳</span>
              <span className="hidden sm:inline">Running</span>
              <span className="sm:hidden">...</span>
            </>
          ) : (
            <>
              <span className="mr-1 sm:mr-2">▶</span>
              <span className="hidden sm:inline">Run Code</span>
              <span className="sm:hidden">Run</span>
            </>
          )}
        </Button>
      </div>
    </header>
  )
}
