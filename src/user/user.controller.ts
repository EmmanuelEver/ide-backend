import { Body, Controller, Get, NotFoundException, Param, Put, Req, UseGuards } from '@nestjs/common';
import { User } from '@prisma/client';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { UserService } from './user.service';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async getUsers(@Req() req): Promise<User[]> {
    console.log(req.user)
    const users = await this.userService.getUsers();
    return users
  }

  @UseGuards(JwtAuthGuard)
  @Get(":userId")
  async getUserById(@Param("userId") userId: string): Promise<User> {
    const user = await this.userService.findById(userId)
    if(user) return user
    throw new NotFoundException()
  }

  @UseGuards(JwtAuthGuard)
  @Put(":userId")
  async updateUser(@Param("userId") userId: string, @Body() payload:any): Promise<User> {
    const updatedUser = await this.userService.updateUser(userId, payload)
    return updatedUser
  }

  @UseGuards(JwtAuthGuard)
  @Put("/role/:userId")
  async updateUserRole(@Param("userId") userId: string, @Body() payload:any): Promise<User> {
    const updatedUser = await this.userService.updateUserRole(userId, payload)
    return updatedUser
  }

}
