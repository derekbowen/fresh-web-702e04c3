import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const email = 'jayen@jayenashar.org';
// Strong, human-typable password: 16 chars, mixed case + digits, no ambiguous chars
const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
const password = Array.from({length: 16}, () =>
  alphabet[crypto.randomInt(0, alphabet.length)]
).join('');

const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// Create or find user
let userId;
const { data: created, error: cErr } = await sb.auth.admin.createUser({
  email, password, email_confirm: true,
  user_metadata: { full_name: 'Jayen Ashar' },
});
if (created?.user) {
  userId = created.user.id;
  console.log('CREATED user', userId);
} else {
  console.log('createUser said:', cErr?.message);
  // find existing
  const { data: list } = await sb.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const m = list?.users?.find(u => (u.email || '').toLowerCase() === email);
  if (!m) { console.error('Could not find or create user'); process.exit(1); }
  userId = m.id;
  // Reset their password to the new one
  await sb.auth.admin.updateUserById(userId, { password, email_confirm: true });
  console.log('UPDATED existing user', userId, '— password reset');
}

// Grant admin role
const { error: rErr } = await sb.from('user_roles')
  .upsert({ user_id: userId, role: 'admin' }, { onConflict: 'user_id,role' });
if (rErr) { console.error('role upsert error:', rErr); process.exit(1); }

console.log('---');
console.log('EMAIL:    ', email);
console.log('PASSWORD: ', password);
console.log('USER ID:  ', userId);
console.log('ROLE:     admin');
