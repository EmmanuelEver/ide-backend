import { Body, Controller, Delete, Get, HttpException, HttpStatus, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ActivitiesService } from './activities.service';
import { CreateActivityDto } from './dto/createActivity.dto';

@Controller('activities')
export class ActivitiesController {
    constructor(private readonly activitiesService: ActivitiesService){}

    @UseGuards(JwtAuthGuard)
    @Get()
    async getAllActivities(@Req() req) {
        const role = req.user.role
        if(role === "STUDENT") {
            const sections = await this.activitiesService.getStudentActivities(req.user.userId)
            return sections
        }
        const sections = await this.activitiesService.getAllActivities()
        return sections
    }

    @UseGuards(JwtAuthGuard)
    @Get(":activityId")
    async getActivity(@Req() req, @Param("activityId") activityId: string) {
        if(req.user.role === "STUDENT") return await this.activitiesService.getStudentActivity(req.user.userId, activityId)
        const activity = await this.activitiesService.getTeacherActivity(req.user.userId, activityId)
        return activity
    }

    @UseGuards(JwtAuthGuard)
    @Put(":activityId")
    async updateActivity(@Req() req, @Param("activityId") activityId: string, @Body() payload: any) {
        if(req.user.role === "STUDENT") throw new HttpException("Unauthorized", HttpStatus.UNAUTHORIZED)
        const updatedActivity = await this.activitiesService.updateActivity(activityId, req.user.userId,payload)
        return updatedActivity
    }

    @UseGuards(JwtAuthGuard)
    @Post()
    async createActivity(@Req() req, @Query("sectionId") sectionId, @Body() createActivityDto: CreateActivityDto) {
        if(req.user.role === "STUDENT") throw new HttpException("Unauthorized", HttpStatus.UNAUTHORIZED)
        if(!sectionId) throw new HttpException("Section id required", HttpStatus.BAD_REQUEST)
        const createdActivity = this.activitiesService.createTeacherActivity(req.user.userId, createActivityDto, sectionId)
        return createdActivity
    }

    @UseGuards(JwtAuthGuard)
    @Get("activity-output")
    async getStudentOutputs(@Req() req, @Query("activityId") activityId: string, @Query("studentId") studentId: string) {
        if(req.user.role !== "STUDENT") throw new HttpException("Unauthorized to access this resource", HttpStatus.UNAUTHORIZED)
        if(!activityId) throw new HttpException("Activity ID is required", HttpStatus.BAD_REQUEST)
        return await this.activitiesService.getActivityOutput(activityId, studentId)
    }

    @UseGuards(JwtAuthGuard)
    @Delete(":activityId")
    async deleteActivity(@Req() req, @Param("activityId") activityId: string) {
        if(req.user.role === "STUDENT") throw new HttpException("Unauthorized", HttpStatus.UNAUTHORIZED)
        const deletedActivity = await this.activitiesService.deleteActivity(req.user.userId, activityId)
        if(deletedActivity) return {message: "Activity successfuly deleted!"}
        throw new HttpException("Server error", HttpStatus.BAD_REQUEST)
    }
}
