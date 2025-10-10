'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import {
  Search,
  Filter,
  DollarSign,
  ShoppingBag,
  TrendingUp,
  BarChart3,
  Download,
  Eye,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

interface Transaction {
  id: number;
  total: string;
  points_earned: number;
  points_redeemed: number;
  created_at: string;
  payment_method: string;
  store_name?: string;
  store_code?: string;
  address_line1?: string;
  city?: string;
  state?: string;
  items?: TransactionItem[];
  vouchers?: TransactionVoucher[];
}

interface TransactionItem {
  id: number;
  product_name: string;
  product_price: string;
  quantity: number;
  subtotal: string;
}

interface TransactionVoucher {
  id: number;
  applied_amount: string;
  discount_amount: string;
  voucher_code: string;
  voucher_name: string;
  voucher_type: string;
  face_value?: string;
  discount_percent?: string;
  image_url?: string;
  description?: string;
}

interface AnalyticsData {
  totalSpent: number;
  totalTransactions: number;
  averageOrderValue: number;
  spendingByMonth: { month: string; amount: number }[];
  spendingByCategory: { category: string; amount: number }[];
  topProducts: { name: string; quantity: number }[];
  savingsFromLoyalty: number;
}

export default function TransactionsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    minAmount: '',
    maxAmount: '',
    paymentMethod: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const fetchTransactions = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        ...(searchTerm && { search: searchTerm }),
        ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
        ...(filters.dateTo && { dateTo: filters.dateTo }),
        ...(filters.minAmount && { minAmount: filters.minAmount }),
        ...(filters.maxAmount && { maxAmount: filters.maxAmount }),
        ...(filters.paymentMethod && { paymentMethod: filters.paymentMethod }),
      });

      const response = await fetch(`/loyalty/api/transactions?${params}`);
      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions || []);
        setTotalPages(data.totalPages || 1);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchTerm, filters]);

  const fetchAnalytics = useCallback(async () => {
    try {
      const response = await fetch('/loyalty/api/transactions/analytics');
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchTransactions();
      fetchAnalytics();
    }
  }, [user, fetchTransactions, fetchAnalytics]);

  const fetchTransactionDetails = async (transactionId: number) => {
    try {
      const response = await fetch(`/loyalty/api/transactions/${transactionId}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedTransaction(data.transaction);
        setShowDetailsModal(true);
      }
    } catch (error) {
      console.error('Error fetching transaction details:', error);
    }
  };

  const clearFilters = () => {
    setFilters({
      dateFrom: '',
      dateTo: '',
      minAmount: '',
      maxAmount: '',
      paymentMethod: '',
    });
  };

  const exportTransactions = async () => {
    try {
      const response = await fetch('/loyalty/api/transactions/export');
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'transactions.csv';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error exporting transactions:', error);
    }
  };

  if (loading || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-primary-600"></div>
          <p className="text-gray-600">Loading transactions...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold text-gray-900">
            Transaction History
          </h1>
          <p className="text-gray-600">
            View and manage your order history and analytics
          </p>
        </div>
        <button
          onClick={exportTransactions}
          className="flex items-center space-x-2 rounded-lg bg-primary-600 px-4 py-2 text-white transition-colors hover:bg-primary-700"
        >
          <Download className="h-4 w-4" />
          <span>Export</span>
        </button>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Analytics Overview */}
        {analytics && (
          <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Spent</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(analytics.totalSpent)}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                  <DollarSign className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Transactions</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {analytics.totalTransactions}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                  <ShoppingBag className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Average Order</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(analytics.averageOrderValue)}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Loyalty Savings</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(analytics.savingsFromLoyalty)}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
                  <BarChart3 className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="mb-8 rounded-2xl border border-gray-100 bg-white p-6 shadow-xl">
          <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-x-4 lg:space-y-0">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-gray-400" />
                <input
                  type="text"
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-transparent focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 rounded-lg border border-gray-300 px-4 py-2 transition-colors hover:bg-gray-50"
            >
              <Filter className="h-4 w-4" />
              <span>Filters</span>
              {showFilters ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="mt-6 border-t border-gray-200 pt-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    From Date
                  </label>
                  <input
                    type="date"
                    value={filters.dateFrom}
                    onChange={e =>
                      setFilters({ ...filters, dateFrom: e.target.value })
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    To Date
                  </label>
                  <input
                    type="date"
                    value={filters.dateTo}
                    onChange={e =>
                      setFilters({ ...filters, dateTo: e.target.value })
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Min Amount
                  </label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={filters.minAmount}
                    onChange={e =>
                      setFilters({ ...filters, minAmount: e.target.value })
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Max Amount
                  </label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={filters.maxAmount}
                    onChange={e =>
                      setFilters({ ...filters, maxAmount: e.target.value })
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Payment Method
                  </label>
                  <select
                    value={filters.paymentMethod}
                    onChange={e =>
                      setFilters({ ...filters, paymentMethod: e.target.value })
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">All Methods</option>
                    <option value="credit_card">Credit Card</option>
                    <option value="debit_card">Debit Card</option>
                    <option value="cash">Cash</option>
                    <option value="mobile_payment">Mobile Payment</option>
                  </select>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 text-gray-600 transition-colors hover:text-gray-800"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Transactions List */}
        <div className="rounded-2xl border border-gray-100 bg-white shadow-xl">
          <div className="border-b border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900">
              Transaction History
            </h2>
          </div>

          <div className="divide-y divide-gray-200">
            {transactions.map(transaction => (
              <div
                key={transaction.id}
                className="p-6 transition-colors hover:bg-gray-50"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100">
                      <ShoppingBag className="h-6 w-6 text-primary-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        Transaction #{transaction.id}
                      </p>
                      <p className="text-sm text-gray-600">
                        {formatDate(transaction.created_at)}
                      </p>
                      <p className="text-xs capitalize text-gray-500">
                        {transaction.payment_method}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">
                      {formatCurrency(parseFloat(transaction.total))}
                    </p>
                    <div className="flex items-center space-x-2 text-sm">
                      {transaction.points_earned > 0 && (
                        <span className="text-green-600">
                          +{transaction.points_earned} pts
                        </span>
                      )}
                      {transaction.points_redeemed > 0 && (
                        <span className="text-red-600">
                          -{transaction.points_redeemed} pts
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => fetchTransactionDetails(transaction.id)}
                    className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                  >
                    <Eye className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {transactions.length === 0 && (
            <div className="py-12 text-center">
              <ShoppingBag className="mx-auto mb-4 h-16 w-16 text-gray-300" />
              <p className="text-gray-500">No transactions found</p>
              <p className="text-sm text-gray-400">
                Try adjusting your search or filters
              </p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="border-t border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </p>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="rounded-lg border border-gray-300 px-3 py-1 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() =>
                      setCurrentPage(Math.min(totalPages, currentPage + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="rounded-lg border border-gray-300 px-3 py-1 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Transaction Details Modal */}
      {showDetailsModal && selectedTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">
                Transaction Details
              </h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Transaction Info */}
              <div className="rounded-lg bg-gray-50 p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Transaction ID</p>
                    <p className="font-medium">#{selectedTransaction.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Date</p>
                    <p className="font-medium">
                      {formatDate(selectedTransaction.created_at)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Payment Method</p>
                    <p className="font-medium capitalize">
                      {selectedTransaction.payment_method}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Amount</p>
                    <p className="text-lg font-bold">
                      {formatCurrency(parseFloat(selectedTransaction.total))}
                    </p>
                  </div>
                </div>
              </div>

              {/* Points Summary */}
              <div className="rounded-lg bg-blue-50 p-4">
                <h4 className="mb-2 font-semibold text-gray-900">
                  Loyalty Points
                </h4>
                <div className="flex space-x-6">
                  {selectedTransaction.points_earned > 0 && (
                    <div>
                      <p className="text-sm text-gray-600">Points Earned</p>
                      <p className="font-bold text-green-600">
                        +{selectedTransaction.points_earned}
                      </p>
                    </div>
                  )}
                  {selectedTransaction.points_redeemed > 0 && (
                    <div>
                      <p className="text-sm text-gray-600">Points Redeemed</p>
                      <p className="font-bold text-red-600">
                        -{selectedTransaction.points_redeemed}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Vouchers Redeemed */}
              {selectedTransaction.vouchers &&
                selectedTransaction.vouchers.length > 0 && (
                  <div>
                    <h4 className="mb-4 font-semibold text-gray-900">
                      Vouchers Redeemed
                    </h4>
                    <div className="space-y-3">
                      {selectedTransaction.vouchers.map(voucher => (
                        <div
                          key={voucher.id}
                          className="flex items-center justify-between rounded-lg bg-green-50 p-4 border border-green-200"
                        >
                          <div className="flex items-center space-x-3">
                            {/* Voucher Image */}
                            {voucher.image_url && (
                              <div className="flex-shrink-0">
                                <Image
                                  src={voucher.image_url}
                                  alt={voucher.voucher_name}
                                  width={48}
                                  height={48}
                                  className="rounded-lg object-cover border border-green-300"
                                />
                              </div>
                            )}
                            
                            {/* Voucher Details */}
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <p className="font-medium text-gray-900">
                                  {voucher.voucher_name}
                                </p>
                                <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                                  {voucher.voucher_code}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600">
                                {voucher.description || `${voucher.voucher_type} Voucher`}
                              </p>
                              <div className="mt-1 flex items-center space-x-4 text-sm">
                                {voucher.voucher_type === 'Value' && voucher.face_value && (
                                  <span className="text-gray-500">
                                    Face Value: {formatCurrency(parseFloat(voucher.face_value))}
                                  </span>
                                )}
                                {voucher.voucher_type === 'Discount' && voucher.discount_percent && (
                                  <span className="text-gray-500">
                                    {voucher.discount_percent}% Off
                                  </span>
                                )}
                                <span className="text-gray-500">
                                  Applied: {formatCurrency(parseFloat(voucher.applied_amount))}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Discount Amount */}
                          <div className="text-right">
                            <p className="text-lg font-bold text-green-600">
                              -{formatCurrency(parseFloat(voucher.discount_amount))}
                            </p>
                            <p className="text-xs text-gray-500">Savings</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Items List */}
              {selectedTransaction.items &&
                selectedTransaction.items.length > 0 && (
                  <div>
                    <h4 className="mb-4 font-semibold text-gray-900">Items</h4>
                    <div className="space-y-3">
                      {selectedTransaction.items.map(item => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between rounded-lg bg-gray-50 p-3"
                        >
                          <div>
                            <p className="font-medium text-gray-900">
                              {item.product_name}
                            </p>
                            <p className="text-sm text-gray-600">
                              {formatCurrency(parseFloat(item.product_price))} ×{' '}
                              {item.quantity}
                            </p>
                          </div>
                          <p className="font-semibold text-gray-900">
                            {formatCurrency(parseFloat(item.subtotal))}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Receipt */}
              <div className="border-t border-gray-200 pt-4">
                <h4 className="mb-4 font-semibold text-gray-900">Receipt</h4>
                <div className="rounded-lg bg-gray-50 p-4 font-mono text-sm">
                  <div className="mb-4 text-center">
                    <p className="font-bold">
                      {selectedTransaction.store_name || 'LOYALTY STORE'}
                    </p>
                    {selectedTransaction.store_code && (
                      <p className="text-sm text-gray-500">
                        {selectedTransaction.store_code}
                      </p>
                    )}
                    <p className="text-gray-600">
                      Transaction #{selectedTransaction.id}
                    </p>
                    <p className="text-gray-600">
                      {formatDate(selectedTransaction.created_at)}
                    </p>
                    {selectedTransaction.address_line1 && (
                      <p className="text-xs text-gray-500 mt-1">
                        {selectedTransaction.address_line1}
                        {selectedTransaction.city && `, ${selectedTransaction.city}`}
                        {selectedTransaction.state && `, ${selectedTransaction.state}`}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Total:</span>
                      <span>
                        {formatCurrency(parseFloat(selectedTransaction.total))}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Payment:</span>
                      <span className="capitalize">
                        {selectedTransaction.payment_method}
                      </span>
                    </div>
                    {selectedTransaction.points_earned > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Points Earned:</span>
                        <span>+{selectedTransaction.points_earned}</span>
                      </div>
                    )}
                    {selectedTransaction.points_redeemed > 0 && (
                      <div className="flex justify-between text-red-600">
                        <span>Points Redeemed:</span>
                        <span>-{selectedTransaction.points_redeemed}</span>
                      </div>
                    )}
                    {selectedTransaction.vouchers &&
                      selectedTransaction.vouchers.length > 0 &&
                      selectedTransaction.vouchers.map(voucher => (
                        <div key={voucher.id} className="flex justify-between text-green-600">
                          <span>Voucher ({voucher.voucher_code}):</span>
                          <span>-{formatCurrency(parseFloat(voucher.discount_amount))}</span>
                        </div>
                      ))}
                  </div>
                  <div className="mt-4 border-t border-gray-300 pt-4 text-center">
                    <p className="text-gray-600">
                      Thank you for your purchase!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
