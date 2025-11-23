const Database = require('better-sqlite3');
const { PrismaClient } = require('@prisma/client');
const path = require('path');

// SQLite 백업 DB
const sqliteDb = new Database(path.join(__dirname, '..', 'prisma', 'dev.db.backup'), { readonly: true });

// PostgreSQL 클라이언트
const postgres = new PrismaClient();

async function migrateData() {
  try {
    console.log('🔄 데이터 마이그레이션 시작...\n');

    // 1. Users
    console.log('👤 사용자 데이터 마이그레이션 중...');
    const users = sqliteDb.prepare('SELECT * FROM User').all();
    console.log(`   찾은 사용자: ${users.length}명`);

    for (const user of users) {
      // 날짜 필드 변환
      const userData = {
        ...user,
        emailVerified: user.emailVerified ? new Date(user.emailVerified) : null,
        createdAt: new Date(user.createdAt),
        updatedAt: new Date(user.updatedAt)
      };

      await postgres.user.upsert({
        where: { id: user.id },
        update: {},
        create: userData
      }).catch(e => console.log(`   ⚠️  오류: ${e.message}`));
    }
    console.log('   ✅ 완료\n');

    // 2. Games
    console.log('🎮 게임 데이터 마이그레이션 중...');
    const games = sqliteDb.prepare('SELECT * FROM Game').all();
    console.log(`   찾은 게임: ${games.length}개`);

    for (const game of games) {
      // 날짜 필드 변환
      const gameData = {
        ...game,
        releaseDate: game.releaseDate ? new Date(game.releaseDate) : null,
        createdAt: new Date(game.createdAt),
        updatedAt: new Date(game.updatedAt)
      };

      await postgres.game.upsert({
        where: { id: game.id },
        update: {},
        create: gameData
      }).catch(e => console.log(`   ⚠️  오류: ${e.message}`));
    }
    console.log('   ✅ 완료\n');

    // 3. Reviews
    console.log('⭐ 리뷰 데이터 마이그레이션 중...');
    const reviews = sqliteDb.prepare('SELECT * FROM Review').all();
    console.log(`   찾은 리뷰: ${reviews.length}개`);

    for (const review of reviews) {
      // 날짜 및 Boolean 필드 변환
      const reviewData = {
        ...review,
        isVerified: Boolean(review.isVerified),
        createdAt: new Date(review.createdAt),
        updatedAt: new Date(review.updatedAt)
      };

      await postgres.review.upsert({
        where: { id: review.id },
        update: {},
        create: reviewData
      }).catch(e => console.log(`   ⚠️  오류: ${e.message}`));
    }
    console.log('   ✅ 완료\n');

    // 4. Review Likes
    console.log('👍 리뷰 좋아요 데이터 마이그레이션 중...');
    const likes = sqliteDb.prepare('SELECT * FROM ReviewLike').all();
    console.log(`   찾은 좋아요: ${likes.length}개`);

    for (const like of likes) {
      // 날짜 필드 변환
      const likeData = {
        ...like,
        createdAt: new Date(like.createdAt)
      };

      await postgres.reviewLike.upsert({
        where: { id: like.id },
        update: {},
        create: likeData
      }).catch(e => console.log(`   ⚠️  오류: ${e.message}`));
    }
    console.log('   ✅ 완료\n');

    // 5. Game Lists
    const gameLists = sqliteDb.prepare('SELECT * FROM GameList').all();
    if (gameLists.length > 0) {
      console.log('📋 게임 리스트 마이그레이션 중...');
      console.log(`   찾은 리스트: ${gameLists.length}개`);

      for (const list of gameLists) {
        // 날짜 및 Boolean 필드 변환
        const listData = {
          ...list,
          isPublic: Boolean(list.isPublic),
          createdAt: new Date(list.createdAt),
          updatedAt: new Date(list.updatedAt)
        };

        await postgres.gameList.upsert({
          where: { id: list.id },
          update: {},
          create: listData
        }).catch(e => console.log(`   ⚠️  오류: ${e.message}`));
      }
      console.log('   ✅ 완료\n');
    }

    // 6. List Items
    const listItems = sqliteDb.prepare('SELECT * FROM ListItem').all();
    if (listItems.length > 0) {
      console.log('📦 리스트 아이템 마이그레이션 중...');
      console.log(`   찾은 아이템: ${listItems.length}개`);

      for (const item of listItems) {
        // 날짜 필드 변환
        const itemData = {
          ...item,
          createdAt: new Date(item.createdAt)
        };

        await postgres.listItem.upsert({
          where: { id: item.id },
          update: {},
          create: itemData
        }).catch(e => console.log(`   ⚠️  오류: ${e.message}`));
      }
      console.log('   ✅ 완료\n');
    }

    // 7. Verification Tokens
    const tokens = sqliteDb.prepare('SELECT * FROM VerificationToken').all();
    if (tokens.length > 0) {
      console.log('🔐 인증 토큰 마이그레이션 중...');
      console.log(`   찾은 토큰: ${tokens.length}개`);

      for (const token of tokens) {
        // 날짜 필드 변환
        const tokenData = {
          ...token,
          expires: new Date(token.expires),
          createdAt: new Date(token.createdAt)
        };

        await postgres.verificationToken.upsert({
          where: { id: token.id },
          update: {},
          create: tokenData
        }).catch(e => console.log(`   ⚠️  오류: ${e.message}`));
      }
      console.log('   ✅ 완료\n');
    }

    console.log('🎉 모든 데이터 마이그레이션 완료!');

  } catch (error) {
    console.error('❌ 마이그레이션 실패:', error);
    throw error;
  } finally {
    sqliteDb.close();
    await postgres.$disconnect();
  }
}

migrateData()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
