import { Injectable } from '@nestjs/common';
import { sign, verify } from 'jsonwebtoken';
import { UserService } from 'src/user/user.service';
import RefreshToken from './entities/refreshToken.entity';
import { OAuth2Client } from 'google-auth-library';


@Injectable()
export class AuthService {
    private oauthClient: OAuth2Client; // add this
    constructor(private readonly userService: UserService) {
        const clientId = process.env.GOOGLE_CLIENT_ID;
        this.oauthClient = new OAuth2Client(clientId);
    }

    private async newRefreshAndAccessToken(
        user: any,
        values: { userAgent: string; ipAddress: string }
    ): Promise<{ accessToken: string; refreshToken: string }> {
        const refreshObject = new RefreshToken({ userId: user.id, role: user.role, ...values })

        return {
            refreshToken: refreshObject.sign(),
            accessToken: sign({
                userId: user.id,
                role: user.role
            },
                process.env.ACCESS_SECRET,
                {
                    expiresIn: process.env.ACCESS_TOKEN_EXPIRY
                }
            )
        }
    }

    async login(user: any, values: { userAgent: string; ipAddress: string }): Promise<{ accessToken: string; refreshToken: string }> {
        return this.newRefreshAndAccessToken(user, values);
    }

    async googleLogin(token: string, values: { userAgent: string; ipAddress: string }): Promise<{ accessToken: string; refreshToken: string } | null> {
        const ticket = await this.oauthClient.verifyIdToken({ idToken: token, audience: process.env.GOOGLE_CLIENT_ID })
        const payload = ticket.getPayload()
        const { email, name, profile, picture } = payload
        const user = await this.userService.findByEmail(email);
        if (!user) {
            //create user
            return null
        }
        return this.newRefreshAndAccessToken(user, values);
    }

    async refresh(refreshStr: string): Promise<string | null> {
        const refreshToken = await this.retrieveRefreshToken(refreshStr)

        if (!refreshToken) {
            return null
        }
        const newAccessToken = {
            userId: refreshToken.id,
            role: refreshToken.role
        }

        return sign(newAccessToken, process.env.ACCESS_SECRET, { expiresIn: process.env.ACCESS_TOKEN_EXPIRY })
    }

    private retrieveRefreshToken(
        refreshStr: string,
    ): Promise<RefreshToken | undefined> {
        try {
            // verify is imported from jsonwebtoken like import { sign, verify } from 'jsonwebtoken';
            const decoded = verify(refreshStr, process.env.REFRESH_SECRET);
            if (typeof decoded === 'string') {
                return undefined;
            }
            return Promise.resolve(new RefreshToken());
        } catch (e) {
            return undefined;
        }
    }

    async logout(refreshStr): Promise<void> {
        const refreshToken = await this.retrieveRefreshToken(refreshStr);

        if (!refreshToken) {
            return;
        }
        // delete refreshtoken from db
    }
}
