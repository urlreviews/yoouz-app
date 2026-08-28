import React, { useState } from 'react';
import { CopoBusinessPricingModal } from './CopoBusinessPricingModal';
import { NavSection } from '../types';

interface CopoPricingViewProps {
  onClose: () => void;
}

export const CopoPricingView: React.FC<CopoPricingViewProps> = ({ onClose }) => {
  const [selectedPlan, setSelectedPlan] = useState<'basic' | 'pro' | 'premium'>('basic');
  
  return (
    <div className="w-full h-full flex flex-col items-center bg-zinc-50 pt-10">
      {/* We are rendering the modal component, but modifying it to not be fixed, or we can just render the modal */}
      <CopoBusinessPricingModal 
        currentPlan={selectedPlan}
        onSelectPlan={(plan) => {
          setSelectedPlan(plan);
          alert(`Redirecting to upgrade flow for ${plan} plan...`);
        }}
        onClose={onClose}
      />
    </div>
  );
};
