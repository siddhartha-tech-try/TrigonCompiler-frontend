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
  isLoading?: boolean
}

export default function Header({
  languages,
  selectedLanguageId,
  onLanguageChange,
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

      {/* Right: Theme toggle */}
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
      </div>
    </header>
  )
}
