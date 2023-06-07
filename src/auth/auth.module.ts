import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from 'src/user/user.module';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RefreshTokenStrategy } from './strategies/jwt-refresh.strategy';
import { PrismaService } from 'src/prisma.service';

@Module({
  imports: [UserModule],
  providers: [AuthService, JwtStrategy, RefreshTokenStrategy, PrismaService],
  controllers: [AuthController]
})
export class AuthModule {}
