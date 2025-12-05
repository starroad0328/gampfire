import { NextRequest, NextResponse } from 'next/server'
import { RelyingParty } from 'openid'
import { prisma } from '@/lib/prisma'
import { getSession } from 'next-auth/react'
import { signIn } from 'next-auth/react'

const REALM = process.env.NEXTAUTH_URL || 'http://localhost:3000'
const RETURN_URL = `${REALM}/api/auth/steam/callback`

interface SteamPlayerSummary {
  response: {
    players: Array<{
      steamid: string
      personaname: string
      avatarfull: string
      profileurl: string
    }>
  }
}

async function getSteamUserInfo(steamId: string) {
  const apiKey = process.env.STEAM_API_KEY
  if (!apiKey) {
    throw new Error('STEAM_API_KEY is not configured')
  }

  const response = await fetch(
    `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${apiKey}&steamids=${steamId}`
  )

  if (!response.ok) {
    throw new Error('Failed to fetch Steam user info')
  }

  const data: SteamPlayerSummary = await response.json()
  return data.response.players[0]
}

export async function GET(request: NextRequest) {
  try {
    const url = request.nextUrl.toString()

    const relyingParty = new RelyingParty(
      RETURN_URL,
      REALM,
      true,
      false,
      []
    )

    // Verify the Steam OpenID response
    return new Promise<NextResponse>(async (resolve, reject) => {
      relyingParty.verifyAssertion(url, async (error, result) => {
        try {
          if (error || !result?.authenticated) {
            console.error('Steam verification error:', error)
            resolve(
              NextResponse.redirect(
                new URL('/login?error=steam_auth_failed', REALM)
              )
            )
            return
          }

          // Extract Steam ID from the claimed identifier
          // Format: https://steamcommunity.com/openid/id/[steamid]
          const claimedId = result.claimedIdentifier
          const steamIdMatch = claimedId?.match(/\/id\/(\d+)/)

          if (!steamIdMatch) {
            resolve(
              NextResponse.redirect(
                new URL('/login?error=invalid_steam_id', REALM)
              )
            )
            return
          }

          const steamId = steamIdMatch[1]

          // Get Steam user info
          const steamUser = await getSteamUserInfo(steamId)

          // Check if user already exists with this Steam ID
          let user = await prisma.user.findFirst({
            where: { steamId },
          })

          if (user) {
            // Update Steam username only (not avatar)
            await prisma.user.update({
              where: { id: user.id },
              data: {
                steamUsername: steamUser.personaname,
              },
            })
          } else {
            // Create new user with Steam account
            // Generate a unique username from Steam name
            const baseUsername = steamUser.personaname
              .toLowerCase()
              .replace(/[^a-z0-9]/g, '')
              .slice(0, 20)

            let username = baseUsername
            let counter = 1

            // Ensure username is unique
            while (await prisma.user.findUnique({ where: { username } })) {
              username = `${baseUsername}${counter}`
              counter++
            }

            user = await prisma.user.create({
              data: {
                username,
                name: steamUser.personaname,
                email: `${steamId}@steam.placeholder.com`, // Placeholder email
                emailVerified: new Date(), // Auto-verify Steam users
                steamId,
                steamUsername: steamUser.personaname,
                image: null, // 기본 프로필 사진 사용
                password: null, // No password for Steam-only users
              },
            })
          }

          // Create a signed token for authentication
          // We'll redirect to a page that will trigger NextAuth signIn
          const token = Buffer.from(JSON.stringify({ userId: user.id })).toString('base64')

          resolve(
            NextResponse.redirect(
              new URL(`/api/auth/steam/verify?token=${token}`, REALM)
            )
          )
        } catch (err) {
          console.error('Steam callback processing error:', err)
          resolve(
            NextResponse.redirect(
              new URL('/login?error=steam_processing_failed', REALM)
            )
          )
        }
      })
    })
  } catch (error) {
    console.error('Steam callback error:', error)
    return NextResponse.redirect(
      new URL('/login?error=steam_callback_failed', REALM)
    )
  }
}
