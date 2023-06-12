import { IsNotEmpty } from "class-validator";

export class CompilationsDto {
    @IsNotEmpty()
    activitySessionId: string;

    @IsNotEmpty()
    codeValue: string;
}