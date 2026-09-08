import fs from "fs";

/**
 * 세 스크립트(checkin/note/endgame)가 전부 공유하는 캐시 파일들.
 * .date/ 폴더 아래에 둡니다.
 */
export const DATA_DIR = ".date";
export const UID_CACHE_PATH = `${DATA_DIR}/uid-cache.json`;
export const CHECKIN_DATE_PATH = `${DATA_DIR}/checkin-date.json`;
export const MESSAGE_STORE_PATH = `${DATA_DIR}/discord-messages.json`;

function ensureDataDir() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export function loadJsonFile(path, fallback) {
  try {
    return JSON.parse(fs.readFileSync(path, "utf-8"));
  } catch (e) {
    return fallback;
  }
}

export function saveJsonFile(path, data) {
  ensureDataDir();
  fs.writeFileSync(path, JSON.stringify(data, null, 2) + "\n");
}

export function loadUidCache() {
  return loadJsonFile(UID_CACHE_PATH, {});
}

export function saveUidCache(cache) {
  saveJsonFile(UID_CACHE_PATH, cache);
}

export function loadCheckinDate() {
  const data = loadJsonFile(CHECKIN_DATE_PATH, null);
  return data?.date || null;
}

export function saveCheckinDate(dateStr) {
  saveJsonFile(CHECKIN_DATE_PATH, { date: dateStr });
}

export function todayKST() {
  const d = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function loadMessageStore() {
  return loadJsonFile(MESSAGE_STORE_PATH, {});
}

export function saveMessageStore(store) {
  saveJsonFile(MESSAGE_STORE_PATH, store);
}

// 저장된 값이 예전 형식({ note, endgame })이든 새 형식(문자열)이든
// "실시간 메모" 메시지 ID를 안전하게 꺼냅니다.
export function getExistingNoteId(store, name) {
  const v = store[name];
  if (typeof v === "string") return v;
  if (v && typeof v === "object") return v.note || null;
  return null;
}

export function getLegacyEndgameId(store, name) {
  const v = store[name];
  if (v && typeof v === "object") return v.endgame || null;
  return null;
}
