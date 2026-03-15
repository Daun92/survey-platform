import { Controller, Get, Post, Param, Body, Req } from '@nestjs/common';
import { Request } from 'express';
import { PublicService } from './public.service';
import { SubmitResponseDto } from './dto/submit-response.dto';

@Controller('public')
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  @Get('surveys/:token')
  getSurveyByToken(@Param('token') token: string) {
    return this.publicService.getSurveyByToken(token);
  }

  @Post('surveys/:token/responses')
  submitResponse(
    @Param('token') token: string,
    @Body() dto: SubmitResponseDto,
    @Req() req: Request,
  ) {
    const ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.ip ||
      '';
    const userAgent = (req.headers['user-agent'] as string) || '';
    return this.publicService.submitResponse(token, dto, ip, userAgent);
  }
}
