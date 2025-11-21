import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Slab, SlabMatchResult } from '../types';
import { useAuth } from './useAuth';
import { calculateCompatibilityScore } from '../utils/slabCalculations';

interface MatchCriteria {
  length?: number;
  width?: number;
  thickness?: number;
  material?: string;
  tolerance?: number;
}

export function useSlabMatching() {
  const { user } = useAuth();
  const [results, setResults] = useState<SlabMatchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const findCompatibleSlabs = async (criteria: MatchCriteria) => {
    if (!user) {
      setError('Utilisateur non authentifié');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const tolerance = criteria.tolerance || 5;

      const { data, error: matchError } = await supabase.rpc(
        'find_compatible_slabs',
        {
          p_user_id: user.id,
          p_length: criteria.length || null,
          p_width: criteria.width || null,
          p_thickness: criteria.thickness || null,
          p_material: criteria.material || null,
          p_tolerance: tolerance,
        }
      );

      if (matchError) throw matchError;

      if (data) {
        const matchResults: SlabMatchResult[] = data.map((item: any) => {
          const slab: Slab = {
            id: item.slab_id,
            userId: user.id,
            position: item.slab_position,
            material: item.slab_material,
            length: parseFloat(item.slab_length),
            width: parseFloat(item.slab_width),
            thickness: parseFloat(item.slab_thickness),
            status: item.slab_status as 'dispo' | 'réservé',
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          return {
            slab,
            compatibilityScore: item.compatibility_score,
            dimensionMatch: {
              lengthDiff: criteria.length ? slab.length - criteria.length : 0,
              widthDiff: criteria.width ? slab.width - criteria.width : 0,
              thicknessDiff: criteria.thickness ? slab.thickness - criteria.thickness : 0,
            },
          };
        });

        setResults(matchResults);
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Erreur lors de la recherche de tranches compatibles:', err);
    } finally {
      setLoading(false);
    }
  };

  const clearResults = () => {
    setResults([]);
    setError(null);
  };

  return {
    results,
    loading,
    error,
    findCompatibleSlabs,
    clearResults,
  };
}
