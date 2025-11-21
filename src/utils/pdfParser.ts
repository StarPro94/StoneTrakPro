import { supabase } from '../lib/supabase';

export interface ParsedPDFResult {
  success: boolean;
  sheet_id?: string;
  confidence?: number;
  warnings?: string[];
  items_count?: number;
  total_m2?: number;
  total_m3?: number;
  processing_time_ms?: number;
  extracted_data?: {
    commercial: string;
    client: string;
    numero_os: string;
    numero_arc: string;
    date_arc: string;
    fourniture: string;
    epaisseur: string;
  };
  error?: string;
}

export async function parsePDFFile(file: File, useClaudeVision: boolean = true): Promise<ParsedPDFResult> {
  const startTime = Date.now();
  const sessionId = crypto.randomUUID();

  console.log('\n' + '='.repeat(80));
  console.log('🚀 [FRONTEND] DÉMARRAGE IMPORT PDF');
  console.log('Session ID:', sessionId);
  console.log('Timestamp:', new Date().toISOString());
  console.log('Méthode:', useClaudeVision ? '🤖 Claude Vision AI' : '📝 Regex classique');
  console.log('='.repeat(80));

  try {
    console.log('\n🔐 [FRONTEND] Étape 1: Vérification authentification...');
    const authStart = Date.now();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      console.error('❌ [FRONTEND] Pas de session active');
      throw new Error('Non authentifié');
    }

    console.log('✅ [FRONTEND] Session active');
    console.log('   User ID:', session.user.id);
    console.log('   Email:', session.user.email);
    console.log('   Durée:', Date.now() - authStart, 'ms');

    console.log('\n📦 [FRONTEND] Étape 2: Préparation du fichier...');
    console.log('   Nom:', file.name);
    console.log('   Taille:', (file.size / 1024).toFixed(2), 'KB');
    console.log('   Type:', file.type);
    console.log('   Dernière modification:', new Date(file.lastModified).toISOString());

    const formData = new FormData();
    formData.append('pdf', file);
    console.log('✅ [FRONTEND] FormData créé avec clé "pdf"');

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const functionName = useClaudeVision ? 'parse-pdf-claude' : 'parse-pdf-debit';
    const functionUrl = `${supabaseUrl}/functions/v1/${functionName}`;
    console.log('\n🌐 [FRONTEND] Étape 3: Envoi requête API...');
    console.log('   URL:', functionUrl);
    console.log('   Méthode: POST');
    console.log('   Authorization: Bearer ***' + session.access_token.slice(-10));

    const fetchStart = Date.now();
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: formData
    });
    const fetchDuration = Date.now() - fetchStart;

    console.log('\n📨 [FRONTEND] Étape 4: Réponse reçue');
    console.log('   Status:', response.status, response.statusText);
    console.log('   Durée requête:', fetchDuration, 'ms');
    console.log('   Headers:');
    response.headers.forEach((value, key) => {
      console.log(`      ${key}: ${value}`);
    });

    if (!response.ok) {
      console.error('❌ [FRONTEND] Réponse HTTP en erreur');
      const errorText = await response.text();
      console.error('   Corps de la réponse:', errorText);

      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText };
      }

      throw new Error(errorData.error || `Erreur HTTP: ${response.status}`);
    }

    console.log('\n📑 [FRONTEND] Étape 5: Parsing de la réponse...');
    const responseText = await response.text();
    console.log('   Taille réponse:', responseText.length, 'caractères');
    console.log('   Contenu brut (100 premiers caractères):', responseText.substring(0, 100));

    let result;
    try {
      result = JSON.parse(responseText);
      console.log('✅ [FRONTEND] JSON parsé avec succès');
    } catch (e) {
      console.error('❌ [FRONTEND] Erreur parsing JSON:', e);
      throw new Error('Réponse invalide du serveur');
    }

    console.log('\n📋 [FRONTEND] Étape 6: Analyse du résultat...');
    console.log('   Success:', result.success);
    console.log('   Sheet ID:', result.sheet_id || 'N/A');
    console.log('   Confidence:', result.confidence || 'N/A');
    console.log('   Items count:', result.items_count || 'N/A');
    console.log('   Total M²:', result.total_m2 || 'N/A');
    console.log('   Total M³:', result.total_m3 || 'N/A');
    console.log('   Warnings:', result.warnings?.length || 0);

    if (result.extracted_data) {
      console.log('\n📊 [FRONTEND] Données extraites:');
      console.log('   Commercial:', result.extracted_data.commercial || '❌ VIDE');
      console.log('   Client:', result.extracted_data.client || '❌ VIDE');
      console.log('   N° OS:', result.extracted_data.numero_os || '❌ VIDE');
      console.log('   N° ARC:', result.extracted_data.numero_arc || '❌ VIDE');
      console.log('   Date ARC:', result.extracted_data.date_arc || '❌ VIDE');
      console.log('   Fourniture:', result.extracted_data.fourniture || '❌ VIDE');
      console.log('   Épaisseur:', result.extracted_data.epaisseur || '❌ VIDE');
    }

    if (result.warnings && result.warnings.length > 0) {
      console.log('\n⚠️  [FRONTEND] Avertissements:');
      result.warnings.forEach((w: string, i: number) => {
        console.log(`   ${i + 1}. ${w}`);
      });
    }

    const totalDuration = Date.now() - startTime;
    console.log('\n⏱️  [FRONTEND] TEMPS TOTAL:', totalDuration, 'ms');
    console.log('='.repeat(80));
    console.log('✅ [FRONTEND] IMPORT TERMINÉ AVEC SUCCÈS');
    console.log('='.repeat(80) + '\n');

    return result;

  } catch (error: any) {
    const errorDuration = Date.now() - startTime;
    console.error('\n' + '❌'.repeat(40));
    console.error('❌ [FRONTEND] ERREUR FATALE');
    console.error('   Message:', error.message);
    console.error('   Stack:', error.stack);
    console.error('   Durée avant erreur:', errorDuration, 'ms');
    console.error('❌'.repeat(40) + '\n');

    return {
      success: false,
      error: error.message || 'Erreur inconnue lors du parsing'
    };
  }
}
