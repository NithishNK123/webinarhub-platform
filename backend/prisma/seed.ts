import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting DB Seeding...');

  // 1. Create Admin User
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@webinarhub.com' },
    update: { passwordHash: adminPassword, role: 'admin' },
    create: {
      name: 'Super Admin',
      email: 'admin@webinarhub.com',
      phone: '+10000000000',
      passwordHash: adminPassword,
      role: 'admin',
      isVerifiedHost: true
    },
  });
  console.log('✅ Admin Account created: admin@webinarhub.com / admin123');

  // 2. Create Standard Host
  const hostPassword = await bcrypt.hash('host123', 10);
  const host = await prisma.user.upsert({
    where: { email: 'host@webinarhub.com' },
    update: {},
    create: {
      name: 'Expert Speaker',
      email: 'host@webinarhub.com',
      phone: '+10000000001',
      passwordHash: hostPassword,
      role: 'user',
      isVerifiedHost: true
    },
  });

  // 3. Create Sample Webinar
  await prisma.webinar.create({
    data: {
      title: 'Advanced System Design 2026',
      description: 'Master large-scale distributed systems, microservices, and high-availability architecture.',
      price: 0, // Free tier
      domain: 'Engineering',
      hostId: host.id,
      startTime: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 7 days from now
      endTime: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7 + 1000 * 60 * 120), // 2 hours long
    }
  });
  console.log('✅ Sample Webinars created.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log('🌱 Seeding Finished!\n');
  });
