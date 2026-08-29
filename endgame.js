import { loadConfig } from "./lib/config.js";
import { loadUidCache, saveUidCache, loadMessageStore, saveMessageStore, getLegacyEndgameId } from "./lib/storage.js";
import { HKRPG_BIZ } from "./lib/games.js";
import { getCachedUID } from "./lib/uid.js";
import { normalizeAvatarUrl, sendOrEditDiscord } from "./lib/discord.js";
import { fetchEndgameStatus, buildChallengeEmbed, buildUpcomingEmbed } from "./lib/hoyoapi.js";

/**
 * =========================================================================
 * [빛 따라 금 찾아 일정]
 * =========================================================================
 * ACCOUNTS_JSON Secret과 .date/ 캐시 파일들은 출석(checkin.js),
 * 실시간 메모(note.js)와 공유합니다.
 *
 * 계정 여러 개를 등록해도, ACCOUNTS 배열의 맨 위(첫 번째) 계정 정보로만
 * 조회하고, ENDGAME_WEBHOOK(최상단 설정) 하나로만 전송합니다.
 * ENDGAME_WEBHOOK이 없으면 이 기능 자체를 건너뜁니다.
 */

async function main() {
  const { accounts: ACCOUNTS, endgameWebhook, endgameAvatar } = loadConfig();
  const uidCache = loadUidCache();
  const messageStore = loadMessageStore();

  let hasFailure = false;

  if (!endgameWebhook) {
    console.log('ENDGAME_WEBHOOK이 없어 "빛 따라 금 찾아 일정"을 건너뜁니다.');
    saveUidCache(uidCache);
    return;
  }

  const mainAccount = ACCOUNTS[0];
  if (!mainAccount || !mainAccount.LTUID || !mainAccount.LTOKEN) {
    console.error('❌ [오류] "빛 따라 금 찾아"를 보낼 맨 위 계정 정보가 올바르지 않습니다.');
    process.exitCode = 1;
    return;
  }

  try {
    const server = mainAccount.SERVER || "prod_official_asia";
    const uid = await getCachedUID(uidCache, mainAccount.LTUID, mainAccount.LTOKEN, HKRPG_BIZ);
    const endgame = await fetchEndgameStatus(mainAccount.LTUID, mainAccount.LTOKEN, uid, server);
    const challengeEmbed = buildChallengeEmbed(endgame);

    const existingEndgameId = messageStore.__endgame__ ?? getLegacyEndgameId(messageStore, mainAccount.NAME);

    const newEndgameId = await sendOrEditDiscord(
      endgameWebhook,
      challengeEmbed,
      normalizeAvatarUrl(endgameAvatar),
      existingEndgameId,
      "HoYo 알리미"
    );
    messageStore.__endgame__ = newEndgameId ?? existingEndgameId;
    console.log('"빛 따라 금 찾아 일정" 전송 완료 (맨 위 계정 기준)');

    // 같은 웹훅으로 "다음 시즌 예고" 메시지도 이어서 생성/수정
    const upcomingEmbed = buildUpcomingEmbed(endgame);
    const existingUpcomingId = messageStore.__upcoming__ ?? null;
    const newUpcomingId = await sendOrEditDiscord(
      endgameWebhook,
      upcomingEmbed,
      normalizeAvatarUrl(endgameAvatar),
      existingUpcomingId,
      "HoYo 알리미"
    );
    messageStore.__upcoming__ = newUpcomingId ?? existingUpcomingId;
    console.log('"다음 시즌 예고" 전송 완료');
  } catch (e) {
    console.error(`"빛 따라 금 찾아 일정" 오류: ${e.message}`);
    hasFailure = true;
  }

  saveUidCache(uidCache);
  saveMessageStore(messageStore);

  if (hasFailure) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
