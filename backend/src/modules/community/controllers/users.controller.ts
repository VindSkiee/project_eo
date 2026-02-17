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
import { UpdateUserDto } from '../dto/update-user.dto';

// Security Decorators
import { Roles } from '@common/decorators/roles.decorator';
import { ActiveUser } from '@common/decorators/active-user.decorator';
import type { ActiveUserData } from '@common/decorators/active-user.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * =========================================
   * 🚨 PRIORITAS TERTINGGI (STATIC ROUTES) 🚨
   * Taruh route statis (tanpa :id) DI SINI.
   * =========================================
   */

  @Get('me')
  async getMe(@ActiveUser() user: ActiveUserData) {
    
    // Cek apakah sub ada? Atau malah tersimpan di property 'id'?
    const userId = user.id; 

    if (!userId) {
        throw new Error(`User ID is undefined! Isi object user adalah: ${JSON.stringify(user)}`);
    }

    return this.usersService.getMyProfile(userId);
  }

  @Patch('profile')
  updateProfile(
    @ActiveUser() user: ActiveUserData,
    @Body() updateProfileDto: UpdateProfileDto
  ) {
    return this.usersService.updateProfile(user.id, updateProfileDto);
  }

  @Patch('change-password')
  changePassword(
    @ActiveUser() user: ActiveUserData,
    @Body() changePasswordDto: ChangePasswordDto
  ) {
    return this.usersService.changePassword(user.id, changePasswordDto);
  }

  /**
   * =========================================
   * ADMIN ROUTES
   * =========================================
   */

  @Post()
  @Roles(SystemRoleType.ADMIN, SystemRoleType.LEADER)
  create(
    @ActiveUser() requester: ActiveUserData, 
    @Body() createUserDto: CreateUserDto
  ) {
    return this.usersService.create(requester, createUserDto);
  }

  @Get()
  @Roles(SystemRoleType.ADMIN, SystemRoleType.LEADER)
  findAll(
    @ActiveUser() requester: ActiveUserData,
    @Query() filterDto: UserFilterDto
  ) {
    return this.usersService.findAll(requester, filterDto);
  }

  /**
   * =========================================
   * ⚠️ DYNAMIC ROUTES (PARAMETER) ⚠️
   * Taruh route dengan :id DI PALING BAWAH
   * =========================================
   */

  @Delete(':id')
  @Roles(SystemRoleType.ADMIN, SystemRoleType.LEADER)
  remove(
    @Param('id') id: string,
    @ActiveUser() requester: ActiveUserData
  ) {
    return this.usersService.remove(id, requester);
  }

  // 👇 INI YANG TADI MENANGKAP 'me'
  // Sekarang dia aman di bawah, hanya menangkap jika route di atas tidak cocok.
  @Get(':id') 
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @Roles(SystemRoleType.ADMIN, SystemRoleType.LEADER)
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @ActiveUser() requester: ActiveUserData
  ) {
    return this.usersService.update(id, updateUserDto, requester);
  }
}