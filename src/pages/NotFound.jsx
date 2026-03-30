import { Link } from 'react-router-dom';
import { ArrowLeft, Compass, Scissors } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-6">
      <div className="max-w-md w-full glass rounded-3xl p-8 border border-white/10 text-center">
        <div className="mx-auto mb-5 w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-gold-400 flex items-center justify-center">
          <Scissors className="w-6 h-6 text-white" />
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-medium mb-4">
          <Compass className="w-3.5 h-3.5" /> Page not found
        </div>
        <h1 className="text-3xl font-bold text-white mb-3">This style doesn’t exist.</h1>
        <p className="text-sm text-gray-400 mb-6">The page you requested is missing or moved. Let’s get you back to the main experience.</p>
        <Link to="/" className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white px-5 py-3 rounded-xl font-semibold transition-all glow">
          <ArrowLeft className="w-4 h-4" /> Go to SalonOS home
        </Link>
      </div>
    </div>
  );
}
