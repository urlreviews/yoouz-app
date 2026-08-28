import React, { useState, useEffect } from "react";
import { 
  Building2, 
  Mail, 
  Code, 
  ShieldCheck, 
  ArrowRight, 
  Check, 
  Copy, 
  Loader2, 
  X, 
  Sparkles, 
  AlertCircle, 
  ExternalLink,
  Globe,
  RefreshCw,
  Lock
} from "lucide-react";
import { Place } from "../types";

export interface BusinessSession {
  businessEmail: string;
  placeId: string;
  placeName: string;
  verifiedAt: string;
  role: 'business_owner';
  verificationMethod: 'business_email_code' | 'resend_email_magic_link' | 'website_meta_tag';
  token: string;
}

interface CopoBusinessClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
  places?: Place[];
  selectedPlace?: Place | null;
  onSuccess: (session: BusinessSession) => void;
}

export const CopoBusinessClaimModal: React.FC<CopoBusinessClaimModalProps> = ({
  isOpen,
  onClose,
  places = [],
  selectedPlace = null,
  onSuccess
}) => {
  const [activeTab, setActiveTab] = useState<'email' | 'meta_tag'>('email');
  
  // Selected place for claim
  const [targetPlace, setTargetPlace] = useState<Partial<Place>>(() => {
    if (selectedPlace) return selectedPlace;
    if (places.length > 0) return places[0];
    return {
      id: 'place-rustic-spoon',
      name: 'The Rustic Spoon',
      address: '123 Main St, New York, NY 10001',
      website: 'https://therusticspoon-nyc.com'
    };
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [showPlaceSearch, setShowPlaceSearch] = useState(false);

  // Email Magic Link State (Resend API)
  const [businessEmail, setBusinessEmail] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSentSuccess, setEmailSentSuccess] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [previewCode, setPreviewCode] = useState<string | null>(null);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailStatusMessage, setEmailStatusMessage] = useState<string | null>(null);

  // Website Meta Tag State
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [isCheckingTag, setIsCheckingTag] = useState(false);
  const [copiedTag, setCopiedTag] = useState(false);
  const [tagError, setTagError] = useState<string | null>(null);
  const [tagSuccess, setTagSuccess] = useState(false);

  // Sync selectedPlace if prop changes
  useEffect(() => {
    if (selectedPlace) {
      setTargetPlace(selectedPlace);
      if (selectedPlace.website) {
        setWebsiteUrl(selectedPlace.website);
      }
    }
  }, [selectedPlace]);

  useEffect(() => {
    if (targetPlace.website && !websiteUrl) {
      setWebsiteUrl(targetPlace.website);
    }
  }, [targetPlace]);

  if (!isOpen) return null;

  const expectedTagString = `<meta name="yoouz-verification" content="verify_${targetPlace.id || 'business'}" />`;

  // 1. Send Magic Link via Resend API
  const handleSendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessEmail || !businessEmail.includes('@')) {
      setEmailError('Please enter a valid official business email.');
      return;
    }

    setIsSendingEmail(true);
    setEmailError(null);
    setEmailStatusMessage(null);

    try {
      const response = await fetch('/api/business/send-magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: businessEmail.trim(),
          placeId: targetPlace.id,
          placeName: targetPlace.name,
          website: targetPlace.website || websiteUrl,
          host: window.location.host
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setEmailSentSuccess(true);
        setEmailStatusMessage(data.message);
        if (data.previewCode) {
          setPreviewCode(data.previewCode);
        }
      } else {
        setEmailError(data.error || 'Failed to dispatch verification email.');
      }
    } catch (err: any) {
      setEmailError('Network error. Please try again.');
    } finally {
      setIsSendingEmail(false);
    }
  };

  // 2. Verify 6-digit OTP code or Magic link
  const handleVerifyCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!otpCode || otpCode.trim().length < 6) {
      setEmailError('Please enter the complete 6-digit verification code.');
      return;
    }

    setIsVerifyingCode(true);
    setEmailError(null);

    try {
      const response = await fetch('/api/business/verify-magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: businessEmail.trim(),
          code: otpCode.trim(),
          placeId: targetPlace.id
        })
      });

      const data = await response.json();
      if (response.ok && data.success && data.session) {
        // Save verified session
        localStorage.setItem('copo_business_verified_session', JSON.stringify(data.session));
        
        // Add to claimed places
        try {
          const raw = localStorage.getItem('copo_claimed_places') || '[]';
          const list = JSON.parse(raw);
          if (!list.includes(targetPlace.id)) {
            list.push(targetPlace.id);
            localStorage.setItem('copo_claimed_places', JSON.stringify(list));
          }
        } catch (e) {}

        window.dispatchEvent(new CustomEvent('copo_business_auth_changed', { detail: data.session }));
        onSuccess(data.session);
        onClose();
      } else {
        setEmailError(data.error || 'Invalid or expired code. Please try again.');
      }
    } catch (err: any) {
      setEmailError('Verification error. Please try again.');
    } finally {
      setIsVerifyingCode(false);
    }
  };

  // 3. Verify HTML Meta Tag
  const handleVerifyWebsiteTag = async () => {
    const url = websiteUrl || targetPlace.website;
    if (!url) {
      setTagError('Please enter the official website URL.');
      return;
    }

    setIsCheckingTag(true);
    setTagError(null);
    setTagSuccess(false);

    try {
      const response = await fetch('/api/business/verify-website-tag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          placeId: targetPlace.id,
          website: url,
          expectedTag: `verify_${targetPlace.id || 'business'}`
        })
      });

      const data = await response.json();
      if (response.ok && data.verified) {
        setTagSuccess(true);
        const session: BusinessSession = {
          businessEmail: `verified_webmaster@${url.replace(/^https?:\/\//, '').split('/')[0]}`,
          placeId: targetPlace.id || 'place-custom',
          placeName: targetPlace.name || 'Verified Venue',
          verifiedAt: new Date().toISOString(),
          role: 'business_owner',
          verificationMethod: 'website_meta_tag',
          token: `biz_tag_${Date.now()}`
        };

        localStorage.setItem('copo_business_verified_session', JSON.stringify(session));
        try {
          const raw = localStorage.getItem('copo_claimed_places') || '[]';
          const list = JSON.parse(raw);
          if (!list.includes(targetPlace.id)) {
            list.push(targetPlace.id);
            localStorage.setItem('copo_claimed_places', JSON.stringify(list));
          }
        } catch (e) {}

        window.dispatchEvent(new CustomEvent('copo_business_auth_changed', { detail: session }));
        setTimeout(() => {
          onSuccess(session);
          onClose();
        }, 1200);
      } else {
        setTagError(data.message || 'Verification meta tag was not detected in your website <head>.');
      }
    } catch (err: any) {
      setTagError('Unable to reach website server. Please check the URL and tag.');
    } finally {
      setIsCheckingTag(false);
    }
  };

  const filteredPlaces = places.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in copo-business-claim-modal"
      onClick={onClose}
    >
      <div 
        className="bg-zinc-900 rounded-3xl max-w-xl w-full shadow-2xl border border-zinc-800 overflow-hidden flex flex-col my-auto relative animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="px-6 py-5 border-b border-zinc-800 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-zinc-900 text-white flex items-center justify-center shadow-sm shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-lg text-white font-['Google_Sans',sans-serif]">
                  Verify Business Listing
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-blue-900/30 text-[10px] font-bold text-blue-400 uppercase tracking-wider">
                  Merchant Access
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">
                Verify ownership to reply to video reviews & manage widgets
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-800 text-zinc-500 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          
          {/* Target Business Selection Card */}
          <div className="p-3.5 bg-zinc-950 rounded-2xl border border-zinc-800/80 flex items-center justify-between">
            <div className="flex items-center gap-3 truncate">
              <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 text-blue-400 flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs">
                {targetPlace.name?.charAt(0) || 'B'}
              </div>
              <div className="truncate">
                <div className="font-bold text-sm text-white flex items-center gap-1.5 truncate">
                  <span>{targetPlace.name}</span>
                  <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" />
                </div>
                <div className="text-[11px] text-zinc-500 truncate">
                  {targetPlace.address || 'Verified Business Venue'}
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowPlaceSearch(!showPlaceSearch)}
              className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-bold rounded-xl border border-zinc-800 transition-colors shrink-0 cursor-pointer shadow-2xs"
            >
              {showPlaceSearch ? 'Cancel' : 'Switch Venue'}
            </button>
          </div>

          {/* Place Search Dropdown if switched */}
          {showPlaceSearch && (
            <div className="p-3 bg-zinc-900 rounded-2xl border border-zinc-800 shadow-lg space-y-2 animate-in fade-in">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search venue name or address..."
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-hidden focus:ring-2 focus:ring-[#1a73e8]"
              />
              <div className="max-h-40 overflow-y-auto space-y-1">
                {filteredPlaces.slice(0, 5).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setTargetPlace(p);
                      setWebsiteUrl(p.website || '');
                      setShowPlaceSearch(false);
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-blue-900/30 rounded-xl text-xs flex items-center justify-between transition-colors"
                  >
                    <div className="truncate">
                      <span className="font-bold text-zinc-200 block truncate">{p.name}</span>
                      <span className="text-[10px] text-zinc-400 block truncate">{p.address}</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Verification Method Tabs */}
          <div className="flex bg-zinc-800 p-1 rounded-2xl">
            <button
              onClick={() => setActiveTab('email')}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'email' 
                  ? 'bg-zinc-900 text-white shadow-sm border border-zinc-800/60' 
                  : 'text-zinc-500 hover:text-zinc-200'
              }`}
            >
              <Mail className="w-4 h-4 text-blue-400" />
              <span>Email Verification</span>
            </button>
            <button
              onClick={() => setActiveTab('meta_tag')}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'meta_tag' 
                  ? 'bg-zinc-900 text-white shadow-sm border border-zinc-800/60' 
                  : 'text-zinc-500 hover:text-zinc-200'
              }`}
            >
              <Code className="w-4 h-4 text-purple-600" />
              <span>Website Meta Tag</span>
            </button>
          </div>

          {/* TAB 1: BUSINESS EMAIL VERIFICATION */}
          {activeTab === 'email' && (
            <div className="space-y-4">
              {!emailSentSuccess ? (
                <form onSubmit={handleSendMagicLink} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                      Business Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={businessEmail}
                        onChange={(e) => setBusinessEmail(e.target.value)}
                        placeholder="e.g. contact@business.com"
                        className="w-full pl-10 pr-4 py-3 bg-zinc-950 focus:bg-zinc-900 border border-zinc-700 rounded-xl text-xs text-white focus:outline-hidden focus:ring-2 focus:ring-[#1a73e8] font-medium"
                      />
                    </div>
                    <p className="text-[11px] text-zinc-500 mt-1">
                      We'll send a 6-digit verification code to confirm ownership.
                    </p>
                  </div>

                  {emailError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{emailError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSendingEmail || !businessEmail}
                    className="w-full py-3.5 bg-[#1a73e8] hover:bg-[#1557b0] disabled:bg-zinc-300 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isSendingEmail ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Sending verification code...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Send Verification Code</span>
                      </>
                    )}
                  </button>
                </form>
              ) : (
                /* Step 2: Enter 6-digit code */
                <div className="space-y-4 animate-in fade-in">
                  <div className="p-4 bg-blue-900/30/80 border border-blue-200/80 rounded-2xl space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-blue-400">
                      <Check className="w-4 h-4" />
                      <span>Verification Code Sent</span>
                    </div>
                    <p className="text-[11.5px] text-zinc-400 leading-relaxed">
                      We sent a verification code to <strong className="text-white">{businessEmail}</strong>. Enter the 6-digit code below:
                    </p>
                    {previewCode && (
                      <div className="pt-2 flex items-center justify-between border-t border-blue-200/60">
                        <span className="text-[10px] text-blue-700 font-bold">Demo Mode Test Code:</span>
                        <button
                          type="button"
                          onClick={() => {
                            setOtpCode(previewCode);
                          }}
                          className="px-2 py-0.5 rounded-md bg-blue-600 text-white text-[10px] font-mono font-bold hover:bg-blue-700 cursor-pointer"
                        >
                          Auto-fill: {previewCode}
                        </button>
                      </div>
                    )}
                  </div>

                  <form onSubmit={handleVerifyCode} className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                        6-Digit Verification Code
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        required
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                        placeholder="123456"
                        className="w-full text-center tracking-[8px] font-mono text-xl py-3 bg-zinc-950 focus:bg-zinc-900 border border-zinc-700 rounded-xl text-white focus:outline-hidden focus:ring-2 focus:ring-[#1a73e8] font-bold"
                      />
                    </div>

                    {emailError && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{emailError}</span>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setEmailSentSuccess(false)}
                        className="px-4 py-3 bg-zinc-800 hover:bg-zinc-800 text-zinc-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={isVerifyingCode || otpCode.length < 6}
                        className="flex-1 py-3 bg-[#1a73e8] hover:bg-[#1557b0] disabled:bg-zinc-300 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {isVerifyingCode ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Verifying...</span>
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="w-4 h-4" />
                            <span>Verify & Enter Business Portal</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: HTML META TAG VERIFICATION */}
          {activeTab === 'meta_tag' && (
            <div className="space-y-4">
              <div className="text-xs text-zinc-400 leading-relaxed">
                Add this verification meta tag to the <code className="text-blue-400 font-mono bg-blue-900/30 px-1 py-0.5 rounded">&lt;head&gt;</code> section of your website homepage:
              </div>

              {/* Tag Box with 1-click Copy */}
              <div className="p-3.5 bg-zinc-900 rounded-2xl text-[11px] font-mono text-zinc-200 border border-zinc-800 relative group select-all">
                <span className="block pr-12 text-blue-400 break-all">
                  {expectedTagString}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(expectedTagString);
                    setCopiedTag(true);
                    setTimeout(() => setCopiedTag(false), 2000);
                  }}
                  className="absolute right-2 top-2 p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all border border-zinc-700"
                >
                  {copiedTag ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedTag ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              {/* Website URL input */}
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                  Official Website Homepage URL
                </label>
                <div className="relative">
                  <Globe className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    placeholder="https://therusticspoon-nyc.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 focus:bg-zinc-900 border border-zinc-700 rounded-xl text-xs text-white focus:outline-hidden focus:ring-2 focus:ring-purple-600 font-medium"
                  />
                </div>
              </div>

              {tagError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{tagError}</span>
                </div>
              )}

              {tagSuccess && (
                <div className="p-3 bg-emerald-900/30 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-700 font-bold">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>Website HTML meta tag verified! Unlocking portal...</span>
                </div>
              )}

              <button
                type="button"
                onClick={handleVerifyWebsiteTag}
                disabled={isCheckingTag || !websiteUrl}
                className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 disabled:bg-zinc-300 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isCheckingTag ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Crawling & Checking Website Head Tag...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    <span>Verify Live Website Tag</span>
                  </>
                )}
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
