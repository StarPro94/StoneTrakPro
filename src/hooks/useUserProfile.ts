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

export function useUserProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      setError(null);
      return;
    }

    if (!isSupabaseConfigured()) {
      setProfile(null);
      setLoading(false);
      setError('Configuration Supabase manquante');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data: profileData, error: profileError } = await supabase!
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        // Si le profil n'existe pas, le créer avec le rôle par défaut
        if (profileError.code === 'PGRST116') {
          const { data: newProfile, error: insertError } = await supabase!
            .from('profiles')
            .insert({
              id: user.id,
              username: user.email?.split('@')[0] || null,
              role: 'atelier' // Rôle par défaut
            })
            .select()
            .single();

          if (insertError) throw insertError;
          
          setProfile({
            id: newProfile.id,
            username: newProfile.username,
            role: newProfile.role,
            machineId: newProfile.machine_id,
            createdAt: new Date(newProfile.created_at),
            updatedAt: new Date(newProfile.updated_at)
          });
        } else {
          throw profileError;
        }
      } else {
        setProfile({
          id: profileData.id,
          username: profileData.username,
          role: profileData.role,
          machineId: profileData.machine_id,
          createdAt: new Date(profileData.created_at),
          updatedAt: new Date(profileData.updated_at)
        });
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Erreur lors du chargement du profil:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<Pick<UserProfile, 'username' | 'role' | 'machineId'>>) => {
    if (!user || !profile) {
      setError('Utilisateur non authentifié ou profil non chargé');
      return;
    }

    try {
      setError(null);

      const { error: updateError } = await supabase!
        .from('profiles')
        .update({
          username: updates.username !== undefined ? updates.username : profile.username,
          role: updates.role !== undefined ? updates.role : profile.role,
          machine_id: updates.machineId !== undefined ? updates.machineId : profile.machineId
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Recharger le profil après la mise à jour
      await fetchProfile();
    } catch (err: any) {
      setError(err.message);
      console.error('Erreur lors de la mise à jour du profil:', err);
    }
  };

  useEffect(() => {
    fetchProfile();

    if (user) {
      // Écouter les changements sur le profil
      const profileSubscription = supabase!
        .channel('profile_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'profiles',
            filter: `id=eq.${user.id}`
          },
          async (payload) => {
            console.log('Changement détecté sur le profil:', payload);
            await fetchProfile();
          }
        )
        .subscribe();

      return () => {
        profileSubscription.unsubscribe();
      };
    }
  }, [user]);

  return {
    profile,
    loading,
    error,
    updateProfile,
    refetch: fetchProfile,

    // Identification du rôle
    isAdmin: profile?.role === 'admin',
    isBureau: profile?.role === 'bureau',
    isAtelier: profile?.role === 'atelier',
    isStockMatiere: profile?.role === 'stock_matiere',

    // Permissions par module
    // Dashboard: Admin et Bureau uniquement
    canAccessDashboard: profile?.role === 'admin' || profile?.role === 'bureau',

    // Tableau de suivi (TrackingTable)
    // - Admin/Bureau: Tout faire (import, édition, suppression)
    // - Stock Matière: Lecture seule
    // - Atelier: Lecture seule (filtrée par machine)
    canImportSheets: profile?.role === 'admin' || profile?.role === 'bureau',
    canEditSheets: profile?.role === 'admin' || profile?.role === 'bureau',
    canDeleteSheets: profile?.role === 'admin' || profile?.role === 'bureau',
    canViewTracking: true, // Tous les rôles peuvent voir le tableau

    // Stock Matière (SlabPark)
    // - Admin/Bureau/Stock Matière: Accès complet
    // - Atelier: Lecture seule
    canManageSlabs: profile?.role === 'admin' || profile?.role === 'bureau' || profile?.role === 'stock_matiere',
    canViewSlabs: true, // Tous les rôles peuvent voir
    canEditSlabs: profile?.role === 'admin' || profile?.role === 'bureau' || profile?.role === 'stock_matiere',
    canDeleteSlabs: profile?.role === 'admin' || profile?.role === 'bureau' || profile?.role === 'stock_matiere',
    canAddSlabs: profile?.role === 'admin' || profile?.role === 'bureau' || profile?.role === 'stock_matiere',

    // Planning
    // - Admin/Bureau: Tout modifier
    // - Stock Matière: Lecture seule
    // - Atelier: Lecture + édition uniquement sur sa machine
    canViewPlanning: true, // Tous peuvent voir
    canEditPlanning: profile?.role === 'admin' || profile?.role === 'bureau',
    canEditOwnMachinePlanning: profile?.role === 'atelier', // Atelier peut éditer uniquement sa machine

    // Machines
    canManageMachines: profile?.role === 'admin' || profile?.role === 'bureau',

    // Rapports: Admin et Bureau uniquement
    canAccessReports: profile?.role === 'admin' || profile?.role === 'bureau',

    // Échafaudage: Admin et Bureau uniquement
    canAccessScaffolding: profile?.role === 'admin' || profile?.role === 'bureau',

    // Administration: Admin uniquement
    canManageUsers: profile?.role === 'admin',
    canAccessAdmin: profile?.role === 'admin'
  };
}