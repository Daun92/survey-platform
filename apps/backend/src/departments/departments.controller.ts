import { Controller, Get, Post, Body, Param, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { DepartmentsService } from './departments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { IsString, MaxLength, IsOptional } from 'class-validator';

export class CreateDepartmentDto {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsString()
  @MaxLength(20)
  code: string;

  @IsOptional()
  @IsString()
  description?: string;
}

@Controller('departments')
export class DepartmentsController {
  constructor(private deptService: DepartmentsService) {}

  @Get()
  findAll() {
    return this.deptService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.deptService.findById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateDepartmentDto) {
    return this.deptService.create(dto);
  }
}
