import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getSteamUserSummary } from '@/lib/steam'
import { prisma } from '@/lib/prisma'

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Set user's avatar to default
    await prisma.user.update({
      where: { email: session.user.email },
      data: {
        image: '/default-avatar.png',
      },
    })

    return NextResponse.json({
      success: true,
      image: '/default-avatar.png',
    })
  } catch (error) {
    console.error('Delete avatar error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { avatarType } = body

    if (avatarType !== 'steam') {
      return NextResponse.json(
        { error: 'Invalid avatar type' },
        { status: 400 }
      )
    }

    // Get user's Steam ID
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { steamId: true },
    })

    if (!user?.steamId) {
      return NextResponse.json(
        { error: 'Steam account not linked' },
        { status: 400 }
      )
    }

    // Fetch Steam profile to get avatar
    const steamProfile = await getSteamUserSummary(user.steamId)

    if (!steamProfile) {
      return NextResponse.json(
        { error: 'Failed to fetch Steam profile' },
        { status: 400 }
      )
    }

    // Update user's avatar to Steam avatar
    await prisma.user.update({
      where: { email: session.user.email },
      data: {
        image: steamProfile.avatarfull,
      },
    })

    return NextResponse.json({
      success: true,
      image: steamProfile.avatarfull,
    })
  } catch (error) {
    console.error('Update avatar error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
