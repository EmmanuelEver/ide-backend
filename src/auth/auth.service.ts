import { Injectable } from '@nestjs/common';
import { sign, verify } from 'jsonwebtoken';
import { UserService } from 'src/user/user.service';
import RefreshToken from './entities/refreshToken.entity';
import { OAuth2Client } from 'google-auth-library';
import { PrismaService } from 'src/prisma.service';


@Injectable()
export class AuthService {
    private oauthClient: OAuth2Client; // add this
    constructor(private readonly userService: UserService, private prisma: PrismaService) {
        const clientId = process.env.GOOGLE_CLIENT_ID;
        this.oauthClient = new OAuth2Client(clientId);
    }

    private async newRefreshAndAccessToken(
        user: any,
        values: { userAgent: string; ipAddress: string }
    ): Promise<{ accessToken: string; refreshToken: string }> {
        const userId: string = user.id
        const refreshObject = new RefreshToken({ userId: userId, role: user.role, ...values })
        const refreshToken = refreshObject.sign()
        await this.prisma.refreshToken.create({
            data: {
                token: refreshToken,
                userId: userId,
                expiresAt: new Date(new Date().getTime() + (24 * 60 * 60 * 1000))
            }
        })
        return {
            refreshToken,
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

    private getRefreshTokenObject(refreshStr: string,
    ): Promise<RefreshToken | undefined> {
        try {
            // verify is imported from jsonwebtoken like import { sign, verify } from 'jsonwebtoken';
            const decoded: any = verify(refreshStr, process.env.REFRESH_SECRET);
            if (typeof decoded === 'string') {
                return undefined;
            }
            return decoded;
        } catch (e) {
            return undefined;
        }
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

    async login(user: any, values: { userAgent: string; ipAddress: string }): Promise<{ accessToken: string; refreshToken: string }> {
        return this.newRefreshAndAccessToken(user, values);
    }

    async googleLogin(token: string, values: { userAgent: string; ipAddress: string }): Promise<{ accessToken: string; refreshToken: string } | null> {
        const ticket = await this.oauthClient.verifyIdToken({ idToken: token, audience: process.env.GOOGLE_CLIENT_ID })
        const payload = ticket.getPayload()
        const { email, name, picture } = payload
        // const user = { email, name, picture }
        const user = await this.userService.findByEmail(email);
        if (!user) {
            //create user
            const newUser = await this.userService.createUser({ email, name, profileUrl: picture })
            return this.newRefreshAndAccessToken(newUser, values)
        }
        return this.newRefreshAndAccessToken(user, values);
    }

    //add function to check if refresh token is in db

    async refresh(refreshStr: string): Promise<string | null> {
        //check refresh if token is in db
        const refreshTokenObj = await this.getRefreshTokenObject(refreshStr)
        if (!refreshTokenObj) {
            await this.prisma.refreshToken.delete({where: {token: refreshStr}})
            return null
        }
        const tokenInDb = await this.prisma.refreshToken.findUnique({where: {token: refreshStr}})
        if (!tokenInDb) {
            return null
        }
        const newAccessToken = {
            userId: refreshTokenObj.userId,
            role: refreshTokenObj.role
        }
        return sign(newAccessToken, process.env.ACCESS_SECRET, { expiresIn: process.env.ACCESS_TOKEN_EXPIRY })
    }

    async logout(userId: string): Promise<boolean | null> {
        try {
            await this.prisma.refreshToken.deleteMany({
                where: {
                    userId:userId
                }
            })
            return true
        } catch (error) {
            return null
        }
    }
}
