import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('=== Checking Notice Board Status ===\n')

  // Get all boards
  const boards = await prisma.board.findMany({
    select: {
      id: true,
      name: true,
      isNoticeBoard: true,
      communityId: true,
    },
  })

  console.log('Boards:')
  boards.forEach(board => {
    console.log(`- ${board.name} (ID: ${board.id})`)
    console.log(`  isNoticeBoard: ${board.isNoticeBoard}`)
    console.log(`  communityId: ${board.communityId}\n`)
  })

  console.log('\n=== Checking Posts ===\n')

  // Get all posts
  const posts = await prisma.post.findMany({
    select: {
      id: true,
      title: true,
      isNotice: true,
      boardId: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 10,
  })

  console.log('Recent Posts:')
  posts.forEach(post => {
    const board = boards.find(b => b.id === post.boardId)
    console.log(`- ${post.title} (ID: ${post.id})`)
    console.log(`  Board: ${board?.name || 'None'}`)
    console.log(`  Board isNoticeBoard: ${board?.isNoticeBoard || false}`)
    console.log(`  Post isNotice: ${post.isNotice}\n`)
  })
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
