/**
 * AutoUpdateManager - Gerenciador de Atualização Automática do PWA
 * 
 * COMO USAR:
 * 1. Cole este arquivo em: components/AutoUpdateManager.tsx
 * 2. Importe no App.tsx: import { AutoUpdateManager } from './components/AutoUpdateManager';
 * 3. Adicione no App.tsx: <AutoUpdateManager />
 * 4. A CADA DEPLOY: Mude a constante APP_VERSION abaixo
 * 
 * O que faz:
 * - Detecta automaticamente quando há nova versão
 * - Mostra notificação ao usuário
 * - Força refresh após 5 segundos
 * - Limpa cache automaticamente
 * 
 * @version 1.0.0
 */

import React, { useEffect, useState } from 'react';
import { RefreshCw, X } from 'lucide-react';

// ========================================
// ⚠️ MUDE ISSO A CADA DEPLOY! ⚠️
// ========================================
const APP_VERSION = '2.9.1';  // ← INCREMENTE A CADA DEPLOY (ex: 2.9.1 → 2.9.2)
// ========================================

const STORAGE_KEY = 'prosperus-app-version';
const DISMISSED_KEY = 'update-banner-dismissed';

export const AutoUpdateManager: React.FC = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    checkForUpdates();
    setupServiceWorkerListener();
  }, []);

  // Countdown timer
  useEffect(() => {
    if (showBanner && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (showBanner && countdown === 0) {
      handleUpdate();
    }
  }, [showBanner, countdown]);

  const checkForUpdates = () => {
    const storedVersion = localStorage.getItem(STORAGE_KEY);
    const wasDismissed = sessionStorage.getItem(DISMISSED_KEY);

    console.log('🔍 Verificando versão do app...');
    console.log(`   Versão armazenada: ${storedVersion}`);
    console.log(`   Versão atual: ${APP_VERSION}`);

    // Se versão mudou E não foi dismissed nesta sessão
    if (storedVersion && storedVersion !== APP_VERSION && !wasDismissed) {
      console.log('✨ Nova versão detectada! Mostrando banner...');
      setShowBanner(true);
    } else if (!storedVersion) {
      // Primeira vez rodando o app, salva versão
      localStorage.setItem(STORAGE_KEY, APP_VERSION);
      console.log('📝 Primeira execução - versão salva');
    } else {
      console.log('✅ App está atualizado');
    }
  };

  const setupServiceWorkerListener = () => {
    if (!('serviceWorker' in navigator)) return;

    // Verifica updates periodicamente (a cada 5 minutos)
    setInterval(() => {
      navigator.serviceWorker.ready.then((registration) => {
        registration.update();
      });
    }, 5 * 60 * 1000);

    // Listener para novo service worker
    navigator.serviceWorker.ready.then((registration) => {
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('🔄 Novo Service Worker detectado!');
              setShowBanner(true);
            }
          });
        }
      });
    });

    // Auto-reload quando novo SW assume controle
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        console.log('🔄 Service Worker atualizado - recarregando...');
        refreshing = true;
        window.location.reload();
      }
    });
  };

  const handleUpdate = async () => {
    setIsUpdating(true);
    console.log('🚀 Iniciando atualização...');

    try {
      // 1. Limpa todos os caches
      if ('caches' in window) {
        console.log('🧹 Limpando caches...');
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => {
          console.log(`   - Removendo cache: ${name}`);
          return caches.delete(name);
        }));
        console.log('✅ Caches limpos');
      }

      // 2. Atualiza Service Worker
      if ('serviceWorker' in navigator) {
        console.log('🔄 Atualizando Service Worker...');
        const registration = await navigator.serviceWorker.ready;
        await registration.update();
        console.log('✅ Service Worker atualizado');
      }

      // 3. Salva nova versão
      localStorage.setItem(STORAGE_KEY, APP_VERSION);
      console.log(`✅ Versão ${APP_VERSION} salva`);

      // 4. Recarrega página
      console.log('🔄 Recarregando página...');
      setTimeout(() => {
        window.location.reload();
      }, 500);

    } catch (error) {
      console.error('❌ Erro ao atualizar:', error);
      // Tenta reload simples em caso de erro
      window.location.reload();
    }
  };

  const handleDismiss = () => {
    // Salva que foi dismissed (válido apenas nesta sessão)
    sessionStorage.setItem(DISMISSED_KEY, 'true');
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-[999] backdrop-blur-sm animate-in fade-in" />

      {/* Modal de Atualização */}
      <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-in slide-in-from-bottom-4 fade-in">
          
          {/* Header */}
          <div className="p-6 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" style={{ animationDuration: '2s' }} />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Nova Versão Disponível! 🎉
            </h2>
            
            <p className="text-gray-600">
              Estamos atualizando o app com melhorias e correções.
            </p>
          </div>

          {/* Progress */}
          <div className="px-6 pb-6">
            <div className="bg-gray-100 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  {isUpdating ? 'Atualizando...' : `Atualização em ${countdown}s`}
                </span>
                <span className="text-sm text-gray-500">
                  v{APP_VERSION}
                </span>
              </div>
              
              {/* Progress bar */}
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-600 transition-all duration-1000 ease-linear"
                  style={{ 
                    width: `${isUpdating ? 100 : ((5 - countdown) / 5) * 100}%` 
                  }}
                />
              </div>
            </div>

            {/* Botões */}
            <div className="flex gap-3">
              <button
                onClick={handleDismiss}
                disabled={isUpdating}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Depois
              </button>
              
              <button
                onClick={handleUpdate}
                disabled={isUpdating}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {isUpdating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Atualizando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    Atualizar Agora
                  </>
                )}
              </button>
            </div>

            {/* Info adicional */}
            <p className="text-xs text-center text-gray-500 mt-4">
              Seus dados estão seguros e não serão perdidos
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default AutoUpdateManager;
