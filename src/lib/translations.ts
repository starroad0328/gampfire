// 게임 장르 번역
const genreTranslations: Record<string, string> = {
  // 주요 장르
  'Action': '액션',
  'Adventure': '어드벤처',
  'RPG': 'RPG',
  'Role-playing (RPG)': 'RPG',
  'Strategy': '전략',
  'Shooter': '슈팅',
  'Simulation': '시뮬레이션',
  'Sports': '스포츠',
  'Racing': '레이싱',
  'Fighting': '격투',
  'Puzzle': '퍼즐',
  'Platform': '플랫포머',
  'Platformer': '플랫포머',

  // 세부 장르
  'Indie': '인디',
  'Arcade': '아케이드',
  'MOBA': 'MOBA',
  'Music': '음악',
  'Tactical': '전술',
  'Turn-based strategy (TBS)': '턴제 전략',
  'Real Time Strategy (RTS)': '실시간 전략',
  'Hack and slash/Beat \'em up': '핵 앤 슬래시',
  'Pinball': '핀볼',
  'Quiz/Trivia': '퀴즈/트리비아',
  'Card & Board Game': '카드/보드 게임',
  'Point-and-click': '포인트 앤 클릭',
  'Visual Novel': '비주얼 노블',

  // 기타
  'Horror': '호러',
  'Survival': '서바이벌',
  'Stealth': '스텔스',
  'Sandbox': '샌드박스',
  'Open World': '오픈월드',
  'Massively Multiplayer': '대규모 멀티플레이어',
  'MMO': 'MMO',
  'MMORPG': 'MMORPG',
}

// 플랫폼 번역
const platformTranslations: Record<string, string> = {
  'PC': 'PC',
  'PlayStation': '플레이스테이션',
  'PlayStation 2': '플레이스테이션 2',
  'PlayStation 3': '플레이스테이션 3',
  'PlayStation 4': '플레이스테이션 4',
  'PlayStation 5': '플레이스테이션 5',
  'PS5': 'PS5',
  'PS4': 'PS4',
  'PS3': 'PS3',
  'PS2': 'PS2',
  'Xbox': 'Xbox',
  'Xbox 360': 'Xbox 360',
  'Xbox One': 'Xbox One',
  'Xbox Series X|S': 'Xbox Series X|S',
  'Nintendo Switch': '닌텐도 스위치',
  'Nintendo 3DS': '닌텐도 3DS',
  'Wii': 'Wii',
  'Wii U': 'Wii U',
  'Game Boy': '게임보이',
  'Game Boy Advance': '게임보이 어드밴스',
  'Nintendo DS': '닌텐도 DS',
  'iOS': 'iOS',
  'Android': '안드로이드',
  'Mac': 'Mac',
  'Linux': '리눅스',
  'Web': '웹',
  'Steam': 'Steam',
}

/**
 * 영어 장르명을 한국어로 번역
 * @param genre 영어 장르명
 * @returns 한국어 장르명 (번역이 없으면 원문 반환)
 */
export function translateGenre(genre: string): string {
  return genreTranslations[genre] || genre
}

/**
 * 영어 플랫폼명을 한국어로 번역
 * @param platform 영어 플랫폼명
 * @returns 한국어 플랫폼명 (번역이 없으면 원문 반환)
 */
export function translatePlatform(platform: string): string {
  return platformTranslations[platform] || platform
}

/**
 * 장르 배열을 한국어로 번역
 * @param genres 영어 장르명 배열
 * @returns 한국어 장르명 배열
 */
export function translateGenres(genres: string[]): string[] {
  return genres.map(translateGenre)
}

/**
 * 플랫폼 배열을 한국어로 번역
 * @param platforms 영어 플랫폼명 배열
 * @returns 한국어 플랫폼명 배열
 */
export function translatePlatforms(platforms: string[]): string[] {
  return platforms.map(translatePlatform)
}
