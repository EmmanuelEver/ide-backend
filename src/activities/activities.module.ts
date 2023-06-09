import { Module } from '@nestjs/common';
import { ActivitiesService } from './activities.service';
import { ActivitiesController } from './activities.controller';
import { PrismaService } from 'src/prisma.service';
import { UserService } from 'src/user/user.service';

@Module({
  providers: [ActivitiesService, PrismaService, UserService],
  controllers: [ActivitiesController]
})
export class ActivitiesModule {}
