import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@sourcetool/db';

@Injectable()
export class SavedSearchesService {
  async getAll(teamId: string) {
    return prisma.savedSearch.findMany({
      where: { teamId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(
    teamId: string,
    userId: string,
    input: { query: string; marketplace?: string; filters?: any },
  ) {
    return prisma.savedSearch.create({
      data: {
        teamId,
        userId,
        query: input.query,
        marketplace: input.marketplace as any,
        filters: input.filters,
      },
    });
  }

  async remove(id: string, teamId: string) {
    const search = await prisma.savedSearch.findFirst({
      where: { id, teamId },
    });
    if (!search) throw new NotFoundException('Saved search not found');

    await prisma.savedSearch.delete({ where: { id } });
    return { deleted: true };
  }
}
