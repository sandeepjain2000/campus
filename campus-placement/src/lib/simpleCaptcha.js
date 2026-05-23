import crypto from 'crypto';

const TTL_MS = 10 * 60 * 1000;

function getSecret() {
  const s = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;
  if (!s && process.env.NODE_ENV === 'production') {
    throw new Error('NEXTAUTH_SECRET is required for login captcha');
  }
  return s || 'placementhub-dev-captcha';
}

/**
 * @returns {{ question: string, token: string }}
 */
export function createLoginCaptcha() {
  const a = Math.floor(Math.random() * 9) + 1;
  const b = Math.floor(Math.random() * 9) + 1;
  const exp = Date.now() + TTL_MS;
  const body = Buffer.from(JSON.stringify({ a, b, exp })).toString('base64url');
  const sig = crypto.createHmac('sha256', getSecret()).update(body).digest('base64url');
  return {
    question: `What is ${a} + ${b}?`,
    token: `${body}.${sig}`,
  };
}

/**
 * @param {string | undefined} token
 * @param {string | number | undefined} answer
 */
export function verifyLoginCaptcha(token, answer) {
  if (!token) return false;
  const [body, sig] = String(token).split('.');
  if (!body || !sig) return false;

  const expectedSig = crypto.createHmac('sha256', getSecret()).update(body).digest('base64url');
  if (sig !== expectedSig) return false;

  let data;
  try {
    data = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
  } catch {
    return false;
  }

  if (!data || typeof data.a !== 'number' || typeof data.b !== 'number' || typeof data.exp !== 'number') {
    return false;
  }
  if (Date.now() > data.exp) return false;

  const ans = parseInt(String(answer ?? '').trim(), 10);
  if (!Number.isFinite(ans)) return false;
  return ans === data.a + data.b;
}
