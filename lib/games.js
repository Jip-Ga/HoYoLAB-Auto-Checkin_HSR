export const GAME_DATA = {
  "붕괴 3rd": {
    url: "https://sg-public-api.hoyolab.com/event/mani/sign?act_id=e202110291205111",
    biz: "bh3_global"
  },
  "원신": {
    url: "https://sg-hk4e-api.hoyolab.com/event/sol/sign?act_id=e202102251931481",
    biz: "hk4e_global"
  },
  "붕괴: 스타레일": {
    url: "https://sg-public-api.hoyolab.com/event/luna/os/sign?act_id=e202303301540311",
    biz: "hkrpg_global"
  },
  "젠레스 존 제로": {
    url: "https://sg-public-api.hoyolab.com/event/luna/zzz/os/sign?act_id=e202406031448091&lang=ko-kr",
    biz: "nap_global",
    extraHeaders: { "x-rpc-signgame": "zzz" }
  }
};

export const GAME_ALIASES = {
  "붕괴 3rd": ["hi3", "hi3rd", "Honkai Impact 3rd", "붕3", "붕3rd", "붕괴3rd", "3rd"],
  "원신": ["gl", "Genshin Impact", "겐신", "1신", "원공노", "공월", "공월의노래"],
  "붕괴: 스타레일": ["hsr", "Honkai: Star Rail", "붕스", "붕스타", "별", "별붕", "스타레일", "붕괴스타레일", "붕괴 : 스타레일"],
  "젠레스 존 제로": ["z", "zzz", "Zenless Zone Zero", "젠존제", "찢", "ㅈㅈㅈ", "젠레스존제로", "젠제로", "젠레스", "존", "제로"]
};

export const GAMES = { ...GAME_DATA };
for (const [originalName, aliases] of Object.entries(GAME_ALIASES)) {
  for (const alias of aliases) {
    GAMES[alias] = GAME_DATA[originalName];
  }
}

const GAMES_LOWERCASE = {};
for (const [name, data] of Object.entries(GAMES)) {
  GAMES_LOWERCASE[name.toLowerCase()] = data;
}

export function findGame(gameName) {
  return GAMES[gameName] || GAMES_LOWERCASE[String(gameName).toLowerCase()];
}

const ORIGINAL_NAME_BY_GAME = new Map();
for (const [originalName, data] of Object.entries(GAME_DATA)) {
  ORIGINAL_NAME_BY_GAME.set(data, originalName);
}

/**
 * showAliasAsIs: true면 적은 별명 그대로, false면 원래 정식 이름으로 표시.
 */
export function getDisplayName(gameName, game, showAliasAsIs) {
  if (showAliasAsIs) return gameName;
  return ORIGINAL_NAME_BY_GAME.get(game) || gameName;
}

// 붕괴: 스타레일의 biz 값. 실시간 메모/빛 따라 금 찾아의 UID 조회에도 이 값을 그대로 씁니다.
export const HKRPG_BIZ = "hkrpg_global";
