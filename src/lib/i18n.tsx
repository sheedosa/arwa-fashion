import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import type { Lang } from './types'

// Dictionary ported from the Claude Design prototype (project/Arwa Fashion.dc.html
// `this.T`), extended with the Phase 2 modules (purchasing, expenses, stock counts,
// reports) that had no screens in the original design.
const dict = {
  ar: {
    brand: 'أروى فاشن', tagline: 'إدارة فروع طرابلس والمبيعات', loginAs: 'دخول',
    dashboard: 'لوحة المالك', pos: 'نقطة البيع', inventory: 'المخزون', products: 'المنتجات',
    returns: 'المرتجعات', transfers: 'التحويلات', customers: 'العملاء', recon: 'إقفال الصندوق', logout: 'خروج',
    purchasing: 'المشتريات', expenses: 'المصروفات', stockCounts: 'الجرد', reports: 'التقارير',
    offlineBanner: 'لا يوجد اتصال — تُحفظ المبيعات محليًا وتُزامَن عند عودة الشبكة', inQueue: 'بانتظار المزامنة',
    searchPos: 'ابحث بالاسم أو امسح الباركود ثم Enter…', search: 'بحث…', outStock: 'نافد', elsewhere: 'متوفر في',
    cart: 'السلة', emptyCart: 'السلة فارغة — اختر صنفًا أو امسح باركود', lineDisc: 'خصم %', subtotal: 'المجموع',
    orderDisc: 'خصم الفاتورة %', total: 'الإجمالي', pay: 'الدفع',
    payTitle: 'تحصيل الدفعة', payUsdL: 'دولار أمريكي $', payLydL: 'دينار ليبي د.ل', exact: 'المتبقي',
    method: 'طريقة الدفع', cash: 'نقدًا', card: 'بطاقة', bank: 'حوالة',
    custPhone: 'هاتف العميل (اختياري)', paid: 'المدفوع', remaining: 'المتبقي', change: 'الباقي للعميل',
    complete: 'إتمام البيع', receipt: 'إيصال', newSale: 'بيع جديد', print: 'طباعة', whatsapp: 'واتساب',
    queuedNote: 'حُفظ محليًا — سيُزامَن تلقائيًا', thanks: 'شكرًا لتسوقكم من أروى فاشن', product: 'المنتج',
    qty: 'الكمية', branch: 'الفرع', dateL: 'التاريخ', seller: 'البائع', lastMovs: 'آخر حركات المخزون',
    style: 'كود الموديل', category: 'الفئة', priceL: 'السعر $', costL: 'التكلفة $', variantsL: 'المقاسات × الألوان',
    newProduct: 'منتج جديد', nameAr: 'الاسم (عربي)', nameEn: 'الاسم (إنجليزي)', sizesL: 'المقاسات', colorsL: 'الألوان',
    save: 'حفظ المنتج', cancel: 'إلغاء', stockNote: 'الكميات تُضاف عبر استلام شحنة — المخزون لا يُعدَّل يدويًا أبدًا',
    findSale: 'ابحث برقم الإيصال أو هاتف العميل…', reason: 'سبب الإرجاع', refund: 'قيمة الاسترجاع',
    processRet: 'تنفيذ الإرجاع واستعادة المخزون', backList: 'رجوع', choose: 'اختيار',
    wrongSize: 'مقاس غير مناسب', defect: 'عيب مصنعي', changedMind: 'تغيير رأي',
    retDone: 'تم الإرجاع وأُعيدت الكمية إلى المخزون',
    newTransfer: 'طلب تحويل بين الفروع', from: 'من', to: 'إلى', item: 'الصنف', status: 'الحالة',
    request: 'إرسال الطلب', statusReq: 'مطلوب', statusSent: 'قيد النقل', statusRec: 'تم الاستلام',
    send: 'إرسال', receive: 'استلام',
    name: 'الاسم', phone: 'الهاتف', points: 'النقاط', lastBuy: 'آخر شراء', addCust: 'إضافة',
    sizesPref: 'المقاسات المفضلة', history: 'سجل المشتريات', custNew: 'عميل جديد من رقم الهاتف',
    openFloat: 'رصيد الافتتاح', expected: 'المتوقع بالصندوق', counted: 'المعدود فعليًا', variance: 'الفرق',
    closeDay: 'إقفال اليوم', dayClosedMsg: 'أُقفل اليوم — مبيعات هذا اليوم مقفلة ولا تُعدَّل', cashSales: 'نقدي اليوم',
    todaySales: 'مبيعات اليوم', todayUnits: 'قطع اليوم', monthSales: 'مبيعات الشهر', monthMargin: 'هامش الشهر',
    topSellers: 'الأكثر مبيعًا هذا الشهر', byBranch: 'حسب الفرع', revenue: 'الإيراد', units: 'القطع', margin: 'الهامش',
    allUsd: 'كل الأرقام بالدولار الأمريكي', roleOwner: 'المالكة', roleManager: 'مدير فرع', roleCashier: 'كاشير',
    syncedMsg: 'تمت مزامنة المبيعات المعلقة', added: 'أُضيف', noStock: 'الكمية غير متوفرة بهذا الفرع',
    trDone: 'تم تحديث التحويل', custAdded: 'أُضيف العميل', prodAdded: 'أُنشئ المنتج بكل المتغيرات',
    closedT: 'أُقفل صندوق اليوم', export: 'تصدير CSV', all: 'الكل', noResults: 'لا توجد نتائج مطابقة',
    navSell: 'البيع', navStock: 'المخزون', navManage: 'الإدارة', menu: 'القائمة', close: 'إغلاق', removeLine: 'حذف', details: 'تفاصيل',
    // Phase 2
    suppliers: 'الموردون', newPo: 'أمر شراء جديد', supplier: 'المورد', poId: 'رقم الأمر', ordered: 'مطلوب',
    received: 'مستلم', unitCost: 'سعر الوحدة $', landedCost: 'التكلفة الواصلة $', freight: 'الشحن $',
    customs: 'الجمارك $', clearing: 'التخليص $', receivePo: 'استلام الشحنة', poStatus: 'حالة الأمر',
    poDraft: 'مسودة', poOrdered: 'مطلوب', poPartial: 'استلام جزئي', poReceived: 'مستلم بالكامل', poClosed: 'مغلق',
    addItem: 'إضافة صنف', createPo: 'إنشاء الأمر', allocNote: 'تُوزَّع الشحن والجمارك والتخليص على الكمية المستلمة لحساب تكلفة الوحدة الواصلة',
    newExpense: 'مصروف جديد', amount: 'المبلغ $', description: 'الوصف', addExpense: 'إضافة المصروف',
    pnl: 'الأرباح والخسائر', consolidated: 'كل الفروع', cogs: 'تكلفة البضاعة المباعة', grossProfit: 'الربح الإجمالي',
    netProfit: 'صافي الربح', thisMonth: 'هذا الشهر', perBranch: 'حسب الفرع',
    catRent: 'إيجار', catSalaries: 'رواتب', catUtilities: 'مرافق', catMarketing: 'تسويق', catMaintenance: 'صيانة', catOther: 'أخرى',
    newCount: 'جلسة جرد جديدة', startCount: 'بدء الجرد', countSession: 'جلسة الجرد', expectedQty: 'المتوقع',
    countedQty: 'المعدود', varianceQty: 'الفرق', postAdjustment: 'ترحيل التسوية', postedNote: 'تم ترحيل التسوية إلى حركات المخزون',
    sessionOpen: 'مفتوحة', sessionPosted: 'مرحّلة', countedOfExpected: 'مُدخَل',
    sellThrough: 'نسبة البيع حسب الموديل', sizeRun: 'تحليل المقاسات', deadStock: 'الركود المخزني',
    marginByCategory: 'الهامش حسب الفئة', salesByPerson: 'أداء البائعين', daysInStock: 'أيام بالمخزون',
    sellThroughPct: 'نسبة البيع', sizeLabel: 'المقاس', soldPct: 'نسبة البيع', neverMoved: 'لم يتحرك',
  },
  en: {
    brand: 'Arwa Fashion', tagline: 'Tripoli multi-branch retail management', loginAs: 'Sign in',
    dashboard: 'Owner dashboard', pos: 'POS', inventory: 'Inventory', products: 'Products',
    returns: 'Returns', transfers: 'Transfers', customers: 'Customers', recon: 'Cash close', logout: 'Sign out',
    purchasing: 'Purchasing', expenses: 'Expenses', stockCounts: 'Stock counts', reports: 'Reports',
    offlineBanner: 'No connection — sales are saved locally and sync when back online', inQueue: 'pending sync',
    searchPos: 'Search or scan a barcode, then Enter…', search: 'Search…', outStock: 'Out', elsewhere: 'Available at',
    cart: 'Cart', emptyCart: 'Cart is empty — pick an item or scan a barcode', lineDisc: 'Disc %', subtotal: 'Subtotal',
    orderDisc: 'Order discount %', total: 'Total', pay: 'Pay',
    payTitle: 'Take payment', payUsdL: 'US Dollar $', payLydL: 'Libyan Dinar LYD', exact: 'Remainder',
    method: 'Method', cash: 'Cash', card: 'Card', bank: 'Transfer',
    custPhone: 'Customer phone (optional)', paid: 'Paid', remaining: 'Remaining', change: 'Change due',
    complete: 'Complete sale', receipt: 'Receipt', newSale: 'New sale', print: 'Print', whatsapp: 'WhatsApp',
    queuedNote: 'Saved locally — will sync automatically', thanks: 'Thank you for shopping at Arwa Fashion',
    product: 'Product', qty: 'Qty', branch: 'Branch', dateL: 'Date', seller: 'Seller', lastMovs: 'Latest stock movements',
    style: 'Style code', category: 'Category', priceL: 'Price $', costL: 'Cost $', variantsL: 'Sizes × colours',
    newProduct: 'New product', nameAr: 'Name (Arabic)', nameEn: 'Name (English)', sizesL: 'Sizes', colorsL: 'Colours',
    save: 'Save product', cancel: 'Cancel', stockNote: 'Quantities arrive via shipment receipts — stock is never edited by hand',
    findSale: 'Search by receipt no. or customer phone…', reason: 'Return reason', refund: 'Refund value',
    processRet: 'Process return & restock', backList: 'Back', choose: 'Open',
    wrongSize: 'Wrong size', defect: 'Manufacturing defect', changedMind: 'Changed mind',
    retDone: 'Returned — stock restored',
    newTransfer: 'New inter-branch transfer', from: 'From', to: 'To', item: 'Item', status: 'Status',
    request: 'Send request', statusReq: 'Requested', statusSent: 'In transit', statusRec: 'Received',
    send: 'Send', receive: 'Receive',
    name: 'Name', phone: 'Phone', points: 'Points', lastBuy: 'Last purchase', addCust: 'Add',
    sizesPref: 'Preferred sizes', history: 'Purchase history', custNew: 'Quick-create customer from phone',
    openFloat: 'Opening float', expected: 'Expected in drawer', counted: 'Counted', variance: 'Variance',
    closeDay: 'Close the day', dayClosedMsg: 'Day closed — today’s sales are locked', cashSales: 'Cash sales today',
    todaySales: 'Sales today', todayUnits: 'Units today', monthSales: 'Sales this month', monthMargin: 'Margin this month',
    topSellers: 'Top sellers this month', byBranch: 'By branch', revenue: 'Revenue', units: 'Units', margin: 'Margin',
    allUsd: 'All figures in USD', roleOwner: 'Owner', roleManager: 'Branch manager', roleCashier: 'Cashier',
    syncedMsg: 'Queued sales synced', added: 'Added', noStock: 'Not in stock at this branch',
    trDone: 'Transfer updated', custAdded: 'Customer added', prodAdded: 'Product created with all variants',
    closedT: 'Day closed', export: 'Export CSV', all: 'All', noResults: 'No matching items',
    navSell: 'Selling', navStock: 'Stock', navManage: 'Manage', menu: 'Menu', close: 'Close', removeLine: 'Remove', details: 'Details',
    // Phase 2
    suppliers: 'Suppliers', newPo: 'New purchase order', supplier: 'Supplier', poId: 'PO #', ordered: 'Ordered',
    received: 'Received', unitCost: 'Unit cost $', landedCost: 'Landed cost $', freight: 'Freight $',
    customs: 'Customs $', clearing: 'Clearing $', receivePo: 'Receive shipment', poStatus: 'Status',
    poDraft: 'Draft', poOrdered: 'Ordered', poPartial: 'Partially received', poReceived: 'Received', poClosed: 'Closed',
    addItem: 'Add item', createPo: 'Create PO', allocNote: 'Freight, customs and clearing are allocated across received units to compute landed unit cost',
    newExpense: 'New expense', amount: 'Amount $', description: 'Description', addExpense: 'Add expense',
    pnl: 'Profit & loss', consolidated: 'Consolidated', cogs: 'Cost of goods sold', grossProfit: 'Gross profit',
    netProfit: 'Net profit', thisMonth: 'This month', perBranch: 'Per branch',
    catRent: 'Rent', catSalaries: 'Salaries', catUtilities: 'Utilities', catMarketing: 'Marketing', catMaintenance: 'Maintenance', catOther: 'Other',
    newCount: 'New count session', startCount: 'Start count', countSession: 'Count session', expectedQty: 'Expected',
    countedQty: 'Counted', varianceQty: 'Variance', postAdjustment: 'Post adjustment', postedNote: 'Adjustment posted to stock movements',
    sessionOpen: 'Open', sessionPosted: 'Posted', countedOfExpected: 'entered',
    sellThrough: 'Sell-through by style', sizeRun: 'Size-run analysis', deadStock: 'Dead-stock aging',
    marginByCategory: 'Margin by category', salesByPerson: 'Salesperson performance', daysInStock: 'Days in stock',
    sellThroughPct: 'Sell-through', sizeLabel: 'Size', soldPct: 'Sold %', neverMoved: 'Never moved',
  },
} as const

export type TKey = keyof typeof dict.ar

interface I18nContextValue {
  lang: Lang
  dir: 'rtl' | 'ltr'
  t: Record<TKey, string>
  toggleLang: () => void
  langBtnLabel: string
}

const I18nContext = createContext<I18nContextValue | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>('ar')
  const value = useMemo<I18nContextValue>(() => {
    const dir = lang === 'ar' ? 'rtl' : 'ltr'
    return {
      lang,
      dir,
      t: dict[lang],
      toggleLang: () => setLang((l) => (l === 'ar' ? 'en' : 'ar')),
      langBtnLabel: lang === 'ar' ? 'English' : 'العربية',
    }
  }, [lang])
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}

/** Localized-text picker, e.g. nm(product) or nm(branch). */
export function useNm() {
  const { lang } = useI18n()
  return (o: { ar: string; en: string }) => (lang === 'ar' ? o.ar : o.en)
}
