import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { UserService } from 'src/user/user.service';
import { PrismaService } from 'src/prisma.service';

@Module({
  providers: [DashboardService, PrismaService, UserService],
  controllers: [DashboardController]
})
export class DashboardModule {}
