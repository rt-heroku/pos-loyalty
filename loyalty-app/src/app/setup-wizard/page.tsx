'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { z } from 'zod';
import { Building2, User, Mail, Lock, Phone, CheckCircle2, ArrowRight, ArrowLeft, Link, Database, CheckCircle, XCircle, Upload, Image as ImageIcon, Users } from 'lucide-react';

// Disable static optimization for this page (uses dynamic search params)
export const dynamic = 'force-dynamic';

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
});

// Step 3: Location Setup
const step3Schema = z.object({
  locationId: z.number().optional(),
  createNewLocation: z.boolean().default(false),
  storeCode: z.string().optional(),
  storeName: z.string().optional(),
  locationAddress: z.string().optional(),
  locationCity: z.string().optional(),
  locationState: z.string().optional(),
  locationZipCode: z.string().optional(),
  taxRate: z.string().optional(),
  locationLogo: z.string().optional(), // Base64 encoded logo
});

// Step 4: Database Connection Info (display only - no schema needed)

// Step 5: MuleSoft Integration
const step5Schema = z.object({
  mulesoftEndpoint: z.string().url().optional().or(z.literal('')),
});

// Step 6: Loyalty Data Setup (optional, only if MuleSoft connection successful)
const step6Schema = z.object({
  loyaltyProgramId: z.string().optional(),
  journalTypeId: z.string().optional(),
  journalSubtypeId: z.string().optional(),
  enrollmentJournalSubtypeId: z.string().optional(),
  loadMembers: z.boolean().default(false),
  loadProducts: z.boolean().default(false),
});

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;
type Step3Data = z.infer<typeof step3Schema>;
// Step 4 is display-only, no type needed
type Step5Data = z.infer<typeof step5Schema>;
type Step6Data = z.infer<typeof step6Schema>;

interface Location {
  id: number;
  store_name: string;
  store_code: string;
  city: string;
  state: string;
}

export default function SetupWizardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
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
  
  // Get returnTo parameter (where to redirect after setup)
  const returnTo = searchParams?.get('returnTo') || '/login';
  
  // Form data for all steps
  const [step1Data, setStep1Data] = useState<Partial<Step1Data>>({});
  const [step2Data, setStep2Data] = useState<Partial<Step2Data>>({});
  const [step3Data, setStep3Data] = useState<Partial<Step3Data>>({ createNewLocation: false }); // Location
  // Step 4 (DB Info) is display-only, no form data needed
  const [step5Data, setStep5Data] = useState<Partial<Step5Data>>({ mulesoftEndpoint: '' }); // MuleSoft
  const [step6Data, setStep6Data] = useState<Partial<Step6Data>>({}); // Loyalty Data Setup
  
  // Step 6 specific state
  const [loyaltyPrograms, setLoyaltyPrograms] = useState<any[]>([]);
  const [journalTypes, setJournalTypes] = useState<any[]>([]); // Array of { JournalType: {...}, JournalSubTypes: [...] }
  const [catalogs, setCatalogs] = useState<any[]>([]);
  const [selectedCatalog, setSelectedCatalog] = useState<string>('');
  const [loadingLoyaltyData, setLoadingLoyaltyData] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [loadingCatalogs, setLoadingCatalogs] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productsResult, setProductsResult] = useState<any[] | null>(null);

  // Check if setup is needed
  useEffect(() => {
    const checkSetupStatus = async () => {
      try {
        const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
        const response = await fetch(`${basePath}/api/setup/status`);
        const data = await response.json();

        if (!data.setupRequired) {
          // Setup already complete, redirect to intended destination
          // If returning to /pos (Express app), use window.location.href
          if (returnTo === '/pos') {
            window.location.href = returnTo;
          } else {
            router.push(returnTo);
          }
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
        const locationsList = data.locations || [];
        setLocations(locationsList);
        
        // If no locations exist, automatically set createNewLocation to true
        if (locationsList.length === 0) {
          setStep3Data(prev => ({ ...prev, createNewLocation: true }));
        }
      }
    } catch (error) {
      console.error('Error loading locations:', error);
    }
  };

  // Handle logo upload
  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be less than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setStep3Data(prev => ({ ...prev, locationLogo: base64 }));
      setError(null);
    };
    reader.readAsDataURL(file);
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
    if (currentStep === 3) { // Load locations on Location step
      loadLocations();
    } else if (currentStep === 4) { // Load DB info on Database Connection step
      loadDbConnection();
    } else if (currentStep === 6 && connectionTestResult?.success) { // Load loyalty data on Step 6 if MuleSoft connected
      loadLoyaltyData();
    }
  }, [currentStep, connectionTestResult]);

  // Test MuleSoft connection
  const testMulesoftConnection = async () => {
    if (!step5Data.mulesoftEndpoint) {
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
        body: JSON.stringify({ endpoint: step5Data.mulesoftEndpoint }),
      });

      const data = await response.json();
      setConnectionTestResult(data);

      // If connection is successful, save the MuleSoft settings immediately
      if (data.success) {
        console.log('✅ Connection successful, saving MuleSoft settings...');
        try {
          const saveResponse = await fetch(`${basePath}/api/setup/save-mulesoft`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ mulesoftEndpoint: step5Data.mulesoftEndpoint }),
          });

          if (saveResponse.ok) {
            console.log('✅ MuleSoft settings saved successfully');
          } else {
            console.error('❌ Failed to save MuleSoft settings:', await saveResponse.text());
          }
        } catch (saveError) {
          console.error('❌ Error saving MuleSoft settings:', saveError);
          // Don't fail the whole operation, just log it
        }
      }
    } catch (error) {
      setConnectionTestResult({
        success: false,
        message: 'Failed to test connection: ' + (error instanceof Error ? error.message : 'Unknown error')
      });
    } finally {
      setTestingConnection(false);
    }
  };

  // Load loyalty programs, journal types, and catalogs from MuleSoft
  const loadLoyaltyData = async () => {
    if (!step5Data.mulesoftEndpoint) return;
    
    setLoadingLoyaltyData(true);
    setLoadingCatalogs(true);
    try {
      console.log('🔄 Loading loyalty data from:', step5Data.mulesoftEndpoint);
      
      // Load loyalty programs
      const programsResponse = await fetch(`${step5Data.mulesoftEndpoint}/programs`);
      if (programsResponse.ok) {
        const programs = await programsResponse.json();
        console.log('✅ Loaded loyalty programs:', programs);
        setLoyaltyPrograms(programs);
        if (programs.length > 0) {
          setStep6Data(prev => ({ ...prev, loyaltyProgramId: programs[0].Id }));
        }
      } else {
        console.error('❌ Failed to load programs:', programsResponse.status, programsResponse.statusText);
        setError(`Failed to load loyalty programs: ${programsResponse.statusText}`);
      }

      // Load journal types (includes subtypes in response)
      const journalTypesResponse = await fetch(`${step5Data.mulesoftEndpoint}/journaltypes`);
      if (journalTypesResponse.ok) {
        const types = await journalTypesResponse.json();
        console.log('✅ Loaded journal types:', types);
        setJournalTypes(types);
        if (types.length > 0 && types[0].JournalType) {
          // Set first journal type ID
          setStep6Data(prev => ({ ...prev, journalTypeId: types[0].JournalType.Id }));
          // Set first subtype if available
          if (types[0].JournalSubTypes && types[0].JournalSubTypes.length > 0) {
            setStep6Data(prev => ({ ...prev, journalSubtypeId: types[0].JournalSubTypes[0].Id }));
            // Also set enrollment subtype if available
            const enrollmentSubtype = types[0].JournalSubTypes.find((st: any) => st.Name.toLowerCase().includes('enrollment'));
            if (enrollmentSubtype) {
              setStep6Data(prev => ({ ...prev, enrollmentJournalSubtypeId: enrollmentSubtype.Id }));
            } else {
              setStep6Data(prev => ({ ...prev, enrollmentJournalSubtypeId: types[0].JournalSubTypes[0].Id })); // Fallback to first
            }
          }
        }
      } else {
        console.error('❌ Failed to load journal types:', journalTypesResponse.status, journalTypesResponse.statusText);
        setError(`Failed to load journal types: ${journalTypesResponse.statusText}`);
      }

      // Load catalogs via backend API (avoids CORS)
      const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
      const catalogsResponse = await fetch(`${basePath}/api/loyalty/catalogs?endpoint=${encodeURIComponent(step5Data.mulesoftEndpoint)}`);
      if (catalogsResponse.ok) {
        const catalogsData = await catalogsResponse.json();
        console.log('✅ Loaded catalogs:', catalogsData);
        setCatalogs(catalogsData);
        if (catalogsData.length > 0) {
          setSelectedCatalog(catalogsData[0].Id);
        }
      } else {
        console.error('❌ Failed to load catalogs:', catalogsResponse.status, catalogsResponse.statusText);
        setError(`Failed to load catalogs: ${catalogsResponse.statusText}`);
      }
    } catch (error) {
      console.error('❌ Error loading loyalty data:', error);
      setError(`Error loading loyalty data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoadingLoyaltyData(false);
      setLoadingCatalogs(false);
    }
  };

  // Get subtypes for the currently selected journal type
  const getCurrentSubtypes = () => {
    if (!step6Data.journalTypeId) return [];
    const selectedType = journalTypes.find(jt => jt.JournalType.Id === step6Data.journalTypeId);
    return selectedType?.JournalSubTypes || [];
  };

  // Load members from MuleSoft (same flow as SettingsView: fetch then sync)
  const handleLoadMembers = async () => {
    if (!step6Data.loyaltyProgramId) {
      setError('Please select a loyalty program first');
      return;
    }

    setLoadingMembers(true);
    setError(null);
    try {
      const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
      
      // Step 1: Fetch members from MuleSoft (GET)
      console.log('🔄 Step 1: Fetching members from MuleSoft...');
      const fetchResponse = await fetch(`${basePath}/api/mulesoft/members?endpoint=${encodeURIComponent(step5Data.mulesoftEndpoint || '')}`);
      
      if (!fetchResponse.ok) {
        const errorData = await fetchResponse.json();
        throw new Error(errorData.error || 'Failed to fetch members from MuleSoft');
      }

      const members = await fetchResponse.json();
      console.log(`✅ Fetched ${members.length} members from MuleSoft`);
      
      // Step 2: Sync members to database (POST)
      console.log('🔄 Step 2: Syncing members to database...');
      const syncResponse = await fetch(`${basePath}/api/mulesoft/members/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          loyaltyProgramId: step6Data.loyaltyProgramId,
          endpoint: step5Data.mulesoftEndpoint 
        }),
      });

      if (!syncResponse.ok) {
        const errorData = await syncResponse.json();
        throw new Error(errorData.error || 'Failed to sync members to database');
      }

      const results = await syncResponse.json();
      console.log('✅ Sync completed:', results);
      
      // Count successful syncs
      const memberCount = Array.isArray(results) ? results.length : (results.totalMembers || 0);
      alert(`✅ Successfully loaded and synced ${memberCount} members from Loyalty Cloud!`);
    } catch (error) {
      console.error('Failed to load/sync members:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(`Members Loading Failed: ${errorMessage}`);
      alert(`⚠️ Members Loading Failed:\n\n${errorMessage}\n\nYou can load members later from the System Settings section.`);
    } finally {
      setLoadingMembers(false);
    }
  };

  // Load products from selected catalog (same flow as LoadFromCloudModal)
  const handleLoadProducts = async () => {
    if (!selectedCatalog) {
      setError('Please select a catalog first');
      alert('⚠️ Please select a catalog first');
      return;
    }

    setLoadingProducts(true);
    setError(null);
    setProductsResult(null);
    
    try {
      console.log('🔄 Loading products from catalog:', selectedCatalog);
      const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
      
      // Call backend API to load products with catalog ID
      const response = await fetch(`${basePath}/api/loyalty/products/load`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          catalogId: selectedCatalog,
          endpoint: step5Data.mulesoftEndpoint 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load products');
      }

      const result = await response.json();
      console.log('✅ Products loaded successfully:', result);
      setProductsResult(result);
      
      // Count successes
      const successCount = Array.isArray(result) ? result.filter((item: any) => item.success).length : 0;
      const totalCount = Array.isArray(result) ? result.length : 0;
      
      alert(`✅ Successfully loaded ${successCount} out of ${totalCount} products from Loyalty Cloud!`);
    } catch (error) {
      console.error('Failed to load products:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(`Products Loading Failed: ${errorMessage}`);
      alert(`⚠️ Products Loading Failed:\n\n${errorMessage}\n\nYou can load products later from the Data Management section in Settings.`);
    } finally {
      setLoadingProducts(false);
    }
  };

  const validateStep = (step: number): boolean => {
    try {
      if (step === 1) {
        step1Schema.parse(step1Data);
      } else if (step === 2) {
        step2Schema.parse(step2Data);
      } else if (step === 3) {
        // Location setup validation
        if (step3Data.createNewLocation) {
          if (!step3Data.storeCode || !step3Data.storeName) {
            setError('Store code and name are required for new location');
            return false;
          }
      } else if (!step3Data.locationId && locations.length > 0) {
        setError('Please select a location or create a new one');
        return false;
      }
    } else if (step === 4) {
      // Database info step - display only, no validation needed
      // Just return true to allow proceeding to next step
    } else if (step === 5) {
      // MuleSoft step is optional, always valid
      step5Schema.parse(step5Data);
    } else if (step === 6) {
      // Loyalty data setup is optional, always valid
      step6Schema.parse(step6Data);
    }
      setError(null);
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0]?.message || 'Validation error');
      }
      return false;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      // Skip step 6 if on step 5 and MuleSoft connection was not successful
      if (currentStep === 5 && (!connectionTestResult || !connectionTestResult.success)) {
        // Go directly to completion (which will be handled by final submit)
        // Since step 6 is optional and requires MuleSoft, skip it
        handleSubmit();
      } else {
      setCurrentStep(currentStep + 1);
      }
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
        // Step 4 (DB connection info) is display-only, not submitted
        ...step5Data,
        ...step6Data, // Include loyalty data configuration
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

      // Redirect to intended destination after 2 seconds
      setTimeout(() => {
        // If returning to /pos (Express app), use window.location.href
        // Otherwise use router.push for Next.js routes
        if (returnTo === '/pos') {
          window.location.href = returnTo;
        } else {
          router.push(returnTo);
        }
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
            Step {currentStep} of {connectionTestResult?.success ? '6' : '5'}: {
              currentStep === 1 ? 'Admin Account' : 
              currentStep === 2 ? 'Business Information' : 
              currentStep === 3 ? 'Location Setup' :
              currentStep === 4 ? 'Database Connection Info' :
              currentStep === 5 ? 'MuleSoft Integration' :
              'Loyalty Data Setup'
            }
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {(connectionTestResult?.success ? [1, 2, 3, 4, 5, 6] : [1, 2, 3, 4, 5]).map((step) => (
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
                {step < (connectionTestResult?.success ? 6 : 5) && (
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
            </div>
          )}

          {/* Step 4: Database Connection Info */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Database Connection Information</h2>
              
              <p className="text-gray-600">
                Use these database connection details to deploy the MuleSoft Loyalty Sync application.
              </p>

              {/* Deployment Instructions */}
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
                <div className="flex items-start space-x-3">
                  <Database className="h-6 w-6 text-blue-600 mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-blue-900 mb-2">
                      Deploy the MuleSoft Loyalty Sync application
                    </h3>
                    <p className="text-sm text-blue-700 mb-3">
                      Before proceeding to the next step, deploy the MuleSoft Loyalty Sync application 
                      using the database connection details below. Follow the instructions in the deployment guide:
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

              {/* Database Connection Information - Properties Format */}
              {dbConnection && (
                <div className="rounded-lg border border-gray-300 bg-gray-50 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
                      <Database className="h-5 w-5 text-gray-600" />
                      <span>Database Connection Properties</span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => {
                        const propertiesText = `#Environment
env=prod

#DB Configuration
db.host=${dbConnection.host || 'localhost'}
db.port=${dbConnection.port || '5432'}
db.user=${dbConnection.user || 'user'}
db.password=${dbConnection.password || 'password'}
db.database=${dbConnection.database || 'database'}

#Mule AI Chain Configuration
mac.heroku.inference_key=${dbConnection.inferenceKey || ''}
mac.openai_key=

#Salesforce configurations
# How to create an External Connected App: https://docs.google.com/document/d/1AqZEVKX52ZySBjEWQnqa5P1EPBffyEu88xe1cLaZlb0/edit?tab=t.yox8akb3q8gc
sfdc.domain=
sfdc.consumer_key=
sfdc.consumer_secret=`;
                        navigator.clipboard.writeText(propertiesText);
                        alert('Properties copied to clipboard!');
                      }}
                      className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                      Copy Properties
                    </button>
                  </div>
                  <div className="rounded bg-gray-900 p-4 overflow-x-auto">
                    <pre className="text-xs font-mono text-green-400">
{`#Environment
env=prod

#DB Configuration
db.host=${dbConnection.host || 'localhost'}
db.port=${dbConnection.port || '5432'}
db.user=${dbConnection.user || 'user'}
db.password=${dbConnection.password || 'password'}
db.database=${dbConnection.database || 'database'}

#Mule AI Chain Configuration
mac.heroku.inference_key=${dbConnection.inferenceKey || ''}
mac.openai_key=

#Salesforce configurations
# How to create an External Connected App: https://docs.google.com/document/d/1AqZEVKX52ZySBjEWQnqa5P1EPBffyEu88xe1cLaZlb0/edit?tab=t.yox8akb3q8gc
sfdc.domain=
sfdc.consumer_key=
sfdc.consumer_secret=`}
                    </pre>
                  </div>
                  <p className="mt-3 text-xs text-gray-600">
                    Copy these properties and paste them into your MuleSoft application's configuration file when deploying.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 5: MuleSoft Integration */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">MuleSoft Integration</h2>
              
              <p className="text-gray-600">
                Configure your MuleSoft Loyalty Sync endpoint and test the connection.
              </p>

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
                  value={step5Data.mulesoftEndpoint || ''}
                  onChange={(e) => setStep5Data({ ...step5Data, mulesoftEndpoint: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 py-2 px-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://your-mulesoft-app.cloudhub.io"
                  />
                </div>

              {/* Test Connection Button */}
              {step5Data.mulesoftEndpoint && (
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

          {/* Step 6: Loyalty Data Setup */}
          {currentStep === 6 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Loyalty Data Setup</h2>
              
              <p className="text-sm text-gray-600">
                Load existing members and products from your Loyalty Cloud.
              </p>

              {/* Optional Notice */}
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <p className="text-sm text-blue-900">
                  <strong>Note:</strong> This step is optional. You can load this data later from the System Settings and Data Management sections.
                </p>
              </div>

              {loadingLoyaltyData ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
                  <span className="ml-3 text-gray-600">Loading loyalty configuration...</span>
                </div>
              ) : (
                <>
                  {/* Loyalty Program Selection */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                      Loyalty Program
                  </label>
                    <select
                      value={step6Data.loyaltyProgramId || ''}
                      onChange={(e) => setStep6Data({ ...step6Data, loyaltyProgramId: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 py-2 px-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={loyaltyPrograms.length === 0}
                    >
                      {loyaltyPrograms.length === 0 ? (
                        <option value="">No programs available</option>
                      ) : (
                        loyaltyPrograms.map((program) => (
                          <option key={program.Id} value={program.Id}>
                            {program.Name}
                          </option>
                        ))
                      )}
                    </select>
                </div>

                  {/* Journal Type Selection */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                      Journal Type
                  </label>
                    <select
                      value={step6Data.journalTypeId || ''}
                      onChange={(e) => {
                        const typeId = e.target.value;
                        setStep6Data({ ...step6Data, journalTypeId: typeId, journalSubtypeId: '' });
                        // Auto-select first subtype if available
                        if (typeId) {
                          const selectedType = journalTypes.find(jt => jt.JournalType.Id === typeId);
                          if (selectedType?.JournalSubTypes && selectedType.JournalSubTypes.length > 0) {
                            setStep6Data(prev => ({ ...prev, journalSubtypeId: selectedType.JournalSubTypes[0].Id }));
                          }
                        }
                      }}
                    className="w-full rounded-lg border border-gray-300 py-2 px-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={journalTypes.length === 0}
                    >
                      {journalTypes.length === 0 ? (
                        <option value="">No journal types available</option>
                      ) : (
                        journalTypes.map((journalType) => (
                          <option key={journalType.JournalType.Id} value={journalType.JournalType.Id}>
                            {journalType.JournalType.Name}
                          </option>
                        ))
                      )}
                    </select>
                </div>

                  {/* Transaction Journal Subtype Selection */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                      Transaction Journal Subtype
                  </label>
                    <select
                      value={step6Data.journalSubtypeId || ''}
                      onChange={(e) => setStep6Data({ ...step6Data, journalSubtypeId: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 py-2 px-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={!step6Data.journalTypeId || getCurrentSubtypes().length === 0}
                    >
                      {!step6Data.journalTypeId ? (
                        <option value="">Select a journal type first</option>
                      ) : getCurrentSubtypes().length === 0 ? (
                        <option value="">No subtypes available</option>
                      ) : (
                        getCurrentSubtypes().map((subtype: any) => (
                          <option key={subtype.Id} value={subtype.Id}>
                            {subtype.Name}
                          </option>
                        ))
                      )}
                    </select>
                </div>

                  {/* Enrollment Journal Subtype Selection */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Enrollment Journal Subtype
                    </label>
                    <select
                      value={step6Data.enrollmentJournalSubtypeId || ''}
                      onChange={(e) => setStep6Data({ ...step6Data, enrollmentJournalSubtypeId: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 py-2 px-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={!step6Data.journalTypeId || getCurrentSubtypes().length === 0}
                    >
                      {!step6Data.journalTypeId ? (
                        <option value="">Select a journal type first</option>
                      ) : getCurrentSubtypes().length === 0 ? (
                        <option value="">No subtypes available</option>
                      ) : (
                        getCurrentSubtypes().map((subtype: any) => (
                          <option key={subtype.Id} value={subtype.Id}>
                            {subtype.Name}
                          </option>
                        ))
                      )}
                    </select>
              </div>

                  {/* Product Catalog Selection */}
                  <div className="pt-4 border-t border-gray-200">
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Select Product Catalog
                    </label>
                    <select
                      value={selectedCatalog}
                      onChange={(e) => setSelectedCatalog(e.target.value)}
                      disabled={loadingCatalogs || catalogs.length === 0}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">
                        {loadingCatalogs ? 'Loading catalogs...' : catalogs.length === 0 ? 'No catalogs available' : 'Select a catalog'}
                      </option>
                      {catalogs.map((catalog) => (
                        <option key={catalog.Id} value={catalog.Id}>
                          {catalog.Name}
                        </option>
                      ))}
                    </select>
            </div>

                  {/* Load Data Buttons */}
                  <div className="space-y-4 pt-4">
                    <h3 className="font-semibold text-gray-900">Load Existing Data</h3>
                    
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {/* Load Members Button */}
                      <button
                        type="button"
                        onClick={handleLoadMembers}
                        disabled={loadingMembers || !step6Data.loyaltyProgramId}
                        className="flex items-center justify-center space-x-2 rounded-lg bg-green-600 px-4 py-3 font-medium text-white hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loadingMembers ? (
                          <>
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                            <span>Loading Members...</span>
                          </>
                        ) : (
                          <>
                            <Users className="h-5 w-5" />
                            <span>Load Existing Members</span>
                          </>
                        )}
                      </button>

                      {/* Load Products Button */}
                      <button
                        type="button"
                        onClick={handleLoadProducts}
                        disabled={loadingProducts || !selectedCatalog}
                        className="flex items-center justify-center space-x-2 rounded-lg bg-blue-600 px-4 py-3 font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loadingProducts ? (
                          <>
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                            <span>Loading Products...</span>
                          </>
                        ) : (
                          <>
                            <Building2 className="h-5 w-5" />
                            <span>Load Existing Products</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Products Load Results */}
                  {productsResult && (
                    <div className="pt-4 border-t border-gray-200">
                      <h3 className="font-semibold text-gray-900 mb-3">Products Load Summary</h3>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="grid grid-cols-3 gap-4 text-center mb-4">
                          <div>
                            <div className="text-2xl font-bold text-gray-900">{productsResult.length}</div>
                            <div className="text-sm text-gray-600">Total</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-green-600">
                              {productsResult.filter((item: any) => item.success).length}
                            </div>
                            <div className="text-sm text-gray-600">Successful</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-red-600">
                              {productsResult.filter((item: any) => !item.success).length}
                            </div>
                            <div className="text-sm text-gray-600">Failed</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Step 3: Location Setup (internal step 4, shown as UI step 3) */}
          {currentStep === 3 && (
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
                            checked={step3Data.locationId === location.id && !step3Data.createNewLocation}
                            onChange={() => setStep3Data({ ...step3Data, locationId: location.id, createNewLocation: false })}
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
                        checked={step3Data.createNewLocation === true}
                        onChange={() => setStep3Data({ ...step3Data, createNewLocation: true, locationId: undefined })}
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
              {(step3Data.createNewLocation || locations.length === 0) && (
                <div className="mt-6 space-y-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
                  <h3 className="font-semibold text-gray-900">New Location Details</h3>
                  
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Store Code *
                      </label>
                      <input
                        type="text"
                        value={step3Data.storeCode || ''}
                        onChange={(e) => setStep3Data({ ...step3Data, storeCode: e.target.value.toUpperCase() })}
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
                        value={step3Data.storeName || ''}
                        onChange={(e) => setStep3Data({ ...step3Data, storeName: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 py-2 px-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Main Store"
                      />
                    </div>
                  </div>

                  {/* Logo Upload */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Store Logo (Optional)
                    </label>
                    <div className="flex items-center space-x-4">
                      {/* Logo Preview */}
                      {step3Data.locationLogo ? (
                        <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg border-2 border-gray-300">
                          <img
                            src={step3Data.locationLogo}
                            alt="Store logo"
                            className="h-full w-full object-contain"
                          />
                          <button
                            type="button"
                            onClick={() => setStep3Data({ ...step3Data, locationLogo: undefined })}
                            className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50">
                          <ImageIcon className="h-8 w-8 text-gray-400" />
                        </div>
                      )}

                      {/* Upload Button */}
                      <div className="flex-1">
                        <label className="flex cursor-pointer items-center justify-center space-x-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                          <Upload className="h-4 w-4" />
                          <span>Upload Logo</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleLogoUpload}
                            className="hidden"
                          />
                        </label>
                        <p className="mt-1 text-xs text-gray-500">
                          PNG, JPG or GIF (max 2MB)
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Address
                    </label>
                    <input
                      type="text"
                      value={step3Data.locationAddress || ''}
                      onChange={(e) => setStep3Data({ ...step3Data, locationAddress: e.target.value })}
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
                        value={step3Data.locationCity || ''}
                        onChange={(e) => setStep3Data({ ...step3Data, locationCity: e.target.value })}
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
                        value={step3Data.locationState || ''}
                        onChange={(e) => setStep3Data({ ...step3Data, locationState: e.target.value })}
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
                        value={step3Data.locationZipCode || ''}
                        onChange={(e) => setStep3Data({ ...step3Data, locationZipCode: e.target.value })}
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
                      value={step3Data.taxRate || '0.08'}
                      onChange={(e) => setStep3Data({ ...step3Data, taxRate: e.target.value })}
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

            {currentStep < (connectionTestResult?.success ? 6 : 5) ? (
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

