import React, { useState } from 'react';
import { Users, Shield, Settings, AlertTriangle, Edit2, Save, X, UserCheck, Layers } from 'lucide-react';
import { useProfiles } from '../hooks/useProfiles';
import { useMachines } from '../hooks/useMachines';
import { UserProfile } from '../hooks/useUserProfile';
import ConfirmationModal from './ConfirmationModal';
import MachinesManager from './MachinesManager';
import MaterialsManager from './MaterialsManager';

interface AdminPanelProps {
  profileLoading: boolean;
  profile: UserProfile | null;
  canManageUsers: boolean;
}

export default function AdminPanel({ profileLoading, profile: currentUserProfile, canManageUsers }: AdminPanelProps) {
  const { profiles, loading, error, updateProfileRole, updateProfileMachine, updateProfileUsername } = useProfiles();
  const { machines } = useMachines();

  // DÉBOGAGE: Vérifier le profil et les permissions
  console.log('=== ADMIN PANEL DEBUG ===');
  console.log('AdminPanel currentUserProfile:', currentUserProfile);
  console.log('AdminPanel profileLoading:', profileLoading);
  console.log('AdminPanel currentUserProfile?.role:', currentUserProfile?.role);
  console.log('AdminPanel currentUserProfile?.isAdmin:', currentUserProfile?.isAdmin);
  console.log('=== FIN ADMIN PANEL DEBUG ===');

  const [activeTab, setActiveTab] = useState<'users' | 'machines' | 'materials'>('users');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<'username' | 'role' | 'machine' | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingUpdate, setPendingUpdate] = useState<{ userId: string; field: string; value: string } | null>(null);

  // Affichage du loader pendant le chargement du profil
  if (profileLoading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du profil utilisateur...</p>
        </div>
      </div>
    );
  }

  // Vérifier que l'utilisateur actuel est admin
  if (!canManageUsers) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <h2 className="text-xl font-semibold text-red-800 mb-2">Accès Refusé</h2>
            <p className="text-red-600">Vous n'avez pas les permissions nécessaires pour accéder à cette section.</p>
            <p className="text-red-500 text-sm mt-2">Seuls les administrateurs peuvent gérer les utilisateurs.</p>
          </div>
        </div>
      </div>
    );
  }

  const handleStartEdit = (userId: string, field: 'username' | 'role' | 'machine', currentValue: string) => {
    setEditingUserId(userId);
    setEditingField(field);
    setEditValue(currentValue || '');
  };

  const handleCancelEdit = () => {
    setEditingUserId(null);
    setEditingField(null);
    setEditValue('');
  };

  const handleSaveEdit = async () => {
    if (!editingUserId || !editingField) return;

    // Vérifier si c'est un changement critique qui nécessite une confirmation
    const isCriticalChange = editingField === 'role' || 
      (editingField === 'machine' && editValue !== profiles.find(p => p.id === editingUserId)?.machineId);

    if (isCriticalChange) {
      setPendingUpdate({ userId: editingUserId, field: editingField, value: editValue });
      setShowConfirmModal(true);
      return;
    }

    // Appliquer le changement directement pour les modifications non critiques
    await applyUpdate(editingUserId, editingField, editValue);
  };

  const applyUpdate = async (userId: string, field: string, value: string) => {
    try {
      switch (field) {
        case 'username':
          await updateProfileUsername(userId, value);
          break;
        case 'role':
          await updateProfileRole(userId, value as any);
          break;
        case 'machine':
          await updateProfileMachine(userId, value || null);
          break;
      }
      
      // Réinitialiser l'état d'édition
      handleCancelEdit();
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
    }
  };

  const confirmUpdate = async () => {
    if (pendingUpdate) {
      await applyUpdate(pendingUpdate.userId, pendingUpdate.field, pendingUpdate.value);
      setPendingUpdate(null);
    }
  };

  const closeConfirmModal = () => {
    setShowConfirmModal(false);
    setPendingUpdate(null);
    handleCancelEdit();
  };

  const getRoleName = (role: string) => {
    const roleNames = {
      admin: 'Administrateur',
      bureau: 'Bureau d\'études',
      atelier: 'Atelier',
      stock_matiere: 'Stock Matière'
    };
    return roleNames[role as keyof typeof roleNames] || role;
  };

  const getRoleColor = (role: string) => {
    const colors = {
      admin: 'bg-red-100 text-red-800',
      bureau: 'bg-blue-100 text-blue-800',
      atelier: 'bg-green-100 text-green-800',
      stock_matiere: 'bg-purple-100 text-purple-800'
    };
    return colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (date?: Date) => {
    if (!date) return '-';
    return date.toLocaleDateString('fr-FR') + ' à ' + date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <p className="text-red-600 font-medium">Erreur: {error}</p>
            </div>
          </div>
        )}

        {/* En-tête */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-3">
                <Shield className="h-7 w-7 text-red-600" />
                <span>Panneau d'Administration</span>
              </h2>
              <p className="text-gray-600 mt-1">Gestion des utilisateurs, machines et matériaux</p>
            </div>
          </div>

          {/* Onglets de navigation */}
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('users')}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-all duration-200 flex items-center justify-center space-x-2 ${
                activeTab === 'users'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
              }`}
            >
              <Users className="h-4 w-4" />
              <span>Utilisateurs</span>
            </button>
            <button
              onClick={() => setActiveTab('machines')}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-all duration-200 flex items-center justify-center space-x-2 ${
                activeTab === 'machines'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
              }`}
            >
              <Settings className="h-4 w-4" />
              <span>Machines</span>
            </button>
            <button
              onClick={() => setActiveTab('materials')}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-all duration-200 flex items-center justify-center space-x-2 ${
                activeTab === 'materials'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
              }`}
            >
              <Layers className="h-4 w-4" />
              <span>Matériaux</span>
            </button>
          </div>
        </div>

        {activeTab === 'users' && (
          <>
        {/* Statistiques des rôles */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { role: 'admin', name: 'Administrateurs', color: 'red', icon: Shield },
            { role: 'bureau', name: 'Bureau', color: 'blue', icon: Settings },
            { role: 'atelier', name: 'Atelier', color: 'green', icon: UserCheck },
            { role: 'stock_matiere', name: 'Stock Matière', color: 'purple', icon: Users }
          ].map(({ role, name, color, icon: Icon }) => {
            const count = profiles.filter(p => p.role === role).length;
            return (
              <div key={role} className="bg-white rounded-lg shadow-md p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{name}</p>
                    <p className="text-2xl font-bold text-gray-900">{count}</p>
                  </div>
                  <Icon className={`h-8 w-8 text-${color}-600`} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Tableau des utilisateurs */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 bg-gray-50 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Liste des Utilisateurs</h3>
          </div>
          
          {profiles.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500">Aucun utilisateur trouvé</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Utilisateur</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Nom d'utilisateur</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Rôle</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Machine Assignée</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden lg:table-cell">Dernière Connexion</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden md:table-cell">Inscription</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {profiles.map((profile) => {
                    const isCurrentUser = profile.id === currentUserProfile?.id;
                    const assignedMachine = machines.find(m => m.id === profile.machineId);
                    
                    return (
                      <tr key={profile.id} className={`hover:bg-gray-50 ${isCurrentUser ? 'bg-blue-50' : ''}`}>
                        {/* Email */}
                        <td className="px-3 sm:px-6 py-4">
                          <div className="flex items-center">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {profile.email}
                                {isCurrentUser && (
                                  <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    Vous
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-gray-500 hidden sm:block">ID: {profile.id.substring(0, 8)}...</div>
                            </div>
                          </div>
                        </td>

                        {/* Nom d'utilisateur */}
                        <td className="px-3 sm:px-6 py-4">
                          {editingUserId === profile.id && editingField === 'username' ? (
                            <div className="flex items-center space-x-2">
                              <input
                                type="text"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Nom d'utilisateur"
                                autoFocus
                              />
                              <button
                                onClick={handleSaveEdit}
                                className="text-green-600 hover:text-green-800 p-1"
                                title="Sauvegarder"
                              >
                                <Save className="h-4 w-4" />
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="text-red-600 hover:text-red-800 p-1"
                                title="Annuler"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-gray-900">{profile.username || '-'}</span>
                              <button
                                onClick={() => handleStartEdit(profile.id, 'username', profile.username || '')}
                                className="text-gray-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Modifier le nom d'utilisateur"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </td>

                        {/* Rôle */}
                        <td className="px-3 sm:px-6 py-4">
                          {editingUserId === profile.id && editingField === 'role' ? (
                            <div className="flex items-center space-x-2">
                              <select
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                disabled={isCurrentUser} // Empêcher de modifier son propre rôle
                              >
                                <option value="admin">Administrateur</option>
                                <option value="bureau">Bureau d'études</option>
                                <option value="atelier">Atelier</option>
                                <option value="stock_matiere">Stock Matière</option>
                              </select>
                              <button
                                onClick={handleSaveEdit}
                                className="text-green-600 hover:text-green-800 p-1"
                                title="Sauvegarder"
                                disabled={isCurrentUser}
                              >
                                <Save className="h-4 w-4" />
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="text-red-600 hover:text-red-800 p-1"
                                title="Annuler"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2 group">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(profile.role)}`}>
                                {getRoleName(profile.role)}
                              </span>
                              {!isCurrentUser && (
                                <button
                                  onClick={() => handleStartEdit(profile.id, 'role', profile.role)}
                                  className="text-gray-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                  title="Modifier le rôle"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Machine */}
                        <td className="px-3 sm:px-6 py-4">
                          {editingUserId === profile.id && editingField === 'machine' ? (
                            <div className="flex items-center space-x-2">
                              <select
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              >
                                <option value="">Aucune machine</option>
                                {machines.map((machine) => (
                                  <option key={machine.id} value={machine.id}>
                                    {machine.name}
                                  </option>
                                ))}
                              </select>
                              <button
                                onClick={handleSaveEdit}
                                className="text-green-600 hover:text-green-800 p-1"
                                title="Sauvegarder"
                              >
                                <Save className="h-4 w-4" />
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="text-red-600 hover:text-red-800 p-1"
                                title="Annuler"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2 group">
                              <span className="text-sm text-gray-900">
                                {assignedMachine ? assignedMachine.name : '-'}
                              </span>
                              <button
                                onClick={() => handleStartEdit(profile.id, 'machine', profile.machineId || '')}
                                className="text-gray-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Modifier la machine assignée"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </td>

                        {/* Dernière connexion */}
                        <td className="px-3 sm:px-6 py-4 text-sm text-gray-500 hidden lg:table-cell">
                          {formatDate(profile.lastSignIn)}
                        </td>

                        {/* Date d'inscription */}
                        <td className="px-3 sm:px-6 py-4 text-sm text-gray-500 hidden md:table-cell">
                          {formatDate(profile.createdAt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal de confirmation */}
        <ConfirmationModal
          isOpen={showConfirmModal}
          onClose={closeConfirmModal}
          onConfirm={confirmUpdate}
          title="Confirmer la modification"
          message={`Êtes-vous sûr de vouloir modifier ${
            pendingUpdate?.field === 'role' ? 'le rôle de' : 'la machine assignée à'
          } cet utilisateur ?\n\nCette action peut affecter les permissions d'accès de l'utilisateur.`}
          confirmButtonText="Confirmer"
          cancelButtonText="Annuler"
          type="warning"
        />
          </>
        )}

        {activeTab === 'machines' && <MachinesManager />}

        {activeTab === 'materials' && <MaterialsManager />}
      </div>
    </div>
  );
}