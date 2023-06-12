import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Prisma, Role, Student, User } from '@prisma/client';
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
        const userData = await this.prisma.user.findMany({where: {role: role}})
        if(!userData) throw new HttpException("User not found", HttpStatus.NOT_FOUND)
        return userData
    }

    async findById(userId: string): Promise<User | null> {
        const userData = await this.prisma.user.findUnique({where: {id: userId}})
        if(!userData) throw new HttpException("User not found", HttpStatus.NOT_FOUND)
        return userData
    }

    async findStudentByUserId(userId: string): Promise<Student | null> {
      const userData = await this.prisma.student.findUnique({where: {userId}, include: {user: true}})
      if(!userData) throw new HttpException("User not found", HttpStatus.NOT_FOUND)
      return userData
    }
    
    async findStudentById(studentId: string): Promise<Student | null> {
      const userData = await this.prisma.student.findUnique({where: {id: studentId}, include: {user: true}})
      if(!userData) throw new HttpException("User not found", HttpStatus.NOT_FOUND)
      return userData
    }

    async findByTeacherId(userId: string): Promise<any | null> {
      const userData = await this.prisma.teacher.findUnique({where: {userId}, include: {user: true}})
      if(userData) return userData
      throw new HttpException("Teacher doesn exist", HttpStatus.NOT_FOUND)
    }

    async findByEmail(email: string): Promise<User | null> {
        const userData = this.prisma.user.findUnique({where: {email}})
        if(userData) return userData
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
