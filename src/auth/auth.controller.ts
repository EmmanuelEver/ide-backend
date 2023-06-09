import { Body, Controller, Delete, HttpException, HttpStatus, Ip, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { GoogleTokenDto } from './dto/googleToken.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RefreshAuthGuard } from './guards/jwt-refresh.guard';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post("google-login")
    async googleLogin(@Req() request, @Res({ passthrough: true }) res: Response, @Ip() ipAddress: string, @Body() body: GoogleTokenDto) {
        const data = await this.authService.googleLogin(body.token, {ipAddress, userAgent: request.headers['user-agent']})
        if(data) {
            const { accessToken, refreshToken } = data
            res.cookie("refreshToken", refreshToken, {
                httpOnly: true,
                secure: true,
                sameSite: 'none',
                expires: new Date(Date.now() + (1 * 24 * 60 * 60 * 1000))
            })
            .send({accessToken})
        } else {
            throw new HttpException(
                {
                  status: HttpStatus.UNAUTHORIZED,
                  error: 'Error while logging in with google',
                },
                HttpStatus.UNAUTHORIZED,
              );
        }
    }

    @UseGuards(RefreshAuthGuard)
    @Post("refresh") 
    async refreshToken(@Req() req) {
        const accessToken = await this.authService.refresh(req.user.refreshToken)
        return {accessToken}
    }

    @UseGuards(JwtAuthGuard)
    @Post('logout')
    async logout(@Res() res: Response, @Req() req) {
        try {
            await this.authService.logout(req.user.userId);
            res.clearCookie("refreshToken", {
                httpOnly: true,
                secure: true,
                sameSite: 'none',
                expires: new Date(new Date().getTime() + (24 * 60 * 60 * 1000))
            })
            .status(200)
            .send("User logged out")
        } catch (error) {
            res.clearCookie("refreshToken", {
                httpOnly: true,
                secure: true,
                sameSite: 'none',
                expires: new Date()
            })
            .status(404)
            .send("User logged out")
        }
    }
}
