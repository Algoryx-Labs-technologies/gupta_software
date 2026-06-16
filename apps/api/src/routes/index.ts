import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes.js';
import usersRoutes from '../modules/users/users.routes.js';
import sitesRoutes from '../modules/sites/sites.routes.js';
import vendorsRoutes from '../modules/vendors/vendors.routes.js';
import itemsRoutes from '../modules/items/items.routes.js';
import purchasesRoutes from '../modules/purchases/purchases.routes.js';
import tendersRoutes from '../modules/tenders/tenders.routes.js';
import stockRoutes from '../modules/stock/stock.routes.js';
import inventoryRoutes from '../modules/inventory/inventory.routes.js';
import labourExpensesRoutes from '../modules/labour-expenses/labour-expenses.routes.js';
import employeesRoutes from '../modules/employees/employees.routes.js';
import dashboardRoutes from '../modules/dashboard/dashboard.routes.js';
import activityRoutes from '../modules/activity/activity.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/sites', sitesRoutes);
router.use('/vendors', vendorsRoutes);
router.use('/items', itemsRoutes);
router.use('/purchases', purchasesRoutes);
router.use('/tenders', tendersRoutes);
router.use('/stock', stockRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/labour-expenses', labourExpensesRoutes);
router.use('/employees', employeesRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/activity', activityRoutes);

export default router;
