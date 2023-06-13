import { Controller, Get, HttpException, HttpStatus, Param, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { OutputsService } from './outputs.service';

@Controller('outputs')
export class OutputsController {
    constructor(private readonly outputsService: OutputsService){}

    @UseGuards(JwtAuthGuard)
    @Get()
    async getOutputs(@Req() req) {
        if(req.user.role === "STUDENT") throw new HttpException("Unauthorized to access this resource", HttpStatus.UNAUTHORIZED)
    }

    @UseGuards(JwtAuthGuard)
    @Get("students")
    async getStudentsOutput(@Req() req) {
        if(req.user.role === "STUDENT") throw new HttpException("Unauthorized to access this resource", HttpStatus.UNAUTHORIZED)
        return await this.outputsService.getStudentsOutput(req.user.userId)
    }

    @UseGuards(JwtAuthGuard)
    @Get("students/:studentId")
    async getStudentOutput(@Req() req, @Param("studentId") studentId: string, @Query("sectionId") sectionId: string) {
        if(req.user.role === "STUDENT") throw new HttpException("Unauthorized to access this resource", HttpStatus.UNAUTHORIZED)
        if(!sectionId) return await this.outputsService.getStudentOutputs(req.user.userId, studentId)
        if(sectionId) return await this.outputsService.getStudentOutputBySection(studentId, sectionId)
    }

}