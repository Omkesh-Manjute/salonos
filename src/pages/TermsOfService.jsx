import { Link } from 'react-router-dom';
import { ChevronLeft, FileText } from 'lucide-react';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-gray-300 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Effect */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-700/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-3xl mx-auto relative z-10">
        <Link to="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-white transition-colors mb-12">
          <ChevronLeft className="w-4 h-4" /> Back to Home
        </Link>
        
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-600 to-brand-400 p-2.5 shadow-lg shadow-brand-500/20">
            <FileText className="w-full h-full text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white">Terms of Service</h1>
        </div>

        <div className="glass rounded-3xl p-8 sm:p-12 border border-white/10 space-y-8">
          <div>
            <p className="text-sm text-gray-500 uppercase tracking-wider font-medium mb-2">Effective Date: March 2026</p>
            <p className="leading-relaxed">
              Welcome to SalonOS. These Terms of Service ("Terms") govern your use of the SalonOS management platform, located at salonos.omkeshsinghthakur.com. By accessing or using our platform, you agree to be bound by these Terms.
            </p>
          </div>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">1. Acceptance of Terms</h2>
            <p className="leading-relaxed">
              By registering an account, logging in, or browsing the SalonOS public facing interfaces, you confirm your understanding of and agreement to these terms. If you disagree with any part of the terms, you may not access the service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">2. Description of Service</h2>
            <p className="leading-relaxed">
              SalonOS is a cloud-based Software-as-a-Service (SaaS) platform designed for salon administration. We provide a suite of tools including, but not limited to, real-time booking, digital queue management, staff assignment, CRM, and analytics. We reserve the right to modify, suspend, or discontinue any portion of the service at any time with or without notice.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">3. User Responsibilities</h2>
            <ul className="list-disc pl-6 space-y-2 text-gray-400">
              <li><strong>Salon Owners:</strong> You are responsible for accurately maintaining your salon's profile, service list, pricing, and ensuring that any customer data you input complies with local privacy regulations. You must protect your account credentials.</li>
              <li><strong>Customers:</strong> You are responsible for ensuring that the booking details and contact information provided are accurate. Repeated "no-shows" or fraudulent bookings may result in suspension from booking access across the platform.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">4. Subscriptions and Payments</h2>
            <p className="leading-relaxed">
              For salon owners, certain SalonOS features require a premium subscription tier. Subscription fees are billed on a recurring basis as outlined during checkout. All payments are non-refundable unless legally required otherwise. You can cancel your subscription at any time, which will take effect at the end of the current billing cycle.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-bold text-white mb-4">5. Intellectual Property</h2>
            <p className="leading-relaxed">
              The platform, including its original content, features, frontend interface, and functionality, are owned by SalonOS and are protected by international copyright, trademark, and other intellectual property or proprietary rights laws. Do not copy or reverse engineer the software.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">6. Limitation of Liability</h2>
            <p className="leading-relaxed">
              In no event shall SalonOS, nor its directors, employees, partners, or agents, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, or goodwill, resulting from your access to or use of (or inability to access or use) the service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">Contact</h2>
            <p className="leading-relaxed">
              If you have any questions about these Terms, please contact us at legal@salonos.in.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
