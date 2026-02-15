import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SourcedProductsService } from './sourced-products.service';
import { JwtAuthGuard } from '../../common/guards/auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('sourced-products')
export class SourcedProductsController {
  constructor(private sourcedProductsService: SourcedProductsService) {}

  @Get()
  async getAll(
    @CurrentUser('teamId') teamId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return {
      success: true,
      ...(await this.sourcedProductsService.getAll(
        teamId,
        Number(page) || 1,
        Number(limit) || 20,
      )),
    };
  }

  @Get(':id')
  async getById(
    @Param('id') id: string,
    @CurrentUser('teamId') teamId: string,
  ) {
    return {
      success: true,
      data: await this.sourcedProductsService.getById(id, teamId),
    };
  }

  @Post()
  async create(
    @CurrentUser('teamId') teamId: string,
    @Body() body: any,
  ) {
    return {
      success: true,
      data: await this.sourcedProductsService.create(teamId, body),
    };
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @CurrentUser('teamId') teamId: string,
    @Body() body: any,
  ) {
    return {
      success: true,
      data: await this.sourcedProductsService.update(id, teamId, body),
    };
  }

  @Delete(':id')
  async delete(
    @Param('id') id: string,
    @CurrentUser('teamId') teamId: string,
  ) {
    return {
      success: true,
      data: await this.sourcedProductsService.remove(id, teamId),
    };
  }
}
