import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Compilations, Student } from '@prisma/client';
import { ActivitiesService } from 'src/activities/activities.service';
import { ActivitySessionService } from 'src/activity-session/activity-session.service';
import { PrismaService } from 'src/prisma.service';
import { ScriptService } from 'src/script-runner.service';
import { UserService } from 'src/user/user.service';

@Injectable()
export class CompilationsService {
    constructor(private prisma: PrismaService, private userService: UserService, private activitySessionService: ActivitySessionService, private scriptService: ScriptService, private activityService: ActivitiesService){}

    private getCodeCompilationLineChanges(prevValue: string, currentValue: string) {
        const prevValueArray = prevValue.split(/\r?\n/)
            const currentValueArray = currentValue.split(/\r?\n/)
    
            const maxLength = Math.max(prevValueArray.length, currentValueArray.length);
            const unequalIndices = [];
    
            for (let i = 0; i < maxLength; i++) {
                if (prevValueArray[i] !== currentValueArray[i]) {
                    unequalIndices.push(i + 1);
                }
            }
            return unequalIndices
    }

    private calculateEqScore(compilationPairs: [c1:Compilations, c2:Compilations][]) {
        return compilationPairs.map(([c1, c2]) => {
            let score = 0;
            // check if both events end in error
            if(c1.error && c2.error) {
                score += 2;
                // check if same error
                if(c1.compileResult === c2.compileResult) {
                    score += 2
                }
                //check if same line error
                if(c1.LineError === c2.LineError) {
                    score += 3
                }
                //check if same edit location
                if(this.getCodeCompilationLineChanges(c1.codeValue, c2.codeValue).includes(c1.LineError)) {
                    score += 2
                }
                return score / 9
            }
            return score / 9
        })
    }

    async getAllCompilations():Promise<Compilations[] | null> {
        try {
            const compilations = await this.prisma.compilations.findMany()
            return compilations
        } catch (error) {
            console.log(error)
            throw new HttpException("Server error", HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    async getStudentCompilations(studentId: string, activityId: string):Promise<Compilations[] | null> {
        try {
            const includeActivity =  activityId ? {activity: {id: activityId}} : {}
            const compilations = await this.prisma.compilations.findMany({
                where: {
                    student: {
                        id: studentId
                    },
                    ...includeActivity
                }
            })
            return compilations
        } catch (error) {
            console.log(error)
            throw new HttpException("Server error", HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    async getActivityCompilations(activityId: string):Promise<Student[] | null>  {
        try {
            const student = await this.prisma.student.findMany({
                include: {
                  compilations: {
                    where: {
                      activityId: activityId,
                    },
                  },
                }
              });
            return student
        } catch (error) {
            console.log(error)
            throw new HttpException("Server error", HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    async getAllCompilationsOfMyStudents(userId: string, activityId?: string):Promise<Compilations []> {
        const teacher = await this.userService.findTeacherByUserId(userId)
        const activity = activityId ?  await this.activityService.getActivity(activityId) : null
        const queryActivity = activity ? {activityId: activity.id} : {}
        try {
            const compilations = await this.prisma.compilations.findMany({
                where: {
                    activity: {
                        teacher: {
                            id: teacher.id
                        }
                    },
                    ...queryActivity
                }
            })
            return compilations
        } catch (error) {
            console.log(error)
            throw new HttpException("Server error", HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    async getAllCompilationsOfStudent(userId: string, studentId: string, activityId?: string):Promise<Compilations []> {
        const teacher = await this.userService.findTeacherByUserId(userId)
        const student = await this.userService.findStudentById(userId)
        const activity = activityId ?  await this.activityService.getActivity(activityId) : null
        const queryActivity = activity ? {activityId: activity.id} : {}
        try {
            const compilations = await this.prisma.compilations.findMany({
                where: {
                    student: {
                        id: student.id
                    },
                    activity: {
                        teacher: {
                            id: teacher.id
                        }
                    },
                    ...queryActivity
                }
            })
            return compilations
        } catch (error) {
            console.log(error)
            throw new HttpException("Server error", HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    async createCompilation(activitySessionId: string, userId: string, payload: any): Promise< {result: string, error: boolean, message: string} | null> {
        const student = await this.userService.findStudentByUserId(userId)
        if(!student) throw new HttpException("Student is not existing", HttpStatus.BAD_REQUEST)
        const activitySession = await this.activitySessionService.getActivitySession(activitySessionId)
        try {
            const {result, error, message, lineNumber, errorType} = activitySession?.activity?.lang === "python" ? await this.scriptService.runPythonScript(payload.codeValue) :  activitySession?.activity?.lang === "c" ? await this.scriptService.runCScript(payload.codeValue) : await this.scriptService.runCScript(payload.codeValue)
            const compilation = await this.prisma.compilations.create({
                data: {
                    error: error,
                    codeValue: payload.codeValue,
                    compileResult: result || message,
                    compileTimes: activitySession.compilationCount + 1,
                    errorType: errorType || null,
                    LineError: error ? (isNaN(lineNumber) ? -1 : lineNumber) : 0,
                    student: {
                        connect: {
                            id: student.id
                        }
                    },
                    activitySession: {
                        connect: {
                            id: activitySession.id
                        }
                    },
                    activity: {
                        connect: {
                            id: activitySession.activityId
                        }
                    }
                }
            })
            if(compilation) {
                const compilations = await this.prisma.compilations.findMany({where: {
                    activitySessionId: activitySession.id
                }})
                if(compilations.length >= 2) {
                    const compilationPairs = []
                    compilations.forEach((compilation, idx) => {
                        if(idx + 1 !== compilations.length) {
                            compilationPairs.push([compilation, compilations[idx + 1]])
                        }
                    })
                    const compilationPairScores = this.calculateEqScore(compilationPairs)
                    const averageCompilationPairScore = compilationPairScores.reduce((a, b) => (a+=b), 0) / compilationPairScores.length
                    await this.activitySessionService.updateActivitySession(activitySession.id, {compilationCount: {increment: 1}, answerValue: compilation.codeValue, result, eqScore: averageCompilationPairScore})
                    return {result, error, message}
                }
                await this.activitySessionService.updateActivitySession(activitySession.id, {compilationCount: {increment: 1}, answerValue: compilation.codeValue, result})
                return {result, error, message}
            }
            throw new HttpException("Server error", HttpStatus.INTERNAL_SERVER_ERROR)
        } catch (error) {
            console.error(error)
            throw new HttpException("Server error", HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    async compileCode(codeStr: string): Promise<any> {
        try {
            return await this.scriptService.runCScript(codeStr)
        } catch (error) {
            console.error(error)
            throw new HttpException("Server error", HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }
}
