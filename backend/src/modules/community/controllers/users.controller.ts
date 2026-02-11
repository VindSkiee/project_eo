import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  Query,
} from '@nestjs/common';
import { SystemRoleType } from '@prisma/client';

// Services & DTOs
import { UsersService } from '../services/users.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { UserFilterDto } from '../dto/user-filter.dto';

// Security Decorators
import { Roles } from '@common/decorators/roles.decorator';
import { ActiveUser } from '@common/decorators/active-user.decorator';
import type { ActiveUserData } from '@common/decorators/active-user.decorator';
import { UpdateUserDto } from '../dto/update-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * =========================================
   * ADMIN & LEADER AREA (Manajemen Warga)
   * =========================================
   */

  /**
   * CREATE USER (Mendaftarkan Warga)
   * Akses: ADMIN (RT) & LEADER (RW)
   */
  @Post()
  @Roles(SystemRoleType.ADMIN, SystemRoleType.LEADER)
  create(
    @ActiveUser() requester: ActiveUserData, 
    @Body() createUserDto: CreateUserDto
  ) {
    return this.usersService.create(requester, createUserDto);
  }

  /**
   * GET ALL USERS (Daftar Warga)
   * Akses: ADMIN (RT) & LEADER (RW)
   * Service otomatis memfilter agar RT tidak melihat warga RT lain.
   */
  @Get()
  @Roles(SystemRoleType.ADMIN, SystemRoleType.LEADER)
  findAll(
    @ActiveUser() requester: ActiveUserData,
    @Query() filterDto: UserFilterDto
  ) {
    return this.usersService.findAll(requester, filterDto);
  }

  /**
   * DELETE USER (Soft Delete)
   * Akses: ADMIN (RT) & LEADER (RW)
   */
  @Delete(':id')
  @Roles(SystemRoleType.ADMIN, SystemRoleType.LEADER)
  remove(
    @Param('id') id: string,
    @ActiveUser() requester: ActiveUserData
  ) {
    return this.usersService.remove(id, requester);
  }

  /**
   * =========================================
   * SELF SERVICE AREA (Akun Pribadi)
   * =========================================
   */

  /**
   * UPDATE PROFILE (Diri Sendiri)
   * Akses: Semua User Login
   * Note: Kita pakai `user.sub` dari token, bukan `:id` dari URL agar aman.
   */
  @Patch('profile')
  updateProfile(
    @ActiveUser() user: ActiveUserData,
    @Body() updateProfileDto: UpdateProfileDto
  ) {
    return this.usersService.updateProfile(user.sub, updateProfileDto);
  }

  /**
   * CHANGE PASSWORD (Diri Sendiri)
   * Akses: Semua User Login
   */
  @Patch('change-password')
  changePassword(
    @ActiveUser() user: ActiveUserData,
    @Body() changePasswordDto: ChangePasswordDto
  ) {
    return this.usersService.changePassword(user.sub, changePasswordDto);
  }

  /**
   * =========================================
   * GENERAL ACCESS
   * =========================================
   */

  /**
   * GET ONE USER (Detail Profile)
   * Akses: Semua User Login
   * Gunanya: Untuk melihat detail tetangga atau profile sendiri via ID.
   * Note: Password disembunyikan oleh service.
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  /**
   * UPDATE USER BY ADMIN (Koreksi Data)
   * Akses: ADMIN (RT) & LEADER (RW)
   */
  @Patch(':id') // Hati-hati jangan tertukar dengan @Patch('profile')
  @Roles(SystemRoleType.ADMIN, SystemRoleType.LEADER)
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @ActiveUser() requester: ActiveUserData
  ) {
    return this.usersService.update(id, updateUserDto, requester);
  }
}