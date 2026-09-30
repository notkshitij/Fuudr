import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PartnerAuthForm } from './components/PartnerRoute';

const SignIn = () => {
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const stored = localStorage.getItem('partnerUser');
      if (stored) {
        const user = JSON.parse(stored);
        if (!user.opening_time) {
          navigate('/partner/setup-profile', { replace: true });
        } else {
          navigate('/partner/dashboard', { replace: true });
        }
      }
    } catch {
      // Ignore
    }
  }, [navigate]);

  return <PartnerAuthForm />;
};

export default SignIn;

