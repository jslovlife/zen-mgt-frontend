import React, { useEffect, useState } from "react";
import { APIUtil } from "~/utils/api.util";

/**
 * Custom hook for CSRF protection
 * Provides CSRF token and validation utilities
 */
export function useCSRF() {
  const [csrfToken, setCSRFToken] = useState<string | null>(null);
  
  useEffect(() => {
    // Get CSRF token from API utility
    const apiUtil = APIUtil.getInstance();
    const token = apiUtil.getCSRFToken();
    
    if (token) {
      setCSRFToken(token);
    } else {
      // Try to get from meta tag
      const metaToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
      if (metaToken) {
        setCSRFToken(metaToken);
        apiUtil.setCSRFToken(metaToken);
      }
    }
  }, []);
  
  // Function to get CSRF input field for forms
  const getCSRFInput = (): React.ReactElement | null => {
    if (!csrfToken) return null;
    
    return React.createElement('input', {
      type: 'hidden',
      name: '_csrf',
      value: csrfToken,
      key: 'csrf-input'
    });
  };
  
  // Function to get CSRF headers for fetch requests
  const getCSRFHeaders = () => {
    if (!csrfToken) return {};
    
    return {
      'X-CSRF-Token': csrfToken,
      'X-Requested-With': 'XMLHttpRequest'
    };
  };
  
  // Function to add CSRF token to FormData
  const addCSRFToFormData = (formData: FormData) => {
    if (csrfToken) {
      formData.append('_csrf', csrfToken);
    }
    return formData;
  };
  
  return {
    csrfToken,
    getCSRFInput,
    getCSRFHeaders,
    addCSRFToFormData,
    hasToken: !!csrfToken
  };
} 