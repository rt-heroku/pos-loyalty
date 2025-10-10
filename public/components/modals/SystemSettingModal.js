        // System Settings Modal
        if (!window.Modals) {
            window.Modals = {};
        }
        
        window.Modals.SystemSettingModal = function ({ show, onClose, editingSetting, X, settingForm, setSettingForm, handleSaveSetting, Save }) {
            if (!show) return null;

            return React.createElement('div', {
                className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'
            }, [
                React.createElement('div', { 
                    key: 'modal',
                    className: 'bg-white dark:bg-gray-800 rounded-lg w-full max-w-lg'
                }, [
                    React.createElement('div', { key: 'header', className: 'px-6 py-4 border-b dark:border-gray-700 flex justify-between items-center' }, [
                        React.createElement('h2', { key: 'title', className: 'text-xl font-bold dark:text-white' }, 
                            editingSetting ? 'Edit System Setting' : 'Add System Setting'
                        ),
                        React.createElement('button', {
                            key: 'close-btn',
                            onClick: onClose,
                            className: 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                        }, React.createElement(X, { key: 'close-icon', size: 24 }))
                    ]),
                    
                    React.createElement('div', { key: 'form', className: 'p-6 space-y-4' }, [
                        React.createElement('div', { key: 'key' }, [
                            React.createElement('label', { key: 'key-label', className: 'block text-sm font-medium mb-2 dark:text-white' }, 'Setting Key *'),
                            React.createElement('input', {
                                key: 'key-input',
                                type: 'text',
                                value: settingForm.setting_key,
                                onChange: (e) => setSettingForm(prev => ({ ...prev, setting_key: e.target.value })),
                                disabled: !!editingSetting,
                                className: 'w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-600',
                                placeholder: 'e.g., company_email'
                            })
                        ]),
                        
                        React.createElement('div', { key: 'value' }, [
                            React.createElement('label', { key: 'value-label', className: 'block text-sm font-medium mb-2 dark:text-white' }, 'Setting Value *'),
                            settingForm.setting_type === 'boolean' ? 
                                React.createElement('select', {
                                    key: 'value-select',
                                    value: settingForm.setting_value,
                                    onChange: (e) => setSettingForm(prev => ({ ...prev, setting_value: e.target.value })),
                                    className: 'w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white'
                                }, [
                                    React.createElement('option', { key: 'true', value: 'true' }, 'True'),
                                    React.createElement('option', { key: 'false', value: 'false' }, 'False')
                                ]) :
                                React.createElement('input', {
                                    key: 'value-input',
                                    type: settingForm.setting_type === 'number' ? 'number' : 'text',
                                    value: settingForm.setting_value,
                                    onChange: (e) => setSettingForm(prev => ({ ...prev, setting_value: e.target.value })),
                                    className: 'w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white',
                                    placeholder: 'Setting value'
                                })
                        ]),
                        
                        React.createElement('div', { key: 'type', className: 'grid grid-cols-2 gap-4' }, [
                            React.createElement('div', { key: 'category' }, [
                                React.createElement('label', { key: 'category-label', className: 'block text-sm font-medium mb-2 dark:text-white' }, 'Category'),
                                React.createElement('select', {
                                    key: 'category-select',
                                    value: settingForm.category,
                                    onChange: (e) => setSettingForm(prev => ({ ...prev, category: e.target.value })),
                                    className: 'w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white'
                                }, [
                                    React.createElement('option', { key: 'general', value: 'general' }, 'General'),
                                    React.createElement('option', { key: 'pos', value: 'pos' }, 'POS'),
                                    React.createElement('option', { key: 'loyalty', value: 'loyalty' }, 'Loyalty'),
                                    React.createElement('option', { key: 'inventory', value: 'inventory' }, 'Inventory'),
                                    React.createElement('option', { key: 'email', value: 'email' }, 'Email'),
                                    React.createElement('option', { key: 'integration', value: 'integration' }, 'Integration')
                                ])
                            ]),
                            React.createElement('div', { key: 'setting-type' }, [
                                React.createElement('label', { key: 'setting-type-label', className: 'block text-sm font-medium mb-2 dark:text-white' }, 'Type'),
                                React.createElement('select', {
                                    key: 'setting-type-select',
                                    value: settingForm.setting_type,
                                    onChange: (e) => setSettingForm(prev => ({ ...prev, setting_type: e.target.value })),
                                    className: 'w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white'
                                }, [
                                    React.createElement('option', { key: 'text', value: 'text' }, 'Text'),
                                    React.createElement('option', { key: 'number', value: 'number' }, 'Number'),
                                    React.createElement('option', { key: 'boolean', value: 'boolean' }, 'Boolean'),
                                    React.createElement('option', { key: 'json', value: 'json' }, 'JSON')
                                ])
                            ])
                        ]),
                        
                        React.createElement('div', { key: 'encryption' }, [
                            React.createElement('label', { key: 'encryption-label', className: 'flex items-center gap-2 mb-2' }, [
                                React.createElement('input', {
                                    key: 'encryption-checkbox',
                                    type: 'checkbox',
                                    checked: settingForm.is_encrypted || false,
                                    onChange: (e) => setSettingForm(prev => ({ ...prev, is_encrypted: e.target.checked })),
                                    className: 'w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600'
                                }),
                                React.createElement('span', { key: 'encryption-text', className: 'text-sm font-medium dark:text-white' }, 'Encrypt this setting'),
                                React.createElement('span', { key: 'encryption-icon', className: 'text-xs' }, '🔒')
                            ]),
                            React.createElement('p', { key: 'encryption-help', className: 'text-xs text-gray-500 dark:text-gray-400' }, 
                                'Encrypt sensitive data like passwords and API keys'
                            )
                        ]),
                        
                        React.createElement('div', { key: 'description' }, [
                            React.createElement('label', { key: 'description-label', className: 'block text-sm font-medium mb-2 dark:text-white' }, 'Description'),
                            React.createElement('textarea', {
                                key: 'description-textarea',
                                value: settingForm.description,
                                onChange: (e) => setSettingForm(prev => ({ ...prev, description: e.target.value })),
                                rows: 3,
                                className: 'w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white',
                                placeholder: 'Describe what this setting controls'
                            })
                        ])
                    ]),

                    React.createElement('div', { key: 'footer', className: 'px-6 py-4 border-t dark:border-gray-700 flex gap-3 justify-end' }, [
                        React.createElement('button', {
                            key: 'cancel-btn',
                            onClick: onClose,
                            className: 'px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors'
                        }, 'Cancel'),
                        React.createElement('button', {
                            key: 'save-btn',
                            onClick: handleSaveSetting,
                            className: 'px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2'
                        }, [
                            React.createElement(Save, { key: 'icon', size: 16 }),
                            editingSetting ? 'Update Setting' : 'Create Setting'
                        ])
                    ])
                ])
            ]);
        };
