'use client';

import React from 'react';

interface Voucher {
  id: number;
  voucher_code: string;
  name: string;
  description?: string;
  voucher_type: 'Value' | 'Discount' | 'ProductSpecific';
  face_value?: number;
  remaining_value?: number;
  discount_percent?: number;
  product_id?: number;
  product_name?: string;
  expiration_date?: string;
  is_active: boolean;
}

interface VoucherSelectorProps {
  vouchers: Voucher[];
  appliedVouchers: Voucher[];
  onApplyVoucher: (voucher: Voucher) => void;
  onRemoveVoucher: (voucher: Voucher) => void;
  loading?: boolean;
}

export default function VoucherSelector({
  vouchers,
  appliedVouchers,
  onApplyVoucher,
  onRemoveVoucher,
  loading = false,
}: VoucherSelectorProps) {
  const isVoucherApplied = (voucher: Voucher) => {
    return appliedVouchers.some(v => v.id === voucher.id);
  };

  const getVoucherValue = (voucher: Voucher) => {
    switch (voucher.voucher_type) {
      case 'Value':
        const value = voucher.remaining_value || voucher.face_value || 0;
        return `$${parseFloat(value.toString()).toFixed(2)}`;
      case 'Discount':
        return `${voucher.discount_percent}% off`;
      case 'ProductSpecific':
        if (voucher.discount_percent) {
          return `${voucher.discount_percent}% off ${voucher.product_name || 'product'}`;
        } else if (voucher.face_value) {
          return `$${parseFloat(voucher.face_value.toString()).toFixed(2)} off ${voucher.product_name || 'product'}`;
        }
        return voucher.product_name || 'Product voucher';
      default:
        return '';
    }
  };

  const getVoucherIcon = (type: string) => {
    switch (type) {
      case 'Value':
        return '💵';
      case 'Discount':
        return '🏷️';
      case 'ProductSpecific':
        return '🎁';
      default:
        return '🎫';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (vouchers.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <div className="text-4xl mb-2">🎫</div>
        <div className="text-sm">No vouchers available</div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900">
          Available Vouchers
        </h3>
        <span className="text-sm text-gray-500">
          {vouchers.length} available
        </span>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {vouchers.map((voucher) => {
          const applied = isVoucherApplied(voucher);
          
          return (
            <div
              key={voucher.id}
              className={`flex items-center justify-between p-4 border-2 rounded-xl transition-all ${
                applied
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-xl">{getVoucherIcon(voucher.voucher_type)}</span>
                  <span className="font-semibold text-gray-900 text-sm">
                    {voucher.voucher_code}
                  </span>
                  {applied && (
                    <span className="px-2 py-0.5 bg-green-500 text-white text-xs rounded-full">
                      Applied
                    </span>
                  )}
                </div>
                
                <div className="text-xs text-gray-600 mb-1">
                  {voucher.name}
                </div>
                
                <div className="text-sm font-semibold text-blue-600">
                  {getVoucherValue(voucher)}
                </div>
                
                {voucher.expiration_date && (
                  <div className="text-xs text-gray-500 mt-1">
                    Expires: {new Date(voucher.expiration_date).toLocaleDateString()}
                  </div>
                )}
              </div>

              <button
                onClick={() => applied ? onRemoveVoucher(voucher) : onApplyVoucher(voucher)}
                className={`px-4 py-2 text-sm rounded-lg font-semibold transition-colors ${
                  applied
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : 'bg-green-500 text-white hover:bg-green-600'
                }`}
              >
                {applied ? 'Remove' : 'Apply'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

