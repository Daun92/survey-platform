import { IsOptional, IsObject, IsBoolean, IsDateString } from 'class-validator';
import { DistributionConfig } from '@survey/shared';

export class UpdateDistributionDto {
  @IsObject()
  @IsOptional()
  config?: Partial<DistributionConfig>;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsDateString()
  @IsOptional()
  expiresAt?: string | null;
}
