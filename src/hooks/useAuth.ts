import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

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
      setLoading(false);
    });

    // Écouter les changements d'authentification (login/logout uniquement)
    const { data: { subscription } } = supabase!.auth.onAuthStateChange(
      (event, session) => {
        // Ne réagir qu'aux vrais changements d'authentification
        // Ignorer les événements de refocus qui ne changent rien
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
          console.log('Auth state change:', event);
          setUser(session?.user ?? null);
          setLoading(false);
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