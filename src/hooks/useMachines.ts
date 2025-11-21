import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Machine } from '../types';
import { useAuth } from './useAuth';

export function useMachines() {
  const { user } = useAuth();
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMachines = async () => {
    if (!user) {
      setMachines([]);
      setLoading(false);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data: machinesData, error: machinesError } = await supabase
        .from('machines')
        .select('*')
        .order('name', { ascending: true });

      if (machinesError) throw machinesError;

      const formattedMachines: Machine[] = machinesData.map(machine => ({
        id: machine.id,
        userId: machine.user_id,
        name: machine.name,
        createdAt: new Date(machine.created_at),
        updatedAt: new Date(machine.updated_at)
      }));

      setMachines(formattedMachines);
    } catch (err: any) {
      setError(err.message);
      console.error('Erreur lors du chargement des machines:', err);
    } finally {
      setLoading(false);
    }
  };

  const addMachine = async (newMachineData: Omit<Machine, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) {
      setError('Utilisateur non authentifié');
      return;
    }

    try {
      setError(null);

      const { data: machineData, error: machineError } = await supabase
        .from('machines')
        .insert({
          user_id: user.id,
          name: newMachineData.name
        })
        .select()
        .single();

      if (machineError) throw machineError;

      await fetchMachines();
    } catch (err: any) {
      setError(err.message);
      console.error('Erreur lors de l\'ajout de la machine:', err);
    }
  };

  const updateMachine = async (updatedMachine: Machine) => {
    if (!user) {
      setError('Utilisateur non authentifié');
      return;
    }

    try {
      setError(null);

      const { error: machineError } = await supabase
        .from('machines')
        .update({
          name: updatedMachine.name
        })
        .eq('id', updatedMachine.id);

      if (machineError) throw machineError;

      await fetchMachines();
    } catch (err: any) {
      setError(err.message);
      console.error('Erreur lors de la mise à jour de la machine:', err);
    }
  };

  const deleteMachine = async (machineId: string) => {
    if (!user) {
      setError('Utilisateur non authentifié');
      return;
    }

    try {
      setError(null);

      const { error } = await supabase
        .from('machines')
        .delete()
        .eq('id', machineId);

      if (error) throw error;

      await fetchMachines();
    } catch (err: any) {
      setError(err.message);
      console.error('Erreur lors de la suppression de la machine:', err);
    }
  };

  useEffect(() => {
    fetchMachines();

    if (user) {
      const machinesSubscription = supabase
        .channel('machines_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'machines'
          },
          async (payload) => {
            console.log('Changement détecté sur machines:', payload);
            await fetchMachines();
          }
        )
        .subscribe();

      return () => {
        machinesSubscription.unsubscribe();
      };
    }
  }, [user]);

  return {
    machines,
    loading,
    error,
    addMachine,
    updateMachine,
    deleteMachine,
    refetch: fetchMachines
  };
}