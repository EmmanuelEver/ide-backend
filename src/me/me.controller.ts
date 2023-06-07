import { Controller, Get, NotFoundException, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { MeService } from './me.service';

@Controller('me')
export class MeController {
    constructor(private readonly meService: MeService) {}

    @UseGuards(JwtAuthGuard)
    @Get()
    async getMe(@Req() req) {
        const userId: string = req.user.userId
        if(!userId) throw new NotFoundException("User not found");
        const userData = await this.meService.getUserData(userId)
        if(userData) {
            return userData
        }
        throw new NotFoundException("User not found");
    }
}
