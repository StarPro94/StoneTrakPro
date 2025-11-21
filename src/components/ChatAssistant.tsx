import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Loader2, X, Minimize2, Maximize2, Bot, User as UserIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatAssistantProps {
  sheets: any[];
  onClose?: () => void;
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
}

export default function ChatAssistant({ sheets, onClose, isMinimized, onToggleMinimize }: ChatAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Bonjour ! Je suis votre assistant intelligent StoneTrak. Je peux vous aider à :\n\n• Analyser vos commandes et production\n• Créer des rapports personnalisés\n• Identifier des tendances et anomalies\n• Répondre à vos questions sur les données\n• Suggérer des optimisations\n\nComment puis-je vous aider aujourd'hui ?",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getContextualData = () => {
    const activeSheets = sheets.filter(s => !s.fini && !s.livre);
    const urgentSheets = activeSheets.filter(sheet => {
      const delaiStr = sheet.delai?.trim();
      const delaiDays = delaiStr && !isNaN(parseInt(delaiStr)) ? parseInt(delaiStr) : null;
      if (delaiDays === null || delaiDays <= 0) return false;
      const creationDate = new Date(sheet.dateCreation);
      const dueDate = new Date(creationDate);
      dueDate.setDate(dueDate.getDate() + delaiDays);
      const daysUntilDue = Math.ceil((dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilDue <= 3 && daysUntilDue >= 0;
    });

    return {
      totalSheets: sheets.length,
      activeSheets: activeSheets.length,
      completedSheets: sheets.filter(s => s.fini).length,
      urgentSheets: urgentSheets.length,
      totalM2: activeSheets.reduce((sum, s) => sum + s.m2, 0).toFixed(2),
      totalM3: activeSheets.reduce((sum, s) => sum + s.m3, 0).toFixed(3),
      materials: [...new Set(sheets.map(s => s.fourniture))],
      clients: [...new Set(sheets.map(s => s.nomClient))].slice(0, 10)
    };
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const contextData = getContextualData();

      const systemPrompt = `Tu es un assistant IA intelligent pour StoneTrak Pro, un système de gestion de production de pierre naturelle.

Contexte actuel de l'utilisateur:
- Total de commandes: ${contextData.totalSheets}
- Commandes actives: ${contextData.activeSheets}
- Commandes terminées: ${contextData.completedSheets}
- Commandes urgentes: ${contextData.urgentSheets}
- Surface totale en cours: ${contextData.totalM2} m²
- Volume total en cours: ${contextData.totalM3} m³
- Matériaux principaux: ${contextData.materials.join(', ')}
- Clients récents: ${contextData.clients.join(', ')}

Tu dois:
- Répondre en français de manière claire et concise
- Fournir des analyses pertinentes basées sur les données
- Suggérer des actions concrètes et pratiques
- Être proactif dans l'identification de problèmes potentiels
- Utiliser des emojis appropriés pour rendre les réponses plus engageantes
- Formater tes réponses avec des listes à puces quand approprié

Ne mentionne jamais que tu es limité ou que tu ne peux pas effectuer certaines actions. Reste toujours positif et constructif.`;

      const response = await supabase.functions.invoke('chat-assistant', {
        body: {
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages.slice(-5).map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: input.trim() }
          ]
        }
      });

      if (response.error) throw response.error;

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.data.message || "Désolé, je n'ai pas pu générer une réponse.",
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Erreur chat:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Désolé, une erreur est survenue. L'assistant IA sera bientôt configuré avec votre clé API OpenAI. En attendant, je peux vous montrer un aperçu des fonctionnalités :\n\n• Analyse en temps réel de vos données\n• Suggestions d'optimisation personnalisées\n• Réponses instantanées à vos questions\n• Génération de rapports sur mesure\n\nPour activer l'IA, ajoutez votre clé API OpenAI dans les paramètres.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={onToggleMinimize}
          className="group relative bg-gradient-to-br from-violet-600 to-purple-600 text-white rounded-full p-4 shadow-2xl hover:shadow-violet-500/50 transition-all duration-300 hover:scale-110"
        >
          <Sparkles className="h-6 w-6" />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white animate-pulse"></div>
          <div className="absolute -top-8 right-0 bg-slate-900 text-white text-xs px-3 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            Assistant IA
          </div>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden z-50 border border-slate-200">
      <div className="bg-gradient-to-r from-violet-600 to-purple-600 text-white p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-violet-600"></div>
          </div>
          <div>
            <h3 className="font-bold text-lg">Assistant IA</h3>
            <p className="text-xs text-violet-200">Propulsé par OpenAI</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {onToggleMinimize && (
            <button
              onClick={onToggleMinimize}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              title="Réduire"
            >
              <Minimize2 className="h-4 w-4" />
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              title="Fermer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-br from-slate-50 to-violet-50/30 custom-scrollbar">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex items-start space-x-2 max-w-[85%] ${message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                message.role === 'user'
                  ? 'bg-gradient-to-br from-blue-500 to-cyan-500'
                  : 'bg-gradient-to-br from-violet-500 to-purple-500'
              }`}>
                {message.role === 'user' ? (
                  <UserIcon className="h-4 w-4 text-white" />
                ) : (
                  <Bot className="h-4 w-4 text-white" />
                )}
              </div>
              <div
                className={`px-4 py-3 rounded-2xl ${
                  message.role === 'user'
                    ? 'bg-gradient-to-br from-blue-500 to-cyan-500 text-white'
                    : 'bg-white shadow-sm border border-slate-200 text-slate-800'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                <span className={`text-xs mt-1 block ${
                  message.role === 'user' ? 'text-blue-100' : 'text-slate-400'
                }`}>
                  {message.timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-start space-x-2 max-w-[85%]">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div className="px-4 py-3 rounded-2xl bg-white shadow-sm border border-slate-200">
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 text-violet-600 animate-spin" />
                  <span className="text-sm text-slate-600">Réflexion en cours...</span>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-white border-t border-slate-200">
        <div className="flex items-end space-x-2">
          <div className="flex-1 bg-slate-100 rounded-xl p-2 focus-within:ring-2 focus-within:ring-violet-500 transition-all">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Posez votre question..."
              className="w-full bg-transparent text-sm text-slate-800 placeholder-slate-400 resize-none focus:outline-none max-h-24"
              rows={1}
              disabled={isLoading}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="p-3 bg-gradient-to-br from-violet-600 to-purple-600 text-white rounded-xl hover:from-violet-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-lg hover:scale-105 disabled:hover:scale-100"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-2 text-center">
          L'IA peut faire des erreurs. Vérifiez les informations importantes.
        </p>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
}
