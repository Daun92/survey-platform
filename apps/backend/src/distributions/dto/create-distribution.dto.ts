import { IsEnum, IsOptional, IsObject, IsDateString } from 'class-validator';
import { DistributionChannel, DistributionConfig } from '@survey/shared';

export class CreateDistributionDto {
  @IsEnum(DistributionChannel)
  @IsOptional()
  channel?: DistributionChannel;

  @IsObject()
  @IsOptional()
  config?: Partial<DistributionConfig>;

  @IsDateString()
  @IsOptional()
  expiresAt?: string;
}
