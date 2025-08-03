/**
 * Utilit�rios para gerenciar dados do onboarding no localStorage
 */

/**
 * Fun��o para carregar dados do onboarding salvos no localStorage
 * @param {string} userEmail - Email do usu�rio
 * @returns {object|null} - Dados do onboarding ou null se n�o existir
 */
export const loadOnboardingData = userEmail => {
  try {
    if (!userEmail) return null;

    const onboardingKey = `onboarding_data_${userEmail}`;
    const savedData = localStorage.getItem(onboardingKey);

    if (savedData) {
      return JSON.parse(savedData);
    }

    return null;
  } catch (error) {
    console.error('Erro ao carregar dados do onboarding:', error);
    return null;
  }
};

/**
 * Fun��o para salvar dados do onboarding no localStorage
 * @param {string} userEmail - Email do usu�rio
 * @param {object} data - Dados do onboarding para salvar
 * @returns {boolean} - True se salvou com sucesso, false caso contr�rio
 */
export const saveOnboardingData = (userEmail, data) => {
  try {
    if (!userEmail || !data) return false;

    const onboardingKey = `onboarding_data_${userEmail}`;
    const dataToSave = {
      ...data,
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem(onboardingKey, JSON.stringify(dataToSave));
    return true;
  } catch (error) {
    console.error('Erro ao salvar dados do onboarding:', error);
    return false;
  }
};

/**
 * Fun��o para verificar se o onboarding foi completado
 * @param {string} userEmail - Email do usu�rio
 * @returns {boolean} - True se foi completado, false caso contr�rio
 */
export const isOnboardingCompleted = userEmail => {
  try {
    if (!userEmail) return false;

    const completedKey = `onboarding_completed_${userEmail}`;
    return localStorage.getItem(completedKey) === 'true';
  } catch (error) {
    console.error('Erro ao verificar status do onboarding:', error);
    return false;
  }
};

/**
 * Fun��o para marcar o onboarding como completado
 * @param {string} userEmail - Email do usu�rio
 * @returns {boolean} - True se marcou com sucesso, false caso contr�rio
 */
export const markOnboardingCompleted = userEmail => {
  try {
    if (!userEmail) return false;

    const completedKey = `onboarding_completed_${userEmail}`;
    localStorage.setItem(completedKey, 'true');
    return true;
  } catch (error) {
    console.error('Erro ao marcar onboarding como completado:', error);
    return false;
  }
};

/**
 * Fun��o para limpar dados do onboarding
 * @param {string} userEmail - Email do usu�rio
 */
export const clearOnboardingData = userEmail => {
  try {
    if (!userEmail) return;

    const onboardingKey = `onboarding_data_${userEmail}`;
    const completedKey = `onboarding_completed_${userEmail}`;

    localStorage.removeItem(onboardingKey);
    localStorage.removeItem(completedKey);
  } catch (error) {
    console.error('Erro ao limpar dados do onboarding:', error);
  }
};
