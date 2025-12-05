import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const { email, code } = await request.json()

    if (!email || !code) {
      return NextResponse.json(
        { error: '이메일과 인증 코드를 입력해주세요.' },
        { status: 400 }
      )
    }

    // Find verification token
    const verificationToken = await prisma.verificationToken.findFirst({
      where: {
        email,
        token: code,
      },
    })

    if (!verificationToken) {
      return NextResponse.json(
        { error: '유효하지 않은 인증 코드입니다.' },
        { status: 400 }
      )
    }

    // Check if token is expired
    if (verificationToken.expires < new Date()) {
      // Delete expired token
      await prisma.verificationToken.delete({
        where: { id: verificationToken.id },
      })

      return NextResponse.json(
        { error: '인증 코드가 만료되었습니다. 새로운 코드를 요청해주세요.' },
        { status: 400 }
      )
    }

    // Get pending user data
    const pendingUser = await prisma.pendingUser.findUnique({
      where: { email },
    })

    if (!pendingUser) {
      return NextResponse.json(
        { error: '가입 정보를 찾을 수 없습니다. 다시 회원가입해주세요.' },
        { status: 404 }
      )
    }

    // Create actual user account
    await prisma.user.create({
      data: {
        username: pendingUser.username,
        email: pendingUser.email,
        password: pendingUser.password,
        name: pendingUser.name,
        image: '/default-avatar.png',
        emailVerified: new Date(),
      },
    })

    // Delete pending user
    await prisma.pendingUser.delete({
      where: { email },
    })

    // Delete used verification token
    await prisma.verificationToken.delete({
      where: { id: verificationToken.id },
    })

    return NextResponse.json({
      success: true,
      message: '이메일 인증이 완료되었습니다!',
    })
  } catch (error) {
    console.error('Verification error:', error)
    return NextResponse.json(
      { error: '인증 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
