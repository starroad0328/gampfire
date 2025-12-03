import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { sendVerificationEmail } from '@/lib/email'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const { username, email, password } = await request.json()

    // Validate input
    if (!username || !email || !password) {
      return NextResponse.json(
        { error: '모든 필드를 입력해주세요.' },
        { status: 400 }
      )
    }

    // Validate username
    if (username.length < 3 || username.length > 20) {
      return NextResponse.json(
        { error: '아이디는 3-20자 사이여야 합니다.' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: '올바른 이메일 형식이 아닙니다.' },
        { status: 400 }
      )
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: '비밀번호는 최소 8자 이상이어야 합니다.' },
        { status: 400 }
      )
    }

    // Check if username already exists in User table
    const existingUsername = await prisma.user.findUnique({
      where: { username },
    })

    if (existingUsername) {
      return NextResponse.json(
        { error: '이미 사용 중인 아이디입니다.' },
        { status: 400 }
      )
    }

    // Check if username exists in PendingUser
    const pendingUsername = await prisma.pendingUser.findUnique({
      where: { username },
    })

    // If pending username exists with different email, reject
    // If same email, it will be deleted in the next step
    if (pendingUsername && pendingUsername.email !== email) {
      return NextResponse.json(
        { error: '이미 사용 중인 아이디입니다.' },
        { status: 400 }
      )
    }

    // Check if email already exists in User table (verified accounts)
    const existingEmail = await prisma.user.findUnique({
      where: { email },
    })

    if (existingEmail) {
      return NextResponse.json(
        { error: '이미 가입된 이메일입니다.' },
        { status: 400 }
      )
    }

    // Check if email exists in PendingUser (unverified)
    const pendingEmail = await prisma.pendingUser.findUnique({
      where: { email },
    })

    // If pending user exists, delete old one and create new (allow re-registration)
    if (pendingEmail) {
      // Delete old pending user and verification tokens
      await prisma.pendingUser.delete({
        where: { email },
      })
      await prisma.verificationToken.deleteMany({
        where: { email },
      })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create pending user (not actual user until email verified)
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24) // Expires in 24 hours

    await prisma.pendingUser.create({
      data: {
        username,
        email,
        password: hashedPassword,
        name: username, // Default name to username
        expiresAt,
      },
    })

    // Generate verification code (6-digit)
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()

    // Save verification token
    const tokenExpiresAt = new Date()
    tokenExpiresAt.setHours(tokenExpiresAt.getHours() + 24) // Expires in 24 hours

    await prisma.verificationToken.create({
      data: {
        email,
        token: verificationCode,
        expires: tokenExpiresAt,
      },
    })

    // Send verification email
    try {
      await sendVerificationEmail(email, verificationCode)
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError)
      // Continue even if email fails - user can request a new code
    }

    return NextResponse.json({
      success: true,
      message: '회원가입이 완료되었습니다. 이메일을 확인해주세요.',
      email,
    })
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: '회원가입 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
