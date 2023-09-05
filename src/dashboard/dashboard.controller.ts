import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
    constructor(private readonly dashboardService: DashboardService) {}

    @UseGuards(JwtAuthGuard)
    @Get()
    async getDashboardData(@Req() req:any) {
        if(req.user.role === "STUDENT") return await this.dashboardService.getStudentDashboardData(req.user.userId)
        if(req.user.role === "TEACHER") return await this.dashboardService.getTeacherDashboardData(req.user.userId)
    }

    @UseGuards(JwtAuthGuard)
    @Get("/recent-activities")
    async getRecentActivities(@Req() req:any) {
        if(req.user.role === "STUDENT") return await this.dashboardService.getStudentRecentActivities(req.user.userId)
    }
}
