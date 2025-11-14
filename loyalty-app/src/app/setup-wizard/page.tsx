'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { Building2, User, Mail, Lock, Phone, MapPin, CheckCircle2, ArrowRight, ArrowLeft, Link, Database, CheckCircle, XCircle } from 'lucide-react';

// Step schemas
const step1Schema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

const step2Schema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
});

const step3Schema = z.object({
  mulesoftEndpoint: z.string().url().optional().or(z.literal('')),
});

const step4Schema = z.object({
  locationId: z.number().optional(),
  createNewLocation: z.boolean().default(false),
  storeCode: z.string().optional(),
  storeName: z.string().optional(),
  locationAddress: z.string().optional(),
  locationCity: z.string().optional(),
  locationState: z.string().optional(),
  locationZipCode: z.string().optional(),
  taxRate: z.string().optional(),
});

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;
type Step3Data = z.infer<typeof step3Schema>;
type Step4Data = z.infer<typeof step4Schema>;

interface Location {
  id: number;
  store_name: string;
  store_code: string;
  city: string;
  state: string;
}

export default function SetupWizardPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [checkingSetup, setCheckingSetup] = useState(true);
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [dbConnection, setDbConnection] = useState<any>(null);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionTestResult, setConnectionTestResult] = useState<{ success: boolean; message: string; data?: any } | null>(null);
  
  // Form data for all steps
  const [step1Data, setStep1Data] = useState<Partial<Step1Data>>({});
  const [step2Data, setStep2Data] = useState<Partial<Step2Data>>({});
  const [step3Data, setStep3Data] = useState<Partial<Step3Data>>({ mulesoftEndpoint: '' });
  const [step4Data, setStep4Data] = useState<Partial<Step4Data>>({ createNewLocation: false });

  // Check if setup is needed
  useEffect(() => {
    const checkSetupStatus = async () => {
      try {
        const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
        const response = await fetch(`${basePath}/api/setup/status`);
        const data = await response.json();

        if (!data.setupRequired) {
          router.push('/login');
        } else {
          setCheckingSetup(false);
          // Load existing locations if any
          loadLocations();
        }
      } catch (error) {
        console.error('Error checking setup status:', error);
        setCheckingSetup(false);
      }
    };

    checkSetupStatus();
  }, [router]);

  // Load company logo
  useEffect(() => {
    const loadLogo = async () => {
      try {
        const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
        const response = await fetch(`${basePath}/api/locations/current`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.location && data.location.logo_base64) {
            setCompanyLogo(data.location.logo_base64);
          }
        }
      } catch (error) {
        console.error('Error loading logo:', error);
      }
    };
    loadLogo();
  }, []);

  const loadLocations = async () => {
    try {
      const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
      const response = await fetch(`${basePath}/api/locations`);
      if (response.ok) {
        const data = await response.json();
        setLocations(data.locations || []);
      }
    } catch (error) {
      console.error('Error loading locations:', error);
    }
  };

  // Load database connection info
  useEffect(() => {
    const loadDbConnection = async () => {
      try {
        const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
        const response = await fetch(`${basePath}/api/setup/database-info`);
        if (response.ok) {
          const data = await response.json();
          setDbConnection(data);
        }
      } catch (error) {
        console.error('Error loading database info:', error);
      }
    };
    if (currentStep === 3) {
      loadDbConnection();
    }
  }, [currentStep]);

  // Test MuleSoft connection
  const testMulesoftConnection = async () => {
    if (!step3Data.mulesoftEndpoint) {
      setConnectionTestResult({
        success: false,
        message: 'Please enter a MuleSoft endpoint URL'
      });
      return;
    }

    setTestingConnection(true);
    setConnectionTestResult(null);

    try {
      const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
      const response = await fetch(`${basePath}/api/setup/test-mulesoft`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ endpoint: step3Data.mulesoftEndpoint }),
      });

      const data = await response.json();
      setConnectionTestResult(data);
    } catch (error) {
      setConnectionTestResult({
        success: false,
        message: 'Failed to test connection: ' + (error instanceof Error ? error.message : 'Unknown error')
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const validateStep = (step: number): boolean => {
    try {
      if (step === 1) {
        step1Schema.parse(step1Data);
      } else if (step === 2) {
        step2Schema.parse(step2Data);
      } else if (step === 3) {
        step3Schema.parse(step3Data);
        // MuleSoft step is optional, always valid
      } else if (step === 4) {
        if (step4Data.createNewLocation) {
          if (!step4Data.storeCode || !step4Data.storeName) {
            setError('Store code and name are required for new location');
            return false;
          }
        } else if (!step4Data.locationId && locations.length > 0) {
          setError('Please select a location or create a new one');
          return false;
        }
      }
      setError(null);
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message);
      }
      return false;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    setError(null);
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    setIsLoading(true);
    setError(null);

    try {
      const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
      
      // Combine all form data
      const setupData = {
        ...step1Data,
        ...step2Data,
        ...step3Data,
        ...step4Data,
      };

      const response = await fetch(`${basePath}/api/setup/initialize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(setupData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Setup failed');
      }

      setSuccess(true);

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during setup');
    } finally {
      setIsLoading(false);
    }
  };

  if (checkingSetup) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Checking setup status...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
          <div className="text-center">
            <CheckCircle2 className="mx-auto mb-4 h-16 w-16 text-green-500" />
            <h2 className="mb-2 text-2xl font-bold text-gray-900">Setup Complete!</h2>
            <p className="text-gray-600">
              Your system has been configured successfully.
            </p>
            <p className="mt-2 text-sm text-gray-500">
              Redirecting to login...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-3xl">
        {/* Header with Logo */}
        <div className="mb-8 text-center">
          {companyLogo && (
            <div className="mb-6 flex justify-center">
              <img
                src={companyLogo}
                alt="Company Logo"
                className="h-40 w-auto max-w-full object-contain"
              />
            </div>
          )}
          <h1 className="mb-2 text-3xl font-bold text-gray-900">
            Welcome to Your POS & Loyalty System
          </h1>
          <p className="text-gray-600">
            Step {currentStep} of 4: {
              currentStep === 1 ? 'Admin Account' : 
              currentStep === 2 ? 'Business Information' : 
              currentStep === 3 ? 'MuleSoft Integration' :
              'Location Setup'
            }
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex flex-1 items-center">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full ${
                    step <= currentStep
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-300 text-gray-600'
                  }`}
                >
                  {step}
                </div>
                {step < 4 && (
                  <div
                    className={`mx-2 h-1 flex-1 ${
                      step < currentStep ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <div className="rounded-2xl bg-white p-8 shadow-xl">
          {/* Step 1: Admin Account */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Create Admin Account</h2>
              
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* Username */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Username *
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={step1Data.username || ''}
                      onChange={(e) => setStep1Data({ ...step1Data, username: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="admin"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Email *
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      value={step1Data.email || ''}
                      onChange={(e) => setStep1Data({ ...step1Data, email: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="admin@company.com"
                    />
                  </div>
                </div>

                {/* First Name */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={step1Data.firstName || ''}
                    onChange={(e) => setStep1Data({ ...step1Data, firstName: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 py-2 px-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="John"
                  />
                </div>

                {/* Last Name */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={step1Data.lastName || ''}
                    onChange={(e) => setStep1Data({ ...step1Data, lastName: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 py-2 px-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Doe"
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Password *
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="password"
                      value={step1Data.password || ''}
                      onChange={(e) => setStep1Data({ ...step1Data, password: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="password"
                      value={step1Data.confirmPassword || ''}
                      onChange={(e) => setStep1Data({ ...step1Data, confirmPassword: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Phone (Optional)
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Phone className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="tel"
                    value={step1Data.phone || ''}
                    onChange={(e) => setStep1Data({ ...step1Data, phone: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Business Information */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Business Information</h2>
              <p className="text-sm text-gray-600">This information is required to set up your system</p>

              {/* Company Name - Required */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Company Name *
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Building2 className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={step2Data.companyName || ''}
                    onChange={(e) => setStep2Data({ ...step2Data, companyName: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Your Business Name"
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Address (Optional)
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <MapPin className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={step2Data.address || ''}
                    onChange={(e) => setStep2Data({ ...step2Data, address: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="123 Main Street"
                  />
                </div>
              </div>

              {/* City, State, Zip */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    City
                  </label>
                  <input
                    type="text"
                    value={step2Data.city || ''}
                    onChange={(e) => setStep2Data({ ...step2Data, city: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 py-2 px-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="New York"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    State
                  </label>
                  <input
                    type="text"
                    value={step2Data.state || ''}
                    onChange={(e) => setStep2Data({ ...step2Data, state: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 py-2 px-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="NY"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Zip Code
                  </label>
                  <input
                    type="text"
                    value={step2Data.zipCode || ''}
                    onChange={(e) => setStep2Data({ ...step2Data, zipCode: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 py-2 px-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="10001"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: MuleSoft Integration */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">MuleSoft Integration</h2>
              
              {/* Deployment Instructions */}
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
                <div className="flex items-start space-x-3">
                  <Database className="h-6 w-6 text-blue-600 mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-blue-900 mb-2">
                      Please deploy the MuleSoft Loyalty Sync application
                    </h3>
                    <p className="text-sm text-blue-700 mb-3">
                      Before proceeding, you need to deploy the MuleSoft Loyalty Sync application. 
                      Follow the instructions in the deployment guide:
                    </p>
                    <a
                      href="https://docs.google.com/document/d/1AqZEVKX52ZySBjEWQnqa5P1EPBffyEu88xe1cLaZlb0/edit?tab=t.f0smgig9s2jq"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                    >
                      <Link className="h-4 w-4" />
                      <span>View Deployment Instructions</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Database Connection Information */}
              {dbConnection && (
                <div className="rounded-lg border border-gray-300 bg-gray-50 p-6">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    <Database className="h-5 w-5 text-gray-600" />
                    <span>Database Connection Information</span>
                  </h3>
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Host
                        </label>
                        <div className="rounded bg-white px-3 py-2 text-sm font-mono text-gray-900 border border-gray-200">
                          {dbConnection.host || 'N/A'}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Port
                        </label>
                        <div className="rounded bg-white px-3 py-2 text-sm font-mono text-gray-900 border border-gray-200">
                          {dbConnection.port || 'N/A'}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Database
                        </label>
                        <div className="rounded bg-white px-3 py-2 text-sm font-mono text-gray-900 border border-gray-200">
                          {dbConnection.database || 'N/A'}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          User
                        </label>
                        <div className="rounded bg-white px-3 py-2 text-sm font-mono text-gray-900 border border-gray-200">
                          {dbConnection.user || 'N/A'}
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Password
                      </label>
                      <div className="rounded bg-white px-3 py-2 text-sm font-mono text-gray-900 border border-gray-200">
                        {dbConnection.password || 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* MuleSoft Endpoint Configuration */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  MuleSoft Endpoint URL (Optional)
                </label>
                <p className="mb-3 text-xs text-gray-600">
                  Enter the base URL of your deployed MuleSoft application (e.g., https://your-app.cloudhub.io)
                </p>
                <input
                  type="url"
                  value={step3Data.mulesoftEndpoint || ''}
                  onChange={(e) => setStep3Data({ ...step3Data, mulesoftEndpoint: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 py-2 px-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://your-mulesoft-app.cloudhub.io"
                />
              </div>

              {/* Test Connection Button */}
              {step3Data.mulesoftEndpoint && (
                <div>
                  <button
                    type="button"
                    onClick={testMulesoftConnection}
                    disabled={testingConnection}
                    className="flex items-center space-x-2 rounded-lg border border-blue-600 bg-white px-4 py-2 text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {testingConnection ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                        <span>Testing Connection...</span>
                      </>
                    ) : (
                      <>
                        <Database className="h-4 w-4" />
                        <span>Test MuleSoft Connection</span>
                      </>
                    )}
                  </button>

                  {/* Connection Test Result */}
                  {connectionTestResult && (
                    <div className={`mt-4 rounded-lg border p-4 ${
                      connectionTestResult.success 
                        ? 'border-green-200 bg-green-50' 
                        : 'border-red-200 bg-red-50'
                    }`}>
                      <div className="flex items-start space-x-3">
                        {connectionTestResult.success ? (
                          <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                        )}
                        <div className="flex-1">
                          <p className={`text-sm font-medium ${
                            connectionTestResult.success ? 'text-green-900' : 'text-red-900'
                          }`}>
                            {connectionTestResult.message}
                          </p>
                          {connectionTestResult.success && connectionTestResult.data && (
                            <div className="mt-2 text-xs text-green-700">
                              <p className="font-semibold">Loyalty Programs Found:</p>
                              <ul className="mt-1 list-disc list-inside">
                                {connectionTestResult.data.map((program: any, index: number) => (
                                  <li key={index}>{program.Name} (ID: {program.Id})</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <p className="text-xs text-gray-500 italic">
                Note: The MuleSoft endpoint configuration is optional. You can skip this step and configure it later in Settings.
              </p>
            </div>
          )}

          {/* Step 4: Location Setup */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Location Setup</h2>
              
              {locations.length > 0 ? (
                <>
                  <p className="text-sm text-gray-600">Select an existing location or create a new one</p>
                  
                  {/* Existing Locations */}
                  <div>
                    <label className="mb-3 block text-sm font-medium text-gray-700">
                      Select Existing Location
                    </label>
                    <div className="space-y-2">
                      {locations.map((location) => (
                        <label
                          key={location.id}
                          className="flex items-center space-x-3 rounded-lg border-2 border-gray-200 p-4 cursor-pointer hover:bg-gray-50"
                        >
                          <input
                            type="radio"
                            name="location"
                            checked={step4Data.locationId === location.id && !step4Data.createNewLocation}
                            onChange={() => setStep4Data({ ...step4Data, locationId: location.id, createNewLocation: false })}
                            className="h-4 w-4 text-blue-600"
                          />
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{location.store_name}</div>
                            <div className="text-sm text-gray-500">
                              {location.store_code} • {location.city}, {location.state}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Or Create New */}
                  <div>
                    <label className="flex items-center space-x-3 rounded-lg border-2 border-gray-200 p-4 cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="location"
                        checked={step4Data.createNewLocation === true}
                        onChange={() => setStep4Data({ ...step4Data, createNewLocation: true, locationId: undefined })}
                        className="h-4 w-4 text-blue-600"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">Create New Location</div>
                        <div className="text-sm text-gray-500">Set up a new store location</div>
                      </div>
                    </label>
                  </div>
                </>
              ) : (
                <p className="text-sm text-gray-600">Create your first location</p>
              )}

              {/* New Location Form */}
              {(step4Data.createNewLocation || locations.length === 0) && (
                <div className="mt-6 space-y-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
                  <h3 className="font-semibold text-gray-900">New Location Details</h3>
                  
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Store Code *
                      </label>
                      <input
                        type="text"
                        value={step4Data.storeCode || ''}
                        onChange={(e) => setStep4Data({ ...step4Data, storeCode: e.target.value.toUpperCase() })}
                        className="w-full rounded-lg border border-gray-300 py-2 px-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="STORE01"
                        maxLength={10}
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Store Name *
                      </label>
                      <input
                        type="text"
                        value={step4Data.storeName || ''}
                        onChange={(e) => setStep4Data({ ...step4Data, storeName: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 py-2 px-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Main Store"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Address
                    </label>
                    <input
                      type="text"
                      value={step4Data.locationAddress || ''}
                      onChange={(e) => setStep4Data({ ...step4Data, locationAddress: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 py-2 px-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="123 Store Street"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        City
                      </label>
                      <input
                        type="text"
                        value={step4Data.locationCity || ''}
                        onChange={(e) => setStep4Data({ ...step4Data, locationCity: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 py-2 px-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="New York"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        State
                      </label>
                      <input
                        type="text"
                        value={step4Data.locationState || ''}
                        onChange={(e) => setStep4Data({ ...step4Data, locationState: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 py-2 px-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="NY"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Zip Code
                      </label>
                      <input
                        type="text"
                        value={step4Data.locationZipCode || ''}
                        onChange={(e) => setStep4Data({ ...step4Data, locationZipCode: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 py-2 px-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="10001"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Tax Rate (Optional)
                    </label>
                    <input
                      type="text"
                      value={step4Data.taxRate || '0.08'}
                      onChange={(e) => setStep4Data({ ...step4Data, taxRate: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 py-2 px-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0.08"
                    />
                    <p className="mt-1 text-xs text-gray-500">Enter as decimal (e.g., 0.08 for 8%)</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="mt-8 flex justify-between">
            {currentStep > 1 && (
              <button
                onClick={handleBack}
                disabled={isLoading}
                className="flex items-center space-x-2 rounded-lg border border-gray-300 px-6 py-3 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Back</span>
              </button>
            )}

            {currentStep < 4 ? (
              <button
                onClick={handleNext}
                className="ml-auto flex items-center space-x-2 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <span>Next</span>
                <ArrowRight className="h-5 w-5" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="ml-auto flex items-center space-x-2 rounded-lg bg-green-600 px-6 py-3 font-semibold text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    <span>Completing Setup...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-5 w-5" />
                    <span>Complete Setup</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>This wizard will guide you through setting up your POS & Loyalty system</p>
        </div>
      </div>
    </div>
  );
}

