/**
 * ACCOUNTS_JSON Secret을 읽어서 계정 목록 + 공용 설정을 반환합니다.
 * checkin.js / note.js / endgame.js가 전부 이 함수를 씁니다.
 */
export function loadConfig() {
  const raw = process.env.ACCOUNTS_JSON;
  if (!raw) {
    throw new Error(
      "ACCOUNTS_JSON 환경변수(Secret)가 설정되지 않았습니다. README를 참고해서 GitHub Secret을 등록해주세요."
    );
  }
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    throw new Error("ACCOUNTS_JSON 파싱 실패: JSON 형식이 올바른지 확인해주세요. " + e.message);
  }
  if (!parsed || !Array.isArray(parsed.ACCOUNTS)) {
    throw new Error('ACCOUNTS_JSON의 "ACCOUNTS" 값이 배열이 아닙니다. 형식을 확인해주세요.');
  }
  const showAliasAsIs = String(parsed.SHOW_ALIAS_AS_IS ?? "o").toLowerCase() === "o";
  return {
    accounts: parsed.ACCOUNTS,
    showAliasAsIs,
    endgameWebhook: parsed.ENDGAME_WEBHOOK || "",
    endgameAvatar: parsed.ENDGAME_AVATAR || ""
  };
}
