import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Star } from 'lucide-react'
import { translateGenre } from '@/lib/translations'

interface GameCardProps {
  id: string
  title: string
  coverImage: string | null
  averageRating: number
  totalReviews: number
  genres: string[]
  platforms: string[]
  releaseDate?: Date | null
}

export function GameCard({
  id,
  title,
  coverImage,
  averageRating,
  totalReviews,
  genres,
  platforms,
  releaseDate,
}: GameCardProps) {
  const linkHref = `/games/${id}`

  return (
    <Link href={linkHref}>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-full">
        <CardHeader className="p-0">
          <div className="relative aspect-[3/4] bg-muted">
            {coverImage ? (
              <Image
                src={coverImage}
                alt={title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 50vw, 25vw"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                No Image
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-4">
          <h3 className="font-bold text-lg line-clamp-2 mb-2">{title}</h3>

          <div className="flex items-center gap-3 mb-2">
            {averageRating > 0 ? (
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold">{averageRating.toFixed(1)}</span>
                <span className="text-xs text-muted-foreground">
                  ({totalReviews})
                </span>
              </div>
            ) : (
              <span className="text-xs text-muted-foreground">평점 없음</span>
            )}
          </div>

          <div className="flex flex-wrap gap-1 mb-2">
            {genres.slice(0, 2).map((genre) => (
              <Badge key={genre} variant="secondary" className="text-xs">
                {translateGenre(genre)}
              </Badge>
            ))}
          </div>
        </CardContent>

        <CardFooter className="p-4 pt-0 text-xs text-muted-foreground">
          {platforms.slice(0, 3).join(', ')}
        </CardFooter>
      </Card>
    </Link>
  )
}
