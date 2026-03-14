import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { IsString, MaxLength, IsOptional } from 'class-validator';
import { APP_CONSTANTS } from '@survey/shared';

export class CreateProjectDto {
  @IsString()
  @MaxLength(APP_CONSTANTS.MAX_SURVEY_TITLE_LENGTH)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateProjectDto {
  @IsOptional()
  @IsString()
  @MaxLength(APP_CONSTANTS.MAX_SURVEY_TITLE_LENGTH)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(private projectsService: ProjectsService) {}

  @Get()
  findAll() {
    return this.projectsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.projectsService.findById(id);
  }

  @Post()
  create(@Body() dto: CreateProjectDto, @Request() req: { user: { id: string } }) {
    return this.projectsService.create({ ...dto, ownerId: req.user.id });
  }

  @Put(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProjectDto,
    @Request() req: { user: { id: string; role: string } },
  ) {
    return this.projectsService.update(id, dto, req.user.id, req.user.role);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: { user: { id: string; role: string } },
  ) {
    return this.projectsService.remove(id, req.user.id, req.user.role);
  }
}
