import { IsNotEmpty, Length } from "class-validator";


export class CreateSectionDto {
    @IsNotEmpty()
    title: string;

    @IsNotEmpty()
    description: string;

    @Length(3, 10)
    @IsNotEmpty()
    shortcode: string;

    isOnline: boolean
}


export class JoinSectionDto {
    @IsNotEmpty()
    accessCode: string;
}

export class JoinSectionApproveDto {

    @IsNotEmpty()
    studentId: string;
}