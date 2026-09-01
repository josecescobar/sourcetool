import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { prisma } from '@sourcetool/db';

@Injectable()
export class BuyListsService {
  async getAll(teamId: string) {
    return prisma.buyList.findMany({
      where: { teamId },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { items: true } } },
    });
  }

  async getById(id: string, teamId: string) {
    const list = await prisma.buyList.findFirst({
      where: { id, teamId },
      include: {
        items: {
          orderBy: { addedAt: 'desc' },
          include: {
            product: { include: { listings: true } },
            analysis: true,
          },
        },
      },
    });
    if (!list) throw new NotFoundException('Buy list not found');
    return list;
  }

  async create(teamId: string, name: string) {
    return prisma.buyList.create({
      data: { teamId, name },
      include: { _count: { select: { items: true } } },
    });
  }

  async update(id: string, teamId: string, name: string) {
    const list = await prisma.buyList.findFirst({ where: { id, teamId } });
    if (!list) throw new NotFoundException('Buy list not found');

    return prisma.buyList.update({
      where: { id },
      data: { name },
      include: { _count: { select: { items: true } } },
    });
  }

  async delete(id: string, teamId: string) {
    const list = await prisma.buyList.findFirst({ where: { id, teamId } });
    if (!list) throw new NotFoundException('Buy list not found');

    await prisma.buyList.delete({ where: { id } });
    return { deleted: true };
  }

  async addItem(
    listId: string,
    teamId: string,
    input: { productId: string; analysisId?: string; notes?: string },
  ) {
    const list = await prisma.buyList.findFirst({
      where: { id: listId, teamId },
    });
    if (!list) throw new NotFoundException('Buy list not found');

    const existing = await prisma.buyListItem.findFirst({
      where: { buyListId: listId, productId: input.productId },
    });
    if (existing) {
      throw new ConflictException('Product already exists in this list');
    }

    return prisma.buyListItem.create({
      data: {
        buyListId: listId,
        productId: input.productId,
        analysisId: input.analysisId,
        notes: input.notes,
      },
      include: {
        product: { include: { listings: true } },
        analysis: true,
      },
    });
  }

  async addItemsBatch(
    listId: string,
    teamId: string,
    items: Array<{ productId: string; analysisId?: string; notes?: string }>,
  ) {
    const list = await prisma.buyList.findFirst({
      where: { id: listId, teamId },
    });
    if (!list) throw new NotFoundException('Buy list not found');

    const existing = await prisma.buyListItem.findMany({
      where: {
        buyListId: listId,
        productId: { in: items.map((i) => i.productId) },
      },
      select: { productId: true },
    });
    const existingIds = new Set(existing.map((e: { productId: string }) => e.productId));

    const toAdd = items.filter((i) => !existingIds.has(i.productId));

    const created = await prisma.$transaction(
      toAdd.map((item) =>
        prisma.buyListItem.create({
          data: {
            buyListId: listId,
            productId: item.productId,
            analysisId: item.analysisId,
            notes: item.notes,
          },
          include: {
            product: { include: { listings: true } },
            analysis: true,
          },
        }),
      ),
    );

    return {
      added: created.length,
      skipped: items.length - created.length,
      items: created,
    };
  }

  async removeItem(listId: string, itemId: string, teamId: string) {
    const list = await prisma.buyList.findFirst({
      where: { id: listId, teamId },
    });
    if (!list) throw new NotFoundException('Buy list not found');

    const item = await prisma.buyListItem.findFirst({
      where: { id: itemId, buyListId: listId },
    });
    if (!item) throw new NotFoundException('Item not found');

    await prisma.buyListItem.delete({ where: { id: itemId } });
    return { deleted: true };
  }
}
