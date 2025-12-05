import { Star, StarHalf } from 'lucide-react'

interface StarRatingProps {
  rating: number
  size?: 'sm' | 'md' | 'lg'
  showNumber?: boolean
}

export function StarRating({ rating, size = 'md', showNumber = false }: StarRatingProps) {
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  }

  const iconSize = sizeClasses[size]
  const fullStars = Math.floor(rating)
  const hasHalfStar = rating % 1 >= 0.25 && rating % 1 < 0.75
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0)

  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {/* Full stars */}
        {[...Array(fullStars)].map((_, i) => (
          <Star
            key={`full-${i}`}
            className={`${iconSize} fill-yellow-400 text-yellow-400`}
          />
        ))}

        {/* Half star */}
        {hasHalfStar && (
          <div className="relative">
            <Star className={`${iconSize} text-yellow-400`} />
            <div className="absolute inset-0 overflow-hidden" style={{ width: '50%' }}>
              <Star className={`${iconSize} fill-yellow-400 text-yellow-400`} />
            </div>
          </div>
        )}

        {/* Empty stars */}
        {[...Array(emptyStars)].map((_, i) => (
          <Star
            key={`empty-${i}`}
            className={`${iconSize} text-muted-foreground`}
          />
        ))}
      </div>

      {showNumber && (
        <span className="text-sm font-semibold ml-1">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  )
}
