import { Link } from 'react-router-dom';
import { ChevronLeft, Shield } from 'lucide-react';

export default function PrivacyPolicy() {
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
            <Shield className="w-full h-full text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white">Privacy Policy</h1>
        </div>

        <div className="glass rounded-3xl p-8 sm:p-12 border border-white/10 space-y-8">
          <div>
            <p className="text-sm text-gray-500 uppercase tracking-wider font-medium mb-2">Effective Date: March 2026</p>
            <p className="leading-relaxed">
              At SalonOS, accessible from salonos.omkeshsinghthakur.com, one of our main priorities is the privacy of our visitors and users. This Privacy Policy document contains types of information that is collected and recorded by SalonOS and how we use it.
            </p>
          </div>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">Information We Collect</h2>
            <p className="mb-4">
              SalonOS provides a comprehensive management system for salons, their staff, and their customers. To provide these services effectively, we collect the following types of information:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-400">
              <li><strong>Personal Identification Information:</strong> Name, email address, phone number, and account credentials.</li>
              <li><strong>Business Information:</strong> Salon details, staff rosters, service configurations, and pricing.</li>
              <li><strong>Customer Data:</strong> Appointment histories, booking schedules, queue positions, and service preferences as entered by salon owners or customers.</li>
              <li><strong>Usage Data:</strong> Information on how the platform is accessed and used, including device types, IP addresses, and interaction logs.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">How We Use Your Information</h2>
            <p className="mb-4">We use the collected information for various purposes, including:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-400">
              <li>To provide, operate, and maintain the SalonOS platform.</li>
              <li>To facilitate appointment bookings and manage digital queues.</li>
              <li>To improve, personalize, and expand our services.</li>
              <li>To communicate with you, including customer service, updates, and marketing communications (where permitted).</li>
              <li>To process transactions and manage Subscriptions.</li>
              <li>To find and prevent fraud and ensure platform security.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">Data Protection and Security</h2>
            <p className="leading-relaxed">
              We adopt robust data collection, storage, and processing practices alongside rigorous security measures to protect against unauthorized access, alteration, disclosure, or destruction of your personal information, username, password, transaction information, and data stored on our platform. Our database architecture isolates tenant (salon) data to ensure cross-tenant security and privacy.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-bold text-white mb-4">Third-Party Services</h2>
            <p className="leading-relaxed">
              SalonOS utilizes third-party services for essential operations, including Supabase for secure database management and authentication, and Firebase for real-time push notifications. These third-party providers have their own privacy policies regarding how they handle data. We do not sell, trade, or rent users' personal identification information to others.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">Contact Us</h2>
            <p className="leading-relaxed">
              If you have any questions or suggestions about our Privacy Policy, do not hesitate to contact us at support@salonos.in.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
