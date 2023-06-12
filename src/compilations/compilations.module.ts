import { Module } from '@nestjs/common';
import { ActivitiesService } from 'src/activities/activities.service';
import { ActivitySessionService } from 'src/activity-session/activity-session.service';
import { PrismaService } from 'src/prisma.service';
import { ScriptService } from 'src/script-runner.service';
import { UserService } from 'src/user/user.service';
import { CompilationsController } from './compilations.controller';
import { CompilationsService } from './compilations.service';

@Module({
  controllers: [CompilationsController],
  providers: [CompilationsService, PrismaService, UserService, ActivitySessionService, ActivitiesService, ScriptService]
})
export class CompilationsModule {}
