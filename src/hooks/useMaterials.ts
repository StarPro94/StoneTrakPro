import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Material } from '../types';
import { useAuth } from './useAuth';
import { parseXLSFile, detectMaterialTypeFromName } from '../utils/xlsParser';

export function useMaterials() {
  const { user } = useAuth();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingProgress, setLoadingProgress] = useState<{ current: number; total: number } | null>(null);

  const fetchMaterials = async () => {
    if (!isSupabaseConfigured()) {
      setMaterials([]);
      setLoading(false);
      setError('Configuration Supabase manquante');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setLoadingProgress(null);

      const { count } = await supabase!
        .from('materials')
        .select('*', { count: 'exact', head: true });

      const totalCount = count || 0;
      console.log(`📊 Total de matières à charger: ${totalCount}`);

      const batchSize = 1000;
      let allMaterials: any[] = [];
      let hasMore = true;
      let currentOffset = 0;

      while (hasMore) {
        const { data, error: fetchError } = await supabase!
          .from('materials')
          .select('*')
          .order('name', { ascending: true })
          .range(currentOffset, currentOffset + batchSize - 1);

        if (fetchError) throw fetchError;

        if (data && data.length > 0) {
          allMaterials = [...allMaterials, ...data];
          currentOffset += batchSize;

          setLoadingProgress({
            current: allMaterials.length,
            total: totalCount
          });

          if (data.length < batchSize) {
            hasMore = false;
          }
        } else {
          hasMore = false;
        }
      }

      console.log(`✓ ${allMaterials.length} matières chargées avec succès`);
      setLoadingProgress(null);

      setMaterials(
        allMaterials.map((m) => ({
          id: m.id,
          name: m.name,
          type: m.type,
          thickness: m.thickness,
          isActive: m.is_active,
          description: m.description,
          createdAt: new Date(m.created_at),
          updatedAt: new Date(m.updated_at),
          ref: m.ref,
          cmup: m.cmup,
        }))
      );
    } catch (err: any) {
      setError(err.message);
      console.error('Erreur lors du chargement des matières:', err);
    } finally {
      setLoading(false);
    }
  };

  const addMaterial = async (material: Omit<Material, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user || !isSupabaseConfigured()) {
      setError('Utilisateur non authentifié ou configuration manquante');
      return;
    }

    try {
      setError(null);

      const { error: insertError } = await supabase!
        .from('materials')
        .insert({
          name: material.name,
          type: material.type,
          thickness: material.thickness,
          is_active: material.isActive,
          description: material.description,
          ref: material.ref,
          cmup: material.cmup,
        });

      if (insertError) throw insertError;

      await fetchMaterials();
    } catch (err: any) {
      setError(err.message);
      console.error('Erreur lors de l\'ajout de la matière:', err);
      throw err;
    }
  };

  const updateMaterial = async (material: Material) => {
    if (!user || !isSupabaseConfigured()) {
      setError('Utilisateur non authentifié ou configuration manquante');
      return;
    }

    try {
      setError(null);

      const { error: updateError } = await supabase!
        .from('materials')
        .update({
          name: material.name,
          type: material.type,
          thickness: material.thickness,
          is_active: material.isActive,
          description: material.description,
          ref: material.ref,
          cmup: material.cmup,
        })
        .eq('id', material.id);

      if (updateError) throw updateError;

      await fetchMaterials();
    } catch (err: any) {
      setError(err.message);
      console.error('Erreur lors de la mise à jour de la matière:', err);
      throw err;
    }
  };

  const deleteMaterial = async (id: string) => {
    if (!user || !isSupabaseConfigured()) {
      setError('Utilisateur non authentifié ou configuration manquante');
      return;
    }

    try {
      setError(null);

      const { error: deleteError } = await supabase!
        .from('materials')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      await fetchMaterials();
    } catch (err: any) {
      setError(err.message);
      console.error('Erreur lors de la suppression de la matière:', err);
      throw err;
    }
  };

  const importMaterialsFromCSV = async (csvContent: string) => {
    if (!user || !isSupabaseConfigured()) {
      setError('Utilisateur non authentifié ou configuration manquante');
      return;
    }

    try {
      setError(null);

      const lines = csvContent.split('\n').filter(line => line.trim());
      const materialsToImport: Array<{ name: string; type: 'tranche' | 'bloc'; thickness: number | null; description: string | null }> = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const parts = line.split(',').map(p => p.trim().replace(/^"|"$/g, ''));
        const name = parts[0];

        if (!name) continue;

        const type = name.match(/K\d+/) ? 'tranche' : 'bloc';
        const thicknessMatch = name.match(/K(\d+)/);
        const thickness = thicknessMatch ? parseInt(thicknessMatch[1]) : null;
        const description = parts[1] || null;

        materialsToImport.push({ name, type, thickness, description });
      }

      for (const mat of materialsToImport) {
        await supabase!
          .from('materials')
          .upsert({
            name: mat.name,
            type: mat.type,
            thickness: mat.thickness,
            is_active: true,
            description: mat.description,
          }, {
            onConflict: 'name'
          });
      }

      await fetchMaterials();
    } catch (err: any) {
      setError(err.message);
      console.error('Erreur lors de l\'import CSV:', err);
      throw err;
    }
  };

  const importMaterialsFromXLS = async (file: File) => {
    if (!user || !isSupabaseConfigured()) {
      setError('Utilisateur non authentifié ou configuration manquante');
      return;
    }

    try {
      setError(null);

      const parseResult = await parseXLSFile(file);
      const parsedMaterials = parseResult.materials;

      const fetchBatchSize = 1000;
      let allExistingMaterials: any[] = [];
      let hasMore = true;
      let offset = 0;

      while (hasMore) {
        const { data, error: fetchError } = await supabase!
          .from('materials')
          .select('name, ref')
          .range(offset, offset + fetchBatchSize - 1);

        if (fetchError) throw fetchError;

        if (data && data.length > 0) {
          allExistingMaterials = [...allExistingMaterials, ...data];
          offset += fetchBatchSize;
          if (data.length < fetchBatchSize) {
            hasMore = false;
          }
        } else {
          hasMore = false;
        }
      }

      const existingMaterials = { data: allExistingMaterials, error: null };

      const existingNames = new Set(
        (existingMaterials.data || []).map(m => m.name.toLowerCase())
      );
      const existingRefs = new Set(
        (existingMaterials.data || []).map(m => m.ref?.toLowerCase()).filter(Boolean)
      );

      const materialsToInsert = [];
      const materialsToUpdate = [];
      let skippedCount = 0;

      for (const material of parsedMaterials) {
        const nameExists = existingNames.has(material.matiere.toLowerCase());
        const refExists = existingRefs.has(material.ref.toLowerCase());

        const detectedType = detectMaterialTypeFromName(material.matiere);
        let materialType: 'tranche' | 'bloc' = 'tranche';

        if (detectedType === 'bloc') {
          materialType = 'bloc';
        } else if (detectedType === 'tranche') {
          materialType = 'tranche';
        } else if (detectedType === 'both') {
          materialType = 'tranche';
        }

        const thicknessMatch = material.matiere.match(/K(\d+)/);
        const thickness = thicknessMatch ? parseInt(thicknessMatch[1]) : null;

        const materialData = {
          ref: material.ref,
          name: material.matiere,
          type: materialType,
          thickness: thickness,
          is_active: true,
          description: null,
          cmup: material.cmup,
        };

        if (nameExists || refExists) {
          materialsToUpdate.push(materialData);
        } else {
          materialsToInsert.push(materialData);
        }
      }

      let addedCount = 0;
      let updatedCount = 0;

      const insertBatchSize = 500;
      for (let i = 0; i < materialsToInsert.length; i += insertBatchSize) {
        const batch = materialsToInsert.slice(i, i + insertBatchSize);
        const { error: insertError } = await supabase!
          .from('materials')
          .insert(batch);

        if (!insertError) {
          addedCount += batch.length;
        } else {
          console.error('Erreur insertion batch:', insertError);
        }
      }

      for (const material of materialsToUpdate) {
        const { error: updateError } = await supabase!
          .from('materials')
          .update({ cmup: material.cmup })
          .or(`name.eq.${material.name},ref.eq.${material.ref}`);

        if (!updateError) {
          updatedCount++;
        }
      }

      await fetchMaterials();

      return {
        addedCount,
        updatedCount,
        cmupCount: parseResult.stats.withCMUP,
        totalProcessed: parsedMaterials.length,
        rejected: parseResult.stats.rejected,
      };
    } catch (err: any) {
      setError(err.message);
      console.error('Erreur lors de l\'import XLS:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchMaterials();

    if (user && isSupabaseConfigured()) {
      const subscription = supabase!
        .channel('materials_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'materials',
          },
          () => {
            fetchMaterials();
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [user]);

  const getMaterialByName = (name: string): Material | undefined => {
    return materials.find(m => m.name.toLowerCase() === name.toLowerCase());
  };

  const getMaterialCMUP = (materialName: string): number | null => {
    const material = getMaterialByName(materialName);
    return material?.cmup ?? null;
  };

  const trancheMaterials = materials.filter(m => (m.type === 'tranche' || m.type === 'both') && m.isActive);
  const blocMaterials = materials.filter(m => (m.type === 'bloc' || m.type === 'both') && m.isActive);
  const trancheMaterialNames = trancheMaterials.map(m => m.name);
  const blocMaterialNames = blocMaterials.map(m => m.name);

  return {
    materials,
    activeMaterials: materials.filter(m => m.isActive),
    trancheMaterials,
    blocMaterials,
    trancheMaterialNames,
    blocMaterialNames,
    loading,
    loadingProgress,
    error,
    addMaterial,
    updateMaterial,
    deleteMaterial,
    importMaterialsFromCSV,
    importMaterialsFromXLS,
    refetch: fetchMaterials,
    getMaterialByName,
    getMaterialCMUP,
  };
}
