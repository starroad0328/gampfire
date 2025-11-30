import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    return NextResponse.json({
      hasSession: !!session,
      userEmail: session?.user?.email || null,
      adminEmail: process.env.ADMIN_EMAIL || 'NOT_SET',
      isAdmin: session?.user?.email === process.env.ADMIN_EMAIL,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to check admin status' }, { status: 500 })
  }
}
