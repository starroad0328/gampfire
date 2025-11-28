import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Check if user is admin
    if (!session?.user?.email || session.user.email !== process.env.ADMIN_EMAIL) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Prevent deleting own account
    const userToDelete = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    })

    if (userToDelete?.email === session.user.email) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      )
    }

    // Delete user (Cascade will delete all related data: reviews, likes, etc.)
    await prisma.user.delete({
      where: { id: userId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete user error:', error)
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    )
  }
}
