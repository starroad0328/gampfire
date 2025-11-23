import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getSteamUserSummary, resolveVanityUrl } from '@/lib/steam'
import { prisma } from '@/lib/prisma'

// Helper function to extract Steam ID or vanity URL from input
function extractSteamInfo(input: string): { steamId: string | null; vanityUrl: string | null } {
  // Remove whitespace
  const trimmed = input.trim()

  // If it's just a Steam ID (17-digit number)
  if (/^\d{17}$/.test(trimmed)) {
    return { steamId: trimmed, vanityUrl: null }
  }

  // Try to extract from profile URL: https://steamcommunity.com/profiles/76561198...
  const profileMatch = trimmed.match(/steamcommunity\.com\/profiles\/(\d{17})/)
  if (profileMatch) {
    return { steamId: profileMatch[1], vanityUrl: null }
  }

  // Try to extract from vanity URL: https://steamcommunity.com/id/customname/
  const vanityMatch = trimmed.match(/steamcommunity\.com\/id\/([^/?]+)/)
  if (vanityMatch) {
    return { steamId: null, vanityUrl: vanityMatch[1] }
  }

  // Try to extract from URL with id parameter: ?id=76561198...
  const idParamMatch = trimmed.match(/[?&]id=(\d{17})/)
  if (idParamMatch) {
    return { steamId: idParamMatch[1], vanityUrl: null }
  }

  return { steamId: null, vanityUrl: null }
}

export async function POST(request: NextRequest) {
  try {
    // Check if user is logged in
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { steamId: inputSteamId } = body

    if (!inputSteamId || typeof inputSteamId !== 'string') {
      return NextResponse.json(
        { error: 'Steam ID is required' },
        { status: 400 }
      )
    }

    // Extract Steam ID or vanity URL from input
    const { steamId: directSteamId, vanityUrl } = extractSteamInfo(inputSteamId)
    let steamId = directSteamId

    // If it's a vanity URL, resolve it to Steam ID
    if (vanityUrl && !steamId) {
      console.log('Resolving vanity URL:', vanityUrl)
      steamId = await resolveVanityUrl(vanityUrl)
      if (!steamId) {
        console.error('Failed to resolve vanity URL:', vanityUrl)
        return NextResponse.json(
          { error: 'Steam 프로필을 찾을 수 없습니다. 프로필이 공개되어 있는지 확인해주세요.' },
          { status: 400 }
        )
      }
      console.log('Resolved vanity URL to Steam ID:', steamId)
    }

    if (!steamId) {
      console.error('Failed to extract Steam ID from input:', inputSteamId)
      return NextResponse.json(
        { error: '올바른 Steam ID 또는 프로필 URL을 입력해주세요' },
        { status: 400 }
      )
    }

    console.log('Using Steam ID:', steamId)

    // Validate Steam ID by fetching user profile
    const steamProfile = await getSteamUserSummary(steamId)

    if (!steamProfile) {
      console.error('Steam profile not found or private for ID:', steamId)
      return NextResponse.json(
        { error: 'Invalid Steam ID or profile is private' },
        { status: 400 }
      )
    }

    console.log('Steam profile found:', steamProfile.personaname)

    // Check if Steam ID is already linked to another account
    const existingUser = await prisma.user.findUnique({
      where: { steamId },
    })

    if (existingUser && existingUser.id !== session.user.id) {
      return NextResponse.json(
        { error: 'This Steam account is already linked to another user' },
        { status: 400 }
      )
    }

    // Link Steam account to user
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        steamId,
        steamUsername: steamProfile.personaname,
        // Don't automatically update image - let user decide
      },
    })

    return NextResponse.json({
      success: true,
      steamUsername: updatedUser.steamUsername,
    })
  } catch (error) {
    console.error('Steam link API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Unlink Steam account
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        steamId: null,
        steamUsername: null,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Steam unlink API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
