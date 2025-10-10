'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Phone,
  MessageSquare,
  X,
  CheckCircle,
  AlertCircle,
  Clock as ClockIcon,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import type { Appointment } from '@/types/store';

export default function AppointmentsPage() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<
    'all' | 'upcoming' | 'completed' | 'cancelled'
  >('all');

  const loadAppointments = useCallback(async () => {
    try {
      setLoading(true);
      const statusParam =
        filter === 'all'
          ? ''
          : filter === 'upcoming'
            ? 'scheduled,confirmed,in_progress'
            : filter;
      const url = statusParam
        ? `/loyalty/api/appointments?status=${statusParam}`
        : '/loyalty/api/appointments';

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setAppointments(data.appointments);
      }
    } catch (error) {
      console.error('Error loading appointments:', error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    if (user) {
      loadAppointments();
    }
  }, [user, loadAppointments]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <ClockIcon className="h-5 w-5 text-blue-500" />;
      case 'confirmed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'in_progress':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'cancelled':
        return <X className="h-5 w-5 text-red-500" />;
      case 'no_show':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'no_show':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (timeString: string) => {
    return timeString;
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) {
      return;
    }

    try {
      const response = await fetch(`/loyalty/api/appointments/${appointmentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'cancelled' }),
      });

      if (response.ok) {
        // Reload appointments
        loadAppointments();
      }
    } catch (error) {
      console.error('Error cancelling appointment:', error);
    }
  };

  const filteredAppointments = appointments.filter(appointment => {
    if (filter === 'upcoming') {
      return ['scheduled', 'confirmed', 'in_progress'].includes(
        appointment.status
      );
    }
    return filter === 'all' || appointment.status === filter;
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="py-12 text-center">
            <Calendar className="mx-auto mb-4 h-16 w-16 text-gray-400" />
            <h1 className="mb-2 text-2xl font-bold text-gray-900">
              My Appointments
            </h1>
            <p className="text-gray-600">
              Please sign in to view your appointments.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-4 lg:mb-0">
              <h1 className="text-3xl font-bold text-gray-900">
                My Appointments
              </h1>
              <p className="mt-2 text-gray-600">
                Manage your service appointments and bookings
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setFilter('all')}
                className={`rounded-lg px-4 py-2 font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('upcoming')}
                className={`rounded-lg px-4 py-2 font-medium transition-colors ${
                  filter === 'upcoming'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Upcoming
              </button>
              <button
                onClick={() => setFilter('completed')}
                className={`rounded-lg px-4 py-2 font-medium transition-colors ${
                  filter === 'completed'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Completed
              </button>
              <button
                onClick={() => setFilter('cancelled')}
                className={`rounded-lg px-4 py-2 font-medium transition-colors ${
                  filter === 'cancelled'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Cancelled
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {loading ? (
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => (
              <div
                key={i}
                className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
              >
                <div className="mb-4 h-6 w-1/4 rounded bg-gray-200"></div>
                <div className="mb-2 h-4 w-1/2 rounded bg-gray-200"></div>
                <div className="h-4 w-1/3 rounded bg-gray-200"></div>
              </div>
            ))}
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="py-12 text-center">
            <Calendar className="mx-auto mb-4 h-16 w-16 text-gray-400" />
            <h3 className="mb-2 text-lg font-medium text-gray-900">
              No appointments found
            </h3>
            <p className="mb-4 text-gray-600">
              {filter === 'all'
                ? "You don't have any appointments yet."
                : `You don't have any ${filter} appointments.`}
            </p>
            <a
              href="/stores"
              className="inline-flex items-center rounded-lg bg-primary-600 px-4 py-2 text-white transition-colors hover:bg-primary-700"
            >
              <MapPin className="mr-2 h-4 w-4" />
              Find Stores
            </a>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredAppointments.map(appointment => (
              <div
                key={appointment.id}
                className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex-1">
                    {/* Header */}
                    <div className="mb-4 flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(appointment.status)}
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {appointment.service?.name || 'Service'}
                          </h3>
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(appointment.status)}`}
                          >
                            {appointment.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                      </div>

                      {appointment.status === 'scheduled' && (
                        <button
                          onClick={() =>
                            handleCancelAppointment(appointment.id)
                          }
                          className="text-sm font-medium text-red-600 hover:text-red-800"
                        >
                          Cancel
                        </button>
                      )}
                    </div>

                    {/* Details */}
                    <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="mr-2 h-4 w-4" />
                          <span>{formatDate(appointment.date)}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Clock className="mr-2 h-4 w-4" />
                          <span>{formatTime(appointment.time)}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <ClockIcon className="mr-2 h-4 w-4" />
                          <span>{appointment.estimatedDuration} minutes</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin className="mr-2 h-4 w-4" />
                          <span>{appointment.store?.name || 'Store'}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <span className="font-medium">
                            ${appointment.totalCost}
                          </span>
                        </div>
                        {appointment.notes && (
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">Notes:</span>{' '}
                            {appointment.notes}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() =>
                          (window.location.href = `tel:${appointment.store?.phone || ''}`)
                        }
                        className="flex items-center rounded-lg bg-blue-600 px-3 py-2 text-sm text-white transition-colors hover:bg-blue-700"
                      >
                        <Phone className="mr-2 h-4 w-4" />
                        Call Store
                      </button>

                      <button
                        onClick={() => {
                          const url = `https://www.google.com/maps/dir/?api=1&destination=${appointment.store?.latitude},${appointment.store?.longitude}`;
                          window.open(url, '_blank');
                        }}
                        className="flex items-center rounded-lg bg-gray-600 px-3 py-2 text-sm text-white transition-colors hover:bg-gray-700"
                      >
                        <MapPin className="mr-2 h-4 w-4" />
                        Get Directions
                      </button>

                      <button
                        onClick={() => {
                          // This would open a chat or contact form
                          alert('Contact support feature coming soon');
                        }}
                        className="flex items-center rounded-lg bg-green-600 px-3 py-2 text-sm text-white transition-colors hover:bg-green-700"
                      >
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Contact Support
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
