import { Module } from '@nestjs/common';
import { ActivitySessionService } from './activity-session.service';
import { ActivitySessionController } from './activity-session.controller';
import { PrismaService } from 'src/prisma.service';
import { UserService } from 'src/user/user.service';
import { ActivitiesService } from 'src/activities/activities.service';

@Module({
  providers: [ActivitySessionService, PrismaService, UserService, ActivitiesService],
  controllers: [ActivitySessionController],
  exports: [ActivitySessionService]

})
export class ActivitySessionModule {
  
}
