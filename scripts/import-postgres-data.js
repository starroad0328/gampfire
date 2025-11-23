const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function importData() {
  try {
    console.log('📥 PostgreSQL로 데이터 임포트 중...\n');

    const dataPath = path.join(process.cwd(), 'scripts', 'backup-data.json');
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

    // 1. Users
    console.log('👤 사용자 데이터 임포트 중...');
    for (const user of data.users) {
      await prisma.user.upsert({
        where: { id: user.id },
        update: {},
        create: user
      });
    }
    console.log(`   ✅ ${data.users.length}명 완료\n`);

    // 2. Games
    console.log('🎮 게임 데이터 임포트 중...');
    for (const game of data.games) {
      await prisma.game.upsert({
        where: { id: game.id },
        update: {},
        create: game
      });
    }
    console.log(`   ✅ ${data.games.length}개 완료\n`);

    // 3. Reviews
    console.log('⭐ 리뷰 데이터 임포트 중...');
    for (const review of data.reviews) {
      await prisma.review.upsert({
        where: { id: review.id },
        update: {},
        create: review
      });
    }
    console.log(`   ✅ ${data.reviews.length}개 완료\n`);

    // 4. Review Likes
    console.log('👍 좋아요 데이터 임포트 중...');
    for (const like of data.reviewLikes) {
      await prisma.reviewLike.upsert({
        where: { id: like.id },
        update: {},
        create: like
      });
    }
    console.log(`   ✅ ${data.reviewLikes.length}개 완료\n`);

    // 5. Game Lists
    if (data.gameLists.length > 0) {
      console.log('📋 게임 리스트 임포트 중...');
      for (const list of data.gameLists) {
        await prisma.gameList.upsert({
          where: { id: list.id },
          update: {},
          create: list
        });
      }
      console.log(`   ✅ ${data.gameLists.length}개 완료\n`);
    }

    // 6. List Items
    if (data.listItems.length > 0) {
      console.log('📦 리스트 아이템 임포트 중...');
      for (const item of data.listItems) {
        await prisma.listItem.upsert({
          where: { id: item.id },
          update: {},
          create: item
        });
      }
      console.log(`   ✅ ${data.listItems.length}개 완료\n`);
    }

    // 7. Follows
    if (data.follows.length > 0) {
      console.log('👥 팔로우 임포트 중...');
      for (const follow of data.follows) {
        await prisma.follow.upsert({
          where: { id: follow.id },
          update: {},
          create: follow
        });
      }
      console.log(`   ✅ ${data.follows.length}개 완료\n`);
    }

    // 8. Developers
    if (data.developers.length > 0) {
      console.log('🏢 개발사 임포트 중...');
      for (const developer of data.developers) {
        await prisma.developer.upsert({
          where: { id: developer.id },
          update: {},
          create: developer
        });
      }
      console.log(`   ✅ ${data.developers.length}개 완료\n`);
    }

    // 9. Announcements
    if (data.announcements.length > 0) {
      console.log('📢 공지사항 임포트 중...');
      for (const announcement of data.announcements) {
        await prisma.announcement.upsert({
          where: { id: announcement.id },
          update: {},
          create: announcement
        });
      }
      console.log(`   ✅ ${data.announcements.length}개 완료\n`);
    }

    // 10. Verification Tokens
    if (data.verificationTokens.length > 0) {
      console.log('🔐 인증 토큰 임포트 중...');
      for (const token of data.verificationTokens) {
        await prisma.verificationToken.upsert({
          where: { id: token.id },
          update: {},
          create: token
        });
      }
      console.log(`   ✅ ${data.verificationTokens.length}개 완료\n`);
    }

    console.log('🎉 모든 데이터 임포트 완료!');

  } catch (error) {
    console.error('❌ 임포트 실패:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

importData()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
