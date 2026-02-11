import { PrismaClient, SystemRoleType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // 1. Buat Roles (Master Data)
  const roles = [
    { name: 'Ketua RW', type: SystemRoleType.LEADER },
    { name: 'Ketua RT', type: SystemRoleType.ADMIN },
    { name: 'Bendahara', type: SystemRoleType.TREASURER },
    { name: 'Warga', type: SystemRoleType.RESIDENT },
  ];

  for (const r of roles) {
    await prisma.role.upsert({
      where: { name: r.name },
      update: {},
      create: { name: r.name, type: r.type },
    });
  }

  // 2. Buat Community Groups (RT/RW)
  const rwGroup = await prisma.communityGroup.create({
    data: { name: 'RW 05 Center', type: 'RW' },
  });

  const rt01 = await prisma.communityGroup.create({
    data: { name: 'RT 01', type: 'RT' },
  });

  const rt02 = await prisma.communityGroup.create({
    data: { name: 'RT 02', type: 'RT' },
  });

  // 3. Buat User: LEADER (Super Admin lokal)
  const hashPassword = await bcrypt.hash('123456', 10); // Password default

  // Ambil ID Role
  const leaderRole = await prisma.role.findUnique({ where: { name: 'Ketua RW' } });
  const adminRole = await prisma.role.findUnique({ where: { name: 'Ketua RT' } });
  const residentRole = await prisma.role.findUnique({ where: { name: 'Warga' } });

  // Create Pak RW
  await prisma.user.create({
    data: {
      email: 'rw@warga.id',
      password: hashPassword,
      fullName: 'Bapak Ketua RW',
      roleId: leaderRole!.id,
      communityGroupId: rwGroup.id,
    },
  });

  // Create Pak RT 01
  await prisma.user.create({
    data: {
      email: 'rt01@warga.id',
      password: hashPassword,
      fullName: 'Bapak RT Satu',
      roleId: adminRole!.id,
      communityGroupId: rt01.id,
    },
  });

  // Create Warga Dummy di RT 01
  await prisma.user.create({
    data: {
      email: 'warga01@warga.id',
      password: hashPassword,
      fullName: 'Udin Warga',
      roleId: residentRole!.id,
      communityGroupId: rt01.id,
    },
  });

  console.log('Seeding selesai! Login: rw@warga.id / 123456');
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());