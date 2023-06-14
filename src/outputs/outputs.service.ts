import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ActivitiesService } from 'src/activities/activities.service';
import { ActivitySessionService } from 'src/activity-session/activity-session.service';
import { PrismaService } from 'src/prisma.service';
import { SectionService } from 'src/section/section.service';
import { UserService } from 'src/user/user.service';

@Injectable()
export class OutputsService {
    constructor(private prisma: PrismaService, private userService: UserService, private activitySessionService: ActivitySessionService, private activityService: ActivitiesService, private sectionService: SectionService) { }

    async getStudentOutputBySection(studentId: string, sectionId: string) {
        const student = await this.userService.findStudentByUserId(studentId)
        try {
            const outputs = await this.prisma.section.findUnique({
                where: {
                    id: sectionId
                },
                select: {
                    title: true,
                    shortcode: true,
                    activities: {
                        select: {
                            id: true,
                            title: true,
                            shortDescription: true,
                            sessions: {
                                where: {
                                    studentId: student.id
                                },
                                select: {
                                    compilationCount: true,
                                    compilations: true,
                                    isSolved: true,
                                    answerValue: true,
                                    lastUpdated: true
                                }
                            }
                        }
                    }
                }
            })
            return outputs
        } catch (error) {
            console.log(error)
            throw new HttpException("Server error", HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    async getStudentOutputs(userId: string, studentId: string) {
        const teacher = await this.userService.findTeacherByUserId(userId)
        const student = await this.userService.findStudentByUserId(studentId)
        try {
            const outputs = await this.prisma.section.findMany({
                where: {
                    createdBy: teacher.id,
                    students: {
                        some: {
                            id: student.id
                        }
                    }
                },
                select: {
                    title: true,
                    id: true,
                    activities: {
                        select: {
                            id: true,
                            title: true,
                            shortDescription: true,
                            compilations: true,
                        }
                    }
                }
            })
            return outputs
        } catch (error) {
            console.log(error)
            throw new HttpException("Server error", HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    async getStudentsOutputByActivity(activityId: string) {
        const activity = await this.activityService.getActivity(activityId)
        try {
            const outputs = await this.prisma.activity.findUnique({
                where: {
                    id: activity.id
                },
                select: {
                    title: true,
                    id: true,
                    shortDescription: true,
                    sessions: {
                        select: {
                            id: true,
                            compilations: true,
                            student: {
                                select: {
                                    user: {
                                        select: {
                                            name: true,
                                            id: true,
                                            profileUrl: true,
                                            email: true
                                        }
                                    }
                                }
                            }
                        }
                    }
                    // students: {
                    //     include: {
                    //         compilations: true,
                    //         user: {
                    //             select: {
                    //                 name: true,
                    //                 id: true,
                    //                 profileUrl: true,
                    //                 email: true
                    //             }
                    //         }
                    //     }
                    // }
                }
            })
            return outputs
        } catch (error) {
            console.log(error)
            throw new HttpException("Server error", HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    async getStudentsOutput(userId: string): Promise<any> {
        const teacher = await this.userService.findTeacherByUserId(userId)
        const sections = await this.prisma.section.findMany({
            where: {
                createdBy: teacher.id,
            },
            select: {
                id: true,
                title: true,
                shortcode: true,
                description: true,
                activities: {
                    select: {
                        title: true,
                        id: true
                    }
                },
                students: {
                    select: {
                        lastActivity: true,
                        id: true,
                        user: {
                            select: {
                                profileUrl: true,
                                name: true,
                                id: true,
                                email: true,
                            }
                        },
                        activitySessions : {
                            select: {
                                activity: {
                                    select: {
                                        title: true
                                    }
                                },
                                compilations: true
                            }
                        }
                    }
                }
            }
        })
        return sections
    }
}
