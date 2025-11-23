const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'file:./prisma/dev.db.backup'
    }
  }
});

async function exportData() {
  try {
    console.log('📤 SQLite 데이터 추출 중...\n');

    const data = {
      users: await prisma.user.findMany(),
      games: await prisma.game.findMany(),
      reviews: await prisma.review.findMany(),
      reviewLikes: await prisma.reviewLike.findMany(),
      gameLists: await prisma.gameList.findMany(),
      listItems: await prisma.listItem.findMany(),
      follows: await prisma.follow.findMany(),
      developers: await prisma.developer.findMany(),
      announcements: await prisma.announcement.findMany(),
      verificationTokens: await prisma.verificationToken.findMany(),
    };

    console.log('📊 추출된 데이터:');
    console.log(`   👤 사용자: ${data.users.length}명`);
    console.log(`   🎮 게임: ${data.games.length}개`);
    console.log(`   ⭐ 리뷰: ${data.reviews.length}개`);
    console.log(`   👍 좋아요: ${data.reviewLikes.length}개`);
    console.log(`   📋 게임 리스트: ${data.gameLists.length}개`);
    console.log(`   📦 리스트 아이템: ${data.listItems.length}개`);
    console.log(`   👥 팔로우: ${data.follows.length}개`);
    console.log(`   🏢 개발사: ${data.developers.length}개`);
    console.log(`   📢 공지사항: ${data.announcements.length}개`);
    console.log(`   🔐 인증 토큰: ${data.verificationTokens.length}개\n`);

    const outputPath = path.join(process.cwd(), 'scripts', 'backup-data.json');
    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));

    console.log(`✅ 데이터가 저장되었습니다: ${outputPath}`);

  } catch (error) {
    console.error('❌ 추출 실패:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

exportData()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
