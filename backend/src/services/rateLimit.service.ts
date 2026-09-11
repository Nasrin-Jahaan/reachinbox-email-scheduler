import { redisClient } from '../config/redis';
import { env } from '../config/env';
import { getHourWindowString, getStartOfNextHour } from '../utils/time';

export interface RateLimitCheckResult {
  allowed: boolean;
  currentCount: number;
  maxLimit: number;
  nextHourStart?: Date;
}

export class RateLimitService {
  static async checkAndIncrementHourlyLimit(
    senderId: string,
    maxLimit: number = env.MAX_EMAILS_PER_HOUR_PER_SENDER,
    date: Date = new Date()
  ): Promise<RateLimitCheckResult> {
    const hourWindow = getHourWindowString(date);
    const key = `email-rate:${senderId}:${hourWindow}`;

    const luaScript = `
      local current = redis.call('INCR', KEYS[1])
      if current == 1 then
        redis.call('EXPIRE', KEYS[1], 7200)
      end
      return current
    `;

    const countResult = (await redisClient.eval(luaScript, 1, key)) as number;

    if (countResult > maxLimit) {
      const nextHour = getStartOfNextHour(date);
      return {
        allowed: false,
        currentCount: countResult,
        maxLimit,
        nextHourStart: nextHour,
      };
    }

    return {
      allowed: true,
      currentCount: countResult,
      maxLimit,
    };
  }

  static async reserveSendSlot(
    senderId: string,
    minDelayMs: number = env.MIN_DELAY_BETWEEN_EMAILS_MS
  ): Promise<{ delayMs: number; reservedTime: number }> {
    const key = `email-last-sent-time:${senderId}`;
    const now = Date.now();

    const luaScript = `
      local last = redis.call('GET', KEYS[1])
      local now = tonumber(ARGV[1])
      local minDelay = tonumber(ARGV[2])
      local reserved = now

      if last then
        local lastTime = tonumber(last)
        if (lastTime + minDelay) > now then
          reserved = lastTime + minDelay
        end
      end

      redis.call('SET', KEYS[1], tostring(reserved), 'EX', 86400)
      return tostring(reserved)
    `;

    const reservedStr = (await redisClient.eval(luaScript, 1, key, String(now), String(minDelayMs))) as string;
    const reservedTime = parseInt(reservedStr, 10);
    const delayMs = Math.max(0, reservedTime - now);

    return { delayMs, reservedTime };
  }
}
