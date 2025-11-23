'use client'

import { useState, useEffect, useRef } from 'react'
import { Search } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Community {
  id: string
  name: string
  description: string | null
  image: string | null
  _count: {
    members: number
    posts: number
  }
}

export function CommunitySearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Community[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const searchCommunities = async () => {
      if (query.trim().length < 1) {
        setResults([])
        setIsOpen(false)
        return
      }

      setIsLoading(true)
      setIsOpen(true)

      try {
        const response = await fetch(`/api/communities/search?q=${encodeURIComponent(query)}`)
        if (response.ok) {
          const data = await response.json()
          setResults(data)
        }
      } catch (error) {
        console.error('Failed to search communities:', error)
      } finally {
        setIsLoading(false)
      }
    }

    const debounce = setTimeout(searchCommunities, 300)
    return () => clearTimeout(debounce)
  }, [query])

  const handleResultClick = (communityId: string) => {
    setQuery('')
    setIsOpen(false)
    router.push(`/communities/${communityId}`)
  }

  return (
    <div ref={searchRef} className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          placeholder="동아리 검색..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim().length > 0 && setIsOpen(true)}
          className="w-full pl-10 pr-4 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {isOpen && (
        <div className="absolute top-full mt-2 w-full bg-card border border-border rounded-md shadow-lg max-h-96 overflow-y-auto z-50">
          {isLoading ? (
            <div className="p-4 text-center text-muted-foreground">
              검색 중...
            </div>
          ) : results.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              검색 결과가 없습니다
            </div>
          ) : (
            <div className="py-2">
              {results.map((community) => (
                <button
                  key={community.id}
                  onClick={() => handleResultClick(community.id)}
                  className="w-full px-4 py-3 text-left hover:bg-muted transition-colors flex items-center gap-3"
                >
                  {community.image ? (
                    <img
                      src={community.image}
                      alt={community.name}
                      className="w-12 h-12 rounded-md object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                      <span className="text-lg font-bold">
                        {community.name[0].toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{community.name}</div>
                    {community.description && (
                      <div className="text-sm text-muted-foreground truncate">
                        {community.description}
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground mt-1">
                      부원 {community._count.members}명 · 게시글 {community._count.posts}개
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
