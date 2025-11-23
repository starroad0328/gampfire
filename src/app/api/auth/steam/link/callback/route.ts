import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const STEAM_OPENID_URL = 'https://steamcommunity.com/openid/login'

async function verifySteamLogin(params: URLSearchParams): Promise<string | null> {
  try {
    const verifyParams = new URLSearchParams(params)
    verifyParams.set('openid.mode', 'check_authentication')

    const response = await fetch(STEAM_OPENID_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: verifyParams.toString(),
    })

    const text = await response.text()

    if (text.includes('is_valid:true')) {
      const claimedId = params.get('openid.claimed_id')
      if (claimedId) {
        const steamId = claimedId.replace('https://steamcommunity.com/openid/id/', '')
        return steamId
      }
    }

    return null
  } catch (error) {
    console.error('Steam verification error:', error)
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check if user is logged in
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.redirect(
        new URL('/login?error=Unauthorized', request.url)
      )
    }

    const searchParams = request.nextUrl.searchParams

    // Verify Steam OpenID response
    const steamId = await verifySteamLogin(searchParams)

    if (!steamId) {
      return NextResponse.redirect(
        new URL('/profile?error=SteamVerificationFailed', request.url)
      )
    }

    // Check if this Steam account is already linked to another user
    const existingUser = await prisma.user.findFirst({
      where: {
        steamId,
        NOT: {
          email: session.user.email,
        },
      },
    })

    if (existingUser) {
      return NextResponse.redirect(
        new URL('/profile?error=SteamAlreadyLinked', request.url)
      )
    }

    // Fetch Steam profile data
    const STEAM_API_KEY = process.env.STEAM_API_KEY
    let steamUsername = null

    if (STEAM_API_KEY) {
      try {
        const steamApiUrl = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${STEAM_API_KEY}&steamids=${steamId}`
        const steamResponse = await fetch(steamApiUrl)
        const steamData = await steamResponse.json()

        if (steamData.response?.players?.[0]) {
          steamUsername = steamData.response.players[0].personaname
        }
      } catch (error) {
        console.error('Failed to fetch Steam profile:', error)
      }
    }

    // Link Steam account to current user
    await prisma.user.update({
      where: { email: session.user.email },
      data: {
        steamId,
        steamUsername,
      },
    })

    return NextResponse.redirect(
      new URL('/profile?success=SteamLinked', request.url)
    )
  } catch (error) {
    console.error('Steam link callback error:', error)
    return NextResponse.redirect(
      new URL('/profile?error=LinkFailed', request.url)
    )
  }
}
