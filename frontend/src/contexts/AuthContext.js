import React, { createContext, useContext, useState, useEffect } from 'react';

import OnboardingModal from '../components/OnboardingModal';
import { apiService } from '../services/api';
import { storage } from '../utils/storage';
import {
  isOnboardingCompleted,
  saveOnboardingData,
  markOnboardingCompleted,
  loadOnboardingData,
} from '../utils/onboardingStorage';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(storage.getUser());
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(storage.getToken());
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Verificar token ao carregar a aplicação
  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          const userData = await apiService.getCurrentUser();

          // Carregar dados do onboarding se existirem
          if (userData?.email) {
            const onboardingData = loadOnboardingData(userData.email);
            if (onboardingData) {
              userData.nickname = onboardingData.nickname || userData.nickname;
              userData.gender = onboardingData.gender || userData.gender;
              userData.profileImage =
                onboardingData.profileImage || userData.profileImage;
              userData.onboardingCompleted = true;
              console.log(
                'DEBUG: Dados do onboarding carregados:',
                onboardingData
              );
            }
          }

          setUser(userData);
          storage.setUser(userData);

          // IMPORTANTE: Verificar onboarding aqui também para usuários já logados
          console.log(
            'DEBUG: Usuário já logado detectado, verificando onboarding...'
          );
          checkOnboardingStatus(userData);
        } catch (error) {
          console.error('Token inválido:', error);
          logout();
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, [token]);

  const loginWithGoogle = async googleToken => {
    try {
      setLoading(true);
      console.log('Iniciando login com Google...');

      const response = await apiService.loginWithGoogle(googleToken);
      const { access_token, user: userData } = response;

      if (!access_token || !userData) {
        throw new Error('Resposta inválida do servidor');
      }

      // Salvar dados
      storage.setToken(access_token);
      storage.setUser(userData);
      setToken(access_token);
      setUser(userData);

      // Verificar se precisa fazer onboarding
      checkOnboardingStatus(userData);

      console.log('Usuario logado com sucesso:', userData.name);

      return { success: true, user: userData };
    } catch (error) {
      console.error('Erro no login:', error);

      let errorMessage = 'Erro no login';

      if (error.code === 'ECONNABORTED') {
        errorMessage =
          'Login demorou muito. Verifique sua conexão e tente novamente.';
      } else if (error.response?.status === 504) {
        errorMessage = 'Servidor demorou para responder. Tente novamente.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Token do Google inválido. Tente fazer login novamente.';
      } else if (error.response?.status === 500) {
        errorMessage =
          'Erro interno do servidor. Tente novamente em alguns segundos.';
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.message) {
        errorMessage = error.message;
      }

      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setTimeout(() => setLoading(false), 100);
    }
  };

  const logout = () => {
    const userEmail = user?.email;
    storage.removeToken();
    storage.removeUser();
    setToken(null);
    setUser(null);
    setShowOnboarding(false);

    // Manter o status de onboarding se já foi completado
    if (userEmail && isOnboardingCompleted(userEmail)) {
      console.log(`DEBUG: Mantendo status de onboarding para ${userEmail}`);
    } else if (userEmail) {
      // Limpar apenas se não foi completado
      localStorage.removeItem(`onboarding_completed_${userEmail}`);
      localStorage.removeItem(`onboarding_data_${userEmail}`);
    }

    // Logout do Google (Google Identity Services)
    if (window.google && window.google.accounts) {
      window.google.accounts.id.disableAutoSelect();
    }
  };

  const refreshToken = async () => {
    try {
      const response = await apiService.refreshToken();
      const { access_token, user: userData } = response;

      storage.setToken(access_token);
      storage.setUser(userData);
      setToken(access_token);
      setUser(userData);

      return true;
    } catch (error) {
      console.error('Erro ao renovar token:', error);
      logout();
      return false;
    }
  };

  const updateUserProfile = async () => {
    try {
      const userData = await apiService.getCurrentUser();

      // Carregar dados do onboarding se existirem
      if (userData?.email) {
        const onboardingData = loadOnboardingData(userData.email);
        if (onboardingData) {
          userData.nickname = onboardingData.nickname || userData.nickname;
          userData.gender = onboardingData.gender || userData.gender;
          userData.profileImage =
            onboardingData.profileImage || userData.profileImage;
          userData.onboardingCompleted = true;
        }
      }

      storage.setUser(userData);
      setUser(userData);
      return userData;
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      return null;
    }
  };

  // Verificar se o usuário precisa fazer onboarding
  const checkOnboardingStatus = userData => {
    if (!userData?.email) {
      console.log('DEBUG Onboarding: Nenhum email de usuário fornecido');
      return;
    }

    console.log('DEBUG Onboarding: Verificando status para:', userData.email);
    const completed = isOnboardingCompleted(userData.email);
    console.log('DEBUG Onboarding: Status completado:', completed);

    // Se não completou onboarding, mostrar onboarding
    if (!completed) {
      console.log('DEBUG Onboarding: Mostrando onboarding modal');
      // Adicionar um pequeno delay para evitar conflitos de estado
      setTimeout(() => {
        setShowOnboarding(true);
        console.log('DEBUG Onboarding: showOnboarding definido como true');
      }, 100);
    } else {
      console.log(
        'DEBUG Onboarding: Onboarding já completado, não mostrando modal'
      );
      setShowOnboarding(false);
    }
  };

  // Completar onboarding
  const completeOnboarding = async formData => {
    if (!user?.email) return;

    try {
      console.log('DEBUG: Completando onboarding com dados:', formData);

      // Salvar dados do onboarding usando função utilitária
      const dataToSave = {
        ...formData,
        completedAt: new Date().toISOString(),
      };

      const saved = saveOnboardingData(user.email, dataToSave);

      if (saved) {
        markOnboardingCompleted(user.email);

        // Atualizar o objeto user com os dados do onboarding
        const updatedUser = {
          ...user,
          name: formData.name || user.name,
          nickname: formData.nickname,
          gender: formData.gender,
          profileImage: formData.profileImage,
          onboardingCompleted: true,
        };

        // Atualizar estado e storage
        setUser(updatedUser);
        storage.setUser(updatedUser);

        // Fechar modal de onboarding
        setShowOnboarding(false);

        console.log('Onboarding completado e perfil atualizado:', updatedUser);

        // Forçar re-render dos componentes que dependem do user
        window.dispatchEvent(
          new CustomEvent('userProfileUpdated', { detail: updatedUser })
        );

        // Tentar sincronizar com o backend
        try {
          await apiService.updateUserProfile({
            name: formData.name,
            nickname: formData.nickname,
            gender: formData.gender,
            profileImage: formData.profileImage,
          });
          console.log('Dados sincronizados com o backend');
        } catch (backendError) {
          console.warn(
            'Erro ao sincronizar com backend, mas dados salvos localmente:',
            backendError
          );
        }
      }
    } catch (error) {
      console.error('Erro ao completar onboarding:', error);
    }
  };

  // Pular onboarding
  const skipOnboarding = () => {
    if (!user?.email) return;

    // Marcar como completado mesmo sem dados
    markOnboardingCompleted(user.email);
    setShowOnboarding(false);

    console.log('Onboarding pulado');
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user,
    loginWithGoogle,
    logout,
    refreshToken,
    updateUserProfile,
    showOnboarding,
    completeOnboarding,
    skipOnboarding,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}

      {/* Onboarding Modal */}
      <OnboardingModal
        isOpen={showOnboarding}
        onClose={skipOnboarding}
        onComplete={completeOnboarding}
      />
    </AuthContext.Provider>
  );
};
