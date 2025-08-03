import { useState, useEffect } from 'react';

export const useOnboarding = user => {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isFirstTime, setIsFirstTime] = useState(false);

  useEffect(() => {
    if (user) {
      console.log('DEBUG Onboarding: Usuário detectado:', user.email);

      // Verificar se onboarding foi completado (usando chave específica do usuário)
      const userOnboardingKey = `onboarding_completed_${user.email}`;
      const hasCompletedOnboarding = localStorage.getItem(userOnboardingKey);

      console.log('DEBUG Onboarding: Chave verificada:', userOnboardingKey);
      console.log(
        'DEBUG Onboarding: Status encontrado:',
        hasCompletedOnboarding
      );

      if (!hasCompletedOnboarding || hasCompletedOnboarding !== 'true') {
        console.log('DEBUG Onboarding: Mostrando onboarding');
        setIsFirstTime(true);
        setShowOnboarding(true);
      } else {
        console.log('DEBUG Onboarding: Onboarding já completado');
        setIsFirstTime(false);
        setShowOnboarding(false);
      }
    } else {
      console.log('DEBUG Onboarding: Nenhum usuário logado');
      setIsFirstTime(false);
      setShowOnboarding(false);
    }
  }, [user]);

  const completeOnboarding = async onboardingData => {
    try {
      console.log('DEBUG: Completando onboarding para:', user.email);

      // Salvar dados do onboarding no backend
      const response = await fetch(
        'http://localhost:8000/api/user/onboarding',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({
            name: onboardingData.name,
            nickname: onboardingData.nickname,
            gender: onboardingData.gender,
            profileImage: onboardingData.profileImage,
          }),
        }
      );

      if (response.ok) {
        // Marcar onboarding como completo
        const userOnboardingKey = `onboarding_completed_${user.email}`;
        localStorage.setItem(userOnboardingKey, 'true');
        console.log(
          'DEBUG: Onboarding marcado como completo:',
          userOnboardingKey
        );

        setShowOnboarding(false);
        setIsFirstTime(false);

        // Opcional: Recarregar dados do usuário
        window.location.reload();
      } else {
        console.error('Erro ao salvar dados do onboarding');
      }
    } catch (error) {
      console.error('Erro ao completar onboarding:', error);
    }
  };

  const skipOnboarding = () => {
    if (user) {
      localStorage.setItem(`onboarding_completed_${user.email}`, 'true');
      setShowOnboarding(false);
      setIsFirstTime(false);
    }
  };

  return {
    showOnboarding,
    isFirstTime,
    completeOnboarding,
    skipOnboarding,
    setShowOnboarding,
  };
};

export default useOnboarding;
