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
                    id: true,
                    title: true,
                    shortcode: true,
                    activities: {
                        select: {
                            id: true,
                            title: true,
                            shortDescription: true,
                            lang: true,
                            sessions: {
                                where: {
                                    studentId: student.id
                                },
                                select: {
                                    compilations: true,
                                    eqScore: true,
                                    lastUpdated: true,
                                    compilationCount: true
                                }
                            }
                        }
                    }
                }
            })
                .then((section) => {
                    if (!section) {
                        throw new Error(`Student with ID ${studentId} not found.`);
                    }


                    const top3ErrorTypesForStudentInSection = {
                        ...section,
                        studentId: student.id,
                        sectionId: section.id,
                        errorTypes: [],
                    };

                    const errorTypes = section.activities.flatMap((activity) => activity.sessions.flatMap((session) =>
                        session.compilations.map((compilation) => compilation.errorType)
                    ))

                    const errorTypeCounts = errorTypes.reduce((counts, errorType) => {
                        counts[errorType] = (counts[errorType] || 0) + 1;
                        return counts;
                    }, {});

                    const sortedErrorTypes = Object.entries(errorTypeCounts).sort(
                        (a: any, b: any) => b[1] - a[1]
                    );

                    const top3 = sortedErrorTypes.slice(0, 3).map((entry) => entry[0]);
                    top3ErrorTypesForStudentInSection.errorTypes = top3;

                    return top3ErrorTypesForStudentInSection;
                })
                .catch((error) => {
                    console.error('Error retrieving top 3 error types for student in section:', error);
                    return outputs;
                });
            return outputs
        } catch (error) {
            console.log(error)
            throw new HttpException("Server error", HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    async getStudentOutputByActivity(studentId: string, activityId: string) {
        const student = await this.userService.findStudentByUserId(studentId)
        try {
            const activityWithTop3ErrorTypes = await this.prisma.activity.findUnique({
                where: {
                    id: activityId,
                },
                include: {
                    sessions: {
                        include: {
                            compilations: true
                        },
                    },
                },
            })
                .then((activity) => {
                    if (!activity) {
                        throw new Error(`Activity with ID ${activityId} not found.`);
                    }

                    const activityWithTop3ErrorTypes = {
                        ...activity,
                        id: activity.id,
                        title: activity.title,
                        sessions: activity.sessions.map((session) => {
                            // Flatten the compilations and error types into a single array
                            const errorTypes = session.compilations.map(
                                (compilation) => compilation.errorType
                            );

                            // Count the occurrences of each error type
                            const errorTypeCounts = errorTypes.reduce((counts, errorType) => {
                                counts[errorType] = (counts[errorType] || 0) + 1;
                                return counts;
                            }, {});

                            // Sort the error types by count in descending order
                            const sortedErrorTypes = Object.entries(errorTypeCounts).sort(
                                (a: any, b: any) => b[1] - a[1]
                            );

                            // Select the top 3 error types
                            const top3 = sortedErrorTypes.slice(0, 3).map((entry) => entry[0]);

                            return {
                                ...session,
                                id: session.id,
                                errorTypes: top3,
                            };
                        }),
                    };

                    return activityWithTop3ErrorTypes;
                })
                .catch((error) => {
                    return activityWithTop3ErrorTypes;
                });
            return activityWithTop3ErrorTypes
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
                            lang: true
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
                    lang: true,
                    sessions: {
                        select: {
                            id: true,
                            eqScore: true,
                            lastUpdated: true,
                            compilations: true,
                            student: {
                                select: {
                                    id: true,
                                    activitySessions: {
                                        select: {
                                            eqScore: true
                                        }
                                    },
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
                        id: true,
                        lang: true,
                        sessions: {
                            select: {
                                compilations: {
                                    select: {
                                        errorType: true
                                    }
                                }
                            }
                        }
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
                        activitySessions: {
                            select: {
                                eqScore: true,
                                activity: {
                                    select: {
                                        title: true,
                                        sectionId: true
                                    }
                                },
                                compilationCount: true
                            }
                        }
                    }
                }
            }
        })
            .then((sections) => {
                const sectionsWithErrorTypes = sections.map((section) => {
                    const top3ErrorTypesForSection = {
                        ...section,
                        errorTypes: [],
                    };

                    const errorTypes = section.activities.flatMap((activity) =>
                        activity.sessions.flatMap((session) =>
                            session.compilations.map((compilation) => compilation.errorType)
                        )
                    );

                    const errorTypeCounts = errorTypes.reduce((counts, errorType) => {
                        counts[errorType] = (counts[errorType] || 0) + 1;
                        return counts;
                    }, {});
                    const sortedErrorTypes = Object.entries(errorTypeCounts).sort(
                        (a:any, b:any) => b[1] - a[1]
                      );
                  
                      const top3 = sortedErrorTypes.slice(0, 3).map((entry) => entry[0]);
                      top3ErrorTypesForSection.errorTypes = top3;
                  
                      return top3ErrorTypesForSection;
                })
                return sectionsWithErrorTypes
            })
        return sections
    }
}
