'use client';

import { useState } from 'react';
import Image from 'next/image';
import { X, Wrench, User, Upload } from 'lucide-react';
import type { StoreLocation, WorkOrder } from '@/lib/database-types';
import { useAuth } from '@/contexts/AuthContext';

interface WorkOrderModalProps {
  store: StoreLocation;
  isOpen: boolean;
  onClose: () => void;
}

export default function WorkOrderModal({
  store,
  isOpen,
  onClose,
}: WorkOrderModalProps) {
  const { user } = useAuth();
  const [serviceDescription, setServiceDescription] = useState('');
  const [workOrderType, setWorkOrderType] =
    useState<WorkOrder['type']>('repair');
  const [priority, setPriority] = useState<WorkOrder['priority']>('medium');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');
  const [estimatedCost, setEstimatedCost] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);


  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 90); // 90 days from now
    return maxDate.toISOString().split('T')[0];
  };


  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setImages(prev => [...prev, ...files]);
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !description || !user) {
      return;
    }

    try {
      setLoading(true);

      const workOrder: Partial<WorkOrder> = {
        storeId: store.id,
        type: workOrderType,
        priority,
        title,
        description,
        status: 'submitted',
      };

      // Add optional fields only if they have values
      if (serviceDescription) {
        workOrder.description = `${workOrder.description}\n\nService needed: ${serviceDescription}`;
      }
      if (customerNotes) {
        workOrder.customerNotes = customerNotes;
      }
      if (estimatedCost) {
        workOrder.estimatedCost = parseFloat(estimatedCost);
      }
      if (preferredDate) {
        workOrder.estimatedCompletion = preferredDate;
      }

      const response = await fetch('/loyalty/api/work-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(workOrder),
      });

      if (response.ok) {
        setSubmissionSuccess(true);
        setTimeout(() => {
          onClose();
          setSubmissionSuccess(false);
        }, 2000);
      } else {
        console.error('Failed to submit work order');
      }
    } catch (error) {
      console.error('Error submitting work order:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 p-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Submit Work Order
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
                Sign in to submit work orders
              </h3>
              <p className="mb-4 text-gray-600">
                Please sign in to your account to submit service requests.
              </p>
              <button
                onClick={onClose}
                className="rounded-lg bg-primary-600 px-6 py-2 text-white transition-colors hover:bg-primary-700"
              >
                Sign In
              </button>
            </div>
          ) : submissionSuccess ? (
            <div className="py-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <Wrench className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="mb-2 text-lg font-medium text-gray-900">
                Work Order Submitted!
              </h3>
              <p className="text-gray-600">
                Your service request has been submitted successfully.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Work Order Type and Priority */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Work Order Type
                  </label>
                  <select
                    value={workOrderType}
                    onChange={e =>
                      setWorkOrderType(e.target.value as WorkOrder['type'])
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
                    required
                  >
                    <option value="repair">Repair</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="installation">Installation</option>
                    <option value="consultation">Consultation</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Priority Level
                  </label>
                  <select
                    value={priority}
                    onChange={e =>
                      setPriority(e.target.value as WorkOrder['priority'])
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
                    required
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              {/* Service Selection (Optional) */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Related Service (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Describe the service needed"
                  value={serviceDescription}
                  onChange={e => setServiceDescription(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Title and Description */}
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Work Order Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
                    placeholder="Brief description of the issue or request"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Detailed Description
                  </label>
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    rows={4}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
                    placeholder="Please provide detailed information about the issue, symptoms, or requirements..."
                    required
                  />
                </div>
              </div>

              {/* Customer Notes */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Additional Notes
                </label>
                <textarea
                  value={customerNotes}
                  onChange={e => setCustomerNotes(e.target.value)}
                  rows={3}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
                  placeholder="Any additional information, preferences, or special requirements..."
                />
              </div>

              {/* Cost and Date Preferences */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Estimated Budget (Optional)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 transform text-gray-500">
                      $
                    </span>
                    <input
                      type="number"
                      value={estimatedCost}
                      onChange={e => setEstimatedCost(e.target.value)}
                      className="w-full rounded-md border border-gray-300 py-2 pl-8 pr-3 focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Preferred Completion Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={preferredDate}
                    onChange={e => setPreferredDate(e.target.value)}
                    min={getMinDate()}
                    max={getMaxDate()}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              {/* Image Upload */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Attach Images (Optional)
                </label>
                <div className="rounded-lg border-2 border-dashed border-gray-300 p-6 text-center">
                  <Upload className="mx-auto mb-2 h-8 w-8 text-gray-400" />
                  <p className="mb-2 text-sm text-gray-600">
                    Upload images to help describe the issue
                  </p>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="inline-flex cursor-pointer items-center rounded-lg bg-primary-600 px-4 py-2 text-white transition-colors hover:bg-primary-700"
                  >
                    Choose Images
                  </label>
                </div>

                {/* Image Preview */}
                {images.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                    {images.map((image, index) => (
                      <div key={index} className="group relative">
                        <Image
                          src={URL.createObjectURL(image)}
                          alt={`Upload ${index + 1}`}
                          width={96}
                          height={96}
                          className="h-24 w-full rounded-lg object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white opacity-0 transition-opacity group-hover:opacity-100"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Work Order Summary */}
              <div className="rounded-lg bg-gray-50 p-4">
                <h4 className="mb-3 font-medium text-gray-900">
                  Work Order Summary
                </h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Type:</span>
                    <span className="font-medium capitalize">
                      {workOrderType}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Priority:</span>
                    <span className="font-medium capitalize">{priority}</span>
                  </div>
                  {serviceDescription && (
                    <div className="flex justify-between">
                      <span>Service:</span>
                      <span className="font-medium">
                        {serviceDescription}
                      </span>
                    </div>
                  )}
                  {estimatedCost && (
                    <div className="flex justify-between">
                      <span>Budget:</span>
                      <span className="font-medium">${estimatedCost}</span>
                    </div>
                  )}
                  {preferredDate && (
                    <div className="flex justify-between">
                      <span>Preferred Date:</span>
                      <span className="font-medium">
                        {new Date(preferredDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

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
                  disabled={!title || !description || loading}
                  className="flex-1 rounded-lg bg-primary-600 px-4 py-2 text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                  {loading ? 'Submitting...' : 'Submit Work Order'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
