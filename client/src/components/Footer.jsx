import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="mt-20 py-12 bg-white/30 backdrop-blur-3xl border-t border-white/50 relative z-10 font-outfit">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center mb-6">
              <img src="/logo.png" alt="CUK Logo" className="h-12 w-auto mr-4" />
              <div>
                <h3 className="text-xl font-black text-gray-900 tracking-tight">CoopVotes</h3>
                <p className="text-xs text-coop-green font-bold uppercase tracking-widest">Secure Election Portal</p>
              </div>
            </div>
            <p className="text-gray-500 max-w-sm leading-relaxed">
              Empowering student voices through secure, transparent, and immutable digital voting systems. Made for students, by students.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-6">Quick Links</h4>
            <ul className="space-y-4 text-sm font-bold">
              <li><Link to="/dashboard" className="text-gray-500 hover:text-coop-green transition-colors">Dashboard</Link></li>
              <li><Link to="/results" className="text-gray-500 hover:text-coop-green transition-colors">Live Results</Link></li>
              <li><Link to="/verify" className="text-gray-500 hover:text-coop-green transition-colors">Audit Portal</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-6">Support</h4>
            <ul className="space-y-4 text-sm font-bold text-gray-500">
              <li className="flex items-start">
                <span className="mr-3">📧</span>
                enquiries@cuk.ac.ke
              </li>
              <li className="flex items-start">
                <span className="mr-3">📞</span>
                +254 724 311 606
              </li>
              <li className="flex items-start">
                <span className="mr-3">📍</span>
                Ushirika Road, Karen <br/>
                P.O. Box 24814-00502 <br/>
                Nairobi, Kenya
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center text-xs font-black uppercase tracking-widest text-gray-400">
          <p>&copy; 2024 The Co-operative University of Kenya. Secure Voting Infrastructure.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className="hover:text-coop-green transition-colors">Privacy</a>
            <a href="#" className="hover:text-coop-green transition-colors">Terms</a>
            <a href="#" className="hover:text-coop-green transition-colors">Security</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
