import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')

    if (!query || query.trim().length === 0) {
      return NextResponse.json([])
    }

    const communities = await prisma.community.findMany({
      where: {
        OR: [
          {
            name: {
              contains: query,
              mode: 'insensitive',
            },
          },
          {
            description: {
              contains: query,
              mode: 'insensitive',
            },
          },
        ],
      },
      include: {
        _count: {
          select: {
            members: true,
            posts: true,
          },
        },
      },
      take: 10,
      orderBy: {
        members: {
          _count: 'desc',
        },
      },
    })

    return NextResponse.json(communities)
  } catch (error) {
    console.error('Failed to search communities:', error)
    return NextResponse.json(
      { error: 'Failed to search communities' },
      { status: 500 }
    )
  }
}
