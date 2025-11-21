/*
  # Création automatique de profil pour nouveaux utilisateurs

  1. Fonction de création de profil
     - Crée automatiquement un profil avec rôle 'atelier' par défaut
     - Utilise l'ID de l'utilisateur nouvellement créé
  
  2. Trigger sur auth.users
     - Se déclenche après insertion d'un nouvel utilisateur
     - Appelle la fonction de création de profil
  
  3. Création de profils pour utilisateurs existants
     - Vérifie et crée les profils manquants
     - Assigne le rôle 'admin' au premier utilisateur (par date de création)
*/

-- Fonction pour créer un profil pour un nouvel utilisateur
CREATE OR REPLACE FUNCTION public.create_profile_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role)
  VALUES (NEW.id, 'atelier');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour créer automatiquement un profil lors de l'inscription
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_profile_for_new_user();

-- Créer des profils pour les utilisateurs existants qui n'en ont pas
DO $$
DECLARE
  user_record RECORD;
  first_user_id UUID;
BEGIN
  -- Trouver le premier utilisateur (par date de création) pour lui donner le rôle admin
  SELECT id INTO first_user_id
  FROM auth.users
  ORDER BY created_at ASC
  LIMIT 1;

  -- Créer des profils pour tous les utilisateurs existants sans profil
  FOR user_record IN 
    SELECT au.id, au.created_at
    FROM auth.users au
    LEFT JOIN public.profiles p ON au.id = p.id
    WHERE p.id IS NULL
    ORDER BY au.created_at ASC
  LOOP
    -- Le premier utilisateur devient admin, les autres deviennent atelier
    IF user_record.id = first_user_id THEN
      INSERT INTO public.profiles (id, role)
      VALUES (user_record.id, 'admin');
      
      RAISE NOTICE 'Profil admin créé pour le premier utilisateur: %', user_record.id;
    ELSE
      INSERT INTO public.profiles (id, role)
      VALUES (user_record.id, 'atelier');
      
      RAISE NOTICE 'Profil atelier créé pour l''utilisateur: %', user_record.id;
    END IF;
  END LOOP;
END $$;

-- Accorder les permissions nécessaires
GRANT EXECUTE ON FUNCTION public.create_profile_for_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_profile_for_new_user() TO service_role;