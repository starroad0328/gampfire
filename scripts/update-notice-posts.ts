import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Updating posts in notice boards to be notices...')

  // Get all notice boards
  const noticeBoards = await prisma.board.findMany({
    where: { isNoticeBoard: true },
  })

  console.log(`Found ${noticeBoards.length} notice boards`)

  // Update all posts in notice boards to be notices
  const result = await prisma.post.updateMany({
    where: {
      boardId: {
        in: noticeBoards.map(board => board.id),
      },
    },
    data: {
      isNotice: true,
    },
  })

  console.log(`Updated ${result.count} posts to be notices`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
