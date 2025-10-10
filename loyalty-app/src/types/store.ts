export interface StoreLocation {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  latitude: number;
  longitude: number;
  phone: string;
  email: string;
  website?: string;
  hours: StoreHours;
  services: string[];
  amenities: string[];
  isOpen: boolean;
  distance?: number;
  rating: number;
  reviewCount: number;
  featured: boolean;
  images: string[];
  description: string;
  manager?: string;
  capacity?: number;
  parkingAvailable: boolean;
  wheelchairAccessible: boolean;
  wifiAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StoreHours {
  monday: DayHours;
  tuesday: DayHours;
  wednesday: DayHours;
  thursday: DayHours;
  friday: DayHours;
  saturday: DayHours;
  sunday: DayHours;
}

export interface DayHours {
  open: string;
  close: string;
  isClosed: boolean;
  specialHours?: string;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  category: string;
  duration: number; // in minutes
  price: number;
  currency: string;
  isAvailable: boolean;
  storeId: string;
  requiresAppointment: boolean;
  maxCapacity?: number;
  requirements?: string[];
  images: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Appointment {
  id: string;
  userId: number;
  storeId: string;
  serviceId: string;
  date: string;
  time: string;
  status:
    | 'scheduled'
    | 'confirmed'
    | 'in_progress'
    | 'completed'
    | 'cancelled'
    | 'no_show';
  notes?: string;
  estimatedDuration: number;
  actualDuration?: number;
  totalCost: number;
  paymentStatus: 'pending' | 'paid' | 'refunded';
  createdAt: string;
  updatedAt: string;
  service?: Service;
  store?: StoreLocation;
}

export interface WorkOrder {
  id: string;
  userId: number;
  storeId: string;
  serviceId?: string;
  type: 'repair' | 'maintenance' | 'installation' | 'consultation' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status:
    | 'submitted'
    | 'assigned'
    | 'in_progress'
    | 'waiting_parts'
    | 'completed'
    | 'cancelled';
  title: string;
  description: string;
  customerNotes?: string;
  technicianNotes?: string;
  estimatedCost?: number;
  actualCost?: number;
  estimatedCompletion?: string;
  actualCompletion?: string;
  assignedTechnician?: string;
  customerSignature?: string;
  images?: string[];
  attachments?: string[];
  createdAt: string;
  updatedAt: string;
  service?: Service;
  store?: StoreLocation;
}

export interface StoreEvent {
  id: string;
  storeId: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  type: 'promotion' | 'workshop' | 'sale' | 'event' | 'training';
  capacity?: number;
  currentAttendees: number;
  isRegistrationRequired: boolean;
  price?: number;
  currency: string;
  images: string[];
  location?: string;
  contactPerson?: string;
  contactPhone?: string;
  contactEmail?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StoreInventory {
  id: string;
  storeId: string;
  productId: string;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  lowStockThreshold: number;
  lastUpdated: string;
  product?: {
    id: string;
    name: string;
    sku: string;
    price: number;
    images: string[];
  };
}

export interface UserLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: number;
}

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface StoreSearchFilters {
  services?: string[];
  amenities?: string[];
  maxDistance?: number;
  rating?: number;
  isOpen?: boolean;
  hasParking?: boolean;
  isWheelchairAccessible?: boolean;
  hasWifi?: boolean;
}
