// Optional Redis import; type is loaded dynamically
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type Redis = any;

let redisClient: Redis | null = null;
let useRedis = false;

try {
  // attempt to require ioredis if available at runtime
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const IORedis = require('ioredis');
  const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
  redisClient = new IORedis(redisUrl);
  useRedis = true;
} catch (err) {
  // no-op: fall back to in-memory store
  useRedis = false;
}

type Stored = { userId: string; expiresAt?: number };

const memoryStore = new Map<string, Stored>();
const userIndex = new Map<string, Set<string>>();

export async function storeRefreshToken(jti: string, userId: string, ttlSeconds: number) {
  if (useRedis && redisClient) {
    await redisClient.set(`refresh:${jti}`, userId, 'EX', ttlSeconds);
    await redisClient.sadd(`user_refresh:${userId}`, jti);
    await redisClient.expire(`user_refresh:${userId}`, ttlSeconds);
    return;
  }
  const expiresAt = Date.now() + ttlSeconds * 1000;
  memoryStore.set(jti, { userId, expiresAt });
  const set = userIndex.get(userId) || new Set<string>();
  set.add(jti);
  userIndex.set(userId, set);
}

export async function verifyAndConsumeRefreshToken(jti: string): Promise<string | null> {
  if (useRedis && redisClient) {
    const key = `refresh:${jti}`;
    const userId = await redisClient.get(key);
    if (!userId) return null;
    // consume (delete) on use
    await redisClient.del(key);
    await redisClient.srem(`user_refresh:${userId}`, jti);
    return userId;
  }
  const entry = memoryStore.get(jti);
  if (!entry) return null;
  if (entry.expiresAt && entry.expiresAt < Date.now()) {
    memoryStore.delete(jti);
    const set = userIndex.get(entry.userId);
    set?.delete(jti);
    return null;
  }
  // consume
  memoryStore.delete(jti);
  const set = userIndex.get(entry.userId);
  set?.delete(jti);
  return entry.userId;
}

export async function revokeRefreshToken(jti: string) {
  if (useRedis && redisClient) {
    await redisClient.del(`refresh:${jti}`);
    return;
  }
  const entry = memoryStore.get(jti);
  if (!entry) return;
  memoryStore.delete(jti);
  const set = userIndex.get(entry.userId);
  set?.delete(jti);
}

export async function revokeAllForUser(userId: string) {
  if (useRedis && redisClient) {
    const keys = await redisClient.smembers(`user_refresh:${userId}`);
    if (keys && keys.length) {
      const pipeline = redisClient.pipeline();
      keys.forEach((k: string) => pipeline.del(`refresh:${k}`));
      pipeline.del(`user_refresh:${userId}`);
      await pipeline.exec();
    }
    return;
  }
  const set = userIndex.get(userId);
  if (!set) return;
  for (const jti of set) memoryStore.delete(jti);
  userIndex.delete(userId);
}

export function isUsingRedis() {
  return useRedis;
}
