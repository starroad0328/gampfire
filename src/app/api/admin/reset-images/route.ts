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

    // Reset all profile images to null (default)
    const result = await prisma.user.updateMany({
      where: {
        image: {
          not: null,
        },
      },
      data: {
        image: null,
      },
    })

    return NextResponse.json({
      success: true,
      message: `Successfully reset ${result.count} profile images to default`,
      count: result.count,
    })
  } catch (error) {
    console.error('Reset images error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
