import fetch from "node-fetch";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * 구글 드라이브 공유 링크를 이미지 다이렉트 링크로 자동 변환합니다.
 * 예: https://drive.google.com/file/d/파일ID/view?usp=sharing
 *     https://drive.google.com/open?id=파일ID
 * → https://drive.google.com/uc?export=view&id=파일ID
 * 구글 드라이브 링크가 아니면(Imgur 등) 원본 그대로 사용합니다.
 */
export function normalizeAvatarUrl(url) {
  if (!url) return url;
  if (url.includes("drive.google.com/uc")) return url;

  let match = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (match) return `https://drive.google.com/uc?export=view&id=${match[1]}`;

  match = url.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/);
  if (match) return `https://drive.google.com/uc?export=view&id=${match[1]}`;

  return url;
}

export function parseWebhookUrl(webhookUrl) {
  const m = webhookUrl.match(/webhooks\/(\d+)\/([^/?]+)/);
  if (!m) return null;
  return { id: m[1], token: m[2] };
}

/**
 * 기존 메시지 ID가 있으면 수정(PATCH), 없거나 수정 실패하면 새로 생성(POST)합니다.
 * existingMessageId가 애초에 null이면 (호요 출석처럼) 매번 새 메시지를 만드는 용도로도 씁니다.
 */
export async function sendOrEditDiscord(webhook, embed, avatar, existingMessageId, username) {
  if (!webhook) return null;
  const parsed = parseWebhookUrl(webhook);
  if (!parsed) {
    console.error("❌ 웹훅 URL 형식이 올바르지 않습니다.");
    return existingMessageId || null;
  }

  const body = { username, avatar_url: avatar || undefined, embeds: [embed] };

  if (existingMessageId) {
    for (let retry = 0; retry < 5; retry++) {
      const res = await fetch(`${webhook}/messages/${existingMessageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        console.log("✏️ 기존 메시지 수정 완료");
        return existingMessageId;
      }
      if (res.status === 429) {
        const data = await res.json();
        await sleep((data.retry_after || 5) * 1000);
        continue;
      }
      console.log(`⚠️ 기존 메시지 수정 실패 (코드: ${res.status}) → 새로 생성합니다.`);
      break;
    }
  }

  for (let retry = 0; retry < 10; retry++) {
    const res = await fetch(`${webhook}?wait=true`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    if (res.ok) {
      const data = await res.json();
      console.log("🆕 새 메시지 생성 완료");
      return data.id;
    }
    if (res.status === 429) {
      const data = await res.json();
      await sleep((data.retry_after || 5) * 1000);
      continue;
    }
    console.error(`❌ 메시지 생성 실패 (코드: ${res.status})`);
    break;
  }
  return existingMessageId || null;
}

export function footerText() {
  const d = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
  const ampm = d.getHours() < 12 ? "오전" : "오후";
  const hours = d.getHours() % 12 || 12;
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}. ${ampm} ${String(hours).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
