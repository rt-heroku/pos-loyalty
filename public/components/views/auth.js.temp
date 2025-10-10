// Authentication and User Management Components
window.Auth = {
    // Login Component
    LoginView: ({ onLoginSuccess }) => {
        const [credentials, setCredentials] = React.useState({
            username: '',
            password: ''
        });
        const [loading, setLoading] = React.useState(false);
        const [error, setError] = React.useState('');

        const handleSubmit = async (e) => {
            e.preventDefault();
            setLoading(true);
            setError('');

            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(credentials)
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || 'Login failed');
                }

                // Store token and user data
                localStorage.setItem('auth_token', data.token);
                localStorage.setItem('user_data', JSON.stringify(data.user));
                localStorage.setItem('token_expires', data.expires_at);
                localStorage.setItem('pos_user_id', data.user.username);
                console.log('Before ps_user_id =', data.user.username);
                console.log('After ps_user_id =',localStorage.getItem('pos_user_id'));
                
                onLoginSuccess(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        return React.createElement('div', { 
            className: 'min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center' 
        }, [
            React.createElement('div', { 
                key: 'login-card',
                className: 'bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 max-w-md w-full mx-4' 
            }, [
                React.createElement('div', { key: 'header', className: 'text-center mb-8' }, [
                    React.createElement('div', { 
                        key: 'logo',
                        className: 'mx-auto mb-4 w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center' 
                    }, [
                        React.createElement('span', { 
                            key: 'icon',
                            className: 'text-white text-2xl font-bold' 
                        }, 'POS')
                    ]),
                    React.createElement('h2', { 
                        key: 'title',
                        className: 'text-2xl font-bold text-gray-900 dark:text-white mb-2' 
                    }, 'POS System Login'),
                    React.createElement('p', { 
                        key: 'subtitle',
                        className: 'text-gray-600 dark:text-gray-300' 
                    }, 'Sign in to access your account')
                ]),
                
                React.createElement('form', { 
                    key: 'form',
                    onSubmit: handleSubmit,
                    className: 'space-y-6' 
                }, [
                    React.createElement('div', { key: 'username' }, [
                        React.createElement('label', { 
                            key: 'label',
                            className: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2' 
                        }, 'Username'),
                        React.createElement('input', {
                            key: 'input',
                            type: 'text',
                            value: credentials.username,
                            onChange: (e) => setCredentials({...credentials, username: e.target.value}),
                            className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white',
                            placeholder: 'Enter your username',
                            required: true
                        })
                    ]),
                    
                    React.createElement('div', { key: 'password' }, [
                        React.createElement('label', { 
                            key: 'label',
                            className: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2' 
                        }, 'Password'),
                        React.createElement('input', {
                            key: 'input',
                            type: 'password',
                            value: credentials.password,
                            onChange: (e) => setCredentials({...credentials, password: e.target.value}),
                            className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white',
                            placeholder: 'Enter your password',
                            required: true
                        })
                    ]),
                    
                    error && React.createElement('div', { 
                        key: 'error',
                        className: 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3' 
                    }, [
                        React.createElement('p', { 
                            key: 'text',
                            className: 'text-red-600 dark:text-red-400 text-sm' 
                        }, error)
                    ]),
                    
                    React.createElement('button', {
                        key: 'submit',
                        type: 'submit',
                        disabled: loading,
                        className: `w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                            loading 
                                ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed' 
                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`
                    }, loading ? 'Signing in...' : 'Sign In')
                ]),
                
                React.createElement('div', { 
                    key: 'footer',
                    className: 'mt-6 text-center text-sm text-gray-600 dark:text-gray-400' 
                }, [
                    React.createElement('p', { key: 'text' }, 'Default admin credentials:'),
                    React.createElement('p', { key: 'credentials' }, 'Username: admin | Password: P@$$word1')
                ])
            ])
        ]);
    },

    // User Profile Component
    ProfileView: ({ user, onLogout }) => {
        const [showChangePassword, setShowChangePassword] = React.useState(false);
        const [passwordForm, setPasswordForm] = React.useState({
            current_password: '',
            new_password: '',
            confirm_password: ''
        });
        const [loading, setLoading] = React.useState(false);
        const [message, setMessage] = React.useState('');

        const handleChangePassword = async (e) => {
            e.preventDefault();
            
            if (passwordForm.new_password !== passwordForm.confirm_password) {
                setMessage('New passwords do not match');
                return;
            }

            setLoading(true);
            setMessage('');

            try {
                const token = localStorage.getItem('auth_token');
                const response = await fetch('/api/auth/change-password', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        current_password: passwordForm.current_password,
                        new_password: passwordForm.new_password
                    })
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || 'Failed to change password');
                }

                setMessage('Password changed successfully');
                setShowChangePassword(false);
                setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
            } catch (err) {
                setMessage(err.message);
            } finally {
                setLoading(false);
            }
        };

        const handleLogout = async () => {
            try {
                const token = localStorage.getItem('auth_token');
                await fetch('/api/auth/logout', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
            } catch (err) {
                console.error('Logout error:', err);
            } finally {
                localStorage.removeItem('auth_token');
                localStorage.removeItem('user_data');
                localStorage.removeItem('token_expires');
                onLogout();
            }
        };

        return React.createElement('div', { className: 'space-y-6' }, [
            React.createElement('div', { 
                key: 'profile-card',
                className: 'bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 p-6' 
            }, [
                React.createElement('div', { key: 'header', className: 'flex items-center justify-between mb-6' }, [
                    React.createElement('h3', { 
                        key: 'title',
                        className: 'text-xl font-semibold text-gray-900 dark:text-white' 
                    }, 'User Profile'),
                    React.createElement('button', {
                        key: 'logout',
                        onClick: handleLogout,
                        className: 'px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors'
                    }, 'Logout')
                ]),
                
                React.createElement('div', { key: 'info', className: 'grid grid-cols-1 md:grid-cols-2 gap-6' }, [
                    React.createElement('div', { key: 'basic' }, [
                        React.createElement('h4', { 
                            key: 'title',
                            className: 'text-lg font-medium text-gray-900 dark:text-white mb-4' 
                        }, 'Basic Information'),
                        React.createElement('div', { key: 'fields', className: 'space-y-3' }, [
                            React.createElement('div', { key: 'name' }, [
                                React.createElement('label', { 
                                    key: 'label',
                                    className: 'block text-sm font-medium text-gray-700 dark:text-gray-300' 
                                }, 'Full Name'),
                                React.createElement('p', { 
                                    key: 'value',
                                    className: 'text-gray-900 dark:text-white' 
                                }, `${user.first_name} ${user.last_name}`)
                            ]),
                            React.createElement('div', { key: 'username' }, [
                                React.createElement('label', { 
                                    key: 'label',
                                    className: 'block text-sm font-medium text-gray-700 dark:text-gray-300' 
                                }, 'Username'),
                                React.createElement('p', { 
                                    key: 'value',
                                    className: 'text-gray-900 dark:text-white' 
                                }, user.username)
                            ]),
                            React.createElement('div', { key: 'email' }, [
                                React.createElement('label', { 
                                    key: 'label',
                                    className: 'block text-sm font-medium text-gray-700 dark:text-gray-300' 
                                }, 'Email'),
                                React.createElement('p', { 
                                    key: 'value',
                                    className: 'text-gray-900 dark:text-white' 
                                }, user.email)
                            ])
                        ])
                    ]),
                    
                    React.createElement('div', { key: 'role' }, [
                        React.createElement('h4', { 
                            key: 'title',
                            className: 'text-lg font-medium text-gray-900 dark:text-white mb-4' 
                        }, 'Role & Permissions'),
                        React.createElement('div', { key: 'fields', className: 'space-y-3' }, [
                            React.createElement('div', { key: 'role' }, [
                                React.createElement('label', { 
                                    key: 'label',
                                    className: 'block text-sm font-medium text-gray-700 dark:text-gray-300' 
                                }, 'Role'),
                                React.createElement('span', { 
                                    key: 'value',
                                    className: 'inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' 
                                }, user.role)
                            ]),
                            React.createElement('div', { key: 'permissions' }, [
                                React.createElement('label', { 
                                    key: 'label',
                                    className: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2' 
                                }, 'Permissions'),
                                React.createElement('div', { 
                                    key: 'list',
                                    className: 'space-y-1' 
                                }, Object.entries(user.permissions).map(([module, perms]) => 
                                    React.createElement('div', { 
                                        key: module,
                                        className: 'text-sm text-gray-600 dark:text-gray-400' 
                                    }, `${module}: ${Object.keys(perms).join(', ')}`)
                                ))
                            ])
                        ])
                    ])
                ]),
                
                React.createElement('div', { key: 'actions', className: 'mt-6 pt-6 border-t dark:border-gray-700' }, [
                    React.createElement('button', {
                        key: 'change-password',
                        onClick: () => setShowChangePassword(!showChangePassword),
                        className: 'px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
                    }, showChangePassword ? 'Cancel' : 'Change Password')
                ])
            ]),
            
            showChangePassword && React.createElement('div', { 
                key: 'password-form',
                className: 'bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 p-6' 
            }, [
                React.createElement('h4', { 
                    key: 'title',
                    className: 'text-lg font-medium text-gray-900 dark:text-white mb-4' 
                }, 'Change Password'),
                
                message && React.createElement('div', { 
                    key: 'message',
                    className: `mb-4 p-3 rounded-lg text-sm ${
                        message.includes('successfully') 
                            ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' 
                            : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                    }` 
                }, message),
                
                React.createElement('form', { 
                    key: 'form',
                    onSubmit: handleChangePassword,
                    className: 'space-y-4' 
                }, [
                    React.createElement('div', { key: 'current' }, [
                        React.createElement('label', { 
                            key: 'label',
                            className: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1' 
                        }, 'Current Password'),
                        React.createElement('input', {
                            key: 'input',
                            type: 'password',
                            value: passwordForm.current_password,
                            onChange: (e) => setPasswordForm({...passwordForm, current_password: e.target.value}),
                            className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white',
                            required: true
                        })
                    ]),
                    
                    React.createElement('div', { key: 'new' }, [
                        React.createElement('label', { 
                            key: 'label',
                            className: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1' 
                        }, 'New Password'),
                        React.createElement('input', {
                            key: 'input',
                            type: 'password',
                            value: passwordForm.new_password,
                            onChange: (e) => setPasswordForm({...passwordForm, new_password: e.target.value}),
                            className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white',
                            required: true
                        })
                    ]),
                    
                    React.createElement('div', { key: 'confirm' }, [
                        React.createElement('label', { 
                            key: 'label',
                            className: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1' 
                        }, 'Confirm New Password'),
                        React.createElement('input', {
                            key: 'input',
                            type: 'password',
                            value: passwordForm.confirm_password,
                            onChange: (e) => setPasswordForm({...passwordForm, confirm_password: e.target.value}),
                            className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white',
                            required: true
                        })
                    ]),
                    
                    React.createElement('div', { key: 'buttons', className: 'flex gap-3' }, [
                        React.createElement('button', {
                            key: 'submit',
                            type: 'submit',
                            disabled: loading,
                            className: `px-4 py-2 rounded-lg font-medium transition-colors ${
                                loading 
                                    ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed' 
                                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                            }`
                        }, loading ? 'Changing...' : 'Change Password'),
                        React.createElement('button', {
                            key: 'cancel',
                            type: 'button',
                            onClick: () => setShowChangePassword(false),
                            className: 'px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors'
                        }, 'Cancel')
                    ])
                ])
            ])
        ]);
    },

    // User Management Component (Admin only)
    UserManagementView: ({ user }) => {
        const [users, setUsers] = React.useState([]);
        const [roles, setRoles] = React.useState([]);
        const [loading, setLoading] = React.useState(true);
        const [showCreateForm, setShowCreateForm] = React.useState(false);
        const [createForm, setCreateForm] = React.useState({
            username: '',
            email: '',
            password: '',
            first_name: '',
            last_name: '',
            role_id: ''
        });

        const loadUsers = async () => {
            try {
                const token = localStorage.getItem('auth_token');
                const response = await fetch('/api/users', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json();
                setUsers(data);
            } catch (err) {
                console.error('Failed to load users:', err);
            }
        };

        const loadRoles = async () => {
            try {
                const token = localStorage.getItem('auth_token');
                const response = await fetch('/api/roles', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json();
                setRoles(data);
            } catch (err) {
                console.error('Failed to load roles:', err);
            }
        };

        React.useEffect(() => {
            Promise.all([loadUsers(), loadRoles()]).finally(() => setLoading(false));
        }, []);

        const handleCreateUser = async (e) => {
            e.preventDefault();
            setLoading(true);

            try {
                const token = localStorage.getItem('auth_token');
                const response = await fetch('/api/users', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(createForm)
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error);
                }

                await loadUsers();
                setShowCreateForm(false);
                setCreateForm({
                    username: '',
                    email: '',
                    password: '',
                    first_name: '',
                    last_name: '',
                    role_id: ''
                });
            } catch (err) {
                alert(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (loading) {
            return React.createElement('div', { 
                className: 'flex items-center justify-center p-8' 
            }, [
                React.createElement('div', { 
                    className: 'animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600' 
                })
            ]);
        }

        return React.createElement('div', { className: 'space-y-6' }, [
            React.createElement('div', { 
                key: 'header',
                className: 'flex items-center justify-between' 
            }, [
                React.createElement('h3', { 
                    key: 'title',
                    className: 'text-xl font-semibold text-gray-900 dark:text-white' 
                }, 'User Management'),
                React.createElement('button', {
                    key: 'create',
                    onClick: () => setShowCreateForm(!showCreateForm),
                    className: 'px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
                }, showCreateForm ? 'Cancel' : 'Create User')
            ]),
            
            showCreateForm && React.createElement('div', { 
                key: 'create-form',
                className: 'bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 p-6' 
            }, [
                React.createElement('h4', { 
                    key: 'title',
                    className: 'text-lg font-medium text-gray-900 dark:text-white mb-4' 
                }, 'Create New User'),
                
                React.createElement('form', { 
                    key: 'form',
                    onSubmit: handleCreateUser,
                    className: 'grid grid-cols-1 md:grid-cols-2 gap-4' 
                }, [
                    React.createElement('input', {
                        key: 'username',
                        type: 'text',
                        placeholder: 'Username',
                        value: createForm.username,
                        onChange: (e) => setCreateForm({...createForm, username: e.target.value}),
                        className: 'px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white',
                        required: true
                    }),
                    React.createElement('input', {
                        key: 'email',
                        type: 'email',
                        placeholder: 'Email',
                        value: createForm.email,
                        onChange: (e) => setCreateForm({...createForm, email: e.target.value}),
                        className: 'px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white',
                        required: true
                    }),
                    React.createElement('input', {
                        key: 'first_name',
                        type: 'text',
                        placeholder: 'First Name',
                        value: createForm.first_name,
                        onChange: (e) => setCreateForm({...createForm, first_name: e.target.value}),
                        className: 'px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white',
                        required: true
                    }),
                    React.createElement('input', {
                        key: 'last_name',
                        type: 'text',
                        placeholder: 'Last Name',
                        value: createForm.last_name,
                        onChange: (e) => setCreateForm({...createForm, last_name: e.target.value}),
                        className: 'px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white',
                        required: true
                    }),
                    React.createElement('input', {
                        key: 'password',
                        type: 'password',
                        placeholder: 'Password',
                        value: createForm.password,
                        onChange: (e) => setCreateForm({...createForm, password: e.target.value}),
                        className: 'px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white',
                        required: true
                    }),
                    React.createElement('select', {
                        key: 'role',
                        value: createForm.role_id,
                        onChange: (e) => setCreateForm({...createForm, role_id: e.target.value}),
                        className: 'px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white',
                        required: true
                    }, [
                        React.createElement('option', { key: 'default', value: '' }, 'Select Role'),
                        ...roles.map(role => 
                            React.createElement('option', { key: role.id, value: role.id }, role.name)
                        )
                    ]),
                    React.createElement('button', {
                        key: 'submit',
                        type: 'submit',
                        disabled: loading,
                        className: `col-span-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                            loading 
                                ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed' 
                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`
                    }, loading ? 'Creating...' : 'Create User')
                ])
            ]),
            
            React.createElement('div', { 
                key: 'users-list',
                className: 'bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 overflow-hidden' 
            }, [
                React.createElement('div', { 
                    key: 'table',
                    className: 'overflow-x-auto' 
                }, [
                    React.createElement('table', { 
                        key: 'table',
                        className: 'min-w-full divide-y divide-gray-200 dark:divide-gray-700' 
                    }, [
                        React.createElement('thead', { 
                            key: 'thead',
                            className: 'bg-gray-50 dark:bg-gray-700' 
                        }, [
                            React.createElement('tr', { key: 'header' }, [
                                React.createElement('th', { key: 'name', className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider' }, 'Name'),
                                React.createElement('th', { key: 'username', className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider' }, 'Username'),
                                React.createElement('th', { key: 'email', className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider' }, 'Email'),
                                React.createElement('th', { key: 'role', className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider' }, 'Role'),
                                React.createElement('th', { key: 'status', className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider' }, 'Status'),
                                React.createElement('th', { key: 'last_login', className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider' }, 'Last Login')
                            ])
                        ]),
                        React.createElement('tbody', { 
                            key: 'tbody',
                            className: 'bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700' 
                        }, users.map(user => 
                            React.createElement('tr', { key: user.id }, [
                                React.createElement('td', { key: 'name', className: 'px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white' }, 
                                    `${user.first_name} ${user.last_name}`),
                                React.createElement('td', { key: 'username', className: 'px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white' }, user.username),
                                React.createElement('td', { key: 'email', className: 'px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white' }, user.email),
                                React.createElement('td', { key: 'role', className: 'px-6 py-4 whitespace-nowrap' }, [
                                    React.createElement('span', { 
                                        key: 'badge',
                                        className: 'inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' 
                                    }, user.role_name)
                                ]),
                                React.createElement('td', { key: 'status', className: 'px-6 py-4 whitespace-nowrap' }, [
                                    React.createElement('span', { 
                                        key: 'badge',
                                        className: `inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                            user.is_active 
                                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                                                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                        }` 
                                    }, user.is_active ? 'Active' : 'Inactive')
                                ]),
                                React.createElement('td', { key: 'last_login', className: 'px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400' }, 
                                    user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never')
                            ])
                        ))
                    ])
                ])
            ])
        ]);
    }
};
