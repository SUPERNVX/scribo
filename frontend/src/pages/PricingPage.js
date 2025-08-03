import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const PricingPage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isAnnual, setIsAnnual] = useState(false);

  const plans = [
    {
      name: 'Gratuito',
      price: 0,
      period: 'para sempre',
      description: 'Perfeito para começar sua jornada de escrita',
      features: [
        { name: 'Análises de Parágrafo', limit: '30/semana', included: true },
        { name: 'Análises Completas', limit: '8/semana', included: true },
        { name: 'Análises Profundas', limit: '3/semana', included: true },
        { name: 'Histórico básico', limit: '30 dias', included: true },
        { name: 'Badges básicas', limit: '', included: true },
        { name: 'Analytics básico', limit: '', included: true },
        { name: 'Analytics avançado', limit: '', included: false },
        { name: 'Relatórios de evolução', limit: '', included: false },
        { name: 'Comparação entre redações', limit: '', included: false },
        { name: 'Badges avançadas', limit: '', included: false },
        { name: 'Suporte prioritário', limit: '', included: false },
      ],
      buttonText: isAuthenticated ? 'Plano Atual' : 'Começar Grátis',
      buttonStyle: 'border-2 border-pastel-purple-300 text-pastel-purple-600 hover:bg-pastel-purple-50',
      popular: false,
    },
    {
      name: 'Premium',
      price: isAnnual ? 8 : 10,
      originalPrice: isAnnual ? 10 : null,
      period: isAnnual ? '/mês (anual)' : '/mês',
      description: 'Para escritores sérios que querem evoluir rapidamente',
      features: [
        { name: 'Análises de Parágrafo', limit: '200/semana', included: true },
        { name: 'Análises Completas', limit: '50/semana', included: true },
        { name: 'Análises Profundas', limit: '20/semana', included: true },
        { name: 'Histórico completo', limit: 'ilimitado', included: true },
        { name: 'Badges básicas', limit: '', included: true },
        { name: 'Analytics básico', limit: '', included: true },
        { name: 'Analytics avançado', limit: '✨ Exclusivo', included: true },
        { name: 'Relatórios de evolução', limit: '', included: true },
        { name: 'Comparação entre redações', limit: '', included: true },
        { name: 'Badges avançadas', limit: '', included: true },
        { name: 'Suporte prioritário', limit: '24h', included: true },
      ],
      buttonText: 'Assinar Premium',
      buttonStyle: 'bg-gradient-to-r from-pastel-purple-500 to-pastel-blue-500 text-white hover:from-pastel-purple-600 hover:to-pastel-blue-600',
      popular: true,
    },
  ];

  const handlePlanSelect = (plan) => {
    if (plan.name === 'Gratuito') {
      if (!isAuthenticated) {
        navigate('/login');
      }
    } else {
      // Implementar lógica de pagamento aqui
      console.log(`Selecionado plano: ${plan.name}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pastel-purple-50 via-white to-pastel-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Escolha seu <span className="bg-gradient-to-r from-pastel-purple-600 to-pastel-blue-600 bg-clip-text text-transparent">Plano</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Desenvolva suas habilidades de escrita com nossa IA avançada. Escolha o plano que melhor se adapta às suas necessidades.
          </p>

          {/* Toggle Anual/Mensal */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <span className={`text-sm font-medium ${!isAnnual ? 'text-pastel-purple-600' : 'text-gray-500'}`}>
              Mensal
            </span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isAnnual ? 'bg-pastel-purple-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isAnnual ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-sm font-medium ${isAnnual ? 'text-pastel-purple-600' : 'text-gray-500'}`}>
              Anual
            </span>
            {isAnnual && (
              <span className="bg-gradient-to-r from-green-500 to-green-600 text-white text-xs px-2 py-1 rounded-full font-medium">
                20% OFF
              </span>
            )}
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={plan.name}
              className={`relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl border-2 transition-all duration-300 hover:shadow-2xl hover:scale-105 ${
                plan.popular 
                  ? 'border-pastel-purple-300 ring-4 ring-pastel-purple-100 dark:ring-pastel-purple-900' 
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-pastel-purple-500 to-pastel-blue-500 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
                    ⭐ Mais Popular
                  </span>
                </div>
              )}

              <div className="p-8">
                {/* Plan Header */}
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    {plan.description}
                  </p>
                  
                  <div className="flex items-center justify-center gap-2 mb-2">
                    {plan.originalPrice && (
                      <span className="text-2xl text-gray-400 line-through">
                        R$ {plan.originalPrice}
                      </span>
                    )}
                    <span className="text-4xl font-bold text-gray-900 dark:text-white">
                      {plan.price === 0 ? 'Grátis' : `R$ ${plan.price}`}
                    </span>
                  </div>
                  <span className="text-gray-600 dark:text-gray-300">
                    {plan.period}
                  </span>
                </div>

                {/* Features List */}
                <div className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-center gap-3">
                      <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
                        feature.included 
                          ? 'bg-green-100 dark:bg-green-900' 
                          : 'bg-gray-100 dark:bg-gray-700'
                      }`}>
                        {feature.included ? (
                          <svg className="w-3 h-3 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <span className={`text-sm ${
                        feature.included 
                          ? 'text-gray-700 dark:text-gray-200' 
                          : 'text-gray-400 dark:text-gray-500'
                      }`}>
                        {feature.name}
                        {feature.limit && (
                          <span className="font-medium text-pastel-purple-600 dark:text-pastel-purple-400 ml-1">
                            ({feature.limit})
                          </span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => handlePlanSelect(plan)}
                  className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-200 ${plan.buttonStyle}`}
                >
                  {plan.buttonText}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-8">
            Perguntas Frequentes
          </h2>
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Como funcionam os limites semanais?
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Os limites são renovados toda segunda-feira. Você pode acompanhar seu uso atual no dashboard.
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Posso cancelar a qualquer momento?
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Sim! Você pode cancelar sua assinatura a qualquer momento. Não há taxas de cancelamento.
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                O que são Análises Profundas?
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                São análises detalhadas que incluem sugestões de melhoria, análise de estrutura, coerência e muito mais.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;