import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { UserService } from 'src/user/user.service';

@Injectable()
export class DashboardService {
    constructor(private prisma: PrismaService, private userService: UserService) {}

    async getStudentDashboardData(userId: string) {
        const student =  await this.userService.findStudentByUserId(userId)
        const dashboardData = {activities: 0, sections: 0, teachers: []}
        const studentSections = await this.prisma.section.findMany({
            where: {
                students: {
                  some: {
                    id: student.id,
                  },
                },
              },
              include: {
                activities: {
                    select: {
                        title: true
                    }
                },
                teacher: {
                    select: {
                        id: true
                    }
                }
            },
        })
        studentSections.forEach((section) => {
            dashboardData.sections++
            dashboardData.activities = dashboardData.activities + section.activities.length
            if(!dashboardData.teachers.includes(section.teacher.id)) {
                dashboardData.teachers.push(section.teacher.id)
            }
        })

        return {sections: dashboardData.sections, teachers: dashboardData.teachers.length, activities: dashboardData.activities}
    }

    async getTeacherDashboardData(userId: string) {
        const teacher = await this.userService.findTeacherByUserId(userId)
        const sections = await this.prisma.section.findMany({
            where: {
                createdBy: teacher.id
            },
            select: {
                students: {
                    select: {
                        id: true
                    }
                },
                pendingStudents: {
                    select: {
                        id: true
                    }
                }
            }
        })
        const students = new Set();
        const pendingStudents = new Set();
        sections.forEach((student) => {
            student.students.forEach((id) => students.add(id))
            student.pendingStudents.forEach((id) => pendingStudents.add(id))
        })

        const activities = await this.prisma.activity.count({
            where: {
                createdBy: teacher.id
            }
        })
        return {sections: sections.length, activities, students: students.size, pendingStudents: pendingStudents.size}
    }

}
