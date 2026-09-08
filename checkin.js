import fetch from "node-fetch";
import { loadConfig } from "./lib/config.js";
import { loadUidCache, saveUidCache, loadCheckinDate, saveCheckinDate, todayKST } from "./lib/storage.js";
import { findGame, getDisplayName } from "./lib/games.js";
import { getCachedUID } from "./lib/uid.js";
import { normalizeAvatarUrl, sendOrEditDiscord, footerText } from "./lib/discord.js";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * =========================================================================
 * [호요랩 자동 출석]
 * =========================================================================
 * ACCOUNTS_JSON Secret과 .date/ 캐시 파일들은 실시간 메모(note.js),
 * 빛 따라 금 찾아(endgame.js)와 공유합니다.
 *
 * 오늘 이미 새로 출석 성공한 기록이 있으면(.date/checkin-date.json),
 * 출석 자체를 건너뜁니다.
 */

async function checkIn(url, ltuid, ltoken, extraHeaders = {}) {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Cookie: `ltuid_v2=${ltuid}; ltoken_v2=${ltoken};`,
      Accept: "application/json, text/plain, */*",
      "Accept-Language": "ko-KR,ko;q=0.9",
      Origin: "https://act.hoyolab.com",
      Referer: "https://act.hoyolab.com/",
      "User-Agent": "Mozilla/5.0",
      ...extraHeaders
    }
  });
  const data = await res.json();
  if (data.retcode === 0) return { success: true, message: "> **출석 체크 성공! 🎉**" };
  if (data.retcode === -5003) return { success: true, message: "> **이미 오늘 출석 완료 ✅**" };
  if (data.retcode === -100) return { success: false, message: "> ***__쿠키 만료 ❌__***" };
  return { success: false, message: `> ***__오류 발생 (${data.message}) ⚠️__***` };
}

async function main() {
  const { accounts: ACCOUNTS, showAliasAsIs } = loadConfig();
  const uidCache = loadUidCache();

  const isManualRun = process.env.GITHUB_EVENT_NAME === "workflow_dispatch";
  let hasFailure = false;
  let hasAnyNewSuccess = false;

  const lastCheckinWebhookAccount = [...ACCOUNTS].reverse().find((a) => a.CHECKIN_WEBHOOK);

  const today = todayKST();
  const lastCheckinDate = loadCheckinDate();

  if (lastCheckinDate === today) {
    console.log(`오늘(${today}) 이미 출석 성공 기록이 있어 출석을 건너뜁니다.`);
    saveUidCache(uidCache);
    return;
  }

  for (const account of ACCOUNTS) {
    const fields = [];
    let successCount = 0;
    let hasNewSuccess = false;
    let hasFailureThisAccount = false;

    for (const gameName of account.GAMES || []) {
      const game = findGame(gameName);
      if (!game) continue;

      const uid = await getCachedUID(uidCache, account.LTUID, account.LTOKEN, game.biz);

      let result = null;
      for (let retry = 0; retry < 3; retry++) {
        try {
          result = await checkIn(game.url, account.LTUID, account.LTOKEN, game.extraHeaders || {});
          if (result) break;
        } catch (e) {
          await sleep(3000);
        }
      }

      const message = result ? result.message : "출석 실패 ❌";
      if (result?.success) {
        successCount++;
        if (message.includes("출석 체크 성공")) {
          hasNewSuccess = true;
          hasAnyNewSuccess = true;
        }
      } else {
        hasFailure = true;
        hasFailureThisAccount = true;
      }

      const displayName = getDisplayName(gameName, game, showAliasAsIs);
      const isAlreadyDone = message.includes("이미 오늘 출석 완료");
      const shouldShowField = isManualRun || !isAlreadyDone;

      if (shouldShowField) {
        fields.push({
          name: `**[${displayName}]**`,
          value: `> UID : ${uid || "조회 실패"}\n${message}`,
          inline: false
        });
      }

      console.log(`[${account.NAME}] ${displayName}: ${message}`);
      await sleep(500);
    }

    const embed = {
      title: `🗓 ${account.NAME} 호요랩 출석 현황`,
      description: `${successCount}/${(account.GAMES || []).length} 성공`,
      color: successCount === (account.GAMES || []).length ? 5763719 : 15548997,
      fields,
      footer: { text: footerText() }
    };

    const webhookToUse = account.CHECKIN_WEBHOOK || lastCheckinWebhookAccount?.CHECKIN_WEBHOOK || "";
    const avatarToUse = account.CHECKIN_AVATAR || lastCheckinWebhookAccount?.CHECKIN_AVATAR || "";

    const shouldNotify = isManualRun || hasNewSuccess || hasFailureThisAccount;

    if (!webhookToUse) {
      console.log(`[${account.NAME}] 출석용 웹훅이 없어 디스코드 전송을 건너뜁니다.`);
    } else if (shouldNotify) {
      await sendOrEditDiscord(webhookToUse, embed, normalizeAvatarUrl(avatarToUse), null, "HoYo 출석 비서");
    } else {
      console.log(`[${account.NAME}] 전부 이미 완료 상태라 디스코드 전송을 건너뜁니다.`);
    }
  }

  if (hasAnyNewSuccess) {
    saveCheckinDate(today);
  }

  saveUidCache(uidCache);

  if (hasFailure) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
