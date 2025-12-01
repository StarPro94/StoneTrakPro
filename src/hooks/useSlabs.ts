import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Slab, Material } from '../types';
import { useAuth } from './useAuth';
import { parseSlabExcelFile, ParseResult } from '../utils/slabExcelParser';
import { generateSlabExcelFile, downloadExcelFile } from '../utils/slabExcelGenerator';

export function useSlabs() {
  const { user } = useAuth();
  const [slabs, setSlabs] = useState<Slab[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSlabs = async () => {
    if (!user) {
      setSlabs([]);
      setLoading(false);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data: slabsData, error: slabsError } = await supabase
        .from('slabs')
        .select(`
          *,
          debit_sheets (
            numero_os,
            ref_chantier
          )
        `)
        .order('position', { ascending: true });

      if (slabsError) throw slabsError;

      const formattedSlabs: Slab[] = slabsData.map(slab => ({
        id: slab.id,
        userId: slab.user_id,
        position: slab.position,
        material: slab.material,
        length: parseFloat(slab.length),
        width: parseFloat(slab.width),
        thickness: parseFloat(slab.thickness),
        quantity: parseInt(slab.quantity) || 1,
        status: slab.status as 'dispo' | 'réservé',
        debitSheetId: slab.debit_sheet_id || undefined,
        createdAt: new Date(slab.created_at),
        updatedAt: new Date(slab.updated_at),
        numeroOS: slab.debit_sheets?.numero_os || undefined,
        refChantier: slab.debit_sheets?.ref_chantier || undefined
      }));

      setSlabs(formattedSlabs);
    } catch (err: any) {
      setError(err.message);
      console.error('Erreur lors du chargement des tranches:', err);
    } finally {
      setLoading(false);
    }
  };

  const addSlab = async (newSlabData: Omit<Slab, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) {
      setError('Utilisateur non authentifié');
      return;
    }

    try {
      setError(null);

      const { data: slabData, error: slabError } = await supabase
        .from('slabs')
        .insert({
          user_id: user.id,
          position: newSlabData.position,
          material: newSlabData.material,
          length: newSlabData.length,
          width: newSlabData.width,
          thickness: newSlabData.thickness,
          quantity: newSlabData.quantity || 1,
          status: newSlabData.status,
          debit_sheet_id: newSlabData.debitSheetId || null
        })
        .select()
        .single();

      if (slabError) throw slabError;

      await fetchSlabs();
    } catch (err: any) {
      setError(err.message);
      console.error('Erreur lors de l\'ajout de la tranche:', err);
    }
  };

  const updateSlab = async (updatedSlab: Slab) => {
    if (!user) {
      setError('Utilisateur non authentifié');
      return;
    }

    try {
      setError(null);

      const { error: slabError } = await supabase
        .from('slabs')
        .update({
          position: updatedSlab.position,
          material: updatedSlab.material,
          length: updatedSlab.length,
          width: updatedSlab.width,
          thickness: updatedSlab.thickness,
          quantity: updatedSlab.quantity || 1,
          status: updatedSlab.status,
          debit_sheet_id: updatedSlab.debitSheetId || null
        })
        .eq('id', updatedSlab.id);

      if (slabError) throw slabError;

      await fetchSlabs();
    } catch (err: any) {
      setError(err.message);
      console.error('Erreur lors de la mise à jour de la tranche:', err);
    }
  };

  const deleteSlab = async (slabId: string) => {
    if (!user) {
      setError('Utilisateur non authentifié');
      return;
    }

    try {
      setError(null);

      const { error } = await supabase
        .from('slabs')
        .delete()
        .eq('id', slabId);

      if (error) throw error;

      await fetchSlabs();
    } catch (err: any) {
      setError(err.message);
      console.error('Erreur lors de la suppression de la tranche:', err);
    }
  };

  useEffect(() => {
    fetchSlabs();

    if (user) {
      const slabsSubscription = supabase
        .channel('slabs_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'slabs'
          },
          async (payload) => {
            console.log('Changement détecté sur slabs:', payload);
            await fetchSlabs();
          }
        )
        .subscribe();

      return () => {
        slabsSubscription.unsubscribe();
      };
    }
  }, [user]);

  const importSlabsFromExcel = async (file: File): Promise<{ added: number; errors: string[] }> => {
    if (!user) {
      throw new Error('Utilisateur non authentifié');
    }

    try {
      const parseResult: ParseResult = await parseSlabExcelFile(file);

      if (parseResult.errors.length > 0 && parseResult.slabs.length === 0) {
        return {
          added: 0,
          errors: parseResult.errors.map(e => `Ligne ${e.row}: ${e.message}`),
        };
      }

      const { data: materialsData } = await supabase
        .from('materials')
        .select('id, name, ref, type');

      const refToMaterial = new Map<string, { id: string; name: string; type: string }>();
      (materialsData || []).forEach((m: any) => {
        refToMaterial.set(m.ref.toLowerCase(), { id: m.id, name: m.name, type: m.type });
      });

      const slabsToInsert = [];
      const errors: string[] = [];
      const createdMaterials = new Set<string>();

      for (const parsedSlab of parseResult.slabs) {
        const refLower = parsedSlab.ref.toLowerCase();
        let material = refToMaterial.get(refLower);

        if (!material) {
          if (!createdMaterials.has(refLower)) {
            const materialType = /\bK\d+/i.test(parsedSlab.material) ? 'tranche' : 'bloc';
            const thicknessMatch = parsedSlab.material.match(/K(\d+)/i);
            const thickness = thicknessMatch ? parseInt(thicknessMatch[1]) : null;

            const newMaterial = {
              ref: parsedSlab.ref,
              name: parsedSlab.material,
              type: materialType,
              thickness: thickness,
              is_active: true,
              cmup: null,
            };

            const { data: created, error: createError } = await supabase
              .from('materials')
              .insert(newMaterial)
              .select()
              .single();

            if (createError) {
              errors.push(`Erreur lors de la création de la matière "${parsedSlab.material}" (${parsedSlab.ref}): ${createError.message}`);
              continue;
            }

            material = { id: created.id, name: created.name, type: created.type };
            refToMaterial.set(refLower, material);
            createdMaterials.add(refLower);
          } else {
            material = refToMaterial.get(refLower);
          }
        }

        slabsToInsert.push({
          user_id: user.id,
          position: parsedSlab.position,
          material: material!.name,
          length: parsedSlab.length,
          width: parsedSlab.width,
          thickness: parsedSlab.thickness,
          quantity: parsedSlab.quantity,
          status: 'dispo',
        });
      }

      if (slabsToInsert.length === 0) {
        return { added: 0, errors };
      }

      const batchSize = 100;
      let totalInserted = 0;

      for (let i = 0; i < slabsToInsert.length; i += batchSize) {
        const batch = slabsToInsert.slice(i, i + batchSize);
        const { error: insertError } = await supabase
          .from('slabs')
          .insert(batch);

        if (insertError) {
          errors.push(`Erreur lors de l'insertion: ${insertError.message}`);
        } else {
          totalInserted += batch.length;
        }
      }

      await fetchSlabs();

      return {
        added: totalInserted,
        errors: [...errors, ...parseResult.errors.map(e => `Ligne ${e.row}: ${e.message}`)],
      };
    } catch (err: any) {
      throw new Error(`Erreur lors de l'import: ${err.message}`);
    }
  };

  const exportSlabsToExcel = async (materials: Material[]) => {
    try {
      const { data: slabsData, error: slabsError } = await supabase
        .from('slabs')
        .select('*')
        .order('material', { ascending: true })
        .order('position', { ascending: true });

      if (slabsError) throw slabsError;

      const slabsWithMaterials = slabsData.map((slab: any) => {
        const material = materials.find(
          (m) => m.name.toLowerCase() === slab.material.toLowerCase()
        );

        return {
          id: slab.id,
          userId: slab.user_id,
          position: slab.position,
          material: slab.material,
          length: parseFloat(slab.length),
          width: parseFloat(slab.width),
          thickness: parseFloat(slab.thickness),
          quantity: parseInt(slab.quantity) || 1,
          status: slab.status,
          debitSheetId: slab.debit_sheet_id,
          createdAt: new Date(slab.created_at),
          updatedAt: new Date(slab.updated_at),
          materialRef: material?.ref,
          materialCmup: material?.cmup,
        };
      });

      const buffer = generateSlabExcelFile(slabsWithMaterials, materials);

      const date = new Date().toISOString().split('T')[0];
      const filename = `Stock_Tranches_${date}.xlsx`;

      downloadExcelFile(buffer, filename);
    } catch (err: any) {
      throw new Error(`Erreur lors de l'export: ${err.message}`);
    }
  };

  return {
    slabs,
    loading,
    error,
    addSlab,
    updateSlab,
    deleteSlab,
    refetch: fetchSlabs,
    importSlabsFromExcel,
    exportSlabsToExcel,
  };
}