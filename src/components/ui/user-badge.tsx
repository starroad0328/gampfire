import { Badge } from '@/components/ui/badge'
import { Shield, Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface UserBadgeProps {
  role: string
  size?: 'sm' | 'md' | 'lg'
  showIcon?: boolean
  className?: string
}

export function UserBadge({ role, size = 'md', showIcon = true, className }: UserBadgeProps) {
  if (role === 'user') {
    return null
  }

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
    lg: 'text-base px-3 py-1.5',
  }

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  }

  if (role === 'expert') {
    return (
      <Badge
        className={cn(
          'bg-yellow-600 hover:bg-yellow-700 text-white',
          sizeClasses[size],
          className
        )}
      >
        {showIcon && <Shield className={cn(iconSizes[size], 'mr-1')} />}
        전문가
      </Badge>
    )
  }

  if (role === 'influencer') {
    return (
      <Badge
        className={cn(
          'bg-purple-600 hover:bg-purple-700 text-white',
          sizeClasses[size],
          className
        )}
      >
        {showIcon && <Star className={cn(iconSizes[size], 'mr-1')} />}
        인플루언서
      </Badge>
    )
  }

  return null
}
