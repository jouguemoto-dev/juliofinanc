import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Account, Transaction } from '../src/types';
import {
  calculateAccountBalance,
  calculateAccountBalanceAsOf,
  calculateReconciliationDifference,
} from '../src/utils/accounting';
import { generateInstallmentTransactions } from '../src/utils/installments';

const bankAccount: Account = {
  id: 'bank',
  name: 'Conta corrente',
  balance: 1000,
  initialBalance: 1000,
  type: 'corrente',
  isChecked: true,
};

function transaction(overrides: Partial<Transaction> & Pick<Transaction, 'id'>): Transaction {
  return {
    date: '2026-10-01',
    description: 'Lançamento de teste',
    category: 'Outras despesas',
    account: bankAccount.name,
    amount: -10,
    type: 'despesa',
    isConsolidated: true,
    ...overrides,
  };
}

test('paired account transfer decreases and increases its respective balances once', () => {
  const wallet = { ...bankAccount, name: 'Carteira' };
  const transferGroupId = 'transfer-1';
  const transactions = [
    transaction({
      id: 'transfer-out',
      description: 'Transferência para Carteira',
      amount: -250,
      type: 'transferencia',
      toAccount: 'Carteira',
      transferGroupId,
    }),
    transaction({
      id: 'transfer-in',
      description: 'Transferência recebida de Conta corrente',
      account: 'Carteira',
      amount: 250,
      type: 'transferencia',
      toAccount: 'Conta corrente',
      transferGroupId,
    }),
  ];

  assert.equal(calculateAccountBalance(bankAccount, transactions, false), 750);
  assert.equal(calculateAccountBalance(wallet, transactions, false), 1250);
  assert.equal(
    calculateAccountBalance(bankAccount, transactions, false) +
      calculateAccountBalance(wallet, transactions, false),
    2000
  );
});

test('credit card purchase and mirrored invoice payment clear the card without double-counting', () => {
  const cardAccount = { ...bankAccount, name: 'Cartão Visa', initialBalance: 0, balance: 0 };
  const transferGroupId = 'invoice-payment-1';
  const transactions = [
    transaction({
      id: 'purchase',
      account: 'Cartão Visa',
      description: 'Compra no cartão',
      amount: -125.5,
    }),
    transaction({
      id: 'invoice-payment-out',
      description: 'Pagamento da fatura',
      amount: -125.5,
      type: 'transferencia',
      toAccount: 'Cartão Visa',
      transferGroupId,
    }),
    transaction({
      id: 'invoice-payment-in',
      description: 'Pagamento recebido no cartão',
      account: 'Cartão Visa',
      amount: 125.5,
      type: 'transferencia',
      toAccount: 'Conta corrente',
      transferGroupId,
    }),
  ];

  assert.equal(calculateAccountBalance(bankAccount, transactions, false), 874.5);
  assert.equal(calculateAccountBalance(cardAccount, transactions, false), 0);
});

test('installments preserve the exact total in cents and only settle the first installment', () => {
  const installments = generateInstallmentTransactions({
    date: '2026-01-31',
    description: 'Notebook',
    category: 'Eletrônicos',
    account: 'Cartão Visa',
    amount: 10,
    type: 'despesa',
    installmentsCount: 3,
    isTotalAmount: true,
    isConsolidated: true,
    consolidateFirstOnly: true,
  });
  const installmentTransactions = installments.map((item, index) => ({
    ...item,
    id: `installment-${index + 1}`,
  }));
  const cardAccount = { ...bankAccount, name: 'Cartão Visa', initialBalance: 0, balance: 0 };

  assert.deepEqual(installments.map((item) => item.amount), [-3.34, -3.33, -3.33]);
  assert.deepEqual(installments.map((item) => item.date), [
    '2026-01-31',
    '2026-02-28',
    '2026-03-31',
  ]);
  assert.equal(installments.filter((item) => item.isConsolidated).length, 1);
  assert.equal(calculateAccountBalance(cardAccount, installmentTransactions, false), -3.34);
  assert.equal(calculateAccountBalance(cardAccount, installmentTransactions, true), -10);
});

test('pending entries affect projected balance but not the settled balance', () => {
  const transactions = [
    transaction({ id: 'settled', amount: -40 }),
    transaction({ id: 'pending', amount: -25, isConsolidated: false }),
  ];

  assert.equal(calculateAccountBalance(bankAccount, transactions, false), 960);
  assert.equal(calculateAccountBalance(bankAccount, transactions, true), 935);
});

test('opening balance remains the base and only transactions through the statement date count', () => {
  const transactions = [
    transaction({ id: 'before', date: '2026-09-30', amount: 50 }),
    transaction({ id: 'on-date', date: '2026-10-13', amount: -20 }),
    transaction({ id: 'after', date: '2026-10-14', amount: -100 }),
    transaction({ id: 'pending-on-date', date: '2026-10-13', amount: -30, isConsolidated: false }),
  ];

  assert.equal(calculateAccountBalanceAsOf(bankAccount, transactions, '2026-10-13'), 1030);
  assert.equal(calculateAccountBalanceAsOf(bankAccount, transactions, '2026-10-13', true), 1000);
});

test('reconciliation difference is rounded to cents and signed from book to statement', () => {
  assert.equal(calculateReconciliationDifference(95.129, 100), -4.87);
  assert.equal(calculateReconciliationDifference(100.005, 100), 0.01);
  assert.equal(calculateReconciliationDifference(100, 100), 0);
});

test('a reconciliation adjustment brings the balance to the statement without modifying prior entries', () => {
  const existingEntry = transaction({ id: 'original-entry', amount: -15 });
  const originalTransactions = [existingEntry];
  const recordedBalance = calculateAccountBalanceAsOf(bankAccount, originalTransactions, '2026-10-01');
  const statementBalance = 980;
  const difference = calculateReconciliationDifference(statementBalance, recordedBalance);
  const adjustment = transaction({
    id: 'reconciliation-adjustment',
    description: 'Ajuste de conciliação',
    category: 'Ajuste de conciliação',
    amount: difference,
    type: difference < 0 ? 'despesa' : 'receita',
  });

  assert.equal(recordedBalance, 985);
  assert.equal(calculateAccountBalance(bankAccount, [...originalTransactions, adjustment], false), statementBalance);
  assert.equal(originalTransactions[0], existingEntry);
  assert.equal(originalTransactions.length, 1);
});
