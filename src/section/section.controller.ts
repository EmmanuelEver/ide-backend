import { Body, Controller, Delete, Get, HttpException, HttpStatus, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CreateSectionDto, JoinSectionApproveDto, JoinSectionDto } from './dto/section.dto';
import { SectionService } from './section.service';

@Controller('sections')
export class SectionController {
    constructor(private readonly sectionService: SectionService){}

    @UseGuards(JwtAuthGuard)
    @Get()
    async getAllSections(@Req() req) {
        const role = req.user.role
        if(role === "STUDENT") {
            const sections = await this.sectionService.getStudentSections(req.user.userId)
            return sections
        }
        else if (role === "TEACHER") {
            const sections = await this.sectionService.getTeacherSections(req.user.userId)
            return sections
        }
        const sections = await this.sectionService.getAllSections()
        return sections
    }

    @UseGuards(JwtAuthGuard)
    @Get(":sectionId")
    async getSection(@Req() req, @Param("sectionId") sectionId: string) {
        const role = req.user.role
        if(role === "STUDENT") {
            const sections = await this.sectionService.getStudentSections(req.user.userId)
            return sections
        }
        else if (role === "TEACHER") {
            const sections = await this.sectionService.getTeacherSection(req.user.userId, sectionId)
            return sections
        }
        const sections = await this.sectionService.getAllSections()
        return sections
    }

    @UseGuards(JwtAuthGuard)
    @Post()
    async createSection(@Req() req, @Body() createSectionDto: CreateSectionDto) {
        if(req.user.role === "STUDENT") throw new HttpException("Unauthorized", HttpStatus.UNAUTHORIZED)
        const createdSection = await this.sectionService.createSection(req.user.userId, createSectionDto)
        if(createdSection) return null
        throw new HttpException("error", HttpStatus.BAD_REQUEST)
    }

    @UseGuards(JwtAuthGuard)
    @Post("join")
    async joinSection(@Req() req, @Body() payload: JoinSectionDto) {
        if(req.user.role === "STUDENT") {
            const joined = await this.sectionService.joinSection(req.user.userId, payload.accessCode)
            if(joined) return {message: "Request to Join section is submitted!" }
            throw new HttpException("error", HttpStatus.BAD_REQUEST)
        }
        throw new HttpException("error", HttpStatus.BAD_REQUEST)
    }

    @UseGuards(JwtAuthGuard)
    @Put(":sectionId/approve")
    async approveJoinRequest(@Req() req, @Param("sectionId") sectionId: string, @Body() payload: JoinSectionApproveDto) {
        if(req.user.role === "STUDENT") throw new HttpException("Unauthorized", HttpStatus.UNAUTHORIZED)
        if(req.user.role === "TEACHER") {
            const approved = this.sectionService.approveJoinSection(payload.studentId, sectionId)
            if(approved) return {message: "Request to Join section is submitted!" }
            throw new HttpException("aprrove error", HttpStatus.BAD_REQUEST)
        }
        throw new HttpException("error", HttpStatus.BAD_REQUEST)
    }

    @UseGuards(JwtAuthGuard)
    @Put(":sectionId/block")
    async blockToSection(@Req() req, @Param("sectionId") sectionId: string, @Body() payload: JoinSectionApproveDto) {
        if(req.user.role === "STUDENT") throw new HttpException("Unauthorized", HttpStatus.UNAUTHORIZED)
        if(req.user.role === "TEACHER") {
            const approved = this.sectionService.blockToSection(payload.studentId, sectionId)
            if(approved) return {message: "Successfuly blocked student!" }
            throw new HttpException("aprrove error", HttpStatus.BAD_REQUEST)
        }
        throw new HttpException("error", HttpStatus.BAD_REQUEST)
    }

    @UseGuards(JwtAuthGuard)
    @Put(":sectionId/unblock")
    async unblockToSection(@Req() req, @Param("sectionId") sectionId: string, @Body() payload: JoinSectionApproveDto) {
        if(req.user.role === "STUDENT") throw new HttpException("Unauthorized", HttpStatus.UNAUTHORIZED)
        if(req.user.role === "TEACHER") {
            const approved = this.sectionService.unBlockToSection(payload.studentId, sectionId)
            if(approved) return {message: "Successfuly blocked student!" }
            throw new HttpException("aprrove error", HttpStatus.BAD_REQUEST)
        }
        throw new HttpException("error", HttpStatus.BAD_REQUEST)
    }

    @UseGuards(JwtAuthGuard)
    @Put(":sectionId")
    async updateSection(@Req() req, @Param("sectionId") sectionId: string, @Body() payload:any) {
        const role = req.user.role
        if(role === "STUDENT") throw new HttpException("Unauthorized", HttpStatus.UNAUTHORIZED)
        else if (role === "TEACHER") {
            const updatedSection = await this.sectionService.updateTeacherSection(req.user.userId, sectionId, payload)
            return updatedSection
        }
        return ""
    }

    @UseGuards(JwtAuthGuard)
    @Delete(":sectionId")
    async deleteSection(@Req() req, @Param("sectionId") sectionId: string) {
        const role = req.user.role
        if(role === "STUDENT") throw new HttpException("Unauthorized", HttpStatus.UNAUTHORIZED)
        else if (role === "TEACHER") {
            const isDeleted = await this.sectionService.deleteSection(req.user.userId, sectionId)
            if(isDeleted) return {message: "Section successfuly deleted!"}
            throw new HttpException("Server error", HttpStatus.BAD_REQUEST)
        }
        return ""
    }
}
