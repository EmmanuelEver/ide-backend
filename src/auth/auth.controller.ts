import { Body, Controller, Delete, HttpException, HttpStatus, Ip, Post, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { GoogleTokenDto } from './dto/googleToken.dto';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}


    @Post("google-login")
    async googleLogin(@Req() request, @Ip() ipAddress: string, @Body() body: GoogleTokenDto) {
        const result = await this.authService.googleLogin(body.token, {ipAddress, userAgent: request.headers['user-agent']})
        if(result) {
            return result
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

    @Post("refresh") 
    async refreshToken(@Body() body: any) {
        return this.authService.refresh(body.refreshToken)
    }

    @Delete('logout')
    async logout(@Body() body: any) {
        return this.authService.logout(body.refreshToken);
    }
}
