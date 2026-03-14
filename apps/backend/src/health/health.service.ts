import { Injectable, Inject } from '@nestjs/common';
import { HealthIndicatorResult } from '@nestjs/terminus';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../redis/redis.module';

@Injectable()
export class HealthService {
  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  async checkRedis(): Promise<HealthIndicatorResult> {
    try {
      const result = await this.redis.ping();
      if (result === 'PONG') {
        return { redis: { status: 'up' } };
      }
      return { redis: { status: 'down', message: `Unexpected response: ${result}` } };
    } catch (error) {
      return { redis: { status: 'down', message: (error as Error).message } };
    }
  }
}
