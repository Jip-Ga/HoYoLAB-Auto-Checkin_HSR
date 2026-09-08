import { loadConfig } from "./lib/config.js";
import { loadUidCache, saveUidCache, loadMessageStore, saveMessageStore, getExistingNoteId } from "./lib/storage.js";
import { HKRPG_BIZ } from "./lib/games.js";
import { getCachedUID } from "./lib/uid.js";
import { normalizeAvatarUrl, sendOrEditDiscord } from "./lib/discord.js";
import { fetchStarRailNote, buildNoteEmbed } from "./lib/hoyoapi.js";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * =========================================================================
 * [붕괴: 스타레일 실시간 메모]
 * =========================================================================
 * ACCOUNTS_JSON Secret과 .date/ 캐시 파일들은 출석(checkin.js),
 * 빛 따라 금 찾아(endgame.js)와 공유합니다.
 *
 * 계정마다 NOTE_WEBHOOK이 있어야 하고, 없으면 그 계정만 건너뜁니다.
 */

async function main() {
  const { accounts: ACCOUNTS } = loadConfig();
  const uidCache = loadUidCache();
  const messageStore = loadMessageStore();

  let hasFailure = false;

  for (const account of ACCOUNTS) {
    if (!account.NOTE_WEBHOOK) {
      console.log(`[${account.NAME}] NOTE_WEBHOOK이 없어 실시간 메모를 건너뜁니다.`);
      continue;
    }
    if (!account.LTUID || !account.LTOKEN) {
      console.error(`❌ [오류] "${account.NAME}" 계정의 LTUID/LTOKEN이 올바르지 않습니다.`);
      hasFailure = true;
      continue;
    }

    try {
      const server = account.SERVER || "prod_official_asia";
      const uid = await getCachedUID(uidCache, account.LTUID, account.LTOKEN, HKRPG_BIZ);
      const note = await fetchStarRailNote(account.LTUID, account.LTOKEN, uid, server);

      const existingNoteId = getExistingNoteId(messageStore, account.NAME);
      const noteEmbed = buildNoteEmbed(account, uid, note);
      const newNoteId = await sendOrEditDiscord(
        account.NOTE_WEBHOOK,
        noteEmbed,
        normalizeAvatarUrl(account.NOTE_AVATAR),
        existingNoteId,
        "HoYo 알리미"
      );

      messageStore[account.NAME] = newNoteId ?? existingNoteId;
      console.log(`[${account.NAME}] 실시간 메모 전송 완료`);
    } catch (e) {
      console.error(`[${account.NAME}] 실시간 메모 오류: ${e.message}`);
      hasFailure = true;
    }

    await sleep(500);
  }

  saveUidCache(uidCache);
  saveMessageStore(messageStore);

  if (hasFailure) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
