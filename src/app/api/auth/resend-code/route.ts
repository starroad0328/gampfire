import { NextResponse } from 'next/server'
import { sendVerificationEmail } from '@/lib/email'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: '이메일을 입력해주세요.' },
        { status: 400 }
      )
    }

    // Check if pending user exists
    const pendingUser = await prisma.pendingUser.findUnique({
      where: { email },
    })

    if (!pendingUser) {
      // Also check if already a verified user
      const existingUser = await prisma.user.findUnique({
        where: { email },
      })

      if (existingUser) {
        return NextResponse.json(
          { error: '이미 인증된 계정입니다.' },
          { status: 400 }
        )
      }

      return NextResponse.json(
        { error: '등록되지 않은 이메일입니다. 먼저 회원가입을 해주세요.' },
        { status: 404 }
      )
    }

    // Delete existing tokens for this email
    await prisma.verificationToken.deleteMany({
      where: { email },
    })

    // Generate new verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()

    // Save new verification token
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24)

    await prisma.verificationToken.create({
      data: {
        email,
        token: verificationCode,
        expires: expiresAt,
      },
    })

    // Send verification email
    try {
      await sendVerificationEmail(email, verificationCode)
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError)
      // Continue even if email fails - code is saved in DB
    }

    return NextResponse.json({
      success: true,
      message: '새로운 인증 코드가 이메일로 전송되었습니다.',
    })
  } catch (error) {
    console.error('Resend code error:', error)
    return NextResponse.json(
      { error: '인증 코드 재전송 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
