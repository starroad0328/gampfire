import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { randomBytes } from 'crypto'

const REALM = process.env.NEXTAUTH_URL || 'http://localhost:3000'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.redirect(new URL('/login?error=missing_token', REALM))
    }

    // Decode the token
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString())
    const { userId } = decoded

    if (!userId) {
      return NextResponse.redirect(new URL('/login?error=invalid_token', REALM))
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.redirect(new URL('/login?error=user_not_found', REALM))
    }

    // Create a one-time login token
    const loginToken = randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes

    // Store the token in the VerificationToken table
    await prisma.verificationToken.create({
      data: {
        email: user.email,
        token: loginToken,
        expires: expiresAt,
      },
    })

    // Redirect to login page with the token
    return NextResponse.redirect(
      new URL(`/login?steamToken=${loginToken}`, REALM)
    )
  } catch (error) {
    console.error('Steam verify error:', error)
    return NextResponse.redirect(
      new URL('/login?error=verification_failed', REALM)
    )
  }
}
