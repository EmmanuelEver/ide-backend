import { Injectable } from '@nestjs/common';
import { Section } from '@prisma/client';
import { randomBytes } from 'crypto';
import { PrismaService } from 'src/prisma.service';
import { UserService } from 'src/user/user.service';

@Injectable()
export class SectionService {
    constructor(private prisma: PrismaService, private userService: UserService) { }

    async getAllSections(): Promise<Section[]> {
        const sections = await this.prisma.section.findMany()
        return sections
    }

    async getTeacherSections(userId: string): Promise<Section[]> {
        const teacher = await this.userService.findByTeacherId(userId)
        const sections = await this.prisma.section.findMany({ where: { createdBy: teacher.id }, include: { students: { include: { user: true }, take: 6 }, activities: true } })
        return sections
    }
    async getTeacherSection(userId: string, sectionId: string): Promise<Section | null> {
        const teacher = await this.userService.findByTeacherId(userId)
        const section = await this.prisma.section.findFirst({ where: { createdBy: teacher.id, id: sectionId }, include: { students: { include: { user: true } }, activities: true, blockedStudents: { include: { user: true } }, pendingStudents: { include: { user: true } } } })
        if (section) return section
        return null
    }

    async getStudentSections(userId: string): Promise<Section[]> {
        const user = await this.prisma.student.findUnique({ where: { userId: userId }, include: { sections: {include: {activities: {where: {isOnline: true}}, teacher: { select: {user: {select: {name: true, profileUrl: true}}}}}} } })
        return user.sections
    }

    async findSectionById(sectionId: string): Promise<Section | null> {
        const section = await this.prisma.section.findUnique({ where: { id: sectionId } })
        if (section) return section
        return null
    }

    async createSection(userId: string, sectionData: any): Promise<Section> {
        const teacher = await this.userService.findByTeacherId(userId)
        if (!teacher) return null
        const createdSection = await this.prisma.section.create({
            data: {
                ...sectionData,
                accessCode: randomBytes(4).toString("hex"),
                teacher: {
                    connect: { id: teacher.id },
                },
            },
            include: {
                teacher: true
            },
        });
        return createdSection
    }

    async updateTeacherSection(userId: string, sectionId: string, payload: any): Promise<Section | null> {
        const teacher = await this.userService.findByTeacherId(userId)
        if (!teacher) return null
        const updatedSection = await this.prisma.section.update({
            where: {
                id: sectionId
            },
            data: {
                ...payload
            }
        })
        return updatedSection
    }

    async joinSection(userId: string, accessCode: any):Promise<Section | null>  {
        const student = await this.userService.findStudentByUserId(userId);
        const updatedSection = await this.prisma.section.update({
            where: {
              accessCode: accessCode
            },
            data: {
              pendingStudents: {
                connect: {
                  id: student.id,
                },
              },
            },
          });
        if(!updatedSection) return null
        return updatedSection
    }

    async approveJoinSection(studentId: string, sectionId: any):Promise<Section | null> {
        const updatedSection = await this.prisma.section.update({
            where: {
              id: sectionId
            },
            data: {
              pendingStudents: {
                disconnect: {
                  id: studentId,
                },
              },
              students: {
                connect: {
                    id: studentId
                }
              }
            },
          });
        if(!updatedSection) return null
        return updatedSection
    }

    async blockToSection(studentId: string, sectionId: any):Promise<Section | null> {
        const updatedSection = await this.prisma.section.update({
            where: {
              id: sectionId
            },
            data: {
              blockedStudents: {
                connect: {
                  id: studentId,
                },
              },
              students: {
                disconnect: {
                    id: studentId
                }
              }
            },
          });
        if(!updatedSection) return null
        return updatedSection
    }

    async unBlockToSection(studentId: string, sectionId: any):Promise<Section | null> {
        const updatedSection = await this.prisma.section.update({
            where: {
              id: sectionId
            },
            data: {
              blockedStudents: {
                disconnect: {
                  id: studentId,
                },
              },
              students: {
                connect: {
                    id: studentId
                }
              }
            },
          });
        if(!updatedSection) return null
        return updatedSection
    }
}