import { 
  BadRequestException, 
  ConflictException, 
  Injectable, 
  NotFoundException, 
  ForbiddenException 
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { SystemRoleType, Prisma } from '@prisma/client';

import { UsersRepository } from '../repositories/users.repository';
import { PrismaService } from '../../../database/prisma.service'; // Sesuaikan path

import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { ChangePasswordDto } from '../dto/change-password.dto'; // Typo 'pasword' di prompt diperbaiki
import { UserFilterDto } from '../dto/user-filter.dto';
import { UpdateUserDto } from '../dto/update-user.dto';

// Import Interface dari Decorator
import { ActiveUserData } from '@common/decorators/active-user.decorator';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly prisma: PrismaService, 
  ) {}

  /**
   * CREATE USER (Updated with Treasurer Validation)
   */
  async create(requester: ActiveUserData, dto: CreateUserDto) {
    // 1. Cek Email Unik (Sama seperti sebelumnya)
    const existingUser = await this.usersRepository.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('Email sudah terdaftar');
    }

    // 2. Logic Group & Security (Sama seperti sebelumnya)
    let targetGroupId = dto.communityGroupId;
    if (requester.roleType === SystemRoleType.ADMIN) {
      targetGroupId = requester.communityGroupId; 
    } else if (requester.roleType === SystemRoleType.LEADER) {
      if (!targetGroupId) throw new BadRequestException('Group ID wajib diisi');
    }

    // --- LOGIC BARU: CEK TREASURER UNIQUENESS ---
    // Jika role yang mau dibuat adalah TREASURER, cek dulu di group target sudah ada belum?
    if (dto.roleType === SystemRoleType.TREASURER) {
      await this.validateTreasurerLimit(targetGroupId!, dto.roleType);
    }
    // ---------------------------------------------

    // 3. Cari Role ID (Sama)
    const role = await this.prisma.role.findUnique({ where: { name: dto.roleType } });
    if (!role) throw new BadRequestException(`Role '${dto.roleType}' tidak valid`);

    // 4. Hash Password (Sama)
    const hashedPassword = await bcrypt.hash(dto.password || 'Warga123!', 10);

    // 5. Create (Sama)
    const newUser = await this.usersRepository.create({
      email: dto.email,
      fullName: dto.fullName,
      password: hashedPassword,
      phone: dto.phone,
      address: dto.address,
      role: { connect: { id: role.id } },
      communityGroup: { connect: { id: targetGroupId } },
      createdBy: { connect: { id: requester.sub } }, 
    });

    return this.sanitizeUser(newUser);
  }

  /**
   * UPDATE USER (Admin/Leader Feature)
   * Fitur untuk koreksi data jika Pak RW salah input.
   */
  async update(id: string, dto: UpdateUserDto, requester: ActiveUserData) {
    // 1. Ambil user lama
    const userToUpdate = await this.usersRepository.findById(id);
    if (!userToUpdate) throw new NotFoundException('User tidak ditemukan');

    // 2. Security Check: Admin RT gak boleh edit user RT lain
    if (requester.roleType === SystemRoleType.ADMIN) {
      if (userToUpdate.communityGroupId !== requester.communityGroupId) {
        throw new ForbiddenException('Anda hanya boleh mengedit warga di RT sendiri');
      }
      // Admin RT juga tidak boleh memindahkan user ke RT lain (Group ID dikunci)
      if (dto.communityGroupId && dto.communityGroupId !== requester.communityGroupId) {
         throw new ForbiddenException('Admin RT tidak boleh memindahkan warga ke RT lain');
      }
    }

    // 3. Logic Validasi Bendahara (Jika Role berubah jadi Treasurer atau Pindah Group)
    const targetGroupId = dto.communityGroupId || userToUpdate.communityGroupId;
    const targetRoleType = dto.roleType || userToUpdate.role.name; // Asumsi role.name = roleType string

    // Jika dia berubah menjadi TREASURER, atau dia TREASURER yg pindah Group
    // Kita cek apakah di tempat baru sudah ada bendahara?
    // Note: Kita exclude user ini sendiri dari hitungan (id not equals)
    if (targetRoleType === SystemRoleType.TREASURER) {
       // Cek apakah role berubah ATAU group berubah?
       if (dto.roleType || dto.communityGroupId) {
          await this.validateTreasurerLimit(targetGroupId, targetRoleType as SystemRoleType, id);
       }
    }

    // 4. Siapkan Data Update
    const dataToUpdate: Prisma.UserUpdateInput = {
      fullName: dto.fullName,
      email: dto.email,
      phone: dto.phone,
      address: dto.address,
    };

    // Jika ganti Role
    if (dto.roleType) {
      const role = await this.prisma.role.findUnique({ where: { name: dto.roleType } });
      if (!role) throw new BadRequestException('Role tidak valid');
      dataToUpdate.role = { connect: { id: role.id } };
    }

    // Jika ganti Group (Pindah RT)
    if (dto.communityGroupId) {
       dataToUpdate.communityGroup = { connect: { id: dto.communityGroupId } };
    }

    // Jika ganti Password (Optional)
    if (dto.password) {
       dataToUpdate.password = await bcrypt.hash(dto.password, 10);
    }

    const updatedUser = await this.usersRepository.update(id, dataToUpdate);
    return this.sanitizeUser(updatedUser);
  }

  /**
   * FIND ALL (Smart Filter)
   */
  async findAll(requester: ActiveUserData, dto: UserFilterDto) {
    // 1. SETUP PAGINATION
    const page = dto.page || 1;
    const limit = dto.limit || 10;

    // 2. BANGUN QUERY FILTER (WHERE)
    const where: Prisma.UserWhereInput = {
      isActive: true, // Default: Hanya tampilkan user yang masih aktif
      AND: [],
    };

    // A. Filter Pencarian Teks
    if (dto.search) {
      (where.AND as any[]).push({
        OR: [
          { fullName: { contains: dto.search, mode: 'insensitive' } },
          { email: { contains: dto.search, mode: 'insensitive' } },
        ],
      });
    }

    // B. Filter Role User
    if (dto.roleType) {
      (where.AND as any[]).push({
        role: { name: dto.roleType },
      });
    }

    // C. FILTER COMMUNITY GROUP (Explicit)
    if (dto.communityGroupId) {
      (where.AND as any[]).push({
        communityGroupId: dto.communityGroupId,
      });
    }

    // D. SECURITY SCOPE (Dari Token)
    if (requester.roleType === SystemRoleType.ADMIN) {
      // Admin RT -> TERKUNCI di Group-nya sendiri
      (where.AND as any[]).push({
        communityGroupId: requester.communityGroupId,
      });
    } 
    // Leader RW -> Bebas

    // 3. EKSEKUSI QUERY KE REPOSITORY
    const [users, total] = await this.usersRepository.findAll({
      skip: (page - 1) * limit,
      take: limit,
      where,
      orderBy: { createdAt: 'desc' },
    });

    // 4. MAPPING DATA (SANITASI & PRIVACY)
    const processedUsers = users.map((user) => {
      // --- LOGIC PRIVACY WALLET ---
      const userView = { ...user };
      
      // Cek Permission lihat Wallet:
      const isRequesterRW = requester.roleType === SystemRoleType.LEADER;
      const isSameGroup = requester.communityGroupId === user.communityGroupId;

      // Jika BUKAN RW dan BEDA Group, hapus walletnya
      if (!isRequesterRW && !isSameGroup) {
        if (userView.communityGroup) {
          // @ts-ignore
          delete (userView.communityGroup as any).wallet;
        }
      }

      return this.sanitizeUser(userView);
    });

    // 5. RETURN FORMAT PAGINATION
    return {
      data: processedUsers,
      meta: {
        total,
        page,
        limit,
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  /**
   * FIND ONE (Profile)
   */
  async findOne(id: string) {
    const user = await this.usersRepository.findById(id);
    if (!user) throw new NotFoundException('User tidak ditemukan');
    return this.sanitizeUser(user);
  }

  /**
   * UPDATE PROFILE (Self Service)
   */
  async updateProfile(userId: string, dto: UpdateProfileDto) {
    if (dto.email) {
      const existing = await this.usersRepository.findByEmail(dto.email);
      if (existing && existing.id !== userId) {
        throw new ConflictException('Email sudah digunakan user lain');
      }
    }

    const updatedUser = await this.usersRepository.update(userId, {
      fullName: dto.fullName,
      email: dto.email,
      phone: dto.phone,
      address: dto.address,
    });

    return this.sanitizeUser(updatedUser);
  }

  /**
   * CHANGE PASSWORD
   */
  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.usersRepository.findById(userId);
    if (!user) throw new NotFoundException('User tidak ditemukan');

    const isMatch = await bcrypt.compare(dto.currentPassword, user.password);
    if (!isMatch) {
      throw new BadRequestException('Password lama salah');
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);

    await this.usersRepository.update(userId, {
      password: hashedPassword,
    });

    return { message: 'Password berhasil diperbarui' };
  }

  /**
   * SOFT DELETE USER
   * Logic: Admin RT hanya boleh hapus warga RT sendiri. Leader boleh hapus siapa saja.
   */
  async remove(userIdToDelete: string, requester: ActiveUserData) {
    // 1. Ambil data user yang mau dihapus
    const userToDelete = await this.usersRepository.findById(userIdToDelete);
    if (!userToDelete) {
      throw new NotFoundException('User tidak ditemukan');
    }

    // 2. Security Check: Admin RT gak boleh hapus warga RT tetangga
    if (requester.roleType === SystemRoleType.ADMIN) {
      if (userToDelete.communityGroupId !== requester.communityGroupId) {
        throw new ForbiddenException('Anda tidak berhak menghapus warga dari RT lain');
      }
    }

    // 3. Lakukan Soft Delete
    return this.usersRepository.softDelete(userIdToDelete);
  }

  /**
   * HELPER: Buang field sensitif
   */
  private sanitizeUser(user: any) {
    if (!user) return null;
    const { password, ...result } = user;
    return result;
  }

  /**
   * HELPER: Validasi 1 Bendahara per Group
   */
  private async validateTreasurerLimit(groupId: number, roleType: SystemRoleType, excludeUserId?: string) {
    const count = await this.usersRepository.count({
      communityGroupId: groupId,
      role: { name: roleType }, // Mencari yang role-nya TREASURER
      isActive: true,
      // Jika excludeUserId ada (saat update), jangan hitung diri sendiri
      id: excludeUserId ? { not: excludeUserId } : undefined, 
    });

    if (count > 0) {
      throw new ConflictException(
        `Grup ini sudah memiliki Bendahara (Treasurer). Satu grup hanya boleh memiliki 1 Bendahara.`
      );
    }
  }
}