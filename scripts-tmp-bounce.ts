import { sendTransactionalEmailServer } from './src/server/transactional-email.server'

const bounceAddr = `test-bounce-${Date.now()}@nonexistent-domain-12345.invalid`
const r = await sendTransactionalEmailServer({
  templateName: 'pool-waitlist-confirmation',
  recipientEmail: bounceAddr,
  idempotencyKey: `smoke-invalid-${Date.now()}`,
  templateData: { city: 'Austin', region: 'TX', nearestMiles: 287 },
})
console.log(JSON.stringify({ target: bounceAddr, result: r }))
console.log('BOUNCE_ADDR=' + bounceAddr)
