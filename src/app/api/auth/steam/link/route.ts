import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const STEAM_OPENID_URL = 'https://steamcommunity.com/openid/login'

export async function GET(request: NextRequest) {
  try {
    // Check if user is logged in
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const returnUrl = `${baseUrl}/api/auth/steam/link/callback`

    const params = new URLSearchParams({
      'openid.ns': 'http://specs.openid.net/auth/2.0',
      'openid.mode': 'checkid_setup',
      'openid.return_to': returnUrl,
      'openid.realm': baseUrl,
      'openid.identity': 'http://specs.openid.net/auth/2.0/identifier_select',
      'openid.claimed_id': 'http://specs.openid.net/auth/2.0/identifier_select',
    })

    const steamLoginUrl = `${STEAM_OPENID_URL}?${params.toString()}`
    return NextResponse.redirect(steamLoginUrl)
  } catch (error) {
    console.error('Steam link initiation error:', error)
    return NextResponse.json(
      { error: 'Failed to initiate Steam linking' },
      { status: 500 }
    )
  }
}
