import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is admin
    const adminEmail = process.env.ADMIN_EMAIL?.trim()
    if (session.user.email.trim() !== adminEmail) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const { userId, username } = await request.json()

    if (!userId || !username) {
      return NextResponse.json(
        { error: 'User ID and username are required' },
        { status: 400 }
      )
    }

    // Validate username format
    if (username.length < 3 || username.length > 20) {
      return NextResponse.json(
        { error: 'Username must be between 3-20 characters' },
        { status: 400 }
      )
    }

    // Check if username is already taken
    const existingUser = await prisma.user.findUnique({
      where: { username },
    })

    if (existingUser && existingUser.id !== userId) {
      return NextResponse.json(
        { error: 'Username is already taken' },
        { status: 400 }
      )
    }

    // Update username
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { username },
    })

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
      },
    })
  } catch (error) {
    console.error('Update username error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
