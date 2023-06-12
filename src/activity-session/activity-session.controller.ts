import { Controller, Get, HttpException, HttpStatus, Param, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ActivitySessionService } from './activity-session.service';

@Controller('activity-session')
export class ActivitySessionController {
    constructor(private readonly activitySessionService: ActivitySessionService){}

    @UseGuards(JwtAuthGuard)
    @Get()
    async getActivitySession(@Req() req, @Query("activityId") activityId) {
        if(req.user.role === "STUDENT") {
            if(!activityId) throw new HttpException("Activity id required", HttpStatus.BAD_REQUEST)
            const activitySession = await this.activitySessionService.getStudentActivitySession(req.user.userId, activityId)
            return activitySession
        }
        return ""
    }

    @UseGuards(JwtAuthGuard)
    @Get(":activitySessionId")
    async getAllActivitySession(@Req() req, @Param("activitySessionId") activitySessionId) {
        if(req.user.role === "STUDENT") throw new HttpException("Unathorized", HttpStatus.UNAUTHORIZED)
        const activitySession = await this.activitySessionService.getActivitySession(activitySessionId)
        return activitySession
    }

    @UseGuards(JwtAuthGuard)
    @Get("all")
    async getAllActivitySessionOfStudent(@Req() req: any, @Param("activityId") activityId:string, @Param("studentId") studentId: string) {
        if(req.user.role === "STUDENT") throw new HttpException("Unathorized", HttpStatus.UNAUTHORIZED)
        if(!activityId && !studentId) return await this.activitySessionService.getAllActivitySessions()
        if(activityId && studentId) return await this.activitySessionService.getAllActivitySessionByStudent(studentId, activityId)
        if(activityId) return await this.activitySessionService.getActivitySessionsByActivity(activityId)
        if(studentId) return await this.activitySessionService.getAllActivitySessionByStudent(studentId)
    }

}
