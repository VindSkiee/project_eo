import { PrismaClient, SystemRoleType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

// Inisialisasi Prisma Client Standard (Versi 5)
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function main() {
  console.log('🌱 Starting Seeding (Full Team)...');

  // ==========================================
  // 1. MASTER ROLES
  // ==========================================
  const rolesData = [
    { name: 'Ketua RW', type: SystemRoleType.LEADER },
    { name: 'Ketua RT', type: SystemRoleType.ADMIN },
    { name: 'Bendahara RW', type: SystemRoleType.TREASURER },
    { name: 'Bendahara RT', type: SystemRoleType.TREASURER },
    { name: 'Warga', type: SystemRoleType.RESIDENT },
  ];

  const roleMap = new Map<string, number>();

  for (const r of rolesData) {
    const role = await prisma.role.upsert({
      where: { name: r.name },
      update: {},
      create: { name: r.name, type: r.type },
    });
    roleMap.set(r.name, role.id);
  }

  // ==========================================
  // 2. COMMUNITY GROUPS (RT/RW)
  // ==========================================
  
  // RW 05 Center
  const rwGroup = await prisma.communityGroup.upsert({
    where: { id: 1 }, // Asumsi ID 1, atau bisa pakai unique name jika ada
    update: {},
    create: { 
      name: 'RW 05 Center', 
      type: 'RW',
      wallet: { create: { balance: 0 } }
    },
  });

  // RT 01
  const rt01 = await prisma.communityGroup.upsert({
    where: { id: 2 },
    update: {},
    create: { 
      name: 'RT 01', 
      type: 'RT',
      parentId: rwGroup.id,
      wallet: { create: { balance: 0 } }
    },
  });

  // ==========================================
  // 3. USERS (4 AKUN UTAMA)
  // ==========================================
  const password = await bcrypt.hash('123456', 10);

  // 1. KETUA RW (rw@warga.id)
  await prisma.user.upsert({
    where: { email: 'rw@warga.id' },
    update: {}, // Jika sudah ada, jangan lakukan apa-apa
    create: {
      email: 'rw@warga.id',
      fullName: 'Bapak Ketua RW',
      password,
      roleId: roleMap.get('Ketua RW')!,
      communityGroupId: rwGroup.id,
    },
  });

  // 2. KETUA RT (rt01@warga.id)
  await prisma.user.upsert({
    where: { email: 'rt01@warga.id' },
    update: {},
    create: {
      email: 'rt01@warga.id',
      fullName: 'Bapak RT Satu',
      password,
      roleId: roleMap.get('Ketua RT')!,
      communityGroupId: rt01.id,
    },
  });

  // 3. BENDAHARA RW (bendahara.rw@warga.id) <-- YANG TADI HILANG
  await prisma.user.upsert({
    where: { email: 'bendahara.rw@warga.id' },
    update: {},
    create: {
      email: 'bendahara.rw@warga.id',
      fullName: 'Ibu Bendahara RW',
      password,
      roleId: roleMap.get('Bendahara RW')!,
      communityGroupId: rwGroup.id,
    },
  });

  // 4. WARGA BIASA (warga01@warga.id) <-- YANG TADI HILANG
  await prisma.user.upsert({
    where: { email: 'warga01@warga.id' },
    update: {},
    create: {
      email: 'warga01@warga.id',
      fullName: 'Udin Warga',
      password,
      roleId: roleMap.get('Warga')!,
      communityGroupId: rt01.id,
    },
  });

  console.log('✅ Seeding Selesai! (4 Akun Siap)');
}

main()
  .catch((e) => {
    console.error('❌ Error Seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });