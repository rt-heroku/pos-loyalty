// Add/Edit Customer Modal
if (!window.Modals) {
    window.Modals = {};
}

window.Modals.CustomerFormModal = function CustomerFormModal({
    show,
    onClose,
    customer,
    onSave,
    loading
}) {
    if (!show) return null;

    const { X, User, Save } = window.Icons;

    const [formData, setFormData] = React.useState({
        name: '',
        email: '',
        phone: '',
        loyalty_number: '',
        points: 0,
        notes: '',
        member_status: 'Active',
        member_type: 'Individual',
        enrollment_date: new Date().toISOString().split('T')[0],
        customer_tier: 'Bronze'
    });

    const [errors, setErrors] = React.useState({});

    // Initialize form data when customer changes
    React.useEffect(() => {
        if (customer) {
            setFormData({
                name: customer.name || '',
                email: customer.email || '',
                phone: customer.phone || '',
                loyalty_number: customer.loyalty_number || '',
                points: customer.points || 0,
                notes: customer.notes || '',
                member_status: customer.member_status || 'Active',
                member_type: customer.member_type || 'Individual',
                enrollment_date: customer.enrollment_date ? customer.enrollment_date.split('T')[0] : new Date().toISOString().split('T')[0],
                customer_tier: customer.customer_tier || 'Bronze'
            });
        } else {
            // Reset form for new customer
            setFormData({
                name: '',
                email: '',
                phone: '',
                loyalty_number: '',
                points: 0,
                notes: '',
                member_status: 'Active',
                member_type: 'Individual',
                enrollment_date: new Date().toISOString().split('T')[0],
                customer_tier: 'Bronze'
            });
        }
        setErrors({});
    }, [customer, show]);

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));

        // Clear error when user starts typing
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: null }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Customer name is required';
        }

        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
        }

        if (formData.phone && !/^[\d\s\-\(\)\+]{10,}$/.test(formData.phone.replace(/\D/g, ''))) {
            newErrors.phone = 'Please enter a valid phone number';
        }

        if (!customer && formData.loyalty_number && !/^[A-Z]{3}\d{3}$/.test(formData.loyalty_number)) {
            newErrors.loyalty_number = 'Loyalty number format: LOY001 (3 letters + 3 numbers)';
        }

        if (formData.points < 0) {
            newErrors.points = 'Points cannot be negative';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = () => {
        if (!validateForm()) return;

        const saveData = {
            ...formData,
            points: parseInt(formData.points) || 0
        };

        // If creating new customer and no loyalty number provided, let backend generate it
        if (!customer && !formData.loyalty_number.trim()) {
            delete saveData.loyalty_number;
        }

        onSave(saveData);
    };

    const formatPhoneNumber = (value) => {
        const cleaned = value.replace(/\D/g, '');
        if (cleaned.length <= 3) return cleaned;
        if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
        return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
    };

    return React.createElement('div', {
        className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'
    }, [
        React.createElement('div', {
            key: 'modal',
            className: 'bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden'
        }, [
            // Header
            React.createElement('div', { key: 'header', className: 'px-6 py-4 border-b flex justify-between items-center' }, [
                React.createElement('h2', { key: 'header-container', className: 'text-xl font-bold flex items-center gap-2' }, [
                    React.createElement(User, { key: 'icon', size: 24 }),
                    customer ? 'Edit Customer' : 'Add New Customer'
                ]),
                React.createElement('button', {
                    key: 'close-button',
                    onClick: onClose,
                    className: 'text-gray-400 hover:text-gray-600 transition-colors'
                }, React.createElement(X, { key: 'close-icon', size: 24 }))
            ]),

            // Form Content
            React.createElement('div', { key: 'content', className: 'p-6 space-y-6' }, [
                // Basic Information
                React.createElement('div', { key: 'member-container', className: 'space-y-4' }, [
                    React.createElement('h3', { key: 'member-type-header', className: 'text-lg font-semibold text-gray-900 border-b pb-2' }, 'Member Type'),
                    
                    // Member Type
                    React.createElement('div', { key: 'member-type' }, [
                        React.createElement('label', { key: 'member-type-label', className: 'block text-sm font-medium mb-2' }, 'Member Type'),
                        React.createElement('select', {
                            key: 'member-type-select',
                            value: formData.member_type,
                            onChange: (e) => handleInputChange('member_type', e.target.value),
                            className: 'w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500',
                            disabled: !!customer // Don't allow changing member type for existing customers
                        }, [
                            React.createElement('option', { key: 'individual', value: 'Individual' }, 'Individual'),
                            React.createElement('option', { key: 'corporate', value: 'Corporate' }, 'Corporate')
                        ]),
                        customer && React.createElement('p', {
                            key: 'member-type-note',
                            className: 'text-gray-500 text-xs mt-1'
                        }, 'Member type cannot be changed after creation')
                    ])
                ]),

                // Member Information
                React.createElement('div', { key: 'member-info', className: 'space-y-4' }, [
                    React.createElement('h3', { key: 'member-info-header', className: 'text-lg font-semibold text-gray-900 border-b pb-2' },
                        'Member Information'
                    ),

                    React.createElement('div', { key: 'member-info-container', className: 'grid grid-cols-1 md:grid-cols-2 gap-4' }, [
                        // Customer Name
                        React.createElement('div', { key: 'name' }, [
                            React.createElement('label', { key: 'name-label', className: 'block text-sm font-medium mb-2' }, 'Customer Name *'),
                            React.createElement('input', {
                                key: 'name-input',
                                type: 'text',
                                value: formData.name,
                                onChange: (e) => handleInputChange('name', e.target.value),
                                className: `w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.name ? 'border-red-500' : 'border-gray-300'
                                    }`,
                                placeholder: 'Enter customer name'
                            }),
                            errors.name && React.createElement('p', {
                                key: 'name-error',
                                className: 'text-red-500 text-sm mt-1'
                            }, errors.name)
                        ]),

                        // Email
                        React.createElement('div', { key: 'email' }, [
                            React.createElement('label', { key: 'email-label', className: 'block text-sm font-medium mb-2' }, 'Email Address'),
                            React.createElement('input', {
                                key: 'email-input',
                                type: 'email',
                                value: formData.email,
                                onChange: (e) => handleInputChange('email', e.target.value),
                                className: `w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.email ? 'border-red-500' : 'border-gray-300'
                                    }`,
                                placeholder: 'customer@example.com'
                            }),
                            errors.email && React.createElement('p', {
                                key: 'email-error',
                                className: 'text-red-500 text-sm mt-1'
                            }, errors.email)
                        ]),

                        // Phone
                        React.createElement('div', { key: 'phone' }, [
                            React.createElement('label', { key: 'phone-label', className: 'block text-sm font-medium mb-2' }, 'Phone Number'),
                            React.createElement('input', {
                                key: 'phone-input',
                                type: 'tel',
                                value: formData.phone,
                                onChange: (e) => {
                                    const formatted = formatPhoneNumber(e.target.value);
                                    handleInputChange('phone', formatted);
                                },
                                className: `w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.phone ? 'border-red-500' : 'border-gray-300'
                                    }`,
                                placeholder: '(555) 123-4567'
                            }),
                            errors.phone && React.createElement('p', {
                                key: 'phone-error',
                                className: 'text-red-500 text-sm mt-1'
                            }, errors.phone)
                        ]),

                        // Loyalty Number (only for new customers or display for existing)
                        React.createElement('div', { key: 'loyalty' }, [
                            React.createElement('label', { key: 'loyalty-label', className: 'block text-sm font-medium mb-2' }, 'Loyalty Number'),
                            React.createElement('input', {
                                key: 'loyalty-input',
                                type: 'text',
                                value: formData.loyalty_number,
                                onChange: (e) => handleInputChange('loyalty_number', e.target.value.toUpperCase()),
                                disabled: !!customer, // Disable editing for existing customers
                                className: `w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.loyalty_number ? 'border-red-500' : 'border-gray-300'
                                    } ${customer ? 'bg-gray-100' : ''}`,
                                placeholder: customer ? 'Auto-assigned' : 'LOY001 (optional - auto-generated if empty)'
                            }),
                            errors.loyalty_number && React.createElement('p', {
                                key: 'loyalty-error',
                                className: 'text-red-500 text-sm mt-1'
                            }, errors.loyalty_number),
                            !customer && React.createElement('p', {
                                key: 'loyalty-note',
                                className: 'text-gray-500 text-xs mt-1'
                            }, 'Leave empty to auto-generate loyalty number')
                        ])
                    ])
                ]),

                React.createElement('div', { key: 'member-info-container', className: 'grid grid-cols-1 md:grid-cols-2 gap-4' }, [
                    // Member Status
                    React.createElement('div', { key: 'member-status' }, [
                        React.createElement('label', { key: 'member-status-label', className: 'block text-sm font-medium mb-2' }, 'Member Status'),
                        React.createElement('select', {
                            key: 'member-status-select',
                            value: formData.member_status,
                            onChange: (e) => handleInputChange('member_status', e.target.value),
                            className: `w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${formData.member_status === 'Active' ? 'border-green-300 bg-green-50' :
                                formData.member_status === 'Inactive' ? 'border-gray-300 bg-gray-50' :
                                    formData.member_status === 'Under Fraud Investigation' ? 'border-yellow-300 bg-yellow-50' :
                                        formData.member_status === 'Fraudulent Member' ? 'border-red-300 bg-red-50' :
                                            'border-purple-300 bg-purple-50'
                                }`
                        }, [
                            React.createElement('option', { key: 'active', value: 'Active' }, '✅ Active'),
                            React.createElement('option', { key: 'inactive', value: 'Inactive' }, '⏸️ Inactive'),
                            React.createElement('option', { key: 'fraud-investigation', value: 'Under Fraud Investigation' }, '⚠️ Under Fraud Investigation'),
                            React.createElement('option', { key: 'merged', value: 'Merged' }, '🔄 Merged'),
                            React.createElement('option', { key: 'fraudulent', value: 'Fraudulent Member' }, '🚨 Fraudulent Member')
                        ]),
                        React.createElement('p', {
                            key: 'member-status-note',
                            className: 'text-xs mt-1',
                            style: {
                                color: formData.member_status === 'Active' ? '#059669' :
                                    formData.member_status === 'Inactive' ? '#6b7280' :
                                        formData.member_status === 'Under Fraud Investigation' ? '#d97706' :
                                            formData.member_status === 'Fraudulent Member' ? '#dc2626' :
                                                '#7c3aed'
                            }
                        },
                            formData.member_status === 'Active' ? 'Customer can make purchases and earn points' :
                                formData.member_status === 'Inactive' ? 'Customer account is temporarily disabled' :
                                    formData.member_status === 'Under Fraud Investigation' ? 'Account under review for suspicious activity' :
                                        formData.member_status === 'Merged' ? 'Account has been merged with another account' :
                                            'Account flagged for fraudulent activity'
                        )
                    ]),

                    // Enrollment Date
                    React.createElement('div', { key: 'enrollment-date' }, [
                        React.createElement('label', { key: 'enrollment-date-label', className: 'block text-sm font-medium mb-2' }, 'Member Since'),
                        React.createElement('input', {
                            key: 'enrollment-date-input',
                            type: 'date',
                            value: formData.enrollment_date,
                            onChange: (e) => handleInputChange('enrollment_date', e.target.value),
                            max: new Date().toISOString().split('T')[0], // Can't be future date
                            className: 'w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                        }),
                        React.createElement('p', {
                            key: 'enrollment-date-note',
                            className: 'text-gray-500 text-xs mt-1'
                        }, 'Date when customer enrolled in loyalty program')
                    ]),

                    // Customer Tier (display with manual override option)
                    React.createElement('div', { key: 'customer-tier' }, [
                        React.createElement('label', { key: 'customer-tier-label', className: 'block text-sm font-medium mb-2' }, 'Customer Tier'),
                        React.createElement('select', {
                            key: 'customer-tier-select',
                            value: formData.customer_tier,
                            onChange: (e) => handleInputChange('customer_tier', e.target.value),
                            className: `w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${formData.customer_tier === 'Bronze' ? 'border-amber-600 bg-amber-50' :
                                formData.customer_tier === 'Silver' ? 'border-gray-400 bg-gray-50' :
                                    formData.customer_tier === 'Gold' ? 'border-yellow-500 bg-yellow-50' :
                                        'border-purple-500 bg-purple-50'
                                }`
                        }, [
                            React.createElement('option', { key: 'bronze', value: 'Bronze' }, '🥉 Bronze'),
                            React.createElement('option', { key: 'silver', value: 'Silver' }, '🥈 Silver'),
                            React.createElement('option', { key: 'gold', value: 'Gold' }, '🥇 Gold'),
                            React.createElement('option', { key: 'platinum', value: 'Platinum' }, '💎 Platinum')
                        ]),
                        React.createElement('p', {
                            key: 'customer-tier-note',
                            className: 'text-gray-500 text-xs mt-1'
                        }, customer ? 'Tier is auto-calculated but can be manually overridden' : 'Initial tier - will be recalculated based on activity'),

                        // Show tier benefits
                        React.createElement('div', { key: 'benefits-container', className: 'mt-2 p-2 bg-gray-50 rounded text-xs' }, [
                            React.createElement('strong', { key: 'benefits-label' }, 'Tier Benefits: '),
                            React.createElement('span', { key: 'benefits-text' },
                                customer ? formData.customer_tier === 'Bronze' ? 'Basic loyalty benefits, 1x points earning' :
                                    formData.customer_tier === 'Silver' ? 'Enhanced benefits, 1.25x points earning, priority support' :
                                        formData.customer_tier === 'Gold' ? 'Premium benefits, 1.5x points earning, exclusive offers' :
                                            'VIP benefits, 2x points earning, personal concierge service' :
                                    'Basic loyalty benefits, 1x points earning'
                            )
                        ])
                    ])
                ]),
                // Loyalty Information (for editing existing customers)
                customer && React.createElement('div', { key: 'loyalty-info', className: 'space-y-4' }, [
                    React.createElement('h3', { key: 'loyalty-info-header', className: 'text-lg font-semibold text-gray-900 border-b pb-2' },
                        'Loyalty Information'
                    ),

                    React.createElement('div', { key: 'loyalty-info-container', className: 'grid grid-cols-1 md:grid-cols-2 gap-4' }, [
                        // Points (editable for adjustments)
                        React.createElement('div', { key: 'points' }, [
                            React.createElement('label', { key: 'points-label', className: 'block text-sm font-medium mb-2' }, 'Points Balance'),
                            React.createElement('input', {
                                key: 'points-input',
                                type: 'number',
                                min: '0',
                                value: formData.points,
                                onChange: (e) => handleInputChange('points', e.target.value),
                                className: `w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.points ? 'border-red-500' : 'border-gray-300'
                                    }`,
                                placeholder: '0'
                            }),
                            errors.points && React.createElement('p', {
                                key: 'points-error',
                                className: 'text-red-500 text-sm mt-1'
                            }, errors.points),
                            React.createElement('p', {
                                key: 'points-note',
                                className: 'text-gray-500 text-xs mt-1'
                            }, 'Adjust points balance if needed')
                        ]),

                        // Customer Stats (read-only display with enhanced info)
                        React.createElement('div', { key: 'stats', className: 'space-y-3' }, [
                            React.createElement('div', { className: 'text-sm' }, [
                                React.createElement('span', { className: 'font-medium text-gray-700' }, 'Total Spent: '),
                                React.createElement('span', { className: 'text-green-600 font-bold' },
                                    `${parseFloat(customer.total_spent || 0).toFixed(2)}`
                                )
                            ]),
                            React.createElement('div', { className: 'text-sm' }, [
                                React.createElement('span', { className: 'font-medium text-gray-700' }, 'Visit Count: '),
                                React.createElement('span', { className: 'text-blue-600 font-bold' },
                                    customer.visit_count || 0
                                )
                            ]),
                            customer.last_visit && React.createElement('div', { className: 'text-sm' }, [
                                React.createElement('span', { className: 'font-medium text-gray-700' }, 'Last Visit: '),
                                React.createElement('span', { className: 'text-purple-600 font-bold' },
                                    new Date(customer.last_visit).toLocaleDateString()
                                )
                            ]),
                            customer.tier_calculation_number && React.createElement('div', { className: 'text-sm' }, [
                                React.createElement('span', { className: 'font-medium text-gray-700' }, 'Tier Score: '),
                                React.createElement('span', { className: 'text-indigo-600 font-bold' },
                                    parseFloat(customer.tier_calculation_number).toFixed(2)
                                )
                            ]),
                            // Member duration
                            customer.enrollment_date && React.createElement('div', { className: 'text-sm' }, [
                                React.createElement('span', { className: 'font-medium text-gray-700' }, 'Member For: '),
                                React.createElement('span', { className: 'text-orange-600 font-bold' },
                                    (() => {
                                        const enrollDate = new Date(customer.enrollment_date);
                                        const now = new Date();
                                        const diffTime = Math.abs(now - enrollDate);
                                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                        const years = Math.floor(diffDays / 365);
                                        const months = Math.floor((diffDays % 365) / 30);

                                        if (years > 0) {
                                            return years === 1 ? '1 year' : `${years} years`;
                                        } else if (months > 0) {
                                            return months === 1 ? '1 month' : `${months} months`;
                                        } else {
                                            return `${diffDays} days`;
                                        }
                                    })()
                                )
                            ])
                        ])
                    ]),

                ]),
                // Notes
                React.createElement('div', { key: 'notes', className: 'space-y-4' }, [
                    React.createElement('h3', { key: 'notes-header', className: 'text-lg font-semibold text-gray-900 border-b pb-2' },
                        'Additional Notes'
                    ),
                    React.createElement('textarea', {
                        key: 'notes-textarea',
                        value: formData.notes,
                        onChange: (e) => handleInputChange('notes', e.target.value),
                        rows: 3,
                        className: 'w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500',
                        placeholder: 'Add any special notes about this customer...'
                    })
                ]),
            ]),

            // Footer
            React.createElement('div', { key: 'footer', className: 'px-6 py-4 border-t bg-gray-50 flex gap-3 justify-end' }, [
                React.createElement('button', {
                    key: 'cancel-button',
                    onClick: onClose,
                    disabled: loading,
                    className: 'px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50'
                }, 'Cancel'),
                React.createElement('button', {
                    key: 'save-button',
                    onClick: handleSave,
                    disabled: loading || !formData.name.trim(),
                    className: 'px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2'
                }, [
                    loading && React.createElement('div', {
                        key: 'spinner',
                        className: 'animate-spin rounded-full h-4 w-4 border-b-2 border-white'
                    }),
                    React.createElement(Save, { key: 'icon', size: 16 }),
                    loading ? 'Saving...' : (customer ? 'Update Customer' : 'Create Customer')
                ])
            ])
        ])
    ]);
};
