import fetch from "node-fetch";
import crypto from "crypto";

function generateDS() {
  const salt = "6s25p5ox5y14umn1p61aqyyvbvvl3lrt";
  const t = Math.floor(Date.now() / 1000);
  const characters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let random = "";
  for (let i = 0; i < 6; i++) {
    random += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  const c = crypto.createHash("md5").update(`salt=${salt}&t=${t}&r=${random}`).digest("hex");
  return `${t},${random},${c}`;
}

function buildHkrpgHeaders(ltuid, ltoken) {
  return {
    Accept: "application/json, text/plain, */*",
    "Accept-Encoding": "gzip, deflate, br",
    Cookie: `ltuid_v2=${ltuid}; ltoken_v2=${ltoken}; ltuid=${ltuid}; ltoken=${ltoken};`,
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36 Edg/112.0.1722.46",
    "x-rpc-app_version": "1.5.0",
    "x-rpc-client_type": "5",
    "x-rpc-language": "ko-kr",
    DS: generateDS(),
    Origin: "https://hoyolab.com",
    Referer: "https://hoyolab.com"
  };
}

export async function fetchHkrpgRecord(ltuid, ltoken, uid, server, endpoint, extraParams = {}) {
  const params = new URLSearchParams({ server, role_id: uid, ...extraParams });
  const url = `https://bbs-api-os.hoyolab.com/game_record/hkrpg/api/${endpoint}?${params.toString()}`;
  const res = await fetch(url, { headers: buildHkrpgHeaders(ltuid, ltoken) });
  const data = await res.json();

  console.log(`[원본 응답: ${endpoint}]`, JSON.stringify(data));

  if (data.retcode !== 0) {
    throw new Error(`${endpoint} 조회 실패 (retcode: ${data.retcode}, message: ${data.message})`);
  }
  return data.data;
}

export async function fetchStarRailNote(ltuid, ltoken, uid, server) {
  return fetchHkrpgRecord(ltuid, ltoken, uid, server, "note");
}

// 서버별 시간대(UTC 기준 시간 오프셋). 아시아 서버는 실제로 한국시간(UTC+9) 기준으로
// 데이터가 오는 걸 확인해서 9로 맞춰뒀습니다. 다른 서버에서 시간이 안 맞으면 이 값을 조정하세요.
const SERVER_TZ_OFFSET_HOURS = {
  prod_official_asia: 9,
  prod_official_cht: 8,
  prod_official_usa: -5,
  prod_official_eur: 1
};

function partialTimeToDate(pt, server) {
  if (!pt || !pt.year) return null;
  const offsetHours = SERVER_TZ_OFFSET_HOURS[server] ?? 8;
  const utcMs = Date.UTC(pt.year, pt.month - 1, pt.day, pt.hour, pt.minute) - offsetHours * 3600 * 1000;
  return new Date(utcMs);
}

export function formatKST(date) {
  if (!date) return "알 수 없음";
  const kst = new Date(date.toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
  const ampm = kst.getHours() < 12 ? "오전" : "오후";
  const hours = kst.getHours() % 12 || 12;
  const mm = String(kst.getMinutes()).padStart(2, "0");
  return `${kst.getFullYear()}.${String(kst.getMonth() + 1).padStart(2, "0")}.${String(kst.getDate()).padStart(2, "0")} ${ampm} ${hours}:${mm}`;
}

export function formatCountdownPlain(date) {
  if (!date) return null;
  const diffMs = date.getTime() - Date.now();
  if (diffMs <= 0) return "0일 0시간";
  const totalMinutes = Math.floor(diffMs / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  return `${days}일 ${hours}시간`;
}

function parseStarChallenge(raw, server) {
  const season = raw.groups && raw.groups[0] ? raw.groups[0] : null;
  const end =
    partialTimeToDate(raw.end_time, server) || (season ? partialTimeToDate(season.end_time, server) : null);
  const seasonName = season?.name_mi18n || season?.name || raw.name_mi18n || "";
  const gameVersion = season?.game_version || raw.game_version || "";

  // groups[1]이 있으면 "다음 시즌 예고" 정보로 사용 (아직 오픈 안 한 다음 시즌)
  const nextSeason = raw.groups && raw.groups[1] ? raw.groups[1] : null;
  const nextSeasonName = nextSeason?.name_mi18n || nextSeason?.name || "";
  const nextOpen = nextSeason ? partialTimeToDate(nextSeason.begin_time, server) : null;

  return { seasonName, gameVersion, end, nextSeasonName, nextOpen };
}

export async function fetchEndgameStatus(ltuid, ltoken, uid, server) {
  const result = {};

  try {
    const raw = await fetchHkrpgRecord(ltuid, ltoken, uid, server, "challenge", {
      schedule_type: 1,
      need_all: "false"
    });
    result.moc = parseStarChallenge(raw, server);
  } catch (e) {
    result.moc = { error: e.message };
  }

  try {
    const raw = await fetchHkrpgRecord(ltuid, ltoken, uid, server, "challenge_story", {
      schedule_type: 1,
      need_all: "false"
    });
    result.pf = parseStarChallenge(raw, server);
  } catch (e) {
    result.pf = { error: e.message };
  }

  try {
    const raw = await fetchHkrpgRecord(ltuid, ltoken, uid, server, "challenge_boss", {
      schedule_type: 1,
      need_all: "false"
    });
    result.apc = parseStarChallenge(raw, server);
  } catch (e) {
    result.apc = { error: e.message };
  }

  try {
    const raw = await fetchHkrpgRecord(ltuid, ltoken, uid, server, "challenge_peak", {
      schedule_type: 1
    });
    const record =
      raw.challenge_peak_records && raw.challenge_peak_records[0] ? raw.challenge_peak_records[0] : null;
    if (!record) {
      result.aa = { error: "기록 없음 (해금 조건 미충족이거나 아직 도전 전)" };
    } else {
      const seasonName = record.group?.name_mi18n || record.boss?.name_mi18n || record.name_mi18n || "";
      result.aa = {
        seasonName,
        gameVersion: record.group?.game_version || "",
        end: record.group ? partialTimeToDate(record.group.end_time, server) : null
      };
    }
  } catch (e) {
    result.aa = { error: e.message };
  }

  result.gameVersion =
    result.aa?.gameVersion || result.moc?.gameVersion || result.pf?.gameVersion || result.apc?.gameVersion || "";

  return result;
}

export function formatRecoverTime(seconds) {
  if (!seconds || seconds <= 0) return "***__가득 참__***";
  const target = new Date(Date.now() + seconds * 1000);
  const kst = new Date(target.toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
  const isTomorrow = kst.getDate() !== now.getDate();
  const ampm = kst.getHours() < 12 ? "오전" : "오후";
  const hours = kst.getHours() % 12 || 12;
  const minutes = String(kst.getMinutes()).padStart(2, "0");
  return `**__${isTomorrow ? "내일" : "오늘"} ${ampm} ${hours}:${minutes}__** 회복 완료`;
}

export function formatWithStatus(current, max, doneWhenZero = false) {
  const isDone = doneWhenZero ? current === 0 : current === max && max !== undefined && max !== null;
  const label = isDone ? "**완료**" : "***__미완료__***";
  return `${current ?? "?"}/${max ?? "?"} ${label}`;
}

/**
 * "다음 시즌 예고" 한 항목을 임베드 필드 텍스트로 변환.
 * 다음 시즌 정보(nextSeasonName/nextOpen)가 없으면 "예정된 다음 시즌 없음"으로 표시.
 */
export function formatUpcomingField(info) {
  if (!info || info.error) return "> 예정된 다음 시즌 없음";
  if (!info.nextSeasonName && !info.nextOpen) return "> 예정된 다음 시즌 없음";

  const seasonLine = `> Season. ${info.nextSeasonName || "--"}`;
  const countdown = formatCountdownPlain(info.nextOpen);
  const countdownLine = countdown
    ? `> ${countdown} 후 오픈 **__[${formatKST(info.nextOpen)}]__**`
    : `> ***__오픈일 정보 없음__***`;

  return `${seasonLine}\n${countdownLine}`;
}

/**
 * "다음 시즌 예고" 임베드를 만듭니다. (이상 중재는 구조가 달라 제외)
 */
export function buildUpcomingEmbed(endgame) {
  return {
    title: "🗓️ 빛 따라 금 찾아 일정",
    description: `[다음 시즌]`,
    color: 15105570,
    fields: [
      { name: "**🌀 망각의 정원**", value: formatUpcomingField(endgame.moc), inline: false },
      { name: "**🪽 허구 이야기**", value: formatUpcomingField(endgame.pf), inline: false },
      { name: "**⌛ 종말의 환영**", value: formatUpcomingField(endgame.apc), inline: false }
    ],
    footer: { text: `⟳  ${footerTextKST()}` }
  };
}

export function formatChallengeField(info) {
  if (!info) return "> 정보 없음";
  if (info.error) return `> ⚠️ ${info.error}`;

  const seasonLine = `> Season. ${info.seasonName || "--"}`;
  const countdown = formatCountdownPlain(info.end);
  const countdownLine = countdown
    ? `> ${countdown} 남음 **__[${formatKST(info.end)}]__**`
    : `> ***__갱신일 정보 없음__***`;

  return `${seasonLine}\n${countdownLine}`;
}

function footerTextKST() {
  const d = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
  const ampm = d.getHours() < 12 ? "오전" : "오후";
  const hours = d.getHours() % 12 || 12;
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}. ${ampm} ${String(hours).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/**
 * "실시간 메모" 임베드를 만듭니다.
 */
export function buildNoteEmbed(account, uid, note) {
  const stamina = `${note.current_stamina ?? "?"}/${note.max_stamina ?? "?"}`;
  const staminaRecover = formatRecoverTime(note.stamina_recover_time);
  const reserveStamina = note.current_reserve_stamina ?? "0";
  const train = formatWithStatus(note.current_train_score, note.max_train_score);
  const echoOfWar = formatWithStatus(note.weekly_cocoon_cnt, note.weekly_cocoon_limit, true);
  const rogueScore = formatWithStatus(note.current_rogue_score, note.max_rogue_score);

  return {
    title: `✨ ${account.NAME} 실시간 메모`,
    description: `UID : ${uid || "***__정보 없음__***"}`,
    color: 3447003,
    fields: [
      { name: "**🔋 개척력**", value: `> ${stamina}\n> ${staminaRecover}`, inline: true },
      { name: "**🪫 예비 개척력**", value: `> ${reserveStamina}`, inline: true },
      { name: "**📘 일일 훈련**", value: `> ${train}`, inline: false },
      { name: "**⚔️ 전쟁의 여운**", value: `> ${echoOfWar}`, inline: false },
      { name: "**🌀 주기 점수**", value: `> ${rogueScore}`, inline: false }
    ],
    footer: { text: `⟳  ${footerTextKST()}` }
  };
}

// API에서 버전 정보를 못 찾았을 때 쓸 예비값
const GAME_VERSION_FALLBACK = "4.4";

/**
 * "빛 따라 금 찾아 일정" 임베드를 만듭니다.
 */
export function buildChallengeEmbed(endgame) {
  const version = endgame.gameVersion || GAME_VERSION_FALLBACK;
  return {
    title: "🗓️ 빛 따라 금 찾아 일정",
    description: `${version}버전 [진행 중]`,
    color: 10181046,
    fields: [
      { name: "**🌀 망각의 정원**", value: formatChallengeField(endgame.moc), inline: false },
      { name: "**🪽 허구 이야기**", value: formatChallengeField(endgame.pf), inline: false },
      { name: "**⌛ 종말의 환영**", value: formatChallengeField(endgame.apc), inline: false },
      { name: "**♙ 이상 중재**", value: formatChallengeField(endgame.aa), inline: false }
    ],
    footer: { text: `⟳  ${footerTextKST()}` }
  };
}
