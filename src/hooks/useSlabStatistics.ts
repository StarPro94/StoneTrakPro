import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { SlabStatistics } from '../types';
import { useAuth } from './useAuth';

export function useSlabStatistics() {
  const { user } = useAuth();
  const [statistics, setStatistics] = useState<SlabStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatistics = async () => {
    if (!user) {
      setStatistics(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: statsError } = await supabase.rpc(
        'get_park_statistics',
        { p_user_id: user.id }
      );

      if (statsError) throw statsError;

      if (data) {
        setStatistics({
          totalSlabs: data.total_slabs || 0,
          availableSlabs: data.available_slabs || 0,
          reservedSlabs: data.reserved_slabs || 0,
          totalPositionsOccupied: data.total_positions_occupied || 0,
          totalSurfaceM2: parseFloat(data.total_surface_m2) || 0,
          totalVolumeM3: parseFloat(data.total_volume_m3) || 0,
          totalEstimatedValue: parseFloat(data.total_estimated_value) || 0,
          oldSlabsCount: data.old_slabs_count || 0,
          materials: data.materials || [],
        });
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Erreur lors du chargement des statistiques:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatistics();

    if (user) {
      const subscription = supabase
        .channel('slabs_stats_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'slabs',
          },
          () => {
            fetchStatistics();
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [user]);

  const occupationRate = useMemo(() => {
    if (!statistics) return 0;
    const totalPositions = 96;
    return (statistics.totalPositionsOccupied / totalPositions) * 100;
  }, [statistics]);

  const availabilityRate = useMemo(() => {
    if (!statistics || statistics.totalSlabs === 0) return 0;
    return (statistics.availableSlabs / statistics.totalSlabs) * 100;
  }, [statistics]);

  return {
    statistics,
    loading,
    error,
    occupationRate,
    availabilityRate,
    refetch: fetchStatistics,
  };
}
