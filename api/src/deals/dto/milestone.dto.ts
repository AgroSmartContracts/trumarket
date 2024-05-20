import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsNumber, IsString } from 'class-validator';

export class MilestoneDTO {
  @ApiProperty()
  @IsString()
  @Expose()
  description: string;

  @ApiProperty()
  @IsNumber()
  @Expose()
  fundsDistribution: number;
}
