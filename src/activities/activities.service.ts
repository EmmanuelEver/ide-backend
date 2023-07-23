import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Activity, Section } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';
import { UserService } from 'src/user/user.service';
import { CreateActivityDto } from './dto/createActivity.dto';

@Injectable()
export class ActivitiesService {
    constructor(private prisma: PrismaService, private userService: UserService) {}

    async getActivity(activityId: string): Promise<Activity> {
        try {
            const activity = await this.prisma.activity.findUnique({where: {id: activityId}})
            if(!activity) throw new HttpException("Activity doesn't exist", HttpStatus.NOT_FOUND)
            return activity
        } catch (error) {
            throw new HttpException("Server Error", HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    async getAllActivities(): Promise<Activity[]> {
        try {
            const activities = await this.prisma.activity.findMany({orderBy: {title: "asc"}})
            return activities
        } catch (error) {
            throw new HttpException("Server Error", HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    async getTeacherActivities(userId: string): Promise<Activity[]> {
        try {
            const teacher = await this.userService.findTeacherByUserId(userId)
            if(!teacher) throw new HttpException("Unauthorized to access this resource", HttpStatus.UNAUTHORIZED)
            const activities = await this.prisma.activity.findMany({where: {createdBy: teacher.id}, orderBy: {createdAt: "desc"}})
            return activities
        } catch (error) {
            throw new HttpException("Server error", HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    async getStudentActivities(userId: string): Promise<Section[] | null> {
        try {
            const studentActivity = await this.prisma.section.findMany({
                where: {
                    students: {
                      some: {
                        id: userId,
                      },
                    },
                  },
                  include: {
                    activities: {
                        where: {
                            isOnline: true
                        },
                        select: {
                            title: true,
                            shortDescription: true,
                            closeDate: true,
                            lang: true,
                            id: true,
                            description: true,
                            starterCode: true
                        }
                    }
                },
            })
            return studentActivity
        } catch (error) {
            throw new HttpException("Server error", HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    async getStudentActivity(userId: string, activityId: string): Promise<Activity | null> {
        try {
            const studentActivity = await this.prisma.activity.findFirst({
                where: {
                    id: activityId,
                    section: {
                      students: {
                        some: {
                          userId: userId,
                        },
                      },
                    },
                  },
                  include: {
                    section: {
                        select: {
                            title: true,
                            shortcode: true
                        }
                    },
                }
            })
    
            return studentActivity
        } catch (error) {
            throw new HttpException("Server error", HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    async getTeacherActivity(userId: string, activityId: string): Promise<Activity | null> {
        const teacher = await this.userService.findTeacherByUserId(userId)
        if(!teacher) throw new HttpException("Unauthorized to access this resource", HttpStatus.UNAUTHORIZED)
        try {
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
        } catch (error) {
            throw new HttpException("Server error", HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    async createTeacherActivity(userId: string, payload: CreateActivityDto, sectionId: string): Promise <Activity | null> {
        const teacher = await this.userService.findTeacherByUserId(userId)
        if(!teacher) throw new HttpException("Unauthorized to access this resource", HttpStatus.UNAUTHORIZED)
        try {
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
        } catch (error) {
            console.log(error)
            throw new HttpException("Server error", HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    async updateActivity(activityId: string, userId: string, payload: any): Promise<Activity | null> {
        const teacher = await this.userService.findTeacherByUserId(userId)
        if(!teacher) throw new HttpException("Unauthorized to access this resource", HttpStatus.UNAUTHORIZED)
        const isCreatedByTeacher = await this.prisma.activity.findFirst({
            where: {
                id: activityId,
                teacher: {
                    id: teacher.id
                }
            }
        })
        if(!isCreatedByTeacher) throw new HttpException("Unauthorized to access this resource", HttpStatus.UNAUTHORIZED)
        try {
            const updatedActivity = await this.prisma.activity.update({
                where: {
                    id: activityId
                },
                data: {
                    ...payload
                }
            })
            return updatedActivity
        } catch (error) {
            console.log(error)
            throw new HttpException("Server error", HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    async getActivityOutput(activityId: string, studentId?: string){
        const activity = await this.getActivity(activityId)
        const student = await this.userService.findStudentById(studentId)
        const studentQuery = student ? {student: {id: student.id}} : {}
        try {
            const outputs = await this.prisma.activitySession.findMany({
                where: {
                    activityId: activity.id,
                    ...studentQuery
                },
                include: {
                    compilations: true
                }
            })
            return outputs
        } catch (error) {
            console.log(error)
            throw new HttpException("Server error", HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    async deleteActivity(userId: string, activityId: string) {
        const teacher = await this.userService.findTeacherByUserId(userId);
        const activity = await this.prisma.activity.findUnique({
            where: {
                id:activityId
            }
        })

        if(activity && activity.createdBy === teacher.id) {
            await this.prisma.activity.delete({
                where: {
                    id: activity.id
                }
            })
            return true
        }
        throw new HttpException("You are unathorized to delete this section", HttpStatus.UNAUTHORIZED)
    }
}
