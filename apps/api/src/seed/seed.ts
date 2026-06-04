import bcrypt from 'bcryptjs';
import { Role, TenderStatus, computePurchaseTotals, computePurchaseAggregateTotals } from '@gupta/shared';
import { connectDb, disconnectDb } from '../config/db.js';
import { UserModel } from '../models/User.js';
import { SiteModel } from '../models/Site.js';
import { VendorModel } from '../models/Vendor.js';
import { ItemModel } from '../models/Item.js';
import { PurchaseModel } from '../models/Purchase.js';
import { TenderModel } from '../models/Tender.js';
import { LabourExpenseModel } from '../models/LabourExpense.js';
import { StockModel } from '../models/Stock.js';

const TEAM_PASSWORD = 'Team@12345';

async function seed() {
  await connectDb();

  console.log('Clearing existing data...');
  await Promise.all([
    UserModel.deleteMany({}),
    SiteModel.deleteMany({}),
    VendorModel.deleteMany({}),
    ItemModel.deleteMany({}),
    PurchaseModel.deleteMany({}),
    TenderModel.deleteMany({}),
    LabourExpenseModel.deleteMany({}),
    StockModel.deleteMany({}),
  ]);

  const passwordHash = await bcrypt.hash(TEAM_PASSWORD, 12);
  const operator = await UserModel.create({
    name: 'Sample Operator',
    email: 'operator@example.com',
    passwordHash,
    role: Role.DATA_OPERATOR,
  });

  await UserModel.create({
    name: 'Sample Accountant',
    email: 'accountant@example.com',
    passwordHash: await bcrypt.hash(TEAM_PASSWORD, 12),
    role: Role.ACCOUNTANT,
  });

  console.log('\n========================================');
  console.log('Admin login (apps/api/.env):');
  console.log('  Use ADMIN_LOGIN_ID + ADMIN_PASSWORD → Admin tab on login');
  console.log('\nTeam login (sample users):');
  console.log('  Email:    operator@example.com');
  console.log('  Password: ' + TEAM_PASSWORD);
  console.log('  Email:    accountant@example.com');
  console.log('  Password: ' + TEAM_PASSWORD);
  console.log('========================================\n');

  const sites = await SiteModel.insertMany([
    { name: 'T260', code: 'T260', location: 'Ahmedabad' },
    { name: 'Anand-Godhra', code: 'AN-GD', location: 'Gujarat' },
    { name: 'Bilaspur', code: 'BLP', location: 'Chhattisgarh' },
    { name: 'Sabarmati', code: 'SBR', location: 'Ahmedabad' },
    { name: 'Mehsana', code: 'MHS', location: 'Gujarat' },
  ]);

  const vendors = await VendorModel.insertMany([
    { name: 'AMIT CORPORATION', phone: '9876543210', gstin: '24AAAAA0000A1Z5' },
    { name: 'MAHADEV ELECTRICALS', phone: '9876543211' },
    { name: 'RITMANN WOOD WORKING CO.', contactPerson: 'Mr. Ritmann' },
    { name: 'SHREE STEEL TRADERS', gstin: '24BBBBB0000B1Z5' },
  ]);

  const items = await ItemModel.insertMany([
    { name: 'FAN', category: 'Electrical', defaultUnit: 'NOS' },
    { name: '25MM WIRE', category: 'Electrical', defaultUnit: 'RFT' },
    { name: '150MM GI PIPE', category: 'Plumbing', defaultUnit: 'RFT' },
    { name: 'BUTTERFLY VALVE', category: 'Plumbing', defaultUnit: 'NOS' },
    { name: 'FLOW METER', category: 'Instrumentation', defaultUnit: 'NOS' },
    { name: 'PUMP', category: 'Mechanical', defaultUnit: 'NOS' },
  ]);

  const purchase1Items = [
    {
      itemDescription: 'CEILING FAN 1200MM',
      item: items[0]._id,
      qty: 10,
      unit: 'NOS',
      perRate: 2500,
      freight: 500,
      labour: 200,
      gstPercent: 18,
      isHmPurchase: false,
      ...computePurchaseTotals({ qty: 10, perRate: 2500, freight: 500, labour: 200, gstPercent: 18 }),
    },
    {
      itemDescription: 'LED BULB 9W',
      qty: 50,
      unit: 'NOS',
      perRate: 120,
      freight: 0,
      labour: 0,
      gstPercent: 18,
      isHmPurchase: false,
      ...computePurchaseTotals({ qty: 50, perRate: 120, freight: 0, labour: 0, gstPercent: 18 }),
    },
  ];

  const purchase2Items = [
    {
      itemDescription: '25MM COPPER WIRE',
      item: items[1]._id,
      qty: 587.22,
      unit: 'SQFT',
      perRate: 45,
      freight: 1200,
      labour: 0,
      gstPercent: 18,
      isHmPurchase: true,
      ...computePurchaseTotals({ qty: 587.22, perRate: 45, freight: 1200, labour: 0, gstPercent: 18 }),
    },
  ];

  const purchase3Items = [
    {
      itemDescription: 'WOODEN DOOR FRAME',
      qty: 5,
      unit: 'NOS',
      perRate: 8500,
      freight: 0,
      labour: 1500,
      gstPercent: 18,
      isHmPurchase: false,
      ...computePurchaseTotals({ qty: 5, perRate: 8500, freight: 0, labour: 1500, gstPercent: 18 }),
    },
  ];

  const tenders = await TenderModel.insertMany([
    {
      serialNo: 1,
      tenderName: 'Water Supply Pipeline Project',
      tenderNo: 'TND-2025-WS-001',
      orderValue: 25000000,
      emd: 500000,
      pg: 1250000,
      sdFromBill: 250000,
      paymentReceivedTillDate: 15000000,
      paymentOutstanding: 10000000,
      executionPending: 8000000,
      workCompleted: 17000000,
      bgNumber: 'BG-WS-2025-001',
      bgExpiryDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      status: TenderStatus.ACTIVE,
      sites: [
        { site: sites[0]._id, siteNameRaw: sites[0].name },
        { site: sites[1]._id, siteNameRaw: sites[1].name },
      ],
      createdBy: operator._id,
    },
    {
      serialNo: 2,
      tenderName: 'Electrical Infrastructure Upgrade',
      tenderNo: 'TND-2025-EL-002',
      orderValue: 8500000,
      emd: 170000,
      pg: 425000,
      sdFromBill: 85000,
      paymentReceivedTillDate: 8500000,
      paymentOutstanding: 0,
      executionPending: 0,
      workCompleted: 8500000,
      bgNumber: 'BG-EL-2025-002',
      bgExpiryDate: new Date('2025-08-15'),
      status: TenderStatus.COMPLETED,
      sites: [{ site: sites[3]._id, siteNameRaw: sites[3].name }],
      createdBy: operator._id,
    },
    {
      serialNo: 3,
      tenderName: 'Site Development Phase II',
      tenderNo: 'TND-2026-SD-003',
      orderValue: 12000000,
      emd: 240000,
      pg: 600000,
      sdFromBill: 120000,
      paymentReceivedTillDate: 0,
      paymentOutstanding: 12000000,
      executionPending: 12000000,
      workCompleted: 0,
      status: TenderStatus.PENDING,
      sites: [
        { site: sites[2]._id, siteNameRaw: sites[2].name },
        { site: sites[4]._id, siteNameRaw: sites[4].name },
      ],
      createdBy: operator._id,
    },
  ]);

  await PurchaseModel.insertMany([
    {
      serialNo: 1,
      vendor: vendors[0]._id,
      vendorNameRaw: vendors[0].name,
      tender: tenders[0]._id,
      billDate: new Date('2025-11-15'),
      billNo: 'BILL-2025-001',
      site: sites[0]._id,
      siteNameRaw: sites[0].name,
      items: purchase1Items,
      ...computePurchaseAggregateTotals(purchase1Items),
      createdBy: operator._id,
    },
    {
      serialNo: 2,
      vendor: vendors[1]._id,
      vendorNameRaw: vendors[1].name,
      tender: tenders[0]._id,
      billDate: new Date('2025-12-01'),
      billNo: 'ME-4521',
      site: sites[1]._id,
      siteNameRaw: sites[1].name,
      items: purchase2Items,
      ...computePurchaseAggregateTotals(purchase2Items),
      createdBy: operator._id,
    },
    {
      serialNo: 3,
      vendor: vendors[2]._id,
      vendorNameRaw: vendors[2].name,
      tender: tenders[2]._id,
      billDate: new Date('2026-01-10'),
      billNo: 'RW-889',
      site: sites[2]._id,
      siteNameRaw: sites[2].name,
      items: purchase3Items,
      ...computePurchaseAggregateTotals(purchase3Items),
      createdBy: operator._id,
    },
  ]);

  await LabourExpenseModel.insertMany([
    {
      tender: tenders[0]._id,
      site: sites[0]._id,
      siteNameRaw: sites[0].name,
      amount: 45000,
      expenseDate: new Date('2025-11-20'),
      description: 'Loading and unloading labour',
      createdBy: operator._id,
    },
    {
      tender: tenders[0]._id,
      site: sites[1]._id,
      siteNameRaw: sites[1].name,
      amount: 28000,
      expenseDate: new Date('2025-12-05'),
      description: 'Site supervision labour',
      createdBy: operator._id,
    },
    {
      tender: tenders[2]._id,
      site: sites[2]._id,
      siteNameRaw: sites[2].name,
      amount: 62000,
      expenseDate: new Date('2026-01-15'),
      createdBy: operator._id,
    },
  ]);

  const stockData = [
    { item: items[0]._id, site: sites[0]._id, quantity: 25 },
    { item: items[0]._id, site: sites[1]._id, quantity: 10 },
    { item: items[1]._id, site: sites[0]._id, quantity: 500 },
    { item: items[2]._id, site: sites[2]._id, quantity: 120 },
    { item: items[3]._id, site: sites[3]._id, quantity: 8 },
    { item: items[4]._id, site: sites[4]._id, quantity: 3 },
    { item: items[5]._id, site: sites[0]._id, quantity: 2 },
  ];

  await StockModel.insertMany(
    stockData.map((s) => ({ ...s, specification: '', unit: '' })),
  );

  console.log('Seed completed successfully!');
  await disconnectDb();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
