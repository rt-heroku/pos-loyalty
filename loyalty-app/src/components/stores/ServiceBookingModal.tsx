'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Calendar, Clock, DollarSign, User } from 'lucide-react';
import type { StoreLocation, Service, Appointment } from '@/lib/database-types';
import { useAuth } from '@/contexts/AuthContext';

interface ServiceBookingModalProps {
  store: StoreLocation;
  isOpen: boolean;
  onClose: () => void;
}

export default function ServiceBookingModal({
  store,
  isOpen,
  onClose,
}: ServiceBookingModalProps) {
  const { user } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const loadServices = useCallback(async () => {
    try {
      const response = await fetch(`/loyalty/api/stores/${store.id}/services`);
      if (response.ok) {
        const data = await response.json();
        setServices(data.services);
      }
    } catch (error) {
      console.error('Error loading services:', error);
    }
  }, [store.id]);

  useEffect(() => {
    if (isOpen) {
      loadServices();
    }
  }, [isOpen, store.id, loadServices]);

  useEffect(() => {
    if (selectedService) {
      // Reset time when service changes
      setSelectedTime('');
    }
  }, [selectedService]);

  const getAvailableTimes = () => {
    if (!selectedService || !selectedDate) return [];

    const times = [];
    const startHour = 9; // 9 AM
    const endHour = 17; // 5 PM
    const interval = 30; // 30 minutes

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += interval) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        times.push(time);
      }
    }

    return times;
  };

  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30); // 30 days from now
    return maxDate.toISOString().split('T')[0];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedService || !selectedDate || !selectedTime || !user) {
      return;
    }

    try {
      setLoading(true);

      const appointment: Partial<Appointment> = {
        storeId: store.id,
        serviceId: selectedService.id,
        date: selectedDate,
        time: selectedTime,
        estimatedDuration: selectedService.duration,
        totalCost: selectedService.price,
        status: 'scheduled',
        paymentStatus: 'pending',
      };

      if (notes) {
        appointment.notes = notes;
      }

      const response = await fetch('/loyalty/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(appointment),
      });

      if (response.ok) {
        setBookingSuccess(true);
        setTimeout(() => {
          onClose();
          setBookingSuccess(false);
        }, 2000);
      } else {
        console.error('Failed to book appointment');
      }
    } catch (error) {
      console.error('Error booking appointment:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 p-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Book a Service
            </h2>
            <p className="mt-1 text-gray-600">{store.name}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 transition-colors hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {!user ? (
            <div className="py-8 text-center">
              <User className="mx-auto mb-4 h-16 w-16 text-gray-400" />
              <h3 className="mb-2 text-lg font-medium text-gray-900">
                Sign in to book services
              </h3>
              <p className="mb-4 text-gray-600">
                Please sign in to your account to schedule appointments.
              </p>
              <button
                onClick={onClose}
                className="rounded-lg bg-primary-600 px-6 py-2 text-white transition-colors hover:bg-primary-700"
              >
                Sign In
              </button>
            </div>
          ) : bookingSuccess ? (
            <div className="py-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <Calendar className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="mb-2 text-lg font-medium text-gray-900">
                Appointment Booked!
              </h3>
              <p className="text-gray-600">
                Your appointment has been successfully scheduled.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Service Selection */}
              <div>
                <label className="mb-3 block text-sm font-medium text-gray-700">
                  Select Service
                </label>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {services.map(service => (
                    <div
                      key={service.id}
                      className={`cursor-pointer rounded-lg border-2 p-4 transition-all ${
                        selectedService?.id === service.id
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedService(service)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">
                            {service.name}
                          </h4>
                          <p className="mt-1 text-sm text-gray-600">
                            {service.description}
                          </p>
                          <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                            <span className="flex items-center">
                              <Clock className="mr-1 h-4 w-4" />
                              {service.duration} min
                            </span>
                            <span className="flex items-center">
                              <DollarSign className="mr-1 h-4 w-4" />$
                              {service.price}
                            </span>
                          </div>
                        </div>
                        {selectedService?.id === service.id && (
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-500">
                            <span className="text-xs text-white">✓</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Date and Time Selection */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Select Date
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={e => setSelectedDate(e.target.value)}
                    min={getMinDate()}
                    max={getMaxDate()}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Select Time
                  </label>
                  <select
                    value={selectedTime}
                    onChange={e => setSelectedTime(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
                    required
                    disabled={!selectedDate}
                  >
                    <option value="">Choose a time</option>
                    {getAvailableTimes().map(time => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Additional Notes
                </label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={3}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
                  placeholder="Any special requirements or notes for your appointment..."
                />
              </div>

              {/* Appointment Summary */}
              {selectedService && selectedDate && selectedTime && (
                <div className="rounded-lg bg-gray-50 p-4">
                  <h4 className="mb-3 font-medium text-gray-900">
                    Appointment Summary
                  </h4>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Service:</span>
                      <span className="font-medium">
                        {selectedService.name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Date:</span>
                      <span className="font-medium">
                        {new Date(selectedDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Time:</span>
                      <span className="font-medium">{selectedTime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Duration:</span>
                      <span className="font-medium">
                        {selectedService.duration} minutes
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Cost:</span>
                      <span className="text-lg font-medium text-primary-600">
                        ${selectedService.price}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 rounded-lg bg-gray-200 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    !selectedService ||
                    !selectedDate ||
                    !selectedTime ||
                    loading
                  }
                  className="flex-1 rounded-lg bg-primary-600 px-4 py-2 text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                  {loading ? 'Booking...' : 'Book Appointment'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
