import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { MeModule } from './me/me.module';
import { SectionModule } from './section/section.module';
import { ActivitiesModule } from './activities/activities.module';
import { ActivitySessionModule } from './activity-session/activity-session.module';
import { CompilationsModule } from './compilations/compilations.module';

@Module({
  imports: [UserModule, AuthModule, ConfigModule.forRoot(), MeModule, SectionModule, ActivitiesModule, ActivitySessionModule, CompilationsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
