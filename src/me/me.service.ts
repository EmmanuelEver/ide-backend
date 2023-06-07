import { Injectable } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { Me } from './entities/me.entity';

@Injectable()
export class MeService {
    constructor(private readonly userService: UserService) {}

    async getUserData(userId: string): Promise <Me | null> {
        
        const user = await this.userService.findById(userId)
        if(!user) {
            return null
        }
        return Promise.resolve(user)
    }

}
