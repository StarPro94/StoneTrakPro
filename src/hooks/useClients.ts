import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Client } from '../types';
import { useAuth } from './useAuth';

export function useClients() {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClients = async () => {
    if (!isSupabaseConfigured() || !user) {
      setClients([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase!
        .from('clients')
        .select('*')
        .order('company_name', { ascending: true });

      if (fetchError) throw fetchError;

      const mappedClients: Client[] = (data || []).map((c: any) => ({
        id: c.id,
        companyName: c.company_name,
        contactName: c.contact_name,
        address: c.address,
        phone: c.phone,
        email: c.email,
        notes: c.notes,
        createdBy: c.created_by,
        createdAt: new Date(c.created_at),
        updatedAt: new Date(c.updated_at)
      }));

      setClients(mappedClients);
    } catch (err: any) {
      setError(err.message);
      console.error('Erreur lors du chargement des clients:', err);
    } finally {
      setLoading(false);
    }
  };

  const findClientByCompany = async (companyName: string): Promise<Client | null> => {
    if (!isSupabaseConfigured() || !companyName.trim()) {
      return null;
    }

    try {
      const { data, error: fetchError } = await supabase!
        .from('clients')
        .select('*')
        .ilike('company_name', companyName.trim())
        .maybeSingle();

      if (fetchError) throw fetchError;
      if (!data) return null;

      return {
        id: data.id,
        companyName: data.company_name,
        contactName: data.contact_name,
        address: data.address,
        phone: data.phone,
        email: data.email,
        notes: data.notes,
        createdBy: data.created_by,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };
    } catch (err: any) {
      console.error('Erreur lors de la recherche du client:', err);
      return null;
    }
  };

  const createClient = async (client: Omit<Client, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>): Promise<Client | null> => {
    if (!user || !isSupabaseConfigured()) {
      setError('Utilisateur non authentifié ou configuration manquante');
      return null;
    }

    try {
      setError(null);

      const { data, error: insertError } = await supabase!
        .from('clients')
        .insert({
          company_name: client.companyName,
          contact_name: client.contactName,
          address: client.address,
          phone: client.phone,
          email: client.email,
          notes: client.notes,
          created_by: user.id
        })
        .select()
        .single();

      if (insertError) throw insertError;

      const newClient: Client = {
        id: data.id,
        companyName: data.company_name,
        contactName: data.contact_name,
        address: data.address,
        phone: data.phone,
        email: data.email,
        notes: data.notes,
        createdBy: data.created_by,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };

      await fetchClients();
      return newClient;
    } catch (err: any) {
      setError(err.message);
      console.error('Erreur lors de la création du client:', err);
      return null;
    }
  };

  const updateClient = async (client: Client): Promise<boolean> => {
    if (!user || !isSupabaseConfigured()) {
      setError('Utilisateur non authentifié ou configuration manquante');
      return false;
    }

    try {
      setError(null);

      const { error: updateError } = await supabase!
        .from('clients')
        .update({
          company_name: client.companyName,
          contact_name: client.contactName,
          address: client.address,
          phone: client.phone,
          email: client.email,
          notes: client.notes
        })
        .eq('id', client.id);

      if (updateError) throw updateError;

      await fetchClients();
      return true;
    } catch (err: any) {
      setError(err.message);
      console.error('Erreur lors de la mise à jour du client:', err);
      return false;
    }
  };

  const deleteClient = async (id: string): Promise<boolean> => {
    if (!user || !isSupabaseConfigured()) {
      setError('Utilisateur non authentifié ou configuration manquante');
      return false;
    }

    try {
      setError(null);

      const { error: deleteError } = await supabase!
        .from('clients')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      await fetchClients();
      return true;
    } catch (err: any) {
      setError(err.message);
      console.error('Erreur lors de la suppression du client:', err);
      return false;
    }
  };

  const saveOrUpdateClient = async (clientData: {
    companyName: string;
    contactName: string | null;
    address: string | null;
    phone: string | null;
    email: string | null;
  }): Promise<Client | null> => {
    if (!clientData.companyName.trim()) {
      return null;
    }

    const existingClient = await findClientByCompany(clientData.companyName);

    if (existingClient) {
      const updated = await updateClient({
        ...existingClient,
        contactName: clientData.contactName,
        address: clientData.address,
        phone: clientData.phone,
        email: clientData.email
      });

      return updated ? existingClient : null;
    } else {
      return await createClient({
        companyName: clientData.companyName,
        contactName: clientData.contactName,
        address: clientData.address,
        phone: clientData.phone,
        email: clientData.email,
        notes: null
      });
    }
  };

  useEffect(() => {
    fetchClients();

    if (user && isSupabaseConfigured()) {
      const channel = supabase!
        .channel('clients_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'clients'
          },
          () => {
            fetchClients();
          }
        )
        .subscribe();

      return () => {
        channel.unsubscribe();
      };
    }
  }, [user]);

  return {
    clients,
    loading,
    error,
    fetchClients,
    findClientByCompany,
    createClient,
    updateClient,
    deleteClient,
    saveOrUpdateClient
  };
}
