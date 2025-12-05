import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function resetProfileImages() {
  try {
    console.log('🔄 Resetting all profile images to default...')

    // Update all users with non-null images to null
    const result = await prisma.user.updateMany({
      where: {
        image: {
          not: null,
        },
      },
      data: {
        image: null,
      },
    })

    console.log(`✅ Successfully reset ${result.count} profile images to default`)
    console.log('Users will now see their default avatar (first letter of name)')
  } catch (error) {
    console.error('❌ Error resetting profile images:', error)
  } finally {
    await prisma.$disconnect()
  }
}

resetProfileImages()
