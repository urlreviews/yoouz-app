import React, { useState } from 'react';
import { X, Building2, CheckCircle2, ShieldCheck, Mail, Phone, User, Sparkles, ArrowRight, Loader2, Award, FileText } from 'lucide-react';
import { VERIFIED_PARTNER_AGENCIES, PartnerAgency } from '../data/agencies';

interface CopoAgencyUpgradeModalProps {
  plan: 'pro' | 'premium';
  placeName?: string;
  placeCity?: string;
  initialAgencyId?: string;
  onClose: () => void;
  onSuccess: (details: { agency: PartnerAgency; email: string; phone: string; contactPerson: string }) => void;
}

export const CopoAgencyUpgradeModal: React.FC<CopoAgencyUpgradeModalProps> = ({ 
  plan, 
  placeName = 'Your Business',
  placeCity = '',
  initialAgencyId,
  onClose, 
  onSuccess 
}) => {
  // Find agency matching city or default
  const defaultAgency = VERIFIED_PARTNER_AGENCIES.find(a => 
    (initialAgencyId && a.id === initialAgencyId) ||
    (placeCity && a.city.toLowerCase().includes(placeCity.toLowerCase()))
  ) || VERIFIED_PARTNER_AGENCIES[0];

  const [selectedAgencyId, setSelectedAgencyId] = useState<string>(defaultAgency.id);
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const selectedAgency = VERIFIED_PARTNER_AGENCIES.find(a => a.id === selectedAgencyId) || defaultAgency;
  const price = plan === 'pro' ? '$149.00' : '$299.00';
  const planTitle = plan === 'pro' ? 'Pro Business Tier' : 'Premium Elite Tier';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      setTimeout(() => {
        onSuccess({
          agency: selectedAgency,
          email: email || 'manager@business.com',
          phone: phone || '+1 (555) 019-2831',
          contactPerson: contactPerson || 'Business Owner'
        });
      }, 2200);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4 animate-in fade-in duration-200 select-none sm:select-auto">
      {/* Blurred Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity cursor-pointer"
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div className="w-full max-w-[500px] rounded-t-[32px] sm:rounded-[28px] overflow-hidden shadow-2xl relative z-10 flex flex-col bg-zinc-950 border border-zinc-800 animate-in slide-in-from-bottom-6 duration-300 max-h-[92vh] sm:max-h-[90vh]">
        
        {/* Mobile Pull Handle Bar */}
        <div className="sm:hidden pt-3 pb-1 flex justify-center w-full shrink-0">
          <div className="w-10 h-1.5 rounded-full bg-zinc-700/80" />
        </div>

        {isSuccess ? (
          <div className="p-8 sm:p-12 flex flex-col items-center justify-center text-center bg-zinc-950">
            <div className="w-20 h-20 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mb-6 ring-2 ring-emerald-500/20 animate-in zoom-in duration-300">
              <CheckCircle2 className="w-10 h-10 stroke-[2.2]" />
            </div>
            <h3 className="text-2xl font-black text-white mb-2">Request Transmitted</h3>
            <p className="text-[14px] text-zinc-300 font-medium max-w-[340px] leading-relaxed mb-4">
              Your activation request for <strong className="text-white">{planTitle}</strong> has been sent to <strong className="text-emerald-400">{selectedAgency.name}</strong>.
            </p>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-xs text-left w-full space-y-1.5 mb-6 text-zinc-300 font-mono">
              <div><strong className="text-zinc-400 font-sans">Account Manager:</strong> {selectedAgency.accountManager}</div>
              <div><strong className="text-zinc-400 font-sans">Direct Phone:</strong> {selectedAgency.contactPhone}</div>
              <div><strong className="text-zinc-400 font-sans">Agency Email:</strong> {selectedAgency.contactEmail}</div>
            </div>
            <div className="flex items-center gap-2 text-zinc-400 text-xs font-semibold bg-zinc-900/80 px-4 py-2 rounded-full border border-zinc-800">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" /> Activating Business Dashboard...
            </div>
          </div>
        ) : (
          <>
            {/* Top Header Section */}
            <div className="bg-zinc-900/90 px-6 sm:px-8 pt-5 sm:pt-6 pb-4 text-center relative border-b border-zinc-800 shrink-0">
              <button 
                onClick={onClose}
                className="absolute right-4 sm:right-5 top-4 sm:top-5 w-8 h-8 flex items-center justify-center rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-300 border border-amber-500/20 rounded-full text-[11px] font-bold mb-2.5">
                <Award className="w-3 h-3" /> Certified Agency Partner Network
              </div>
              
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-none mb-1 flex items-center justify-center gap-2">
                {price} <span className="text-sm font-bold text-zinc-400 mt-1">/ month</span>
              </h2>
              
              <p className="text-xs sm:text-[13px] text-zinc-300 font-medium">
                {placeName} • <span className="text-white font-semibold">{planTitle}</span>
              </p>
            </div>

            {/* Bottom Form Section */}
            <form onSubmit={handleSubmit} className="p-5 sm:p-7 space-y-4 overflow-y-auto custom-scrollbar flex-1 pb-8 sm:pb-7">
              
              {/* Select Partner Agency */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider px-0.5 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-zinc-400" /> Authorized Agency Reseller
                </label>
                <select
                  value={selectedAgencyId}
                  onChange={(e) => setSelectedAgencyId(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-zinc-500 transition-all font-medium cursor-pointer"
                >
                  {VERIFIED_PARTNER_AGENCIES.map((agency) => (
                    <option key={agency.id} value={agency.id} className="bg-zinc-950 text-white">
                      {agency.name} ({agency.city}) — {agency.specialty}
                    </option>
                  ))}
                </select>
                <div className="text-[11px] text-zinc-400 px-1 flex items-center gap-1">
                  <span>Manager: <strong className="text-zinc-200">{selectedAgency.accountManager}</strong></span>
                  <span>•</span>
                  <span>{selectedAgency.contactEmail}</span>
                </div>
              </div>

              {/* Agency Benefits Box */}
              <div className="bg-zinc-900/60 border border-zinc-800/90 rounded-2xl p-3.5 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-white font-bold">
                  <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Direct Agency Invoicing & Concierge</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-zinc-300">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-zinc-400 shrink-0" /> Official B2B Tax Invoice
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-zinc-400 shrink-0" /> Physical QR & NFC Kit
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-zinc-400 shrink-0" /> Video Review Curation
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-zinc-400 shrink-0" /> Local Account Manager
                  </div>
                </div>
              </div>

              {/* Contact Information Fields */}
              <div className="space-y-3 pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1 px-0.5">
                    Contact Person Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input 
                      type="text"
                      required
                      value={contactPerson}
                      onChange={(e) => setContactPerson(e.target.value)}
                      placeholder="e.g. John Miller (Owner / GM)"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1 px-0.5">
                      Business Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <input 
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="billing@domain.com"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1 px-0.5">
                      Phone / WhatsApp
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <input 
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+1 (555) 000-0000"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1 px-0.5">
                    Special Instructions or Questions (Optional)
                  </label>
                  <input 
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Please call before 2 PM, send invoice by email"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition-all"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-12 bg-white hover:bg-zinc-100 text-zinc-950 rounded-2xl text-[14px] font-bold shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Transmitting Request...</>
                  ) : (
                    <><span>Request Activation via {selectedAgency.name.split(' ')[0]}</span> <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
                <div className="text-[11px] text-zinc-400 text-center mt-2">
                  No credit card required upfront • Official agency B2B billing
                </div>
              </div>

            </form>
          </>
        )}
      </div>
    </div>
  );
};
