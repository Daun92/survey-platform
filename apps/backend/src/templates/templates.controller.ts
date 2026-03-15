import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TemplatesService } from './templates.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UseTemplateDto } from './dto/use-template.dto';
import type { TemplateCategory } from '@survey/shared';

@Controller('templates')
@UseGuards(JwtAuthGuard)
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Get()
  findAll(@Query('category') category?: TemplateCategory) {
    return this.templatesService.findAll(category);
  }

  @Get(':id')
  findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.templatesService.findById(id);
  }

  @Post()
  create(
    @Body() dto: CreateTemplateDto,
    @Request() req: { user: { id: string } },
  ) {
    return this.templatesService.create(dto, req.user.id);
  }

  @Post(':id/use')
  useTemplate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UseTemplateDto,
    @Request() req: { user: { id: string } },
  ) {
    return this.templatesService.useTemplate(id, dto, req.user.id);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.templatesService.remove(id);
  }
}
