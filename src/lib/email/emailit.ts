/**
 * Emailit transactional sender.
 * Single chokepoint for the queue dispatcher to send emails via
 * https://api.emailit.com/v2/emails
 *
 * Throws EmailitError on non-2xx responses, with .status and (for 429)
 * .retryAfterSeconds populated so the queue dispatcher can back off.
 */

const EMAILIT_ENDPOINT = "https://api.emailit.com/v2/emails";

export class EmailitError extends Error {
  status: number;
  retryAfterSeconds: number | null;
  body: string;
  constructor(message: string, status: number, body: string, retryAfterSeconds: number | null = null) {
    super(message);
    this.name = "EmailitError";
    this.status = status;
    this.body = body;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export interface SendViaEmailitInput {
  from: string;
  to: string;
  subject: string;
  html: string;
  text?: string | null;
  replyTo?: string | null;
  /**
   * Extra RFC-compliant headers forwarded to Emailit (e.g. List-Unsubscribe,
   * List-Unsubscribe-Post). Keys are case-insensitive on the wire.
   */
  headers?: Record<string, string> | null;
}

export interface SendViaEmailitResult {
  id: string;
  status: string;
}

export async function sendViaEmailit(input: SendViaEmailitInput): Promise<SendViaEmailitResult> {
  const apiKey = process.env.EMAILIT_API_KEY;
  if (!apiKey) {
    throw new EmailitError("EMAILIT_API_KEY is not configured", 500, "");
  }

  const body: Record<string, unknown> = {
    from: input.from,
    to: input.to,
    subject: input.subject,
    html: input.html,
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
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();

  if (!res.ok) {
    let retryAfter: number | null = null;
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
      retryAfter,
    );
  }

  let parsed: any = {};
  try { parsed = JSON.parse(text); } catch { /* tolerate empty body */ }
  return { id: parsed?.id ?? "", status: parsed?.status ?? "pending" };
}
