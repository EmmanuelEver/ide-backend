import { Module } from '@nestjs/common';
import { OutputsService } from './outputs.service';
import { OutputsController } from './outputs.controller';
import { ActivitiesService } from 'src/activities/activities.service';
import { ActivitySessionService } from 'src/activity-session/activity-session.service';
import { UserService } from 'src/user/user.service';
import { PrismaService } from 'src/prisma.service';
import { SectionService } from 'src/section/section.service';

@Module({
  providers: [OutputsService, PrismaService, UserService, ActivitySessionService, ActivitiesService, SectionService],
  controllers: [OutputsController]
})
export class OutputsModule {}
