import { Injectable } from '@nestjs/common';
import { Prisma, Role, User } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class UserService {
    constructor(private prisma: PrismaService) {}

    async getUsers(): Promise<User[]> {
        return this.prisma.user.findMany()
    }

    async createUser(user: Prisma.UserCreateInput): Promise<User> {
        const newUser = await this.prisma.user.create({
            data: {
              ...user,
              student: {
                create: {},
              },
            },
            include: {
              student: true,
            },
          });
        return newUser
    }

    async findByRole(role: Role):Promise<User[]> {
        const userData = this.prisma.user.findMany({where: {role: role}})
        if(userData) {
            return Promise.resolve(userData)
        }
        return null
    }

    async findById(userId: string): Promise<User | null> {
        const userData = this.prisma.user.findUnique({where: {id: userId}})
        if(userData) {
            return Promise.resolve(userData)
        }
        return null
    }

    async findByEmail(email: string): Promise<User | null> {
        const userData = this.prisma.user.findUnique({where: {email}})
        if(userData) {
            return Promise.resolve(userData)
        }
        return null
    }

    async updateUser(userId: string, payload: any): Promise<User | null>{
        const userData = await this.prisma.user.findUnique({where: {id: userId}})
        if(userData) {
            const updatedData = await this.prisma.user.update({
                where: {
                    id: userId
                },
                data: {
                    ...payload,
                }
            })
            return updatedData
        }
        return null
    }

    async updateUserRole(userId: string, payload: any): Promise<User | null>{
        const userData = await this.prisma.user.findUnique({where: {id: userId}})
        if(payload.role === userData.role) return userData
        if(userData) {
            const updatedUser = await this.prisma.user.update({
                where: {
                  id: userId,
                },
                data: {
                  role: payload?.role,
                  student: {
                    ...((payload?.role !== 'STUDENT' && userData.role === 'STUDENT') && { delete: true }),
                  },
                  teacher: {
                    ...((payload?.role !== 'TEACHER' && userData.role === 'TEACHER') && { delete: true }),
                  },
                  admin: {
                    ...((payload?.role !== 'ADMIN' && userData.role === 'ADMIN') && { delete: true }),
                  },
                  ...(payload?.role === 'STUDENT' && {
                    student: {
                      create: {},
                    },
                  }),
                  ...(payload?.role === 'TEACHER' && {
                    teacher: {
                      create: {},
                    },
                  }),
                  ...(payload?.role === 'ADMIN' && {
                    admin: {
                      create: {},
                    },
                  }),
                },
                include: {
                  student: payload?.role === 'STUDENT',
                  teacher: payload?.role === 'TEACHER',
                  admin: payload?.role === 'ADMIN',
                },
            });
            return updatedUser
        }
        return null
    }
}
