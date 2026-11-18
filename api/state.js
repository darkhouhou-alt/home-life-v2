const STATE_KEY = 'our_home_life:main_state';

function getRedisConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  return { url, token };
}

async function redisGet(url, token, key) {
  const res = await fetch(`${url}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store'
  });
  if (!res.ok) throw new Error('Redis GET failed');
  const data = await res.json();
  return data.result ? JSON.parse(data.result) : null;
}

async function redisSet(url, token, key, valueObj) {
  const res = await fetch(`${url}/set/${encodeURIComponent(key)}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(JSON.stringify(valueObj))
  });
  if (!res.ok) throw new Error('Redis SET failed');
}

export default async function handler(req, res) {
  const { url, token } = getRedisConfig();
  if (!url || !token) {
    return res.status(500).json({
      error: 'Redis(Upstash) 환경변수가 연결되지 않았습니다.'
    });
  }

  try {
    if (req.method === 'GET') {
      const current = await redisGet(url, token, STATE_KEY);
      return res.status(200).json(current || { version: 0, document: null });
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      const clientVersion = Number(body.version || 0);
      const existing = await
