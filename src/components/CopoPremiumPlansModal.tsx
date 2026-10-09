
import React from 'react';
import { X, Check, Shield } from 'lucide-react';

interface CopoPremiumPlansModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessName: string;
  ownerEmail: string;
}

export const CopoPremiumPlansModal: React.FC<CopoPremiumPlansModalProps> = ({ isOpen, onClose, businessName, ownerEmail }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col p-4 md:p-8 animate-in fade-in">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-black text-white">Upgrade Your Plan</h2>
        <button onClick={onClose} className="p-2 rounded-full hover:bg-zinc-800 text-white transition-colors">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto w-full">
        {/* Free Plan */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 flex flex-col">
          <h3 className="text-xl font-bold text-zinc-400 mb-4">Free</h3>
          <p className="text-4xl font-black text-white mb-6">$0</p>
          <ul className="space-y-4 mb-8 flex-grow">
            <li className="flex items-center gap-3 text-zinc-200"><Check className="w-5 h-5 text-zinc-600" /> Basic profile</li>
            <li className="flex items-center gap-3 text-zinc-200"><Check className="w-5 h-5 text-zinc-600" /> Standard reviews</li>
          </ul>
        </div>

        {/* Premium Plan */}
        <div className="bg-white border border-white rounded-3xl p-8 flex flex-col relative overflow-hidden">
          <div className="absolute top-4 right-4 bg-zinc-950 text-white px-3 py-1 rounded-full text-xs font-bold">BEST VALUE</div>
          <h3 className="text-xl font-bold text-zinc-950 mb-4 flex items-center gap-2"><Shield className="w-5 h-5" /> Premium</h3>
          <p className="text-4xl font-black text-zinc-950 mb-6">$199<span className="text-base font-normal text-zinc-500">/mo</span></p>
          <ul className="space-y-4 mb-8 flex-grow">
            <li className="flex items-center gap-3 text-zinc-900"><Check className="w-5 h-5 text-zinc-950" /> Advanced analytics</li>
            <li className="flex items-center gap-3 text-zinc-900"><Check className="w-5 h-5 text-zinc-950" /> Priority support</li>
            <li className="flex items-center gap-3 text-zinc-900"><Check className="w-5 h-5 text-zinc-950" /> Branded ad export</li>
          </ul>
          <button 
            onClick={async () => {
              try {
                const response = await fetch('/api/upgrade-request', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    businessName,
                    ownerEmail,
                    timestamp: new Date().toISOString()
                  })
                });
                if (response.ok) {
                  alert('Upgrade request sent successfully! We will contact you shortly.');
                  onClose();
                } else {
                  alert('Failed to send upgrade request. Please try again.');
                }
              } catch (error) {
                console.error('Error sending upgrade request:', error);
                alert('An error occurred. Please try again.');
              }
            }}
            className="w-full py-4 bg-zinc-950 text-white font-bold rounded-2xl hover:bg-zinc-800 transition-colors"
          >
            Upgrade Now
          </button>
        </div>
      </div>
    </div>
  );
};
