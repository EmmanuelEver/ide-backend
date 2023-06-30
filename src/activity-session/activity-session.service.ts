import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ActivitySession, ProgLanguage } from '@prisma/client';
import { ActivitiesService } from 'src/activities/activities.service';
import { PrismaService } from 'src/prisma.service';
import { UserService } from 'src/user/user.service';

@Injectable()
export class ActivitySessionService {
    constructor(private prisma: PrismaService, private userService: UserService, private activitiesService: ActivitiesService) { }


    async getAllActivitySessions(): Promise<ActivitySession[]> {
        const activitySessions = await this.prisma.activitySession.findMany()
        return activitySessions
    }

    async getAllActivitySessionByStudent(studentId: string, activityId?: string): Promise<ActivitySession[]> {
        const activity = activityId ? {
            activity: {
                id: activityId
            }
        } : {}
        try {
            const activitySessions = await this.prisma.activitySession.findMany({
                where: {
                    studentId,
                    ...activity
                },
                include: {
                    compilations: true
                }
            })
            return activitySessions
        } catch (error) {
            console.error(error)
            throw new HttpException("Error", HttpStatus.BAD_REQUEST)
        }
    }

    async getActivitySession(activitySessionId: string): Promise<ActivitySession & { activity: { lang: ProgLanguage } }> {
        try {
            const activity = await this.prisma.activitySession.findUnique({
                where: {
                    id: activitySessionId
                },
                include: {
                    activity: {
                        select: {
                            lang: true
                        }
                    }
                }
            })
            if (!activity) throw new HttpException("Activity session is not existing", HttpStatus.NOT_FOUND)
            return activity
        } catch (error) {
            console.error(error)
            throw new HttpException("Activity session is not existing", HttpStatus.NOT_FOUND)
        }
    }

    async getActivitySessionsByActivity(activityId): Promise<ActivitySession[]> {
        try {
            const activity = await this.activitiesService.getActivity(activityId)
            const activitySessions = await this.prisma.activitySession.findMany({
                where: {
                    activity: {
                        id: activity.id
                    }
                },
                include: {
                    compilations: true
                }
            })
            return activitySessions
        } catch (error) {
            console.log(error)
            throw new HttpException("Server error", HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }


    async getStudentActivitySession(userId: string, activityId: string): Promise<ActivitySession> {
        const student = await this.userService.findStudentByUserId(userId)
        const activity = await this.prisma.activity.findUnique({
            where: {
                id: activityId
            }
        })
        if (!student) throw new HttpException("Must be a student to access", HttpStatus.UNAUTHORIZED)
        if (!activity) throw new HttpException("Activity not found", HttpStatus.NOT_FOUND)
        const activitySession = await this.prisma.activitySession.findFirst({
            where: {
                studentId: student.id,
                activityId: activityId
            }
        })
        if (activitySession) return activitySession
        try {
            const createdActivity = await this.prisma.activitySession.create({
                data: {
                    isSolved: false,
                    answerValue: activity.starterCode || "",
                    compilationCount: 0,
                    student: {
                        connect: {
                            id: student.id
                        }
                    },
                    activity: {
                        connect: {
                            id: activityId
                        }
                    }
                }
            })
            return createdActivity
        } catch (error) {
            throw new HttpException("Server error", HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    async updateActivitySession(activitySessionId, payload: any): Promise<ActivitySession> {
        try {
            const updatedActivitySession = await this.prisma.activitySession.update({
                where: {
                    id: activitySessionId
                },
                data: {
                    ...payload
                }
            })
            return updatedActivitySession
        } catch (error) {
            throw new HttpException("Server error", HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }
}
