// Setup Wizard Component for First-Time POS Configuration
window.Auth.SetupView = ({ onSetupComplete }) => {
    const [formData, setFormData] = React.useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        firstName: '',
        lastName: '',
        phone: '',
        companyName: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
    });
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState('');
    const [success, setSuccess] = React.useState(false);
    const [companyLogo, setCompanyLogo] = React.useState(null);

    // Load company logo on mount
    React.useEffect(() => {
        const loadCompanyLogo = async () => {
            try {
                const response = await fetch('/api/locations/current');
                if (response.ok) {
                    const data = await response.json();
                    if (data.success && data.location && data.location.logo_base64) {
                        setCompanyLogo(data.location.logo_base64);
                    } else {
                        setCompanyLogo('/images/logo.svg');
                    }
                } else {
                    setCompanyLogo('/images/logo.svg');
                }
            } catch (error) {
                console.error('Error loading company logo:', error);
                setCompanyLogo('/images/logo.svg');
            }
        };
        loadCompanyLogo();
    }, []);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Validation
        if (formData.password !== formData.confirmPassword) {
            setError("Passwords don't match");
            setLoading(false);
            return;
        }

        if (formData.password.length < 8) {
            setError('Password must be at least 8 characters');
            setLoading(false);
            return;
        }

        try {
            const response = await fetch('/api/setup/initialize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Setup failed');
            }

            setSuccess(true);

            // Wait 2 seconds then redirect to login
            setTimeout(() => {
                onSetupComplete();
            }, 2000);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return React.createElement('div', {
            className: 'min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4'
        }, [
            React.createElement('div', {
                key: 'success-card',
                className: 'bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center'
            }, [
                React.createElement('div', {
                    key: 'success-icon',
                    className: 'mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center'
                }, [
                    React.createElement('svg', {
                        key: 'checkmark',
                        className: 'w-8 h-8 text-green-500',
                        fill: 'none',
                        stroke: 'currentColor',
                        viewBox: '0 0 24 24'
                    }, [
                        React.createElement('path', {
                            key: 'path',
                            strokeLinecap: 'round',
                            strokeLinejoin: 'round',
                            strokeWidth: 2,
                            d: 'M5 13l4 4L19 7'
                        })
                    ])
                ]),
                React.createElement('h2', {
                    key: 'title',
                    className: 'text-2xl font-bold text-gray-900 mb-2'
                }, 'Setup Complete!'),
                React.createElement('p', {
                    key: 'message',
                    className: 'text-gray-600 mb-4'
                }, 'Your admin account has been created successfully.'),
                React.createElement('p', {
                    key: 'redirect',
                    className: 'text-sm text-gray-500'
                }, 'Redirecting to login...')
            ])
        ]);
    }

    return React.createElement('div', {
        className: 'min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4'
    }, [
        React.createElement('div', {
            key: 'setup-container',
            className: 'w-full max-w-2xl'
        }, [
            // Header
            React.createElement('div', {
                key: 'header',
                className: 'text-center mb-8'
            }, [
                React.createElement('div', {
                    key: 'logo',
                    className: 'mb-4 inline-flex h-20 w-20 items-center justify-center rounded-full bg-blue-600 text-white'
                }, [
                    companyLogo ? React.createElement('img', {
                        key: 'logo-img',
                        src: companyLogo,
                        alt: 'Logo',
                        className: 'h-full w-full object-contain rounded-full'
                    }) : React.createElement('svg', {
                        key: 'building-icon',
                        className: 'h-10 w-10',
                        fill: 'none',
                        stroke: 'currentColor',
                        viewBox: '0 0 24 24'
                    }, [
                        React.createElement('path', {
                            key: 'path',
                            strokeLinecap: 'round',
                            strokeLinejoin: 'round',
                            strokeWidth: 2,
                            d: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'
                        })
                    ])
                ]),
                React.createElement('h1', {
                    key: 'title',
                    className: 'text-3xl font-bold text-gray-900 mb-2'
                }, 'Welcome to Your POS System'),
                React.createElement('p', {
                    key: 'subtitle',
                    className: 'text-gray-600'
                }, "Let's set up your admin account to get started")
            ]),
            
            // Form
            React.createElement('div', {
                key: 'form-container',
                className: 'bg-white rounded-2xl shadow-xl p-8'
            }, [
                React.createElement('form', {
                    key: 'form',
                    onSubmit: handleSubmit,
                    className: 'space-y-6'
                }, [
                    // Admin Account Section
                    React.createElement('div', { key: 'admin-section' }, [
                        React.createElement('h2', {
                            key: 'admin-title',
                            className: 'text-xl font-semibold text-gray-900 mb-4'
                        }, 'Admin Account'),
                        
                        // Username & Email Row
                        React.createElement('div', {
                            key: 'username-email-row',
                            className: 'grid grid-cols-1 md:grid-cols-2 gap-4 mb-4'
                        }, [
                            React.createElement('div', { key: 'username-field' }, [
                                React.createElement('label', {
                                    key: 'username-label',
                                    className: 'block text-sm font-medium text-gray-700 mb-2'
                                }, 'Username *'),
                                React.createElement('input', {
                                    key: 'username-input',
                                    type: 'text',
                                    name: 'username',
                                    required: true,
                                    value: formData.username,
                                    onChange: handleChange,
                                    className: 'w-full rounded-lg border border-gray-300 py-2 px-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500',
                                    placeholder: 'admin'
                                })
                            ]),
                            React.createElement('div', { key: 'email-field' }, [
                                React.createElement('label', {
                                    key: 'email-label',
                                    className: 'block text-sm font-medium text-gray-700 mb-2'
                                }, 'Email *'),
                                React.createElement('input', {
                                    key: 'email-input',
                                    type: 'email',
                                    name: 'email',
                                    required: true,
                                    value: formData.email,
                                    onChange: handleChange,
                                    className: 'w-full rounded-lg border border-gray-300 py-2 px-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500',
                                    placeholder: 'admin@yourbusiness.com'
                                })
                            ])
                        ]),
                        
                        // First & Last Name Row
                        React.createElement('div', {
                            key: 'name-row',
                            className: 'grid grid-cols-1 md:grid-cols-2 gap-4 mb-4'
                        }, [
                            React.createElement('div', { key: 'firstname-field' }, [
                                React.createElement('label', {
                                    key: 'firstname-label',
                                    className: 'block text-sm font-medium text-gray-700 mb-2'
                                }, 'First Name *'),
                                React.createElement('input', {
                                    key: 'firstname-input',
                                    type: 'text',
                                    name: 'firstName',
                                    required: true,
                                    value: formData.firstName,
                                    onChange: handleChange,
                                    className: 'w-full rounded-lg border border-gray-300 py-2 px-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500',
                                    placeholder: 'John'
                                })
                            ]),
                            React.createElement('div', { key: 'lastname-field' }, [
                                React.createElement('label', {
                                    key: 'lastname-label',
                                    className: 'block text-sm font-medium text-gray-700 mb-2'
                                }, 'Last Name *'),
                                React.createElement('input', {
                                    key: 'lastname-input',
                                    type: 'text',
                                    name: 'lastName',
                                    required: true,
                                    value: formData.lastName,
                                    onChange: handleChange,
                                    className: 'w-full rounded-lg border border-gray-300 py-2 px-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500',
                                    placeholder: 'Doe'
                                })
                            ])
                        ]),
                        
                        // Password Row
                        React.createElement('div', {
                            key: 'password-row',
                            className: 'grid grid-cols-1 md:grid-cols-2 gap-4 mb-4'
                        }, [
                            React.createElement('div', { key: 'password-field' }, [
                                React.createElement('label', {
                                    key: 'password-label',
                                    className: 'block text-sm font-medium text-gray-700 mb-2'
                                }, 'Password *'),
                                React.createElement('input', {
                                    key: 'password-input',
                                    type: 'password',
                                    name: 'password',
                                    required: true,
                                    value: formData.password,
                                    onChange: handleChange,
                                    className: 'w-full rounded-lg border border-gray-300 py-2 px-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500',
                                    placeholder: '••••••••'
                                })
                            ]),
                            React.createElement('div', { key: 'confirm-password-field' }, [
                                React.createElement('label', {
                                    key: 'confirm-password-label',
                                    className: 'block text-sm font-medium text-gray-700 mb-2'
                                }, 'Confirm Password *'),
                                React.createElement('input', {
                                    key: 'confirm-password-input',
                                    type: 'password',
                                    name: 'confirmPassword',
                                    required: true,
                                    value: formData.confirmPassword,
                                    onChange: handleChange,
                                    className: 'w-full rounded-lg border border-gray-300 py-2 px-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500',
                                    placeholder: '••••••••'
                                })
                            ])
                        ]),
                        
                        // Phone
                        React.createElement('div', { key: 'phone-field', className: 'mb-4' }, [
                            React.createElement('label', {
                                key: 'phone-label',
                                className: 'block text-sm font-medium text-gray-700 mb-2'
                            }, 'Phone (Optional)'),
                            React.createElement('input', {
                                key: 'phone-input',
                                type: 'tel',
                                name: 'phone',
                                value: formData.phone,
                                onChange: handleChange,
                                className: 'w-full rounded-lg border border-gray-300 py-2 px-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500',
                                placeholder: '(555) 123-4567'
                            })
                        ])
                    ]),
                    
                    // Business Information Section
                    React.createElement('div', { key: 'business-section', className: 'border-t pt-6' }, [
                        React.createElement('h2', {
                            key: 'business-title',
                            className: 'text-xl font-semibold text-gray-900 mb-4'
                        }, 'Business Information (Optional)'),
                        
                        // Company Name
                        React.createElement('div', { key: 'company-field', className: 'mb-4' }, [
                            React.createElement('label', {
                                key: 'company-label',
                                className: 'block text-sm font-medium text-gray-700 mb-2'
                            }, 'Company Name'),
                            React.createElement('input', {
                                key: 'company-input',
                                type: 'text',
                                name: 'companyName',
                                value: formData.companyName,
                                onChange: handleChange,
                                className: 'w-full rounded-lg border border-gray-300 py-2 px-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500',
                                placeholder: 'Your Business Name'
                            })
                        ]),
                        
                        // Address
                        React.createElement('div', { key: 'address-field', className: 'mb-4' }, [
                            React.createElement('label', {
                                key: 'address-label',
                                className: 'block text-sm font-medium text-gray-700 mb-2'
                            }, 'Address'),
                            React.createElement('input', {
                                key: 'address-input',
                                type: 'text',
                                name: 'address',
                                value: formData.address,
                                onChange: handleChange,
                                className: 'w-full rounded-lg border border-gray-300 py-2 px-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500',
                                placeholder: '123 Main Street'
                            })
                        ]),
                        
                        // City, State, Zip
                        React.createElement('div', {
                            key: 'location-row',
                            className: 'grid grid-cols-1 md:grid-cols-3 gap-4'
                        }, [
                            React.createElement('div', { key: 'city-field' }, [
                                React.createElement('label', {
                                    key: 'city-label',
                                    className: 'block text-sm font-medium text-gray-700 mb-2'
                                }, 'City'),
                                React.createElement('input', {
                                    key: 'city-input',
                                    type: 'text',
                                    name: 'city',
                                    value: formData.city,
                                    onChange: handleChange,
                                    className: 'w-full rounded-lg border border-gray-300 py-2 px-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500',
                                    placeholder: 'New York'
                                })
                            ]),
                            React.createElement('div', { key: 'state-field' }, [
                                React.createElement('label', {
                                    key: 'state-label',
                                    className: 'block text-sm font-medium text-gray-700 mb-2'
                                }, 'State'),
                                React.createElement('input', {
                                    key: 'state-input',
                                    type: 'text',
                                    name: 'state',
                                    value: formData.state,
                                    onChange: handleChange,
                                    className: 'w-full rounded-lg border border-gray-300 py-2 px-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500',
                                    placeholder: 'NY'
                                })
                            ]),
                            React.createElement('div', { key: 'zip-field' }, [
                                React.createElement('label', {
                                    key: 'zip-label',
                                    className: 'block text-sm font-medium text-gray-700 mb-2'
                                }, 'Zip Code'),
                                React.createElement('input', {
                                    key: 'zip-input',
                                    type: 'text',
                                    name: 'zipCode',
                                    value: formData.zipCode,
                                    onChange: handleChange,
                                    className: 'w-full rounded-lg border border-gray-300 py-2 px-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500',
                                    placeholder: '10001'
                                })
                            ])
                        ])
                    ]),
                    
                    // Error Message
                    error && React.createElement('div', {
                        key: 'error',
                        className: 'rounded-lg border border-red-200 bg-red-50 p-4'
                    }, [
                        React.createElement('p', {
                            key: 'error-text',
                            className: 'text-sm text-red-600'
                        }, error)
                    ]),
                    
                    // Submit Button
                    React.createElement('button', {
                        key: 'submit-btn',
                        type: 'submit',
                        disabled: loading,
                        className: 'w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
                    }, loading ? 'Setting up...' : 'Complete Setup')
                ])
            ]),
            
            // Footer
            React.createElement('div', {
                key: 'footer',
                className: 'mt-6 text-center text-sm text-gray-600'
            }, [
                React.createElement('p', {
                    key: 'footer-text',
                }, 'This setup wizard will create your admin account and configure your system.'),
                React.createElement('p', {
                    key: 'footer-text-2',
                    className: 'mt-1'
                }, 'You can modify these settings later from the admin panel.')
            ])
        ])
    ]);
};

