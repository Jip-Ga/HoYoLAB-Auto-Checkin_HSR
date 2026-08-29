import fetch from "node-fetch";
import crypto from "crypto";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function getGameUID(ltuid, ltoken, gameBiz) {
  const url = `https://api-account-os.hoyolab.com/account/binding/api/getUserGameRolesByCookie?game_biz=${gameBiz}`;
  const res = await fetch(url, {
    headers: {
      Cookie: `ltuid_v2=${ltuid}; ltoken_v2=${ltoken};`,
      "User-Agent": "Mozilla/5.0"
    }
  });
  const data = await res.json();
  if (data.data?.list?.length > 0) return data.data.list[0].game_uid;
  return null;
}

export function hashLtuid(ltuid) {
  return crypto.createHash("sha256").update(String(ltuid)).digest("hex").slice(0, 16);
}

/**
 * UID를 찾고, 없으면 API로 조회해서 캐시에 채워 넣습니다.
 * checkin.js / note.js / endgame.js 전부 이 캐시를 공유합니다.
 */
export async function getCachedUID(uidCache, ltuid, ltoken, gameBiz) {
  const key = `${hashLtuid(ltuid)}_${gameBiz}`;
  if (uidCache[key]) return uidCache[key];

  const uid = await getGameUID(ltuid, ltoken, gameBiz);
  if (uid) uidCache[key] = uid;
  await sleep(300);
  return uid;
}
