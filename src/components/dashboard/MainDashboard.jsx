import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  FileSignature, 
  Receipt, 
  ShoppingCart, 
  Box, 
  Users, 
  Layers, 
  HandCoins, 
  Wallet,
  ArrowUpRight,
  TrendingUp,
  Download,
  Wheat,
  ShieldCheck
} from 'lucide-react';
import api from '../../services/api';

export default function MainDashboard({ onNavigate }) {
  const [dashData, setDashData] = useState(null);

  useEffect(() => {
    api.getDashboardSummary().then(data => {
      if (data) setDashData(data);
    });
  }, []);

  // Use live data if available, otherwise fallback to defaults
  const d = dashData || {};
  const so = d.salesOrders || {};
  const sc = d.salesContract || {};
  const si = d.salesInvoice || {};
  const po = d.purchaseOrders || {};
  const tp = d.totalPurchase || {};
  const cn = d.containers || {};
  const pc = d.partnersCount || {};
  const kpiCards = [
    {
      title: 'SALES ORDERS',
      icon: FileText,
      iconBg: 'bg-[#1E40AF]', // Royal Blue
      lines: [
        { label: 'BOG APPROVAL PENDING', value: String(so.bogApprovalPending ?? '6') },
        { label: 'AWAITING BUYER SIGN CONTRACT', value: String(so.awaitingBuyerSign ?? '2') },
        { label: 'ORDER IN PROCESS', value: String(so.orderInProcess ?? '99') },
        { label: 'COMPLETED', value: String(so.completed ?? '8') },
      ],
      action: 'export'
    },
    {
      title: 'SPICES & AGRO CONTRACTS',
      icon: FileSignature,
      iconBg: 'bg-[#D97706]', // Dark Yellow
      lines: [
        { label: 'MTD($)', value: '0.00' },
        { label: 'YTD($)', value: '7M' },
        { label: 'MTD QTY', value: '-' },
        { label: 'YTD QTY', value: '20,892.32 CBM | 1,784.16 MT' },
      ],
      action: 'export'
    },
    {
      title: 'COMMERCIAL SALES INVOICE',
      icon: Receipt,
      iconBg: 'bg-[#2563EB]', // Bright Blue
      lines: [
        { label: 'MTD($)', value: '0.00' },
        { label: 'YTD($)', value: '1.3M' },
        { label: 'MTD QTY', value: '-' },
        { label: 'YTD QTY', value: '6,076.50 CBM' },
      ],
      action: 'export'
    },
    {
      title: 'RAW MATERIAL PROCUREMENT',
      icon: FileText,
      iconBg: 'bg-[#334155]', // Slate
      lines: [
        { label: 'BOG APPROVAL PENDING', value: '28' },
        { label: 'APPROVED', value: '265' },
        { label: 'PAYMENT PENDING', value: '207' },
      ],
      action: 'import'
    },
    {
      title: 'TOTAL PURCHASE VOLUME',
      icon: ShoppingCart,
      iconBg: 'bg-[#B45309]', // Dark Yellow / Gold
      lines: [
        { label: 'MTD(₫)', value: '0.00' },
        { label: 'YTD(₫)', value: '1,312.2B' },
        { label: 'MTD QTY', value: '-' },
        { label: 'YTD QTY', value: '615,420.29 CBM' },
      ],
      action: 'import'
    },
    {
      title: 'CONTAINER LOGISTICS',
      icon: Layers,
      iconBg: 'bg-[#1E40AF]', // Royal Blue
      lines: [
        { label: 'ORDERS 500 | PENDING 425 | LOADED 75', value: '' },
      ],
      action: 'export'
    },
    {
      title: 'BUYERS & FARM SUPPLIERS',
      icon: Users,
      iconBg: 'bg-[#D97706]', // Dark Yellow
      lines: [
        { label: 'GLOBAL BUYERS', value: String(pc.registeredBuyers ?? '34') },
        { label: 'CERTIFIED FARMS & SUPPLIERS', value: String(pc.qualifiedSuppliers ?? '56') },
      ],
      action: 'buyers'
    },
    {
      title: 'COMMODITIES & SPICES SKUS',
      icon: Wheat,
      iconBg: 'bg-[#0284C7]', // Sky Blue
      lines: [
        { label: 'WHOLE SPICES, RICE, TEA, MEAL', value: `${d.productsCount ?? 21} SKUs` },
      ],
      action: 'products'
    },
    {
      title: 'TRADE RECEIVABLES',
      icon: HandCoins,
      iconBg: 'bg-[#EF4444]', // Red
      lines: [
        { label: 'TOTAL RECEIVABLE BALANCE', value: '($) 0' },
      ],
      action: 'transactions'
    },
    {
      title: 'SUPPLIER PAYABLES',
      icon: Wallet,
      iconBg: 'bg-[#0F172A]', // Deep Slate
      lines: [
        { label: 'OUTSTANDING AP BALANCE', value: 'VND 1,312.2B' },
      ],
      action: 'transactions'
    }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Top Banner / Corporate Identity */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-lg border border-[#E2E8F0] shadow-card">
        <div className="flex items-center space-x-3.5">
          <img 
            src="/favicon.png" 
            alt="SOILEX" 
            className="w-12 h-12 object-contain rounded-xl p-1 bg-blue-50 border border-blue-200"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                SOILEX Life Science
              </h1>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold bg-amber-50 text-[#B45309] border border-amber-200">
                The Essence of Authentic Spices
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              International Spice & Agro Commodity Export ERP • Certified Operations (ISO, HACCP, FSSAI)
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button className="flex items-center space-x-1.5 px-3.5 py-2 bg-white border border-[#E2E8F0] hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-md shadow-sm transition-colors">
            <Download className="w-3.5 h-3.5" />
            <span>EXPORT SUMMARY</span>
          </button>
          <button 
            onClick={() => onNavigate('export')}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-[#1E40AF] hover:bg-blue-800 text-white text-xs font-semibold rounded-md shadow-sm transition-colors"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>TRADE OPERATIONS</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid (3 Columns) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {kpiCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div 
              key={idx}
              onClick={() => onNavigate(card.action)}
              className="bg-white rounded-lg border border-[#E2E8F0] p-5 shadow-card hover:shadow-card-hover hover:border-[#BFDBFE] transition-all cursor-pointer flex flex-col justify-between group"
            >
              {/* Card Header with Icon Badge */}
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1 pr-3">
                  <div className="space-y-1">
                    {card.lines.map((line, lIdx) => (
                      <div key={lIdx} className="flex flex-wrap items-baseline justify-between text-xs">
                        <span className="font-semibold text-slate-600 uppercase tracking-wide text-[11px]">
                          {line.label}
                        </span>
                        {line.value && (
                          <span className="font-bold text-slate-900 ml-2">
                            {line.value}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right Icon */}
                <div className={`w-11 h-11 rounded-lg ${card.iconBg} text-white flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-105`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>

              {/* Bottom Card Label */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase group-hover:text-[#1E40AF] transition-colors">
                  {card.title}
                </span>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#D97706] transition-colors" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
