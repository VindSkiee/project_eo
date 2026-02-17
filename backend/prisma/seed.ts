import { PrismaClient, SystemRoleType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function main() {
  console.log('🌱 Starting Seeding (Full Team)...');

  // ==========================================
  // 1. MASTER ROLES
  // ==========================================
  const rolesData = [
    { name: 'ADMIN', type: SystemRoleType.ADMIN },
    { name: 'LEADER', type: SystemRoleType.LEADER },
    { name: 'TREASURER', type: SystemRoleType.TREASURER },
    { name: 'RESIDENT', type: SystemRoleType.RESIDENT },
  ];

  const roleMap = new Map<string, number>();

  for (const r of rolesData) {
    const role = await prisma.role.upsert({
      where: { name: r.name },
      update: {},
      create: {
        name: r.name,
        type: r.type,
      },
    });

    roleMap.set(r.name, role.id);
  }

  // ==========================================
  // 2. COMMUNITY GROUPS (RW / RT)
  // ==========================================

  const rwGroup = await prisma.communityGroup.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: 'RW 05 Center',
      type: 'RW',
      wallet: { create: { balance: 0 } },
    },
  });

  const rt01 = await prisma.communityGroup.upsert({
    where: { id: 2 },
    update: {},
    create: {
      name: 'RT 01',
      type: 'RT',
      parentId: rwGroup.id,
      wallet: { create: { balance: 0 } },
    },
  });

  // ==========================================
  // 3. USERS
  // ==========================================

  const password = await bcrypt.hash('123456', 10);

  // ADMIN RW
  await prisma.user.upsert({
    where: { email: 'rw@warga.id' },
    update: {},
    create: {
      email: 'rw@warga.id',
      fullName: 'Bapak Ketua RW',
      password,
      roleId: roleMap.get('ADMIN')!,
      communityGroupId: rwGroup.id,
    },
  });

  // LEADER RT
  await prisma.user.upsert({
    where: { email: 'rt01@warga.id' },
    update: {},
    create: {
      email: 'rt01@warga.id',
      fullName: 'Bapak Ketua RT',
      password,
      roleId: roleMap.get('LEADER')!,
      communityGroupId: rt01.id,
    },
  });

  // TREASURER RW
  await prisma.user.upsert({
    where: { email: 'bendahara.rw@warga.id' },
    update: {},
    create: {
      email: 'bendahara.rw@warga.id',
      fullName: 'Ibu Bendahara RW',
      password,
      roleId: roleMap.get('TREASURER')!,
      communityGroupId: rwGroup.id,
    },
  });

  // RESIDENT
  await prisma.user.upsert({
    where: { email: 'warga01@warga.id' },
    update: {},
    create: {
      email: 'warga01@warga.id',
      fullName: 'Udin Warga',
      password,
      roleId: roleMap.get('RESIDENT')!,
      communityGroupId: rt01.id,
    },
  });

  console.log('✅ Seeding selesai! 4 akun siap.');
}

main()
  .catch((e) => {
    console.error('❌ Error Seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
