import mongoose, { type FilterQuery, Types } from 'mongoose';
import {
  InventoryDirection,
  InventoryMovementType,
  type AllocateStockInput,
  type ConsumeStockInput,
  type InventoryLedgerFilterInput,
} from '@gupta/shared';
import { InventoryLedgerModel, type IInventoryLedger } from '../../models/InventoryLedger.js';
import { PurchaseModel, type IPurchase } from '../../models/Purchase.js';
import { SiteModel } from '../../models/Site.js';
import { ItemModel } from '../../models/Item.js';
import { resolveCreatedByRef } from '../../config/admin.js';
import { ApiError } from '../../utils/ApiError.js';
import { getPagination, buildPaginationMeta } from '../../utils/pagination.js';

export function buildItemKey(itemId?: string | Types.ObjectId | null, itemDescription?: string) {
  if (itemId) return `item:${itemId.toString()}`;
  return `desc:${(itemDescription ?? '').trim().toLowerCase()}`;
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function resolvePurchaseSiteId(purchase: {
  site?: Types.ObjectId | string | null;
  siteNameRaw?: string;
}) {
  if (purchase.site) {
    return typeof purchase.site === 'string'
      ? new mongoose.Types.ObjectId(purchase.site)
      : purchase.site;
  }

  const siteName = purchase.siteNameRaw?.trim();
  if (!siteName) return null;

  const pattern = new RegExp(`^${escapeRegex(siteName)}$`, 'i');
  let site = await SiteModel.findOne({ $or: [{ name: pattern }, { code: pattern }] });

  if (!site) {
    const baseCode = siteName.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12) || 'SITE';
    let code = baseCode;
    let suffix = 1;
    while (await SiteModel.exists({ code })) {
      code = `${baseCode}${suffix}`;
      suffix += 1;
    }
    site = await SiteModel.create({ name: siteName, code });
  }

  return site._id;
}

function signedQuantity(direction: InventoryDirection, quantity: number) {
  return direction === InventoryDirection.IN ? quantity : -quantity;
}

function buildItemBalanceFilter(itemId?: string, itemDescription?: string): FilterQuery<IInventoryLedger> {
  if (itemId) return { item: itemId };
  return {
    $or: [{ item: { $exists: false } }, { item: null }],
    itemDescription: itemDescription ?? '',
  };
}

export async function getBalanceAtSite(siteId: string, itemId?: string, itemDescription?: string) {
  const entries = await InventoryLedgerModel.find({
    site: siteId,
    ...buildItemBalanceFilter(itemId, itemDescription ?? ''),
  }).lean();

  return entries.reduce(
    (sum, entry) => sum + signedQuantity(entry.direction as InventoryDirection, entry.quantity),
    0,
  );
}

async function assertSufficientStock(
  siteId: string,
  itemId: string | undefined,
  itemDescription: string,
  quantity: number,
) {
  const balance = await getBalanceAtSite(siteId, itemId, itemDescription);
  if (balance < quantity) {
    throw new ApiError(400, `Insufficient stock. Available: ${balance}, requested: ${quantity}`);
  }
}

export async function syncPurchaseLedger(purchase: IPurchase, userId?: string) {
  const siteId = await resolvePurchaseSiteId(purchase);
  if (!siteId) return;

  if (!purchase.site) {
    await PurchaseModel.updateOne({ _id: purchase._id }, { site: siteId });
    purchase.site = siteId;
  }

  await InventoryLedgerModel.deleteMany({
    purchaseId: purchase._id,
    movementType: InventoryMovementType.PURCHASE_IN,
  });

  const docs = purchase.items
    .filter((line) => (line.qty ?? 0) > 0)
    .map((line) => ({
      movementType: InventoryMovementType.PURCHASE_IN,
      direction: InventoryDirection.IN,
      item: line.item,
      itemDescription: line.itemDescription,
      unit: line.unit,
      site: siteId,
      quantity: line.qty ?? 0,
      purchaseId: purchase._id,
      purchaseItemId: line._id?.toString(),
      purchaseSerialNo: purchase.serialNo,
      billNo: purchase.billNo,
      createdBy: resolveCreatedByRef(userId),
    }));

  if (docs.length) await InventoryLedgerModel.insertMany(docs);
}

export async function removePurchaseLedger(purchaseId: string) {
  await InventoryLedgerModel.deleteMany({ purchaseId });
}

export async function backfillPurchaseLedger(userId?: string) {
  const purchases = await PurchaseModel.find({
    siteNameRaw: { $exists: true, $ne: '' },
  }).lean();
  let created = 0;

  for (const purchase of purchases) {
    const existing = await InventoryLedgerModel.countDocuments({
      purchaseId: purchase._id,
      movementType: InventoryMovementType.PURCHASE_IN,
    });
    if (existing > 0) continue;
    await syncPurchaseLedger(purchase as unknown as IPurchase, userId);
    created += 1;
  }

  return { syncedPurchases: created };
}

export async function getOverview() {
  await backfillPurchaseLedger();

  const [sites, itemDocs, balanceRows] = await Promise.all([
    SiteModel.find().sort({ name: 1 }).select('name code').lean(),
    ItemModel.find().select('name defaultUnit').lean(),
    InventoryLedgerModel.aggregate<{
      _id: { site: Types.ObjectId; item?: Types.ObjectId; itemDescription: string };
      quantity: number;
    }>([
      {
        $group: {
          _id: { site: '$site', item: '$item', itemDescription: '$itemDescription' },
          quantity: {
            $sum: {
              $cond: [
                { $eq: ['$direction', InventoryDirection.IN] },
                '$quantity',
                { $multiply: ['$quantity', -1] },
              ],
            },
          },
        },
      },
      { $match: { quantity: { $ne: 0 } } },
    ]),
  ]);

  const itemNameMap = new Map(itemDocs.map((item) => [item._id.toString(), item.name]));
  const itemUnitMap = new Map(itemDocs.map((item) => [item._id.toString(), item.defaultUnit]));
  const itemMap = new Map<
    string,
    { key: string; itemId?: string; name: string; itemDescription: string; unit?: string }
  >();

  for (const row of balanceRows) {
    const itemId = row._id.item?.toString();
    const key = buildItemKey(itemId, row._id.itemDescription);
    if (itemMap.has(key)) continue;
    itemMap.set(key, {
      key,
      itemId,
      name: itemId ? (itemNameMap.get(itemId) ?? row._id.itemDescription) : row._id.itemDescription,
      itemDescription: row._id.itemDescription,
      unit: itemId ? itemUnitMap.get(itemId) : undefined,
    });
  }

  const items = [...itemMap.values()].sort((a, b) => a.name.localeCompare(b.name));
  const cells = balanceRows
    .map((row) => {
      const itemId = row._id.item?.toString();
      return {
        itemKey: buildItemKey(itemId, row._id.itemDescription),
        siteId: row._id.site.toString(),
        quantity: Math.round(row.quantity * 100) / 100,
      };
    })
    .filter((cell) => cell.quantity !== 0);

  const purchaseRefs = await InventoryLedgerModel.find({
    movementType: InventoryMovementType.PURCHASE_IN,
  })
    .sort({ createdAt: -1 })
    .select('item itemDescription site billNo')
    .lean();

  const purchaseRefMap = new Map<string, { billNo?: string }>();
  for (const ref of purchaseRefs) {
    const refKey = `${buildItemKey(ref.item?.toString(), ref.itemDescription)}:${ref.site.toString()}`;
    if (!purchaseRefMap.has(refKey)) {
      purchaseRefMap.set(refKey, { billNo: ref.billNo });
    }
  }

  const siteMap = new Map(sites.map((site) => [site._id.toString(), site]));
  const stockLines = cells
    .filter((cell) => cell.quantity > 0)
    .map((cell) => {
      const item = items.find((entry) => entry.key === cell.itemKey);
      const site = siteMap.get(cell.siteId);
      const ref = purchaseRefMap.get(`${cell.itemKey}:${cell.siteId}`);
      return {
        itemKey: cell.itemKey,
        itemId: item?.itemId,
        itemName: item?.name ?? '',
        itemDescription: item?.itemDescription ?? item?.name ?? '',
        unit: item?.unit,
        siteId: cell.siteId,
        siteCode: site?.code ?? '',
        siteName: site?.name ?? '',
        quantity: cell.quantity,
        billNo: ref?.billNo,
      };
    })
    .sort((a, b) => a.itemName.localeCompare(b.itemName) || a.siteName.localeCompare(b.siteName));

  return { items, sites, cells, stockLines };
}

export async function getReceipts() {
  await backfillPurchaseLedger();

  const purchases = await PurchaseModel.find({
    siteNameRaw: { $exists: true, $ne: '' },
  })
    .sort({ billDate: -1 })
    .lean();

  const receipts = [];

  for (const purchase of purchases) {
    const siteId = await resolvePurchaseSiteId(purchase);
    if (!siteId) continue;

    const site = await SiteModel.findById(siteId).select('name code').lean();
    if (!site) continue;

    for (const line of purchase.items) {
      const itemId = line.item?.toString();
      const receivedQty = line.qty ?? 0;
      if (receivedQty <= 0) continue;

      const balanceQty = await getBalanceAtSite(siteId.toString(), itemId, line.itemDescription);

      receipts.push({
        purchaseId: purchase._id.toString(),
        purchaseSerialNo: purchase.serialNo,
        billNo: purchase.billNo,
        billName: purchase.billName,
        billDate: purchase.billDate,
        siteId: siteId.toString(),
        siteName: site.name,
        siteCode: site.code,
        purchaseItemId: line._id?.toString() ?? '',
        itemId,
        itemKey: buildItemKey(itemId, line.itemDescription),
        itemDescription: line.itemDescription,
        unit: line.unit,
        receivedQty,
        balanceQty: Math.max(0, Math.round(balanceQty * 100) / 100),
      });
    }
  }

  return receipts;
}

export async function allocateStock(input: AllocateStockInput, userId?: string) {
  let toSiteId = input.toSiteId;
  if (!toSiteId && input.toSiteName) {
    const resolved = await resolvePurchaseSiteId({ siteNameRaw: input.toSiteName });
    if (!resolved) throw new ApiError(400, 'Could not resolve destination site');
    toSiteId = resolved.toString();
  }
  if (!toSiteId) throw new ApiError(400, 'Destination site is required');

  if (input.fromSiteId === toSiteId) {
    throw new ApiError(400, 'Source and destination sites must be different');
  }

  await assertSufficientStock(
    input.fromSiteId,
    input.itemId,
    input.itemDescription,
    input.quantity,
  );

  const base = {
    movementType: InventoryMovementType.ALLOCATION,
    item: input.itemId,
    itemDescription: input.itemDescription,
    unit: input.unit,
    quantity: input.quantity,
    notes: input.notes,
    createdBy: resolveCreatedByRef(userId),
  };

  await InventoryLedgerModel.insertMany([
    { ...base, direction: InventoryDirection.OUT, site: input.fromSiteId, fromSite: input.fromSiteId, toSite: toSiteId },
    { ...base, direction: InventoryDirection.IN, site: toSiteId, fromSite: input.fromSiteId, toSite: toSiteId },
  ]);

  return { message: 'Stock allocated successfully' };
}

export async function consumeStock(input: ConsumeStockInput, userId?: string) {
  await assertSufficientStock(input.siteId, input.itemId, input.itemDescription, input.quantity);

  await InventoryLedgerModel.create({
    movementType: InventoryMovementType.CONSUMPTION,
    direction: InventoryDirection.OUT,
    item: input.itemId,
    itemDescription: input.itemDescription,
    unit: input.unit,
    site: input.siteId,
    quantity: input.quantity,
    notes: input.notes,
    createdBy: resolveCreatedByRef(userId),
  });

  return { message: 'Stock issued successfully' };
}

export async function listLedger(filters: InventoryLedgerFilterInput) {
  const { page, limit, site, itemId, movementType } = filters;
  const { skip } = getPagination(page, limit);
  const query: FilterQuery<IInventoryLedger> = {};

  if (site) query.site = site;
  if (itemId) query.item = itemId;
  if (movementType) query.movementType = movementType;

  const [data, total] = await Promise.all([
    InventoryLedgerModel.find(query)
      .populate('site', 'name code')
      .populate('fromSite', 'name code')
      .populate('toSite', 'name code')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    InventoryLedgerModel.countDocuments(query),
  ]);

  const entries = data.map((entry) => {
    const siteDoc = entry.site as unknown as { _id: Types.ObjectId; name: string; code: string } | undefined;
    const fromSiteDoc = entry.fromSite as unknown as { name: string } | undefined;
    const toSiteDoc = entry.toSite as unknown as { name: string } | undefined;
    const createdByDoc = entry.createdBy as unknown as { name: string } | undefined;

    return {
      _id: entry._id.toString(),
      movementType: entry.movementType,
      direction: entry.direction,
      item: entry.item?.toString(),
      itemDescription: entry.itemDescription,
      unit: entry.unit,
      site: siteDoc?._id?.toString() ?? entry.site.toString(),
      siteName: siteDoc?.name,
      siteCode: siteDoc?.code,
      quantity: entry.quantity,
      fromSite: entry.fromSite?.toString(),
      fromSiteName: fromSiteDoc?.name,
      toSite: entry.toSite?.toString(),
      toSiteName: toSiteDoc?.name,
      purchaseId: entry.purchaseId?.toString(),
      purchaseSerialNo: entry.purchaseSerialNo,
      billNo: entry.billNo,
      notes: entry.notes,
      createdBy: entry.createdBy?.toString(),
      createdByName: createdByDoc?.name,
      createdAt: entry.createdAt,
    };
  });

  return { data: entries, meta: buildPaginationMeta(page, limit, total) };
}
