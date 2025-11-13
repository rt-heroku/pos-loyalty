'use client';

import { useState } from 'react';
import { 
  Search, 
  ChevronDown, 
  ChevronUp, 
  MessageCircle, 
  Mail, 
  Phone,
  Book,
  HelpCircle,
  ShoppingBag,
  Gift,
  CreditCard,
  User,
  Settings,
  Shield
} from 'lucide-react';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

interface Category {
  id: string;
  name: string;
  icon: any;
  description: string;
}

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFAQ, setExpandedFAQ] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories: Category[] = [
    { id: 'all', name: 'All Topics', icon: Book, description: 'Browse all help topics' },
    { id: 'account', name: 'Account', icon: User, description: 'Profile and account management' },
    { id: 'orders', name: 'Orders', icon: ShoppingBag, description: 'Order history and tracking' },
    { id: 'loyalty', name: 'Loyalty Program', icon: Gift, description: 'Points, rewards, and tiers' },
    { id: 'payments', name: 'Payments', icon: CreditCard, description: 'Payment methods and billing' },
    { id: 'security', name: 'Security', icon: Shield, description: 'Privacy and data protection' },
    { id: 'settings', name: 'Settings', icon: Settings, description: 'App configuration' },
  ];

  const faqs: FAQItem[] = [
    // Account FAQs
    {
      id: 'account-1',
      category: 'account',
      question: 'How do I update my profile information?',
      answer: 'Navigate to Profile from the sidebar menu, then click "Edit Profile". You can update your name, email, phone number, and profile picture. Don\'t forget to save your changes!'
    },
    {
      id: 'account-2',
      category: 'account',
      question: 'How do I change my password?',
      answer: 'Go to Profile > Settings, then select "Change Password". Enter your current password and your new password. For security, we recommend using a strong password with a mix of letters, numbers, and symbols.'
    },
    {
      id: 'account-3',
      category: 'account',
      question: 'Can I delete my account?',
      answer: 'Yes, you can delete your account from Profile > Settings > Delete Account. Please note that this action is permanent and will remove all your data, including loyalty points and order history.'
    },
    
    // Orders FAQs
    {
      id: 'orders-1',
      category: 'orders',
      question: 'Where can I view my order history?',
      answer: 'You can view all your past orders by clicking on "Orders" in the sidebar menu or visiting the Orders tab in your Loyalty page. Each order shows details including items, total, status, and delivery information.'
    },
    {
      id: 'orders-2',
      category: 'orders',
      question: 'How do I track my order?',
      answer: 'Go to Orders page and click on any order to expand its details. You\'ll see the current status (Pending, Processing, Completed, etc.) and estimated delivery time if applicable.'
    },
    {
      id: 'orders-3',
      category: 'orders',
      question: 'Can I reorder items from a previous order?',
      answer: 'Yes! In your order history, click on any past order to expand it, then click the "Reorder" button. This will add all items from that order to your cart.'
    },
    {
      id: 'orders-4',
      category: 'orders',
      question: 'What payment methods are accepted?',
      answer: 'We accept credit cards (Visa, Mastercard, Amex), debit cards, digital wallets (Apple Pay, Google Pay), and cash for in-store pickup orders.'
    },
    
    // Loyalty Program FAQs
    {
      id: 'loyalty-1',
      category: 'loyalty',
      question: 'How do I earn loyalty points?',
      answer: 'You earn points on every purchase! The amount varies by tier: Bronze members earn 1x points, Silver earns 1.25x, Gold earns 1.5x, and Platinum earns 2x points. You also earn bonus points on your birthday and through special promotions.'
    },
    {
      id: 'loyalty-2',
      category: 'loyalty',
      question: 'What are the loyalty tiers?',
      answer: 'We have four tiers: Bronze (0-999 points), Silver (1,000-2,499 points), Gold (2,500-4,999 points), and Platinum (5,000+ points). Each tier offers increasing benefits including point multipliers, exclusive rewards, and special perks.'
    },
    {
      id: 'loyalty-3',
      category: 'loyalty',
      question: 'How do I redeem my points?',
      answer: 'Visit the Loyalty page and go to the Rewards tab. Browse available rewards and click "Redeem" on any reward you want. The required points will be deducted from your balance, and you\'ll receive a voucher you can use on your next purchase.'
    },
    {
      id: 'loyalty-4',
      category: 'loyalty',
      question: 'Do my points expire?',
      answer: 'Points remain active as long as you make at least one purchase every 12 months. If your account is inactive for more than a year, your points may expire. Check your points balance regularly in the Loyalty section.'
    },
    {
      id: 'loyalty-5',
      category: 'loyalty',
      question: 'How do referrals work?',
      answer: 'Share your unique referral code with friends! When they sign up and make their first purchase, you both earn bonus points. Find your referral code in the Loyalty page under the Referrals tab.'
    },
    
    // Payments FAQs
    {
      id: 'payments-1',
      category: 'payments',
      question: 'Is my payment information secure?',
      answer: 'Absolutely! We use industry-standard encryption (SSL/TLS) to protect your payment information. We never store your full credit card details on our servers. All payments are processed through certified payment gateways.'
    },
    {
      id: 'payments-2',
      category: 'payments',
      question: 'Can I save multiple payment methods?',
      answer: 'Yes, you can add and save multiple payment methods in your profile. Go to Profile > Settings > Payment Methods to manage your saved cards and digital wallets.'
    },
    {
      id: 'payments-3',
      category: 'payments',
      question: 'What happens if my payment fails?',
      answer: 'If a payment fails, you\'ll be notified immediately and your order won\'t be processed. You can try again with a different payment method or contact your bank to ensure the card is enabled for online purchases.'
    },
    
    // Security FAQs
    {
      id: 'security-1',
      category: 'security',
      question: 'How is my personal data protected?',
      answer: 'We take your privacy seriously. Your data is encrypted, stored securely, and never shared with third parties without your consent. We comply with all relevant data protection regulations (GDPR, CCPA, etc.).'
    },
    {
      id: 'security-2',
      category: 'security',
      question: 'What should I do if I suspect unauthorized access?',
      answer: 'Change your password immediately from Profile > Settings. Review your recent orders and account activity. Contact our support team right away if you notice any suspicious activity. We recommend enabling two-factor authentication for extra security.'
    },
    
    // Settings FAQs
    {
      id: 'settings-1',
      category: 'settings',
      question: 'How do I change notification preferences?',
      answer: 'Go to Profile > Settings > Notifications. Here you can control which notifications you receive via email, SMS, or push notifications. You can customize alerts for orders, promotions, loyalty updates, and more.'
    },
    {
      id: 'settings-2',
      category: 'settings',
      question: 'Can I use the app in dark mode?',
      answer: 'Yes! The app automatically adapts to your device\'s system theme preference. You can also manually toggle between light and dark mode in Settings.'
    },
  ];

  const toggleFAQ = (id: string) => {
    const newExpanded = new Set(expandedFAQ);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedFAQ(newExpanded);
  };

  const filteredFAQs = faqs.filter(faq => {
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-100">
            <HelpCircle className="h-8 w-8 text-primary-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900">Help Center</h1>
          <p className="mt-2 text-lg text-gray-600">
            Find answers to common questions and get support
          </p>
        </div>

        {/* Search */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search for help..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-12 pr-4 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`rounded-xl border-2 p-4 text-left transition-all ${
                  selectedCategory === category.id
                    ? 'border-primary-500 bg-primary-50 shadow-md'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                }`}
              >
                <Icon
                  className={`mb-2 h-6 w-6 ${
                    selectedCategory === category.id ? 'text-primary-600' : 'text-gray-400'
                  }`}
                />
                <h3
                  className={`font-semibold ${
                    selectedCategory === category.id ? 'text-primary-900' : 'text-gray-900'
                  }`}
                >
                  {category.name}
                </h3>
                <p className="mt-1 text-xs text-gray-600">{category.description}</p>
              </button>
            );
          })}
        </div>

        {/* FAQs */}
        <div className="mb-8">
          <h2 className="mb-4 text-2xl font-bold text-gray-900">
            {selectedCategory === 'all' 
              ? 'Frequently Asked Questions' 
              : categories.find(c => c.id === selectedCategory)?.name}
          </h2>
          
          {filteredFAQs.length === 0 ? (
            <div className="rounded-xl bg-white p-8 text-center shadow-sm">
              <Search className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">No results found</h3>
              <p className="mt-2 text-gray-600">
                Try adjusting your search or browse different categories
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredFAQs.map((faq) => (
                <div
                  key={faq.id}
                  className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
                >
                  <button
                    onClick={() => toggleFAQ(faq.id)}
                    className="flex w-full items-center justify-between p-5 text-left hover:bg-gray-50"
                  >
                    <h3 className="flex-1 pr-4 font-semibold text-gray-900">
                      {faq.question}
                    </h3>
                    {expandedFAQ.has(faq.id) ? (
                      <ChevronUp className="h-5 w-5 flex-shrink-0 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 flex-shrink-0 text-gray-400" />
                    )}
                  </button>
                  {expandedFAQ.has(faq.id) && (
                    <div className="border-t border-gray-100 bg-gray-50 px-5 py-4">
                      <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Contact Support */}
        <div className="rounded-xl border-2 border-primary-200 bg-gradient-to-br from-primary-50 to-white p-8 shadow-lg">
          <h2 className="mb-4 text-2xl font-bold text-gray-900">
            Still need help?
          </h2>
          <p className="mb-6 text-gray-700">
            Can't find what you're looking for? Our support team is here to help!
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            <button className="flex items-center justify-center space-x-3 rounded-lg bg-white p-4 shadow-sm transition-all hover:shadow-md">
              <MessageCircle className="h-6 w-6 text-primary-600" />
              <div className="text-left">
                <div className="font-semibold text-gray-900">Live Chat</div>
                <div className="text-xs text-gray-600">Chat with us now</div>
              </div>
            </button>
            <button className="flex items-center justify-center space-x-3 rounded-lg bg-white p-4 shadow-sm transition-all hover:shadow-md">
              <Mail className="h-6 w-6 text-primary-600" />
              <div className="text-left">
                <div className="font-semibold text-gray-900">Email</div>
                <div className="text-xs text-gray-600">support@example.com</div>
              </div>
            </button>
            <button className="flex items-center justify-center space-x-3 rounded-lg bg-white p-4 shadow-sm transition-all hover:shadow-md">
              <Phone className="h-6 w-6 text-primary-600" />
              <div className="text-left">
                <div className="font-semibold text-gray-900">Phone</div>
                <div className="text-xs text-gray-600">1-800-123-4567</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

