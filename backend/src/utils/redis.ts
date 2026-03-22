import { Redis } from 'ioredis';
import dotenv from 'dotenv';
dotenv.config();

// Create a robust Memory Map fallback if Redis is missing from the Cloud Environment to prevent 500 crashes
class RedisMock {
  private map = new Map<string, string>();
  
  async get(key: string) { return this.map.get(key) || null; }
  async setex(key: string, seconds: number, value: string) { this.map.set(key, value); }
  async del(key: string) { this.map.delete(key); }
  async incr(key: string) { 
    const val = parseInt(this.map.get(key) || '0', 10) + 1;
    this.map.set(key, val.toString());
    return val;
  }
  async expire(key: string, seconds: number) { return 1; }
  on(event: string, cb: any) {}
}

const redisClient = process.env.REDIS_URL 
  ? new Redis(process.env.REDIS_URL) 
  : new RedisMock() as unknown as Redis;

if (process.env.REDIS_URL) {
    (redisClient as Redis).on('connect', () => {
        console.log('✅ Redis clustered successfully');
    });
    (redisClient as Redis).on('error', (err) => {
        console.error('❌ Redis remote error:', err);
    });
} else {
    console.log('⚠️ Running Redis in Native Memory Mock mode. Provide REDIS_URL for production clusters.');
}

export default redisClient;
