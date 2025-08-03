import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SmartIcon } from '../ModernIcons';

const AnalyticsCTA = ({ className = "" }) => {
  const navigate = useNavigate();

  const handleUpgrade = () => {
    navigate('/planos');
  };

  const handleTryAnalytics = () => {
    navigate('/analytics');
  };

  return (
    <div className={`bg-gradient-to-br from-pastel-purple-50 to-pastel-blue-50 dark:from-gray-800 dark:to-gray-700 rounded-2xl p-6 border border-pastel-purple-200 dark:border-gray-600 ${className}`}>
      {/* Header com ícone */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-gradient-to-r from-pastel-purple-500 to-pastel-blue-500 rounded-xl flex items-center justify-center">
          <SmartIcon type="bar-chart" size={24} className="text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            Quer mais dados?
            <span className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white text-xs px-2 py-1 rounded-full font-medium">
              PRO
            </span>
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Desbloqueie insights avançados sobre sua escrita
          </p>
        </div>
      </div>

      {/* Benefícios em grid */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-sm text-gray-700 dark:text-gray-300">Gráficos detalhados</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-sm text-gray-700 dark:text-gray-300">Comparação temporal</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-sm text-gray-700 dark:text-gray-300">Relatórios PDF</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-sm text-gray-700 dark:text-gray-300">Insights de IA</span>
        </div>
      </div>

      {/* Preview visual */}
      <div className="bg-white dark:bg-gray-600 rounded-lg p-3 mb-4 relative overflow-hidden">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs font-medium text-gray-500 dark:text-gray-400">Analytics Preview</div>
          <div className="text-xs text-pastel-purple-600 dark:text-pastel-purple-400">📊 +5 gráficos</div>
        </div>
        
        {/* Mini chart simulation */}
        <div className="flex items-end gap-1 h-8">
          <div className="w-2 bg-pastel-purple-300 rounded-t" style={{height: '60%'}}></div>
          <div className="w-2 bg-pastel-blue-400 rounded-t" style={{height: '80%'}}></div>
          <div className="w-2 bg-pastel-purple-500 rounded-t" style={{height: '100%'}}></div>
          <div className="w-2 bg-pastel-blue-300 rounded-t" style={{height: '70%'}}></div>
          <div className="w-2 bg-pastel-purple-400 rounded-t" style={{height: '90%'}}></div>
        </div>
        
        {/* Blur overlay */}
        <div className="absolute inset-0 bg-white/60 dark:bg-gray-600/60 backdrop-blur-sm flex items-center justify-center">
          <div className="text-xs font-medium text-gray-600 dark:text-gray-300 flex items-center gap-1">
            <SmartIcon type="lock" size={12} />
            Premium
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleTryAnalytics}
          className="flex-1 bg-gradient-to-r from-pastel-purple-500 to-pastel-blue-500 text-white py-2 px-4 rounded-lg font-medium text-sm hover:from-pastel-purple-600 hover:to-pastel-blue-600 transition-all duration-200 flex items-center justify-center gap-2"
        >
          <SmartIcon type="eye" size={16} />
          Ver Analytics
        </button>
        <button
          onClick={handleUpgrade}
          className="flex-1 border-2 border-pastel-purple-300 dark:border-gray-500 text-pastel-purple-600 dark:text-gray-300 py-2 px-4 rounded-lg font-medium text-sm hover:bg-pastel-purple-50 dark:hover:bg-gray-600 transition-all duration-200 flex items-center justify-center gap-2"
        >
          <SmartIcon type="star" size={16} />
          Upgrade
        </button>
      </div>

      {/* Small print */}
      <div className="mt-3 text-center">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          💡 A partir de R$ 10/mês • Cancele quando quiser
        </p>
      </div>
    </div>
  );
};

export default AnalyticsCTA;