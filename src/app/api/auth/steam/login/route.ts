import { NextRequest, NextResponse } from 'next/server'
import { RelyingParty } from 'openid'

const STEAM_OPENID_URL = 'https://steamcommunity.com/openid'
const REALM = process.env.NEXTAUTH_URL || 'http://localhost:3000'
const RETURN_URL = `${REALM}/api/auth/steam/callback`

export async function GET(request: NextRequest) {
  try {
    const relyingParty = new RelyingParty(
      RETURN_URL,
      REALM,
      true, // Use stateless verification
      false, // Don't use associations
      []
    )

    // Start authentication
    return new Promise<NextResponse>((resolve, reject) => {
      relyingParty.authenticate(STEAM_OPENID_URL, false, (error, authUrl) => {
        if (error || !authUrl) {
          console.error('Steam OpenID authentication error:', error)
          reject(
            NextResponse.json(
              { error: 'Steam 인증을 시작할 수 없습니다' },
              { status: 500 }
            )
          )
          return
        }

        // Redirect to Steam
        resolve(NextResponse.redirect(authUrl))
      })
    })
  } catch (error) {
    console.error('Steam login error:', error)
    return NextResponse.json(
      { error: 'Steam 로그인 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
