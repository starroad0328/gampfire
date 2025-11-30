const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// Import Steam tags function
const { getSteamTags } = require('./src/lib/steam')
const { extractSteamId } = require('./src/lib/steam')

async function updateTagsForReviewedGames() {
  try {
    console.log('🔄 Updating tags for reviewed games...\n')

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: 'starroad0328@naver.com' },
      include: {
        reviews: {
          include: {
            game: true
          }
        }
      }
    })

    if (!user) {
      console.log('❌ User not found')
      return
    }

    console.log(`✅ Found user: ${user.name}`)
    console.log(`📊 Total reviews: ${user.reviews.length}\n`)

    let updated = 0
    let skipped = 0
    let failed = 0

    for (const review of user.reviews) {
      const game = review.game

      // Skip if already has tags
      if (game.tags) {
        console.log(`⏭️  Skipping ${game.title} (already has tags)`)
        skipped++
        continue
      }

      // Get Steam ID from game data
      // We need to fetch the full IGDB data with websites
      console.log(`🔍 Processing: ${game.title} (IGDB ID: ${game.igdbId})`)

      if (!game.igdbId) {
        console.log(`  ❌ No IGDB ID, skipping`)
        failed++
        continue
      }

      // Fetch IGDB game data with websites
      const { getGameById } = require('./src/lib/igdb')
      const igdbGame = await getGameById(game.igdbId)

      if (!igdbGame) {
        console.log(`  ❌ Could not fetch IGDB data`)
        failed++
        continue
      }

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
        console.log(`  ⚠️  No tags found from Steam Spy`)
        failed++
        continue
      }

      console.log(`  ✅ Got ${tags.length} tags: ${tags.slice(0, 3).join(', ')}...`)

      // Update game in database
      await prisma.game.update({
        where: { id: game.id },
        data: {
          tags: JSON.stringify(tags)
        }
      })

      console.log(`  ✅ Updated tags in database\n`)
      updated++

      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    console.log('\n📊 Summary:')
    console.log(`  ✅ Updated: ${updated}`)
    console.log(`  ⏭️  Skipped (already had tags): ${skipped}`)
    console.log(`  ❌ Failed: ${failed}`)

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

updateTagsForReviewedGames()
