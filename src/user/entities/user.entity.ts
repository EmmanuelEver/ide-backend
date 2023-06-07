
export class User {
    id: string;
    createdAt: Date;
    email: string;
    googleId: string | null;
    name: string;
    profileUrl: string | null;
    role: Role;
}
export enum Role {
    STUDENT,
    TEACHER,
    ADMIN
}