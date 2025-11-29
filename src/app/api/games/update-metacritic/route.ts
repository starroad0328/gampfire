import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getGameById } from '@/lib/igdb'
import { extractSteamId, getSteamMetacritic } from '@/lib/steam'

export async function POST() {
  try {
    console.log('🔄 Starting Metacritic score update for all games...')

    // Get all games from database
    const games = await prisma.game.findMany({
      select: {
        id: true,
        igdbId: true,
        title: true,
        metacriticScore: true,
      },
    })

    console.log(`📊 Found ${games.length} games to check`)

    let updatedCount = 0
    let skippedCount = 0
    let errorCount = 0

    for (const game of games) {
      try {
        // Get IGDB data to find Steam ID
        if (!game.igdbId) {
          console.log(`❌ No IGDB ID for: ${game.title}`)
          errorCount++
          continue
        }

        const igdbGame = await getGameById(game.igdbId)

        if (!igdbGame) {
          console.log(`❌ IGDB game not found for: ${game.title}`)
          errorCount++
          continue
        }

        const steamId = extractSteamId(igdbGame)

        if (!steamId) {
          console.log(`⏭️  No Steam ID for: ${game.title}`)
          skippedCount++
          continue
        }

        // Get Metacritic score from Steam
        const metacritic = await getSteamMetacritic(steamId)

        if (!metacritic) {
          console.log(`⏭️  No Metacritic data from Steam for: ${game.title}`)
          skippedCount++
          continue
        }

        // Update if different
        if (game.metacriticScore !== metacritic.score) {
          await prisma.game.update({
            where: { id: game.id },
            data: { metacriticScore: metacritic.score },
          })
          console.log(`✅ Updated [${game.title}]: ${game.metacriticScore} → ${metacritic.score}`)
          updatedCount++
        } else {
          console.log(`✓ Already correct [${game.title}]: ${metacritic.score}`)
          skippedCount++
        }

        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500))
      } catch (error) {
        console.error(`Error updating ${game.title}:`, error)
        errorCount++
      }
    }

    console.log('🎉 Metacritic update complete!')
    console.log(`📈 Updated: ${updatedCount} games`)
    console.log(`⏭️  Skipped: ${skippedCount} games`)
    console.log(`❌ Errors: ${errorCount} games`)

    return NextResponse.json({
      success: true,
      total: games.length,
      updated: updatedCount,
      skipped: skippedCount,
      errors: errorCount,
    })
  } catch (error) {
    console.error('Metacritic update error:', error)
    return NextResponse.json(
      { error: 'Failed to update Metacritic scores' },
      { status: 500 }
    )
  }
}
