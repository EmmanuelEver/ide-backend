import { Injectable } from '@nestjs/common';
import { User } from './entities/user.entity';

@Injectable()
export class UserService {
    getHello(): string {
        return 'Hello World!';
    }

    findByEmail(email: string): Promise<User | undefined> {
        const user = {id: "", email, name: "", profileUrl: "", role: ""};

        if(user) {
            return Promise.resolve(user)
        }
        return null
    }
}
