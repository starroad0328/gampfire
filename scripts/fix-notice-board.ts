import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('=== Fixing Notice Board ===\n')

  // Find "공지사항" board
  const noticeBoard = await prisma.board.findFirst({
    where: {
      name: '공지사항',
    },
  })

  if (!noticeBoard) {
    console.log('No board named "공지사항" found')
    return
  }

  console.log(`Found board: ${noticeBoard.name} (ID: ${noticeBoard.id})`)
  console.log(`Current isNoticeBoard: ${noticeBoard.isNoticeBoard}`)

  // Update board to be notice board
  await prisma.board.update({
    where: { id: noticeBoard.id },
    data: { isNoticeBoard: true },
  })

  console.log('✓ Updated board to isNoticeBoard: true\n')

  // Update all posts in this board to be notices
  const result = await prisma.post.updateMany({
    where: { boardId: noticeBoard.id },
    data: { isNotice: true },
  })

  console.log(`✓ Updated ${result.count} posts to isNotice: true\n`)
  console.log('Done!')
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
