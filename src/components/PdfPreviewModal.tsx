import React, { useState } from 'react';
import { Account, Transaction } from '../types';
import { formatDateBR, formatDateShortYear, formatDateWithWeekday, formatCurrency } from '../utils/formatters';
import { calculateAccountBalance, getTransactionImpactOnAccount } from '../utils/accounting';
import { Logo } from './Logo';
import { Printer, X, ZoomIn, ZoomOut, FileSpreadsheet } from 'lucide-react';

interface PdfPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  transactions: Transaction[];
  startDate: string;
  endDate: string;
  orientation?: 'portrait' | 'landscape';
}

export const PdfPreviewModal: React.FC<PdfPreviewModalProps> = ({
  isOpen,
  onClose,
  accounts,
  transactions,
  startDate,
  endDate,
  orientation = 'portrait',
}) => {
  const [zoomLevel, setZoomLevel] = useState(100);

  if (!isOpen) return null;

  const previousTransactions = transactions.filter((tx) => tx.date < startDate);
  const openingBalance = accounts.length > 0
    ? accounts.reduce(
        (balance, account) =>
          balance + calculateAccountBalance(account, previousTransactions, false),
        0
      )
    : previousTransactions
        .filter((tx) => tx.isConsolidated)
        .reduce((balance, tx) => balance + tx.amount, 0);

  const filteredTxs = transactions
    .filter(tx => tx.date >= startDate && tx.date <= endDate)
    .sort((a, b) => a.date.localeCompare(b.date));

  // Group by date
  const groupedByDate: Record<string, Transaction[]> = {};
  filteredTxs.forEach(tx => {
    if (!groupedByDate[tx.date]) groupedByDate[tx.date] = [];
    groupedByDate[tx.date].push(tx);
  });

  const dates = Object.keys(groupedByDate).sort();

  // Daily statement balances track settled funds and start with the balance before the range.
  let runningBalance = openingBalance;
  const dailyBalances: Record<string, number> = {};
  dates.forEach(d => {
    const dayTotal = groupedByDate[d]
      .filter((tx) => tx.isConsolidated)
      .reduce((total, tx) => {
        const impact = accounts.reduce(
          (accountTotal, account) =>
            accountTotal + getTransactionImpactOnAccount(tx, account.name, transactions),
          0
        );
        return total + (accounts.length > 0 ? impact : tx.amount);
      }, 0);
    runningBalance += dayTotal;
    dailyBalances[d] = runningBalance;
  });

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadCSV = () => {
    const header = 'Data;Descricao;Categoria;Conta;Valor (R$);Status\n';
    const rows = filteredTxs.map(t => 
      `${formatDateBR(t.date)};"${t.description}";"${t.category}";"${t.account}";"${t.amount.toFixed(2).replace('.', ',')}";"${t.isConsolidated ? 'Consolidado' : 'Pendente'}"`
    ).join('\n');
    
    const blob = new Blob(['\uFEFF' + header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Extrato_MinhasEconomias_${startDate}_${endDate}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#333333] flex flex-col select-none">
      <style>{`
        @media print {
          @page { size: ${orientation}; margin: 12mm; }
          body * { visibility: hidden !important; }
          #printable-statement,
          #printable-statement * { visibility: visible !important; }
          #printable-statement {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            min-height: 0 !important;
            margin: 0 !important;
            transform: none !important;
            box-shadow: none !important;
            overflow: visible !important;
          }
        }
      `}</style>
      {/* Top PDF Reader Toolbar */}
      <div className="bg-[#2a2a2a] text-gray-200 px-4 py-2 flex items-center justify-between border-b border-[#444] text-[12px] shadow-md print:hidden">
        {/* Left: Page Counter & Zoom */}
        <div className="flex items-center gap-4">
          <span className="text-gray-300">{filteredTxs.length} lançamento(s)</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setZoomLevel(Math.max(60, zoomLevel - 10))}
              className="p-1 hover:bg-[#444] rounded text-gray-300 cursor-pointer"
              title="Reduzir zoom"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="w-12 text-center text-gray-300">{zoomLevel}%</span>
            <button
              onClick={() => setZoomLevel(Math.min(150, zoomLevel + 10))}
              className="p-1 hover:bg-[#444] rounded text-gray-300 cursor-pointer"
              title="Aumentar zoom"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Center: Title */}
        <div className="text-white font-medium text-[13px] hidden sm:block">
          Extrato_de_transacoes_{startDate.replace(/-/g, '')}_{endDate.replace(/-/g, '')}.pdf
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadCSV}
            className="flex items-center gap-1 bg-[#444] hover:bg-[#555] text-white px-2.5 py-1 rounded text-[11px] cursor-pointer"
            title="Exportar para Excel / CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-green-400" />
            <span>Excel / CSV</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1 bg-[#444] hover:bg-[#555] text-white px-2.5 py-1 rounded text-[11px] cursor-pointer"
            title="Imprimir extrato"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir</span>
          </button>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-red-700 text-white rounded cursor-pointer ml-2"
            title="Fechar visualizador"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main PDF Scroll Area */}
      <div className="flex-1 overflow-auto bg-[#4e4e4e] p-6 flex justify-center print:p-0 print:bg-white">
        {/* Printable Paper Document (exact match to images 6 & 7) */}
        <div
          id="printable-statement"
          style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
          className={`bg-white text-black shadow-2xl p-8 transition-transform font-sans ${
            orientation === 'landscape' ? 'w-[1050px]' : 'w-[800px]'
          } min-h-[1050px] print:w-full print:shadow-none print:transform-none print:p-4`}
        >
          {/* Header Row: current date on left, logo on right */}
          <div className="flex items-start justify-between mb-3">
            <div className="text-[13.5px] text-[#000000] font-bold pt-1">
              {new Intl.DateTimeFormat('pt-BR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              }).format(new Date())}
            </div>
            <div>
              <Logo size="md" />
            </div>
          </div>

          {/* Statement date range */}
          <div className="border-2 border-[#0070c0] rounded-sm px-3.5 py-1.5 flex items-center justify-between mb-4">
            <span className="font-black text-[13.5px] text-[#000000]">Extrato de transações</span>
            <span className="text-[13.5px] font-bold text-[#000000]">
              De {formatDateShortYear(startDate)} até {formatDateShortYear(endDate)}
            </span>
          </div>

          {/* Horizontal line */}
          <div className="border-t-2 border-[#555555] mb-2" />

          {/* Settled balance before the selected range */}
          <div className="flex justify-end gap-16 font-black text-[13px] text-[#000000] mb-4">
            <span>Saldo anterior a {formatDateBR(startDate)}</span>
            <span className="tabular-nums">{formatCurrency(openingBalance)}</span>
          </div>

          {/* Grouped Days */}
          <div className="space-y-4 text-[13px]">
            {dates.length > 0 && (
              <div className="flex border-b border-gray-400 pb-1 font-black text-[11px] uppercase">
                <span className="w-[36%]">Descrição</span>
                <span className="w-[22%]">Categoria</span>
                <span className="w-[17%]">Conta</span>
                <span className="w-[13%] text-right">Valor</span>
                <span className="w-[12%] text-right">Status</span>
              </div>
            )}
            {dates.map((dateStr) => {
              const dayTxs = groupedByDate[dateStr];
              const dayBalance = dailyBalances[dateStr] ?? 0;

              return (
                <div key={dateStr} className="space-y-1.5 break-inside-avoid">
                  {/* Date Heading */}
                  <div className="font-black text-[13.5px] text-[#000000]">
                    {formatDateWithWeekday(dateStr)}
                  </div>

                  {/* Transactions Table */}
                  <div className="space-y-1 pl-1">
                    {dayTxs.map((tx) => {
                      const isNegative = tx.amount < 0;
                      const formattedVal = Math.abs(tx.amount).toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      });

                      return (
                        <div
                          key={tx.id}
                          className="flex items-center text-[13px] py-1 hover:bg-gray-50 border-b border-gray-200 last:border-b-0 font-medium"
                        >
                          {/* Description */}
                          <div className="w-[36%] truncate font-bold text-[#000000]">
                            {tx.description}
                          </div>

                          {/* Category with optional recurring icon */}
                          <div className="w-[22%] flex items-center gap-1.5 text-[#000000] font-semibold truncate">
                            {tx.isRecurring && (
                              <span className="text-black text-[11px]" title="Transação recorrente">🔄</span>
                            )}
                            <span className="truncate">{tx.category}</span>
                          </div>

                          {/* Account */}
                          <div className="w-[17%] text-[#000000] font-bold truncate">
                            {tx.account.replace('*****', '***')}
                          </div>

                          {/* Amount */}
                          <div
                            className={`w-[13%] text-right font-black tabular-nums text-[13.5px] ${
                              isNegative ? 'text-[#e00000]' : 'text-[#008800]'
                            }`}
                          >
                            {isNegative ? `-${formattedVal}` : `+${formattedVal}`}
                          </div>

                          <div className="w-[12%] text-right text-[10px] text-black font-black">
                            {tx.isConsolidated ? 'Liquidado' : 'Pendente'}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Saldo do Dia */}
                  <div className="border-t-2 border-dashed border-[#777777] pt-1.5 mt-1.5 flex justify-end gap-16 font-black text-[13px] text-[#000000]">
                    <span>Saldo liquidado do dia</span>
                    <span className="tabular-nums">
                      R$ {dayBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer of the PDF page */}
          <div className="mt-12 pt-4 border-t-2 border-[#777777] flex items-center justify-between text-[12px] font-bold text-[#000000]">
            <div>Minhas Economias - Gerenciador Financeiro Pessoal</div>
          </div>
        </div>
      </div>
    </div>
  );
};
