const EMAILIT_ENDPOINT = "https://api.emailit.com/v2/emails";
class EmailitError extends Error {
  status;
  retryAfterSeconds;
  body;
  constructor(message, status, body, retryAfterSeconds = null) {
    super(message);
    this.name = "EmailitError";
    this.status = status;
    this.body = body;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}
async function sendViaEmailit(input) {
  const apiKey = process.env.EMAILIT_API_KEY;
  if (!apiKey) {
    throw new EmailitError("EMAILIT_API_KEY is not configured", 500, "");
  }
  const body = {
    from: input.from,
    to: input.to,
    subject: input.subject,
    html: input.html
  };
  if (input.text) body.text = input.text;
  if (input.replyTo) body.reply_to = input.replyTo;
  if (input.headers && Object.keys(input.headers).length > 0) {
    body.headers = input.headers;
  }
  const res = await fetch(EMAILIT_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify(body)
  });
  const text = await res.text();
  if (!res.ok) {
    let retryAfter = null;
    if (res.status === 429) {
      const header = res.headers.get("Retry-After");
      if (header) {
        const n = Number(header);
        if (!Number.isNaN(n) && n > 0) retryAfter = n;
      }
      if (retryAfter == null) retryAfter = 60;
    }
    throw new EmailitError(
      `Emailit ${res.status} ${res.statusText}: ${text.slice(0, 300)}`,
      res.status,
      text,
      retryAfter
    );
  }
  let parsed = {};
  try {
    parsed = JSON.parse(text);
  } catch {
  }
  return { id: parsed?.id ?? "", status: parsed?.status ?? "pending" };
}
export {
  sendViaEmailit as s
};
