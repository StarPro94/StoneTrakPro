import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from './useAuth';

export interface UserProfile {
  id: string;
  username: string | null;
  role: 'admin' | 'bureau' | 'atelier' | 'stock_matiere';
  machineId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export function useProfiles() {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfiles = async () => {
    if (!user) {
      setProfiles([]);
      setLoading(false);
      setError(null);
      return;
    }

    if (!isSupabaseConfigured()) {
      setProfiles([]);
      setLoading(false);
      setError('Configuration Supabase manquante');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('Récupération des profils utilisateurs...');

      const { data: profilesData, error: profilesError } = await supabase!
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) {
        console.error('Erreur lors de la récupération des profils:', profilesError);
        throw profilesError;
      }

      console.log('Profils récupérés:', profilesData?.length || 0);

      const formattedProfiles: UserProfile[] = (profilesData || []).map(profile => ({
        id: profile.id,
        username: profile.username,
        role: profile.role,
        machineId: profile.machine_id,
        createdAt: new Date(profile.created_at),
        updatedAt: new Date(profile.updated_at)
      }));

      setProfiles(formattedProfiles);
    } catch (err: any) {
      const errorMessage = err.message || 'Erreur lors de la récupération des profils';
      setError(errorMessage);
      console.error('Erreur useProfiles:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateProfileRole = async (userId: string, newRole: 'admin' | 'bureau' | 'atelier' | 'stock_matiere') => {
    if (!user) {
      setError('Utilisateur non authentifié');
      return;
    }

    try {
      setError(null);
      console.log(`Mise à jour du rôle utilisateur ${userId} vers ${newRole}`);

      const { error: updateError } = await supabase!
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (updateError) {
        console.error('Erreur lors de la mise à jour du rôle:', updateError);
        throw updateError;
      }

      // Recharger les profils après la mise à jour
      await fetchProfiles();
      console.log('Rôle mis à jour avec succès');
    } catch (err: any) {
      const errorMessage = err.message || 'Erreur lors de la mise à jour du rôle';
      setError(errorMessage);
      console.error('Erreur updateProfileRole:', err);
    }
  };

  const updateProfileMachine = async (userId: string, machineId: string | null) => {
    if (!user) {
      setError('Utilisateur non authentifié');
      return;
    }

    try {
      setError(null);
      console.log(`Mise à jour de la machine utilisateur ${userId} vers ${machineId}`);

      const { error: updateError } = await supabase!
        .from('profiles')
        .update({ machine_id: machineId })
        .eq('id', userId);

      if (updateError) {
        console.error('Erreur lors de la mise à jour de la machine:', updateError);
        throw updateError;
      }

      // Recharger les profils après la mise à jour
      await fetchProfiles();
      console.log('Machine mise à jour avec succès');
    } catch (err: any) {
      const errorMessage = err.message || 'Erreur lors de la mise à jour de la machine';
      setError(errorMessage);
      console.error('Erreur updateProfileMachine:', err);
    }
  };

  const updateProfileUsername = async (userId: string, username: string) => {
    if (!user) {
      setError('Utilisateur non authentifié');
      return;
    }

    try {
      setError(null);
      console.log(`Mise à jour du nom d'utilisateur ${userId} vers ${username}`);

      const { error: updateError } = await supabase!
        .from('profiles')
        .update({ username })
        .eq('id', userId);

      if (updateError) {
        console.error('Erreur lors de la mise à jour du nom d\'utilisateur:', updateError);
        throw updateError;
      }

      // Recharger les profils après la mise à jour
      await fetchProfiles();
      console.log('Nom d\'utilisateur mis à jour avec succès');
    } catch (err: any) {
      const errorMessage = err.message || 'Erreur lors de la mise à jour du nom d\'utilisateur';
      setError(errorMessage);
      console.error('Erreur updateProfileUsername:', err);
    }
  };

  useEffect(() => {
    fetchProfiles();

    if (user) {
      // Écouter les changements sur les profils
      const profilesSubscription = supabase!
        .channel('profiles_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'profiles'
          },
          async (payload) => {
            console.log('Changement détecté sur les profils:', payload);
            await fetchProfiles();
          }
        )
        .subscribe();

      return () => {
        profilesSubscription.unsubscribe();
      };
    }
  }, [user]);

  return {
    profiles,
    loading,
    error,
    updateProfileRole,
    updateProfileMachine,
    updateProfileUsername,
    refetch: fetchProfiles
  };
}