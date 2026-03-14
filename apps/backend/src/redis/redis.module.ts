import { Module, Global, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export const REDIS_CLIENT = 'REDIS_CLIENT';

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const redis = new Redis({
          host: config.get<string>('REDIS_HOST', 'localhost'),
          port: config.get<number>('REDIS_PORT', 6379),
          maxRetriesPerRequest: 3,
        });

        redis.on('error', (err) => {
          console.error('Redis connection error:', err.message);
        });

        redis.on('connect', () => {
          console.log('Redis connected');
        });

        return redis;
      },
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule implements OnModuleDestroy {
  constructor(
    private readonly config: ConfigService,
  ) {}

  async onModuleDestroy() {
    // Redis cleanup handled by NestJS lifecycle
  }
}
