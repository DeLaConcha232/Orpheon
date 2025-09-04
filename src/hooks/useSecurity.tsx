import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface SecurityMetrics {
  recentAttempts: number;
  suspiciousActivity: boolean;
  rateLimitStatus: {
    attempts: number;
    maxAttempts: number;
    resetTime: Date;
  };
}

export function useSecurity() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<SecurityMetrics>({
    recentAttempts: 0,
    suspiciousActivity: false,
    rateLimitStatus: {
      attempts: 0,
      maxAttempts: 10,
      resetTime: new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchSecurityMetrics();
    }
  }, [user]);

  const fetchSecurityMetrics = async () => {
    try {
      if (!user) return;

      // Get attempts in the last hour
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      
      const { data: recentAttempts, error } = await supabase
        .from('redemption_attempts')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', oneHourAgo);

      if (error) {
        console.error('Error fetching security metrics:', error);
        return;
      }

      const attempts = recentAttempts?.length || 0;
      const suspiciousTypes = ['suspicious', 'rate_limited'];
      const hasSuspiciousActivity = recentAttempts?.some(attempt => 
        suspiciousTypes.includes(attempt.attempt_type)
      ) || false;

      // Calculate next reset time (next hour)
      const nextHour = new Date();
      nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);

      setMetrics({
        recentAttempts: attempts,
        suspiciousActivity: hasSuspiciousActivity,
        rateLimitStatus: {
          attempts,
          maxAttempts: 10,
          resetTime: nextHour
        }
      });

    } catch (error) {
      console.error('Error in fetchSecurityMetrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkRateLimit = async (): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data, error } = await supabase.rpc('check_redemption_rate_limit', {
        user_id_input: user.id
      });

      if (error) {
        console.error('Error checking rate limit:', error);
        return false;
      }

      return data;
    } catch (error) {
      console.error('Error in checkRateLimit:', error);
      return false;
    }
  };

  const isRateLimited = metrics.rateLimitStatus.attempts >= metrics.rateLimitStatus.maxAttempts;

  return {
    metrics,
    loading,
    isRateLimited,
    checkRateLimit,
    refreshMetrics: fetchSecurityMetrics
  };
}