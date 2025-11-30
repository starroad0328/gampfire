import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSteamTags, extractSteamId } from '@/lib/steam'
import { getGameById } from '@/lib/igdb'

export async function POST(request: Request) {
  try {
    console.log('[Update Tags] Starting batch update...')

    // Get all games that have been reviewed but don't have tags
    const gamesWithoutTags = await prisma.game.findMany({
      where: {
        tags: null,
        igdbId: { not: null },
        reviews: {
          some: {}
        }
      },
      include: {
        _count: {
          select: { reviews: true }
        }
      },
      orderBy: {
        reviews: {
          _count: 'desc'
        }
      },
      take: 50 // Limit to 50 most reviewed games
    })

    console.log(`[Update Tags] Found ${gamesWithoutTags.length} games without tags`)

    let updated = 0
    let failed = 0

    for (const game of gamesWithoutTags) {
      try {
        console.log(`[Update Tags] Processing: ${game.title} (${game._count.reviews} reviews)`)

        if (!game.igdbId) {
          console.log(`  ❌ No IGDB ID`)
          failed++
          continue
        }

        // Fetch full IGDB data with websites
        const igdbGame = await getGameById(game.igdbId)
        if (!igdbGame) {
          console.log(`  ❌ Could not fetch IGDB data`)
          failed++
          continue
        }

        // Extract Steam ID
        const steamId = extractSteamId(igdbGame)
        if (!steamId) {
          console.log(`  ❌ No Steam ID found`)
          failed++
          continue
        }

        console.log(`  ✅ Found Steam ID: ${steamId}`)

        // Get Steam tags
        const tags = await getSteamTags(steamId)
        if (!tags || tags.length === 0) {
          console.log(`  ⚠️  No tags from Steam Spy`)
          failed++
          continue
        }

        console.log(`  ✅ Got ${tags.length} tags: ${tags.slice(0, 3).join(', ')}...`)

        // Update game
        await prisma.game.update({
          where: { id: game.id },
          data: {
            tags: JSON.stringify(tags)
          }
        })

        console.log(`  ✅ Updated tags in database`)
        updated++

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000))

      } catch (error) {
        console.error(`  ❌ Error processing ${game.title}:`, error)
        failed++
      }
    }

    return NextResponse.json({
      success: true,
      message: `Updated ${updated} games, ${failed} failed`,
      updated,
      failed
    })

  } catch (error) {
    console.error('[Update Tags] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update tags' },
      { status: 500 }
    )
  }
}
