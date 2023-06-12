import { Body, Controller, Get, HttpException, HttpStatus, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CompilationsService } from './compilations.service';

@Controller('compilations')
export class CompilationsController {
    constructor(private readonly compilationsServices: CompilationsService){}

    @UseGuards(JwtAuthGuard)
    @Get()
    async getCompilations(@Req() req, @Query("activityId") activityId: string, @Query("studentId") studentId: string) {
        if(req.user.role === "STUDENT") throw new HttpException("Unauthorized to access this resource", HttpStatus.UNAUTHORIZED)
    }

    @UseGuards(JwtAuthGuard)
    @Get()
    async getCompilationsOfMyStudents(@Req() req, @Query("activityId") activityId: string, @Query("studentId") studentId: string) {
        if(req.user.role === "STUDENT") throw new HttpException("Unauthorized to access this resource", HttpStatus.UNAUTHORIZED)
        if(!activityId) throw new HttpException("Activity ID is required", HttpStatus.BAD_REQUEST)
        if(!studentId) return await this.compilationsServices.getAllCompilationsOfMyStudents(req.user.userId, activityId)
        if(studentId) return await this.compilationsServices.getAllCompilationsOfStudent(req.user.userId, studentId, activityId)
    }

    @UseGuards(JwtAuthGuard)
    @Post("open")
    async freeCompileCode(@Req() req, @Body() compileDto: any) {
        const resp = await this.compilationsServices.compileCode(compileDto.codeValue)
        return resp
    }

    @UseGuards(JwtAuthGuard)
    @Post("student")
    async compileCode(@Req() req, @Body() compileDto: any):Promise<{result: string, error: boolean, message: string}> {
        if(req.user.role !== "STUDENT") throw new HttpException("Unauthorized to access this resource", HttpStatus.UNAUTHORIZED)
        return await this.compilationsServices.createCompilation(compileDto.activitySessionId, req.user.userId, compileDto )
    }

    @UseGuards(JwtAuthGuard)
    @Get("activity-output")
    async getStudentOutputs(@Req() req, @Query("activityId") activityId: string, @Query("studentId") studentId: string) {
        if(req.user.role !== "STUDENT") throw new HttpException("Unauthorized to access this resource", HttpStatus.UNAUTHORIZED)
        if(!activityId) throw new HttpException("Activity ID is required", HttpStatus.BAD_REQUEST)

    }

}
