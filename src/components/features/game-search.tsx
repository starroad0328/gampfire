'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { convertIGDBGame, getImageUrl } from '@/lib/igdb'
import Image from 'next/image'

interface SearchResult {
  id: number
  name: string
  title?: string // 한국어 제목
  cover?: { url: string }
  coverImage?: string | null
  first_release_date?: number
  genres?: Array<{ name: string }>
}

// 일치하는 철자를 강조하는 함수
function highlightMatch(text: string, query: string) {
  if (!query.trim()) return text

  const regex = new RegExp(`(${query})`, 'gi')
  const parts = text.split(regex)

  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-yellow-200 dark:bg-yellow-900">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  )
}

export function GameSearch() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // 외부 클릭 감지
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setResults([])
      setShowResults(false)
      return
    }

    setShowResults(true)

    const timeoutId = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/games/search?q=${encodeURIComponent(query)}`)
        if (res.ok) {
          const data = await res.json()
          setResults(data.games || [])
        }
      } catch (error) {
        console.error('Search error:', error)
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [query])

  const handleSelect = (gameId: number) => {
    setQuery('')
    setShowResults(false)
    router.push(`/games/${gameId}`)
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="게임 검색... (최소 2글자)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim().length >= 2 && setShowResults(true)}
          className="pl-10"
        />
      </div>

      {showResults && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-background border rounded-lg shadow-lg max-h-[400px] overflow-y-auto z-50">
          {loading && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              검색 중...
            </div>
          )}

          {!loading && query && results.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              검색 결과가 없습니다
            </div>
          )}

          {!loading && results.length > 0 && (
            <div className="p-1.5">
              {results.slice(0, 5).map((game) => (
                <button
                  key={game.id}
                  onClick={() => handleSelect(game.id)}
                  className="w-full flex items-start gap-2 p-1.5 rounded-md hover:bg-muted transition-colors text-left"
                >
                  <div className="relative w-12 h-16 bg-muted rounded overflow-hidden flex-shrink-0">
                    {(game.coverImage || game.cover?.url) ? (
                      <Image
                        src={game.coverImage || getImageUrl(game.cover!.url, 'cover_small')}
                        alt={game.title || game.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground">
                        No Image
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-xs line-clamp-1">
                      {highlightMatch(game.title || game.name, query)}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-muted-foreground">
                      {game.first_release_date && (
                        <span>
                          {new Date(game.first_release_date * 1000).getFullYear()}
                        </span>
                      )}
                      {game.genres && game.genres.length > 0 && (
                        <>
                          <span>•</span>
                          <span className="truncate">{game.genres[0].name}</span>
                        </>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
