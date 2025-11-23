'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

// IGDB 장르 이름 (영문)과 한글 이름 매핑
const GENRES = [
  { id: 'Shooter', name: '슈팅' },
  { id: 'Platform', name: '플랫포머' },
  { id: 'Puzzle', name: '퍼즐' },
  { id: 'Racing', name: '레이싱' },
  { id: 'Role-playing (RPG)', name: 'RPG' },
  { id: 'Strategy', name: '전략' },
  { id: 'Sport', name: '스포츠' },
  { id: 'Fighting', name: '격투' },
  { id: 'Adventure', name: '어드벤처' },
  { id: 'Simulator', name: '시뮬레이션' },
  { id: 'Arcade', name: '아케이드' },
  { id: 'Indie', name: '인디' },
]

interface GenreCircleProps {
  onSelectGenres: (genres: string[]) => void
  onClose: () => void
}

export function GenreCircle({ onSelectGenres, onClose }: GenreCircleProps) {
  const [selectedGenres, setSelectedGenres] = useState<Set<string>>(new Set())

  const toggleGenre = (genreId: string) => {
    setSelectedGenres(prev => {
      const newSet = new Set(prev)
      if (newSet.has(genreId)) {
        newSet.delete(genreId)
      } else {
        newSet.add(genreId)
      }
      return newSet
    })
  }

  const handleApply = () => {
    onSelectGenres(Array.from(selectedGenres))
    onClose()
  }

  const handleReset = () => {
    setSelectedGenres(new Set())
    onSelectGenres([])
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-background rounded-lg p-8 max-w-2xl w-full mx-4 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        >
          <X className="w-6 h-6" />
        </button>

        <h2 className="text-2xl font-bold mb-2 text-center">장르 선택</h2>
        <p className="text-sm text-muted-foreground mb-8 text-center">
          원하는 장르를 클릭하세요 (복수 선택 가능)
        </p>

        {/* 원형 장르 선택기 */}
        <div className="relative w-full aspect-square max-w-md mx-auto mb-8">
          <svg viewBox="0 0 400 400" className="w-full h-full">
            {/* 12개 섹션 */}
            {GENRES.map((genre, index) => {
              const angle = (index * 30 - 90) * (Math.PI / 180) // -90도부터 시작 (12시 방향)
              const x = 200 + Math.cos(angle) * 140
              const y = 200 + Math.sin(angle) * 140
              const isSelected = selectedGenres.has(genre.id)

              return (
                <g key={genre.id}>
                  {/* 클릭 가능한 원형 버튼 */}
                  <circle
                    cx={x}
                    cy={y}
                    r="35"
                    fill={isSelected ? 'hsl(25 95% 53%)' : 'hsl(var(--muted))'}
                    stroke={isSelected ? 'hsl(25 95% 53%)' : 'currentColor'}
                    strokeWidth="2"
                    className="cursor-pointer hover:opacity-80 transition-all"
                    onClick={() => toggleGenre(genre.id)}
                  />

                  {/* 장르 텍스트 */}
                  <text
                    x={x}
                    y={y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className={`text-xs font-semibold cursor-pointer select-none ${
                      isSelected ? 'fill-white' : 'fill-foreground'
                    }`}
                    onClick={() => toggleGenre(genre.id)}
                  >
                    {genre.name}
                  </text>
                </g>
              )
            })}

            {/* 중앙 텍스트 */}
            <text
              x="200"
              y="195"
              textAnchor="middle"
              className="text-sm fill-muted-foreground font-semibold"
            >
              선택됨
            </text>
            <text
              x="200"
              y="215"
              textAnchor="middle"
              className="text-2xl fill-primary font-bold"
            >
              {selectedGenres.size}
            </text>
          </svg>
        </div>

        {/* 버튼들 */}
        <div className="flex gap-3">
          <button
            onClick={handleReset}
            className="flex-1 px-4 py-2 border border-border rounded-md hover:bg-muted transition-colors"
          >
            초기화
          </button>
          <button
            onClick={handleApply}
            className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-medium"
          >
            적용하기
          </button>
        </div>
      </div>
    </div>
  )
}
