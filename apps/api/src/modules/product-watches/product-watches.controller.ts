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
import { ProductWatchesService } from './product-watches.service';
import { JwtAuthGuard } from '../../common/guards/auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('product-watches')
export class ProductWatchesController {
  constructor(private watchesService: ProductWatchesService) {}

  @Get()
  async getAll(@CurrentUser('teamId') teamId: string) {
    return { success: true, data: await this.watchesService.getAll(teamId) };
  }

  @Post()
  async create(
    @CurrentUser('teamId') teamId: string,
    @Body() body: any,
  ) {
    return {
      success: true,
      data: await this.watchesService.create(teamId, body),
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
      data: await this.watchesService.update(id, teamId, body),
    };
  }

  @Delete(':id')
  async delete(
    @Param('id') id: string,
    @CurrentUser('teamId') teamId: string,
  ) {
    return {
      success: true,
      data: await this.watchesService.remove(id, teamId),
    };
  }

  @Get('alerts')
  async getAlerts(
    @CurrentUser('teamId') teamId: string,
    @Query('unreadOnly') unreadOnly?: string,
  ) {
    return {
      success: true,
      data: await this.watchesService.getAlerts(
        teamId,
        unreadOnly === 'true',
      ),
    };
  }

  @Get('alerts/count')
  async getUnreadCount(@CurrentUser('teamId') teamId: string) {
    return {
      success: true,
      data: { count: await this.watchesService.getUnreadCount(teamId) },
    };
  }

  @Post('alerts/:id/read')
  async markRead(
    @Param('id') id: string,
    @CurrentUser('teamId') teamId: string,
  ) {
    return {
      success: true,
      data: await this.watchesService.markRead(id, teamId),
    };
  }

  @Post('alerts/read-all')
  async markAllRead(@CurrentUser('teamId') teamId: string) {
    return {
      success: true,
      data: await this.watchesService.markAllRead(teamId),
    };
  }
}
