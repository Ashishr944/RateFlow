import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Clean existing data
  await prisma.rating.deleteMany();
  await prisma.store.deleteMany();
  await prisma.user.deleteMany();

  // Create hashed passwords
  const adminPassword = await bcrypt.hash('Password123!', 10);
  const owner1Password = await bcrypt.hash('OwnerPassword1!', 10);
  const owner2Password = await bcrypt.hash('OwnerPassword2!', 10);
  const user1Password = await bcrypt.hash('UserPassword1!', 10);
  const user2Password = await bcrypt.hash('UserPassword2!', 10);
  const user3Password = await bcrypt.hash('UserPassword3!', 10);

  // 1. Create System Administrator
  const admin = await prisma.user.create({
    data: {
      name: 'System Administrator Main Account',
      email: 'admin@rateflow.com',
      password: adminPassword,
      address: 'RateFlow HQ, Main Silicon Valley Office Suite 100, San Francisco, CA',
      role: Role.ADMIN,
    },
  });
  console.log(`Created admin: ${admin.email}`);

  // 2. Create Store Owners
  const owner1 = await prisma.user.create({
    data: {
      name: 'Arthur Pendragon Owner Account',
      email: 'arthur@rateflow.com',
      password: owner1Password,
      address: 'Camelot Castle, Owner Quarters, United Kingdom',
      role: Role.OWNER,
    },
  });
  console.log(`Created owner 1: ${owner1.email}`);

  const owner2 = await prisma.user.create({
    data: {
      name: 'Guinevere Pendragon Owner Account',
      email: 'guinevere@rateflow.com',
      password: owner2Password,
      address: 'Camelot Castle, West Wing, United Kingdom',
      role: Role.OWNER,
    },
  });
  console.log(`Created owner 2: ${owner2.email}`);

  // 3. Create Stores and link to Owners
  const store1 = await prisma.store.create({
    data: {
      name: 'The Roundtable Cafe and Bakery',
      email: 'roundtable@cafe.com',
      address: 'Camelot Square, Middle Section, United Kingdom',
      ownerId: owner1.id,
    },
  });
  console.log(`Created store 1: ${store1.name}`);

  const store2 = await prisma.store.create({
    data: {
      name: 'Merlins Magic Coffee and Donuts',
      email: 'merlin@magic.com',
      address: 'Forest of Dean, Magic Hut 3, United Kingdom',
      ownerId: owner2.id,
    },
  });
  console.log(`Created store 2: ${store2.name}`);

  // 4. Create Normal Users
  const user1 = await prisma.user.create({
    data: {
      name: 'Sir Lancelot The Brave Knight',
      email: 'lancelot@knights.com',
      password: user1Password,
      address: 'Joyous Gard Castle, Knight Quarters, United Kingdom',
      role: Role.USER,
    },
  });
  console.log(`Created user 1: ${user1.email}`);

  const user2 = await prisma.user.create({
    data: {
      name: 'Sir Galahad The Pure Knight',
      email: 'galahad@knights.com',
      password: user2Password,
      address: 'Galahad Manor, Pure Fields, United Kingdom',
      role: Role.USER,
    },
  });
  console.log(`Created user 2: ${user2.email}`);

  const user3 = await prisma.user.create({
    data: {
      name: 'Sir Gawain The Green Knight',
      email: 'gawain@knights.com',
      password: user3Password,
      address: 'Orkney Isles, Gawain Keep, United Kingdom',
      role: Role.USER,
    },
  });
  console.log(`Created user 3: ${user3.email}`);

  // 5. Submit initial ratings
  // User 1 rates Store 1: 5 stars, Store 2: 4 stars
  await prisma.rating.create({
    data: {
      rating: 5,
      userId: user1.id,
      storeId: store1.id,
    },
  });
  await prisma.rating.create({
    data: {
      rating: 4,
      userId: user1.id,
      storeId: store2.id,
    },
  });

  // User 2 rates Store 1: 4 stars
  await prisma.rating.create({
    data: {
      rating: 4,
      userId: user2.id,
      storeId: store1.id,
    },
  });

  // User 3 rates Store 2: 5 stars
  await prisma.rating.create({
    data: {
      rating: 5,
      userId: user3.id,
      storeId: store2.id,
    },
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
