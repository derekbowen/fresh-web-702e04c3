import { supabaseAdmin } from "./client.server-D5ro3rAQ.js";
import "@supabase/supabase-js";
const DETECTORS = [
  {
    category: "off_platform",
    severity: "high",
    patterns: [
      // US phone numbers (loose)
      /\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/,
      // Email addresses
      /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i,
      // Payment apps
      /\b(venmo|cashapp|cash\s?app|zelle|paypal|apple\s?pay|google\s?pay)\b/i,
      // Pay-around-platform phrasing
      /\b(pay\s+(?:me\s+)?(?:outside|directly|cash|in\s+person|off[-\s]?app|off[-\s]?platform))\b/i,
      /\b(text\s+me|call\s+me|whats\s?app|telegram|signal|instagram|@\s?[a-z0-9_.]{3,})\b/i
    ]
  },
  {
    category: "harassment",
    severity: "high",
    patterns: [
      /\b(kill\s+you|hurt\s+you|beat\s+(?:you|your\s+ass)|fuck\s+you|piece\s+of\s+shit|asshole|bitch|slut|whore|retard|f[a4]g)\b/i,
      /\b(i\s+will\s+(?:find|hunt)\s+you|come\s+to\s+your\s+(?:house|home))\b/i
    ]
  },
  {
    category: "fraud",
    severity: "medium",
    patterns: [
      /\b(refund|chargeback|dispute|scam|fraud|stolen|fake\s+listing|misrepresent)\b/i,
      /\b(refuse\s+to\s+(?:pay|refund)|cancel\s+(?:the\s+)?charge|reverse\s+(?:the\s+)?payment)\b/i
    ]
  },
  {
    category: "safety",
    severity: "high",
    patterns: [
      // Minors unsupervised / alcohol with minors / weapons
      /\b(unsupervised|no\s+(?:adult|parent))\b.*\b(kids?|children|minors?|teens?)\b/i,
      /\b(kids?|children|minors?|teens?)\b.*\b(unsupervised|no\s+(?:adult|parent))\b/i,
      /\b(alcohol|drinking|liquor|beer|booze)\b.*\b(minors?|kids?|teens?|underage|under\s?21)\b/i,
      /\b(gun|firearm|pistol|rifle|shotgun|weapon)\b/i,
      /\b(drugs?|cocaine|meth|fentanyl|heroin|molly|ecstasy)\b/i
    ]
  }
];
function snippet(text, match) {
  const idx = text.toLowerCase().indexOf(match.toLowerCase());
  if (idx < 0) return text.slice(0, 240);
  const start = Math.max(0, idx - 80);
  const end = Math.min(text.length, idx + match.length + 80);
  return (start > 0 ? "…" : "") + text.slice(start, end) + (end < text.length ? "…" : "");
}
async function scanMessagesForAlerts() {
  let scanned = 0;
  let alerts = 0;
  for (let batch = 0; batch < 10; batch++) {
    const { data: rows, error } = await supabaseAdmin.from("st_messages").select("id, sharetribe_id, transaction_st_id, sender_st_id, content").eq("scanned", false).order("created_at_st", { ascending: true }).limit(500);
    if (error) return { scanned, alerts, error: error.message };
    if (!rows?.length) break;
    const alertInserts = [];
    const scannedIds = [];
    for (const m of rows) {
      scannedIds.push(m.id);
      const text = (m.content || "").slice(0, 4e3);
      if (!text.trim()) continue;
      for (const det of DETECTORS) {
        const matched = [];
        for (const re of det.patterns) {
          const hit = text.match(re);
          if (hit) matched.push(hit[0].slice(0, 80));
        }
        if (!matched.length) continue;
        alertInserts.push({
          message_st_id: m.sharetribe_id,
          transaction_st_id: m.transaction_st_id,
          sender_st_id: m.sender_st_id,
          category: det.category,
          severity: det.severity,
          matched_terms: matched.slice(0, 8),
          snippet: snippet(text, matched[0]),
          status: "open"
        });
      }
    }
    if (alertInserts.length) {
      const { error: insErr, count } = await supabaseAdmin.from("st_security_alerts").upsert(alertInserts, {
        onConflict: "message_st_id,category",
        ignoreDuplicates: true,
        count: "exact"
      });
      if (insErr) return { scanned, alerts, error: insErr.message };
      alerts += count ?? 0;
    }
    if (scannedIds.length) {
      const { error: updErr } = await supabaseAdmin.from("st_messages").update({ scanned: true }).in("id", scannedIds);
      if (updErr) return { scanned, alerts, error: updErr.message };
    }
    scanned += rows.length;
    if (rows.length < 500) break;
  }
  return { scanned, alerts };
}
export {
  scanMessagesForAlerts
};
