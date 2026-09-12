import React from 'react';
import { CopoAgencyUpgradeModal } from './CopoAgencyUpgradeModal';

interface CopoCreemCheckoutModalProps {
  plan: 'pro' | 'premium';
  onClose: () => void;
  onSuccess: (details?: any) => void;
}

export const CopoCreemCheckoutModal: React.FC<CopoCreemCheckoutModalProps> = ({ plan, onClose, onSuccess }) => {
  return (
    <CopoAgencyUpgradeModal
      plan={plan}
      onClose={onClose}
      onSuccess={(details) => onSuccess(details)}
    />
  );
};
