import { PrismaClient } from '@prisma/client';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { prisma } from '../src/index';
import redisClient from '../src/utils/redis';

// Mock Prisma
jest.mock('../src/index', () => ({
  __esModule: true,
  prisma: mockDeep<PrismaClient>(),
  io: {
      on: jest.fn(),
      emit: jest.fn()
  }
}));

// Mock Redis
jest.mock('../src/utils/redis', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    set: jest.fn(),
    setex: jest.fn(),
    del: jest.fn(),
    incr: jest.fn(),
    expire: jest.fn()
  }
}));

export const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

beforeEach(() => {
    jest.clearAllMocks();
});
