import { IsNotEmpty } from "class-validator";

export class CreateActivityDto {
    @IsNotEmpty()
    title: string;

    @IsNotEmpty()
    shortDescription: string;

    @IsNotEmpty()
    description: string;

    @IsNotEmpty()
    openDate: Date;

    closeDate: Date;

    isOnline: boolean;

    correctAnswer: string;

    @IsNotEmpty()
    lang: "c" | "python"

}