import React, { useMemo } from 'react';
import { Box, Grid3x3, Layers, TrendingUp } from 'lucide-react';
import { useBlocks } from '../hooks/useBlocks';
import { Block } from '../types';

export default function BlockParkDashboard() {
  const { blocks, loading } = useBlocks();

  const statistics = useMemo(() => {
    const totalBlocks = blocks.length;
    const totalVolume = blocks.reduce((sum, block) => sum + block.volume, 0);

    // Grouper par ligne
    const blocksByLigne = blocks.reduce((acc, block) => {
      acc[block.ligne] = (acc[block.ligne] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const lignesOccupied = Object.keys(blocksByLigne).length;
    const totalLignes = 26; // A-Z

    // Grouper par matériau
    const blocksByMaterial = blocks.reduce((acc, block) => {
      acc[block.material] = (acc[block.material] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const uniqueMaterials = Object.keys(blocksByMaterial).length;

    return {
      totalBlocks,
      totalVolume,
      lignesOccupied,
      totalLignes,
      occupationRate: totalLignes > 0 ? (lignesOccupied / totalLignes) * 100 : 0,
      uniqueMaterials,
      blocksByMaterial,
    };
  }, [blocks]);

  if (loading) {
    return (
      <div className="mb-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const kpiCards = [
    {
      title: 'Blocs totaux',
      value: statistics.totalBlocks,
      icon: Box,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
    },
    {
      title: 'Lignes occupées',
      value: statistics.lignesOccupied,
      subtitle: `${statistics.occupationRate.toFixed(0)}% d'occupation`,
      icon: Grid3x3,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200',
    },
    {
      title: 'Matériaux uniques',
      value: statistics.uniqueMaterials,
      icon: Layers,
      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
      borderColor: 'border-pink-200',
    },
    {
      title: 'Volume total',
      value: `${statistics.totalVolume.toFixed(2)} m³`,
      icon: TrendingUp,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50',
      borderColor: 'border-cyan-200',
    },
  ];

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
          <Box className="h-6 w-6 text-purple-600" />
          <span>Vue d'ensemble du stock de blocs</span>
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card, index) => (
          <div
            key={index}
            className={`${card.bgColor} border-2 ${card.borderColor} rounded-xl p-4 transition-all duration-200 hover:shadow-md`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-1">{card.title}</p>
                <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
                {card.subtitle && (
                  <p className="text-xs text-gray-500 mt-1">{card.subtitle}</p>
                )}
              </div>
              <card.icon className={`h-8 w-8 ${card.color} opacity-80`} />
            </div>
          </div>
        ))}
      </div>

      {statistics.totalBlocks === 0 && (
        <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            Aucun bloc en stock. Commencez par ajouter des blocs pour voir les statistiques.
          </p>
        </div>
      )}
    </div>
  );
}
