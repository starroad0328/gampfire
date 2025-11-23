'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Play } from 'lucide-react'

interface TrailerPlayerProps {
  videoId: string
}

export function TrailerPlayer({ videoId }: TrailerPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)

  return (
    <div className="w-[750px]">
      {!isPlaying ? (
        <div
          className="relative aspect-video bg-muted rounded-lg overflow-hidden cursor-pointer group"
          onClick={() => setIsPlaying(true)}
        >
          <Image
            src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
            alt="게임 트레일러"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/50 transition-colors">
            <div className="w-20 h-20 rounded-full bg-orange-500 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Play className="w-10 h-10 text-white fill-white ml-1" />
            </div>
          </div>
        </div>
      ) : (
        <div className="aspect-video rounded-lg overflow-hidden">
          <iframe
            width="100%"
            height="100%"
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
            title="Game Trailer"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          />
        </div>
      )}
    </div>
  )
}
