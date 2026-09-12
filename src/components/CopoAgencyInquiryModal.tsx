import React, { useState } from 'react';
import { Building2, X, Send, CheckCircle2, ShieldCheck, Sparkles, Loader2, Globe, Phone, Mail, User } from 'lucide-react';

interface CopoAgencyInquiryModalProps {
  onClose: () => void;
  venueId?: string;
  venueName?: string;
}

export const CopoAgencyInquiryModal: React.FC<CopoAgencyInquiryModalProps> = ({
  onClose,
  venueId = '',
  venueName = ''
}) => {
  const [agencyName, setAgencyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [managedVenues, setManagedVenues] = useState(venueName || '');
  const [inquiryType, setInquiryType] = useState('Agency Reseller & Multi-Location Management');
  const [message, setMessage] = useState('');

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agencyName.trim() || !contactName.trim() || !email.trim() || !message.trim()) {
      setError('Please fill in all required fields (Agency name, Contact name, Work email, and Message).');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/agency/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agencyName: agencyName.trim(),
          contactName: contactName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          website: website.trim(),
          managedVenues: managedVenues.trim(),
          inquiryType,
          message: message.trim(),
          venueId,
          venueName
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit inquiry. Please try again.');
      }

      setSuccess(true);
    } catch (err: any) {
      console.error('Agency inquiry error:', err);
      setError(err.message || 'Network error occurred while submitting inquiry.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-zinc-950 rounded-3xl border border-zinc-800 text-white max-w-xl w-full shadow-2xl relative flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-zinc-800 flex items-center justify-between shrink-0 bg-zinc-900/50">
          <div className="flex items-center gap-3 pr-6">
            <div className="w-10 h-10 rounded-2xl bg-zinc-900 border border-zinc-700/80 flex items-center justify-center text-white shrink-0 shadow-inner">
              <Building2 className="w-5 h-5 text-zinc-200" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base sm:text-lg flex items-center gap-2">
                Agency Partnership Application
              </h3>
              <p className="text-xs text-zinc-400">
                Authorized marketing, PR, and advertising partner desk
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto p-5 sm:p-6 space-y-5 flex-1 custom-scrollbar text-xs text-zinc-300">
          
          {success ? (
            <div className="py-10 text-center space-y-4 animate-in fade-in zoom-in-95 duration-300">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto shadow-lg">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1.5 max-w-md mx-auto">
                <h4 className="text-lg font-bold text-white">Application Received</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Thank you for applying to the Yoouz Agency Network. Your request has been securely delivered to our Partner Desk team.
                </p>
                <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 mt-4 text-left space-y-1.5">
                  <div className="text-zinc-300 font-semibold flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>What happens next?</span>
                  </div>
                  <p className="text-zinc-400 text-[11px]">
                    Our partner team will verify your agency credentials and reach out to <strong className="text-white">{email}</strong> within 1–2 business days with agency portal access and campaign tools.
                  </p>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 bg-white hover:bg-zinc-200 text-zinc-950 font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-md"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div className="p-3.5 rounded-2xl bg-zinc-900/70 border border-zinc-800 flex items-start gap-3">
                <Sparkles className="w-4 h-4 text-zinc-300 shrink-0 mt-0.5" />
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Yoouz works with certified marketing, advertising, and PR agencies to provide managed promotional campaigns, commercial video media rights, and multi-location profile management for local businesses.
                </p>
              </div>

              {error && (
                <div className="p-3.5 rounded-xl bg-red-950/50 border border-red-800 text-red-300 text-xs flex items-center gap-2">
                  <X className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Grid Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                
                {/* Agency Name */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Agency Name *</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Apex Marketing Group"
                    value={agencyName}
                    onChange={(e) => setAgencyName(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
                  />
                </div>

                {/* Contact Person */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Contact Person *</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sarah Connor"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
                  />
                </div>

                {/* Work Email */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Agency Work Email *</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="sarah@agency.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
                  />
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Phone / WhatsApp</span>
                  </label>
                  <input
                    type="tel"
                    placeholder="+1 (555) 019-2834"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
                  />
                </div>

              </div>

              {/* Website & Managed Venues */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                
                {/* Agency Website */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Agency Website</span>
                  </label>
                  <input
                    type="text"
                    placeholder="https://agency.com"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
                  />
                </div>

                {/* Managed Clients / Venues */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider">
                    Managed Venues / Clients
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. L'Avenue, Sky Bistro (or 5+ venues)"
                    value={managedVenues}
                    onChange={(e) => setManagedVenues(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
                  />
                </div>

              </div>

              {/* Partnership Scope */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider">
                  Partnership Scope
                </label>
                <select
                  value={inquiryType}
                  onChange={(e) => setInquiryType(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-zinc-500 transition-colors cursor-pointer"
                >
                  <option value="Agency Reseller & Multi-Location Management">Agency Reseller & Multi-Location Management</option>
                  <option value="Commercial Video Rights & Paid Ad Usage">Commercial Video Rights & Paid Ad Usage</option>
                  <option value="Dedicated Creator / Video Production Campaigns">Dedicated Creator / Video Production Campaigns</option>
                  <option value="Client Profile Verification & QR Distribution">Client Profile Verification & QR Distribution</option>
                  <option value="Other Custom Partnership">Other Custom Partnership</option>
                </select>
              </div>

              {/* Message */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider">
                  Message & Campaign Details *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Tell us about the clients you represent, target geographic cities, or campaign objectives..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors resize-none"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl text-zinc-400 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 bg-white hover:bg-zinc-200 text-zinc-950 font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-md flex items-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-zinc-950" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5 text-zinc-950" />
                      <span>Submit Application</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          )}

        </div>

      </div>
    </div>
  );
};
