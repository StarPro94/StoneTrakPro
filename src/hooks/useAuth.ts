import { useState, useEffect, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const currentUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Si Supabase n'est pas configuré, arrêter le chargement
    if (!isSupabaseConfigured()) {
      setUser(null);
      setLoading(false);
      return;
    }

    // Récupérer la session actuelle
    supabase!.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      currentUserIdRef.current = session?.user?.id ?? null;
      setLoading(false);
    });

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase!.auth.onAuthStateChange(
      (event, session) => {
        const newUserId = session?.user?.id ?? null;

        // Ne mettre à jour que si l'utilisateur a vraiment changé
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
          console.log('Auth state change:', event);
          setUser(session?.user ?? null);
          currentUserIdRef.current = newUserId;
          setLoading(false);
        } else if (event === 'TOKEN_REFRESHED') {
          // Pour TOKEN_REFRESHED, ne mettre à jour que si l'ID utilisateur a changé
          if (currentUserIdRef.current !== newUserId) {
            console.log('Auth state change: TOKEN_REFRESHED with user change');
            setUser(session?.user ?? null);
            currentUserIdRef.current = newUserId;
          }
          // Sinon, on ignore silencieusement le refresh de token
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
  };

  return {
    user,
    loading,
    signOut
  }
}