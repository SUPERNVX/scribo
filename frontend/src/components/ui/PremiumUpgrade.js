import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SmartIcon } from '../ModernIcons';

const PremiumUpgrade = ({ 
  title = "Recurso Premium", 
  description = "Este recurso está disponível apenas para usuários Premium.",
  feature = "analytics",
  className = ""
}) => {
  const navigate = useNavigate();

  const featureDetails = {
    analytics: {
      icon: "bar-chart",
      title: "Analytics Avançado",
      description: "Acesse relatórios detalhados, gráficos de evolução e insights personalizados sobre sua escrita.",
      benefits: [
        "Gráficos de evolução detalhados",
        "Análise comparativa entre redações",
        "Relatórios de desempenho por competência",
        "Exportação de dados em PDF",
        "Insights personalizados de IA"
      ]
    },
    reports: {
      icon: "file-text",
      title: "Relatórios Avançados",
      description: "Gere relatórios completos sobre seu progresso e desempenho.",
      benefits: [
        "Relatórios mensais automáticos",
        "Análise de tendências",
        "Comparação com outros usuários",
        "Sugestões personalizadas"
      ]
    },
    comparison: {
      icon: "git-compare",
      title: "Comparação de Redações",
      description: "Compare suas redações e veja sua evolução ao longo do tempo.",
      benefits: [
        "Comparação lado a lado",
        "Análise de melhoria",
        "Histórico completo",
        "Métricas detalhadas"
      ]
    }
  };

  const currentFeature = featureDetails[feature] || featureDetails.analytics;

  const handleUpgrade = () => {
    navigate('/planos');
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-pastel-purple-50 via-white to-pastel-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4 ${className}`}>
      <div className="max-w-2xl w-full">
        {/* Main Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
          {/* Header with Gradient */}
          <div className="bg-gradient-to-r from-pastel-purple-500 to-pastel-blue-500 p-8 text-center">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <SmartIcon type={currentFeature.icon} size={40} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              {currentFeature.title}
            </h1>
            <p className="text-white/90 text-lg">
              {currentFeature.description}
            </p>
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Premium Badge */}
            <div className="flex items-center justify-center mb-6">
              <span className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2">
                <span>⭐</span>
                Recurso Premium
              </span>
            </div>

            {/* Benefits List */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 text-center">
                O que você terá acesso:
              </h3>
              <div className="space-y-3">
                {currentFeature.benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-gray-700 dark:text-gray-300">
                      {benefit}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pricing Info */}
            <div className="bg-gradient-to-r from-pastel-purple-50 to-pastel-blue-50 dark:from-gray-700 dark:to-gray-600 rounded-xl p-6 mb-6">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="text-3xl font-bold text-gray-900 dark:text-white">
                    R$ 10
                  </span>
                  <span className="text-gray-600 dark:text-gray-300">/mês</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Cancele a qualquer momento
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleUpgrade}
                className="flex-1 bg-gradient-to-r from-pastel-purple-500 to-pastel-blue-500 text-white py-3 px-6 rounded-lg font-semibold hover:from-pastel-purple-600 hover:to-pastel-blue-600 transition-all duration-200 flex items-center justify-center gap-2"
              >
                <SmartIcon type="star" size={20} />
                Fazer Upgrade
              </button>
              <button
                onClick={() => navigate(-1)}
                className="flex-1 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-3 px-6 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
              >
                Voltar
              </button>
            </div>

            {/* Additional Info */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                💡 Experimente grátis por 7 dias • Sem compromisso
              </p>
            </div>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="mt-6 text-center">
          <div className="flex items-center justify-center gap-6 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <SmartIcon type="shield" size={16} />
              <span>Pagamento Seguro</span>
            </div>
            <div className="flex items-center gap-1">
              <SmartIcon type="clock" size={16} />
              <span>Ativação Imediata</span>
            </div>
            <div className="flex items-center gap-1">
              <SmartIcon type="users" size={16} />
              <span>+1000 usuários</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PremiumUpgrade;