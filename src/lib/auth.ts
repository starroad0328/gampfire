import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: "아이디", type: "text" },
        password: { label: "비밀번호", type: "password" }
      },
      async authorize(credentials: any) {
        // Check for Steam login token
        if (credentials?.steamToken) {
          // Find the verification token
          const verificationToken = await prisma.verificationToken.findFirst({
            where: {
              token: credentials.steamToken,
              expires: {
                gte: new Date(),
              },
            },
          })

          if (!verificationToken) {
            throw new Error('Steam 로그인 토큰이 유효하지 않습니다.')
          }

          // Get the user by email from the token
          const user = await prisma.user.findUnique({
            where: { email: verificationToken.email },
            include: {
              reviews: true,
            },
          })

          if (!user) {
            throw new Error('사용자를 찾을 수 없습니다.')
          }

          // Clear the one-time token
          await prisma.verificationToken.delete({
            where: { id: verificationToken.id },
          })

          const needsOnboarding = user.reviews.length === 0

          if (!user.username) {
            throw new Error('사용자 정보가 올바르지 않습니다.')
          }

          return {
            id: user.id,
            username: user.username,
            email: user.email,
            name: user.name,
            image: user.image,
            needsOnboarding,
          }
        }

        // Regular username/password login
        if (!credentials?.username || !credentials?.password) {
          throw new Error('아이디와 비밀번호를 입력해주세요.')
        }

        // Find user by username
        const user = await prisma.user.findUnique({
          where: { username: credentials.username },
          include: {
            reviews: true,
          },
        })

        if (!user || !user.password) {
          throw new Error('아이디 또는 비밀번호가 일치하지 않습니다.')
        }

        // Check if email is verified
        if (!user.emailVerified) {
          throw new Error('이메일 인증이 필요합니다.')
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isPasswordValid) {
          throw new Error('아이디 또는 비밀번호가 일치하지 않습니다.')
        }

        // Check if user needs onboarding
        const needsOnboarding = user.reviews.length === 0

        if (!user.username) {
          throw new Error('사용자 정보가 올바르지 않습니다.')
        }

        return {
          id: user.id,
          username: user.username,
          email: user.email,
          name: user.name,
          image: user.image,
          needsOnboarding,
        }
      }
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Google OAuth sign-in
      if (account?.provider === 'google') {
        try {
          const email = user.email
          if (!email) {
            return false
          }

          // Check if email was deleted (banned from re-registration)
          const deletedEmail = await prisma.deletedEmail.findUnique({
            where: { email },
          })

          if (deletedEmail) {
            return '/login?error=DeletedAccount'
          }

          // Check if user exists
          let existingUser = await prisma.user.findUnique({
            where: { email },
            include: { reviews: true },
          })

          if (!existingUser) {
            // Create new user from Google account
            const username = email.split('@')[0] + Math.floor(Math.random() * 1000)
            existingUser = await prisma.user.create({
              data: {
                email,
                username,
                name: user.name || username,
                image: '/default-avatar.png', // 기본 프로필 사진 사용
                emailVerified: new Date(), // Google email is already verified
              },
              include: { reviews: true },
            })
          }

          // Store user data for JWT callback
          user.id = existingUser.id
          user.username = existingUser.username!
          user.needsOnboarding = existingUser.reviews.length === 0

          return true
        } catch (error) {
          console.error('Google sign-in error:', error)
          return false
        }
      }

      return true
    },
    async jwt({ token, user, account }) {
      // Initial sign in
      if (user) {
        token.id = user.id
        token.username = user.username
        token.needsOnboarding = user.needsOnboarding
      }
      return token
    },
    async session({ session, token }) {
      // Send properties to the client
      if (session.user && token.id) {
        // Check if user still exists in database
        const userExists = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { id: true },
        })

        if (!userExists) {
          // User was deleted, return empty session to force logout
          return { ...session, user: undefined } as any
        }

        session.user.id = token.id as string
        session.user.username = token.username as string
        session.user.needsOnboarding = token.needsOnboarding as boolean
      }
      return session
    }
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
}
