'use client'

import { useState, useRef, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface GameDescriptionProps {
  description: string
}

export function GameDescription({ description }: GameDescriptionProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [shouldShowButton, setShouldShowButton] = useState(false)
  const textRef = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    if (textRef.current) {
      // Calculate line height and total height
      const lineHeight = parseInt(window.getComputedStyle(textRef.current).lineHeight)
      const maxHeight = lineHeight * 6 // 6 lines
      const actualHeight = textRef.current.scrollHeight

      // Show button if content is more than 6 lines
      setShouldShowButton(actualHeight > maxHeight)
    }
  }, [description])

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-4">게임 정보</h2>
      <div className="relative">
        <p
          ref={textRef}
          className={`text-muted-foreground whitespace-pre-wrap ${
            !isExpanded && shouldShowButton ? 'line-clamp-6' : ''
          }`}
        >
          {description}
        </p>
        {shouldShowButton && (
          <div className={`${!isExpanded ? 'mt-2' : 'mt-4'}`}>
            <Button
              variant="ghost"
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-4 h-4 mr-2" />
                  접기
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-2" />
                  더보기
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </Card>
  )
}
