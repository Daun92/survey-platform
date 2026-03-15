import { Controller, Get, Param } from '@nestjs/common';
import { PublicService } from './public.service';

@Controller('public')
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  @Get('surveys/:token')
  getSurveyByToken(@Param('token') token: string) {
    return this.publicService.getSurveyByToken(token);
  }
}
