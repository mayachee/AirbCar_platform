'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export const useAdminAuth = () => {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/signin');
      return;
    }

    if (user) {
      checkAdminStatus();
    }
  }, [user, authLoading, router]);

  const checkAdminStatus = async () => {
    try {
      setChecking(true);
      const apiUrl = process.env.NEXT_PUBLIC_DJANGO_API_URL || "http://localhost:8000";
      const token = localStorage.getItem("access_token");

      if (!token) {
        router.push("/auth/signin");
        return;
      }

      const response = await fetch(`${apiUrl}/api/verify-token/`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const userData = await response.json();
        const hasAdminAccess = userData.is_staff === true || userData.is_superuser === true;
        setIsAdmin(hasAdminAccess);
        
        if (hasAdminAccess) {
          // Always redirect admins to dashboard
          router.push("/admin/dashboard");
        } else {
          router.push("/auth/signin");
        }
      } else {
        router.push("/auth/signin");
      }
    } catch (error) {
      // Handle "Failed to fetch" and other network errors gracefully
      if (error.message?.includes('Failed to fetch') || error.name === 'TypeError') {
        console.warn('Backend is unavailable. Allowing access for offline development.');
        // For development, allow access when backend is down
        setIsAdmin(true);
        // Redirect to dashboard for development
        router.push("/admin/dashboard");
      } else {
        console.error("Error checking admin status:", error);
        router.push("/auth/signin");
      }
    } finally {
      setChecking(false);
    }
  };

  const handleSignOut = () => {
    logout();
    router.push("/auth/signin");
  };

  return {
    isAdmin,
    checking,
    handleSignOut
  };
};

