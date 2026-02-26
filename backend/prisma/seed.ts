import { PrismaClient, SystemRoleType, TransactionType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// ============================================================
// RESIDENT NAMES PER RT
// ============================================================

const residentNames: Record<number, string[]> = {
  1: [
    'Andi Wijaya',
    'Bambang Supriyadi',
    'Candra Kusuma',
    'Dian Permata',
    'Eko Prasetyo',
    'Fitri Handayani',
    'Galih Nugroho',
    'Heni Susanti',
    'Irwan Syahputra',
    'Joko Purnomo',
  ],
  2: [
    'Mulyadi Suharto',
    'Nina Kartika',
    'Oki Firmansyah',
    'Putri Rahmawati',
    'Qori Abdillah',
    'Rini Wahyuni',
    'Surya Darma',
    'Teti Marlina',
    'Umar Bakri',
    'Vera Listiani',
  ],
  3: [
    'Zainal Abidin',
    'Agus Salim',
    'Basuki Rahmat',
    'Cahyo Wibowo',
    'Dodi Kuswara',
    'Endah Purwaningrum',
    'Fajar Sidiq',
    'Gita Puspita',
    'Hamid Abdullah',
    'Ida Ayu Ketut',
  ],
  4: [
    'Leo Pradipta',
    'Maya Sari',
    'Nandi Wijoseno',
    'Olga Putri',
    'Pandu Aditya',
    'Rudi Hermawan',
    'Sari Wulandari',
    'Tino Supriatna',
    'Umi Kulsum',
    'Vandra Kusuma',
  ],
  5: [
    'Yudi Setiawan',
    'Zara Amelia',
    'Angga Trisnawan',
    'Bunga Citra',
    'Cici Paramida',
    'Deden Supriadi',
    'Erni Susanto',
    'Farhan Ramadhan',
    'Gilang Pratama',
    'Hana Salsabila',
  ],
};

const rtStaffNames = [
  { leader: 'Ahmad Fauzi',    treasurer: 'Dewi Lestari'    },
  { leader: 'Kurniawan Hadi', treasurer: 'Lilis Suryani'   },
  { leader: 'Wahyu Saputra',  treasurer: 'Yuni Pratiwi'    },
  { leader: 'Jefri Utama',    treasurer: 'Kiki Amalia'     },
  { leader: 'Vino Valentino', treasurer: 'Wida Hendrawati' },
];

// ============================================================
// CLEAN DATABASE (FK-safe order)
// ============================================================

async function cleanDatabase() {
  await prisma.eventExpense.deleteMany();
  await prisma.eventParticipant.deleteMany();
  await prisma.eventStatusHistory.deleteMany();
  await prisma.eventApproval.deleteMany();
  await prisma.fundRequest.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.contribution.deleteMany();
  await prisma.paymentGatewayTx.deleteMany();
  await prisma.event.deleteMany();
  await prisma.approvalRule.deleteMany();
  await prisma.duesRule.deleteMany();
  await prisma.roleLabelSetting.deleteMany();
  await prisma.user.deleteMany();
  await prisma.wallet.deleteMany();
  await prisma.communityGroup.deleteMany();
  await prisma.role.deleteMany();
  console.log('   ✓ Database bersih.');
}

// ============================================================
// MAIN
// ============================================================

async function main() {
  console.log('🧹 Menghapus seluruh data lama...');
  await cleanDatabase();

  console.log('🌱 Memulai Seeding data baru...');

  const password = await bcrypt.hash('123456', 10);

  // ----------------------------------------------------------
  // 1. ROLES
  // ----------------------------------------------------------
  console.log('  → Membuat Role...');

  const rolesData = [
    { name: 'LEADER',    type: SystemRoleType.LEADER    },
    { name: 'ADMIN',     type: SystemRoleType.ADMIN     },
    { name: 'TREASURER', type: SystemRoleType.TREASURER },
    { name: 'RESIDENT',  type: SystemRoleType.RESIDENT  },
  ];

  const roleMap = new Map<string, number>();
  for (const r of rolesData) {
    const role = await prisma.role.create({ data: r });
    roleMap.set(r.name, role.id);
  }

  // ----------------------------------------------------------
  // 2. COMMUNITY GROUPS
  // ----------------------------------------------------------
  console.log('  → Membuat Community Groups (RW 01 + RT 01–05)...');

  const rwGroup = await prisma.communityGroup.create({
    data: {
      name: 'RW 01',
      type: 'RW',
      wallet: { create: { balance: 20_000_000 } },
    },
    include: { wallet: true },
  });

  const rtGroups: Array<typeof rwGroup> = [];
  for (let i = 1; i <= 5; i++) {
    const rt = await prisma.communityGroup.create({
      data: {
        name: `RT 0${i}`,
        type: 'RT',
        parentId: rwGroup.id,
        wallet: { create: { balance: 10_000_000 } },
      },
      include: { wallet: true },
    });
    rtGroups.push(rt);
  }

  // ----------------------------------------------------------
  // 3. USERS – RW 01
  // ----------------------------------------------------------
  console.log('  → Membuat User RW 01 (Ketua LEADER + Bendahara TREASURER)...');

  const ketuaRW = await prisma.user.create({
    data: {
      email:           'ketua.rw01@warga.id',
      password,
      fullName:        'Budi Santoso',
      phone:           '08111000001',
      roleId:          roleMap.get('LEADER')!,
      communityGroupId: rwGroup.id,
    },
  });

  await prisma.user.create({
    data: {
      email:           'bendahara.rw01@warga.id',
      password,
      fullName:        'Siti Rahayu',
      phone:           '08111000002',
      roleId:          roleMap.get('TREASURER')!,
      communityGroupId: rwGroup.id,
    },
  });

  // ----------------------------------------------------------
  // 4. USERS – RT 01–05 (Ketua ADMIN + Bendahara TREASURER + 10 Warga)
  // ----------------------------------------------------------
  const rtAdminIds: string[] = [];

  for (let i = 0; i < 5; i++) {
    const rtNum   = i + 1;
    const rtGroup = rtGroups[i];
    const names   = rtStaffNames[i];

    console.log(`  → Membuat User RT 0${rtNum} (ADMIN + TREASURER + 10 RESIDENT)...`);

    // Ketua RT — role ADMIN
    const ketua = await prisma.user.create({
      data: {
        email:           `ketua.rt0${rtNum}@warga.id`,
        password,
        fullName:        names.leader,
        phone:           `081120${String(rtNum).padStart(5, '0')}`,
        roleId:          roleMap.get('ADMIN')!,
        communityGroupId: rtGroup.id,
      },
    });
    rtAdminIds.push(ketua.id);

    // Bendahara RT — role TREASURER
    await prisma.user.create({
      data: {
        email:           `bendahara.rt0${rtNum}@warga.id`,
        password,
        fullName:        names.treasurer,
        phone:           `081130${String(rtNum).padStart(5, '0')}`,
        roleId:          roleMap.get('TREASURER')!,
        communityGroupId: rtGroup.id,
      },
    });

    // 10 Warga — role RESIDENT
    for (let j = 0; j < 10; j++) {
      const seq = String(j + 1).padStart(2, '0');
      await prisma.user.create({
        data: {
          email:           `warga.rt0${rtNum}.${seq}@warga.id`,
          password,
          fullName:        residentNames[rtNum][j],
          phone:           `0812${rtNum}${String(j + 1).padStart(6, '0')}`,
          roleId:          roleMap.get('RESIDENT')!,
          communityGroupId: rtGroup.id,
        },
      });
    }
  }

  // ----------------------------------------------------------
  // 5. INITIAL WALLET TRANSACTIONS (audit trail saldo awal)
  // ----------------------------------------------------------
  console.log('  → Mencatat transaksi saldo awal wallet...');

  if (rwGroup.wallet) {
    await prisma.transaction.create({
      data: {
        walletId:    rwGroup.wallet.id,
        amount:      20_000_000,
        type:        TransactionType.CREDIT,
        description: 'Saldo awal kas RW 01',
        referenceCode: 'INIT-RW01',
        createdById: ketuaRW.id,
      },
    });
  }

  for (let i = 0; i < 5; i++) {
    const rtGroup = rtGroups[i];
    const rtNum   = i + 1;
    if (rtGroup.wallet) {
      await prisma.transaction.create({
        data: {
          walletId:    rtGroup.wallet.id,
          amount:      10_000_000,
          type:        TransactionType.CREDIT,
          description: `Saldo awal kas RT 0${rtNum}`,
          referenceCode: `INIT-RT0${rtNum}`,
          createdById: rtAdminIds[i],
        },
      });
    }
  }

  // ----------------------------------------------------------
  // SUMMARY
  // ----------------------------------------------------------
  const [totalUsers, totalGroups, totalWallets] = await Promise.all([
    prisma.user.count(),
    prisma.communityGroup.count(),
    prisma.wallet.count(),
  ]);

  console.log('\n✅ Seeding selesai!');
  console.log(`   Community Groups : ${totalGroups} (1 RW + 5 RT)`);
  console.log(`   Total Users      : ${totalUsers}`);
  console.log(`     • RW 01        : 2  (1 Ketua + 1 Bendahara)`);
  console.log(`     • Per RT       : 12 (1 Ketua + 1 Bendahara + 10 Warga)`);
  console.log(`     • 5 RT total   : 60`);
  console.log(`   Wallets          : ${totalWallets}`);
  console.log(`     • RW 01        : Rp 20.000.000`);
  console.log(`     • RT 01–05     : Rp 10.000.000 / RT`);
  console.log(`   Default password : 123456`);
}

main()
  .catch((e) => {
    console.error('❌ Error saat seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
