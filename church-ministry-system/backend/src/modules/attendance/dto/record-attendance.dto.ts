import { IsArray, ValidateNested, IsString, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class AttendanceRecordDto {
  @IsString()
  churchMemberId: string;

  @IsString()
  @IsIn(['present', 'absent', 'excused', 'late'])
  status: string;
}

export class RecordAttendanceDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttendanceRecordDto)
  records: AttendanceRecordDto[];
}
