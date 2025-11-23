const { PrismaClient: PrismaClientSQLite } = require('@prisma/client');
const { PrismaClient: PrismaClientPostgres } = require('@prisma/client');

// SQLite 클라이언트 (백업 DB)
const sqlite = new PrismaClientSQLite({
  datasources: {
    db: {
      url: 'file:./prisma/dev.db.backup'
    }
  }
});

// PostgreSQL 클라이언트 (새 DB)
const postgres = new PrismaClientPostgres();

async function migrateData() {
  try {
    console.log('🔄 데이터 마이그레이션 시작...\n');

    // 1. Users
    console.log('👤 사용자 데이터 마이그레이션 중...');
    const users = await sqlite.user.findMany();
    console.log(`   찾은 사용자: ${users.length}명`);

    for (const user of users) {
      await postgres.user.create({
        data: user
      }).catch(e => {
        if (e.code === 'P2002') {
          console.log(`   ⚠️  중복: ${user.email}`);
        } else {
          throw e;
        }
      });
    }
    console.log('   ✅ 사용자 마이그레이션 완료\n');

    // 2. Games
    console.log('🎮 게임 데이터 마이그레이션 중...');
    const games = await sqlite.game.findMany();
    console.log(`   찾은 게임: ${games.length}개`);

    for (const game of games) {
      await postgres.game.create({
        data: game
      }).catch(e => {
        if (e.code === 'P2002') {
          console.log(`   ⚠️  중복: ${game.title}`);
        } else {
          throw e;
        }
      });
    }
    console.log('   ✅ 게임 마이그레이션 완료\n');

    // 3. Reviews
    console.log('⭐ 리뷰 데이터 마이그레이션 중...');
    const reviews = await sqlite.review.findMany();
    console.log(`   찾은 리뷰: ${reviews.length}개`);

    for (const review of reviews) {
      await postgres.review.create({
        data: review
      }).catch(e => {
        if (e.code === 'P2002') {
          console.log(`   ⚠️  중복 리뷰`);
        } else {
          throw e;
        }
      });
    }
    console.log('   ✅ 리뷰 마이그레이션 완료\n');

    // 4. Review Likes
    console.log('👍 리뷰 좋아요 데이터 마이그레이션 중...');
    const likes = await sqlite.reviewLike.findMany();
    console.log(`   찾은 좋아요: ${likes.length}개`);

    for (const like of likes) {
      await postgres.reviewLike.create({
        data: like
      }).catch(e => {
        if (e.code === 'P2002') {
          console.log(`   ⚠️  중복 좋아요`);
        } else {
          throw e;
        }
      });
    }
    console.log('   ✅ 리뷰 좋아요 마이그레이션 완료\n');

    // 5. Verification Tokens
    console.log('🔐 인증 토큰 데이터 마이그레이션 중...');
    const tokens = await sqlite.verificationToken.findMany();
    console.log(`   찾은 토큰: ${tokens.length}개`);

    for (const token of tokens) {
      await postgres.verificationToken.create({
        data: token
      }).catch(e => {
        if (e.code === 'P2002') {
          console.log(`   ⚠️  중복 토큰`);
        } else {
          throw e;
        }
      });
    }
    console.log('   ✅ 인증 토큰 마이그레이션 완료\n');

    console.log('🎉 모든 데이터 마이그레이션 완료!');

  } catch (error) {
    console.error('❌ 마이그레이션 실패:', error);
    throw error;
  } finally {
    await sqlite.$disconnect();
    await postgres.$disconnect();
  }
}

migrateData()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
