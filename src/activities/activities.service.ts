import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Activity, Section, Student } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';
import { UserService } from 'src/user/user.service';
import { CreateActivityDto } from './dto/createActivity.dto';

@Injectable()
export class ActivitiesService {
    constructor(private prisma: PrismaService, private userService: UserService) {}

    async getAllActivities(): Promise<Activity[]> {
        const activities = await this.prisma.activity.findMany()
        return activities
    }

    async getTeacherActivities(userId: string): Promise<Activity[]> {
        const teacher = await this.userService.findByTeacherId(userId)
        const activities = await this.prisma.activity.findMany({where: {createdBy: teacher.id}})
        return activities
    }

    async getStudentActivities(userId: string): Promise<Section[] | null> {
        const studentActivity = await this.prisma.section.findMany({
            where: {
                students: {
                  some: {
                    id: userId,
                  },
                },
              },
              include: {
                activities: true,
            },
        })
        return studentActivity
    }

    async getStudentActivity(userId: string, activityId: string): Promise<Activity | null> {
        const studentActivity = await this.prisma.activity.findFirst({
            where: {
                id: activityId,
                section: {
                  students: {
                    some: {
                      id: userId,
                    },
                  },
                },
              },
        })

        return studentActivity
    }

    async getTeacherActivity(userId: string, activityId: string): Promise<Activity | null> {
        const teacher = await this.userService.findByTeacherId(userId)
        const activity = await this.prisma.activity.findFirst({
            where: {
                id: activityId,
                teacher: {
                    id: teacher.id
                }
            },
            include: {
                teacher: true,
                students: {
                    include: {
                        blockedSections: true,
                        activities: true
                    }
                },
                section: {
                    select : {
                        title: true
                    }
                }
            }
        })
        if(activity) return activity
        return null
    }

    async createTeacherActivity(userId: string, payload: CreateActivityDto, sectionId: string): Promise <Activity | null> {
        const teacher = await this.userService.findByTeacherId(userId)
        const createdActivity = await this.prisma.activity.create({
            data: {
                ...payload,
                openDate: new Date(payload.openDate),
                closeDate: payload.closeDate ? new Date(payload.closeDate) : new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
                teacher: {
                    connect: {
                        id: teacher.id
                    }
                },
                section: {
                    connect: {
                        id: sectionId
                    }
                }
            },
            include: {
                teacher: true
            },
        })
        return createdActivity
    }

    async updateActivity(activityId: string, userId: string, payload: any): Promise<Activity | null> {
        const teacher = await this.userService.findByTeacherId(userId)
        const isCreatedByTeacher = await this.prisma.activity.findFirst({
            where: {
                id: activityId,
                teacher: {
                    id: teacher.id
                }
            }
        })
        if(!isCreatedByTeacher) throw new HttpException("Unauthorized", HttpStatus.UNAUTHORIZED)
        const updatedActivity = this.prisma.activity.update({
            where: {
                id: activityId
            },
            data: {
                ...payload
            }
        })
        return updatedActivity
    }
}
