import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { SmartIcon } from './ModernIcons';
import ProfileImageSelector from './ProfileImageSelector';

const OnboardingModal = ({ isOpen, onComplete, onClose }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    gender: '',
    nickname: '',
    profileImage: '',
  });
  const [errors, setErrors] = useState({});
  const [isAnimating, setIsAnimating] = useState(false);
  const [showImageSelector, setShowImageSelector] = useState(false);

  const totalSteps = 2;

  // Validação dos campos
  const validateStep = step => {
    const newErrors = {};

    if (step === 1) {
      if (!formData.name.trim()) {
        newErrors.name = 'Por favor, digite seu nome';
      }
      if (!formData.gender) {
        newErrors.gender = 'Por favor, selecione seu gênero';
      }
    }

    if (step === 2) {
      if (!formData.nickname.trim()) {
        newErrors.nickname = 'Por favor, digite seu apelido';
      }
      if (!formData.profileImage) {
        newErrors.profileImage = 'Por favor, escolha uma imagem de perfil';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < totalSteps) {
        setIsAnimating(true);
        setTimeout(() => {
          setCurrentStep(currentStep + 1);
          setIsAnimating(false);
        }, 300);
      } else {
        // Finalizar onboarding
        onComplete(formData);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(currentStep - 1);
        setIsAnimating(false);
      }, 300);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpar erro quando o usuário começar a digitar
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const getInputClassName = field => {
    const baseClass =
      'w-full px-4 py-3 rounded-xl font-body text-lg transition-all duration-300 ease-out backdrop-blur-sm';
    const hasError = errors[field];
    const hasValue = formData[field];

    if (hasError) {
      return `${baseClass} bg-red-50/80 dark:bg-red-900/20 border-2 border-red-400 dark:border-red-500 text-red-700 dark:text-red-300 placeholder-red-400 dark:placeholder-red-400`;
    } else if (hasValue) {
      return `${baseClass} bg-green-50/80 dark:bg-green-900/20 border-2 border-green-400 dark:border-green-500 text-green-700 dark:text-green-300 placeholder-green-400 dark:placeholder-green-400`;
    } else {
      return `${baseClass} bg-white/60 dark:bg-dark-bg-glass/60 border-2 border-pastel-purple-200/50 dark:border-dark-border-primary text-soft-gray-900 dark:text-dark-text-primary placeholder-soft-gray-400 dark:placeholder-dark-text-muted focus:border-pastel-purple-400 dark:focus:border-dark-accent-purple`;
    }
  };

  const getButtonClassName = field => {
    const baseClass =
      'p-3 rounded-xl transition-all duration-300 ease-out backdrop-blur-sm border-2';
    const hasError = errors[field];
    const isSelected = formData[field];

    if (hasError) {
      return `${baseClass} bg-red-50/80 dark:bg-red-900/20 border-red-400 dark:border-red-500 hover:bg-red-100/80 dark:hover:bg-red-900/30`;
    } else if (isSelected) {
      return `${baseClass} bg-green-50/80 dark:bg-green-900/20 border-green-400 dark:border-green-500 hover:bg-green-100/80 dark:hover:bg-green-900/30`;
    } else {
      return `${baseClass} bg-white/60 dark:bg-dark-bg-glass/60 border-pastel-purple-200/50 dark:border-dark-border-primary hover:bg-white/80 dark:hover:bg-dark-bg-glass/80 hover:border-pastel-purple-400 dark:hover:border-dark-accent-purple`;
    }
  };

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className='absolute inset-0 bg-black/50 backdrop-blur-sm'
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className='relative w-full max-w-md bg-white/90 dark:bg-dark-bg-card/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 dark:border-dark-border-secondary overflow-hidden'
      >
        {/* Header */}
        <div className='p-6 text-center border-b border-pastel-purple-200/30 dark:border-dark-border-primary'>
          <div className='flex items-center justify-between mb-4'>
            <h2 className='text-2xl font-display font-bold text-soft-gray-900 dark:text-dark-text-primary'>
              Bem-vindo ao Scribo!
            </h2>
            <button
              onClick={onClose}
              className='p-2 rounded-xl bg-white/60 dark:bg-dark-bg-glass/60 hover:bg-white/80 dark:hover:bg-dark-bg-glass/80 transition-all duration-200'
            >
              <SmartIcon type='x' size={20} color='#6b7280' />
            </button>
          </div>

          {/* Progress Bar */}
          <div className='flex items-center justify-center space-x-2 mb-2'>
            {Array.from({ length: totalSteps }, (_, i) => (
              <div
                key={i}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i + 1 <= currentStep
                    ? 'w-8 bg-pastel-purple-500 dark:bg-dark-accent-purple'
                    : 'w-2 bg-pastel-purple-200 dark:bg-dark-border-primary'
                }`}
              />
            ))}
          </div>
          <p className='text-sm text-soft-gray-600 dark:text-dark-text-secondary'>
            Etapa {currentStep} de {totalSteps}
          </p>
        </div>

        {/* Content */}
        <div className='p-6'>
          <AnimatePresence mode='wait'>
            {currentStep === 1 && (
              <motion.div
                key='step1'
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className='space-y-6'
              >
                <div className='text-center mb-6'>
                  <h3 className='text-xl font-display font-bold text-soft-gray-900 dark:text-dark-text-primary mb-2'>
                    Vamos nos conhecer!
                  </h3>
                  <p className='text-soft-gray-600 dark:text-dark-text-secondary'>
                    Conte-nos um pouco sobre você
                  </p>
                </div>

                {/* Nome */}
                <div className='space-y-2'>
                  <label className='block text-sm font-semibold text-soft-gray-700 dark:text-dark-text-secondary'>
                    Qual é o seu nome?
                  </label>
                  <input
                    type='text'
                    value={formData.name}
                    onChange={e => handleInputChange('name', e.target.value)}
                    placeholder='Digite seu nome completo'
                    className={getInputClassName('name')}
                  />
                  {errors.name && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className='text-sm text-red-500 dark:text-red-400 flex items-center gap-2'
                    >
                      <SmartIcon type='alert-circle' size={16} />
                      {errors.name}
                    </motion.p>
                  )}
                </div>

                {/* Gênero */}
                <div className='space-y-3'>
                  <label className='block text-sm font-semibold text-soft-gray-700 dark:text-dark-text-secondary'>
                    Gênero
                  </label>
                  <div className='flex gap-6 justify-center'>
                    {/* Feminino */}
                    <div className='relative group'>
                      <button
                        type='button'
                        onClick={() => handleInputChange('gender', 'female')}
                        className={`relative flex flex-col items-center justify-center min-h-[80px] min-w-[80px] p-4 rounded-xl transition-all duration-300 ease-out backdrop-blur-sm border-2 ${
                          formData.gender === 'female'
                            ? 'bg-green-50/80 dark:bg-green-900/20 border-green-400 dark:border-green-500'
                            : 'bg-white/60 dark:bg-dark-bg-glass/60 border-pastel-purple-200/50 dark:border-dark-border-primary hover:bg-white/80 dark:hover:bg-dark-bg-glass/80 hover:border-pastel-purple-400 dark:hover:border-dark-accent-purple'
                        }`}
                      >
                        <span
                          className='text-4xl font-bold'
                          style={{
                            color:
                              formData.gender === 'female'
                                ? '#10b981'
                                : '#ec4899',
                          }}
                        >
                          ♀
                        </span>
                      </button>

                      {/* Tooltip */}
                      <div className='absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-all duration-200 ease-out pointer-events-none z-10'>
                        <div className='bg-soft-gray-900 dark:bg-dark-bg-card text-white dark:text-dark-text-primary text-xs font-medium px-3 py-2 rounded-lg shadow-lg whitespace-nowrap'>
                          Feminino
                          <div className='absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-soft-gray-900 dark:border-t-dark-bg-card'></div>
                        </div>
                      </div>
                    </div>

                    {/* Masculino */}
                    <div className='relative group'>
                      <button
                        type='button'
                        onClick={() => handleInputChange('gender', 'male')}
                        className={`relative flex flex-col items-center justify-center min-h-[80px] min-w-[80px] p-4 rounded-xl transition-all duration-300 ease-out backdrop-blur-sm border-2 ${
                          formData.gender === 'male'
                            ? 'bg-green-50/80 dark:bg-green-900/20 border-green-400 dark:border-green-500'
                            : 'bg-white/60 dark:bg-dark-bg-glass/60 border-pastel-purple-200/50 dark:border-dark-border-primary hover:bg-white/80 dark:hover:bg-dark-bg-glass/80 hover:border-pastel-purple-400 dark:hover:border-dark-accent-purple'
                        }`}
                      >
                        <span
                          className='text-4xl font-bold'
                          style={{
                            color:
                              formData.gender === 'male'
                                ? '#10b981'
                                : '#3b82f6',
                          }}
                        >
                          ♂
                        </span>
                      </button>

                      {/* Tooltip */}
                      <div className='absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-all duration-200 ease-out pointer-events-none z-10'>
                        <div className='bg-soft-gray-900 dark:bg-dark-bg-card text-white dark:text-dark-text-primary text-xs font-medium px-3 py-2 rounded-lg shadow-lg whitespace-nowrap'>
                          Masculino
                          <div className='absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-soft-gray-900 dark:border-t-dark-bg-card'></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  {errors.gender && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className='text-sm text-red-500 dark:text-red-400 flex items-center gap-2 justify-center'
                    >
                      <SmartIcon type='alert-circle' size={16} />
                      {errors.gender}
                    </motion.p>
                  )}
                </div>
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div
                key='step2'
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className='space-y-6'
              >
                <div className='text-center mb-6'>
                  <h3 className='text-xl font-display font-bold text-soft-gray-900 dark:text-dark-text-primary mb-2'>
                    Quase lá, {formData.name.split(' ')[0]}!
                  </h3>
                  <p className='text-soft-gray-600 dark:text-dark-text-secondary'>
                    Agora vamos personalizar seu perfil
                  </p>
                </div>

                {/* Apelido */}
                <div className='space-y-2'>
                  <label className='block text-sm font-semibold text-soft-gray-700 dark:text-dark-text-secondary'>
                    Como gostaria de ser chamado(a)?
                  </label>
                  <input
                    type='text'
                    value={formData.nickname}
                    onChange={e =>
                      handleInputChange('nickname', e.target.value)
                    }
                    placeholder='Digite seu apelido'
                    className={getInputClassName('nickname')}
                  />
                  {errors.nickname && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className='text-sm text-red-500 dark:text-red-400 flex items-center gap-2'
                    >
                      <SmartIcon type='alert-circle' size={16} />
                      {errors.nickname}
                    </motion.p>
                  )}
                </div>

                {/* Imagem de Perfil */}
                <div className='space-y-3'>
                  <label className='block text-sm font-semibold text-soft-gray-700 dark:text-dark-text-secondary'>
                    Escolha sua imagem de perfil
                  </label>
                  <div className='flex justify-center'>
                    <div className='relative group'>
                      <button
                        type='button'
                        onClick={() => {
                          if (!formData.gender) {
                            setErrors(prev => ({
                              ...prev,
                              gender: 'Selecione seu gênero primeiro',
                            }));
                            return;
                          }
                          setShowImageSelector(true);
                        }}
                        className={`${getButtonClassName('profileImage')} min-h-[100px] min-w-[100px] flex flex-col items-center justify-center gap-3 relative overflow-hidden`}
                      >
                        {formData.profileImage ? (
                          // Mostrar imagem selecionada
                          <>
                            <div className='w-16 h-16 rounded-xl overflow-hidden bg-white shadow-md p-1'>
                              <img
                                src={`/avatars/${formData.gender}/avatar_${formData.profileImage.split('_')[1]}.png`}
                                alt='Avatar selecionado'
                                className='w-full h-full object-contain rounded-lg'
                                onError={e => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                              <div
                                className='w-full h-full bg-gradient-to-br from-pastel-purple-100 to-pastel-blue-100 rounded-lg flex items-center justify-center'
                                style={{ display: 'none' }}
                              >
                                <SmartIcon
                                  type='user'
                                  size={24}
                                  color='#8b5cf6'
                                />
                              </div>
                            </div>
                            <div className='text-xs font-semibold text-soft-gray-600 dark:text-dark-text-secondary text-center'>
                              Clique para alterar
                            </div>
                          </>
                        ) : (
                          // Mostrar ícone padrão
                          <>
                            <SmartIcon type='image' size={36} color='#8b5cf6' />
                            <div className='text-xs font-semibold text-soft-gray-600 dark:text-dark-text-secondary text-center'>
                              Selecionar imagem
                            </div>
                          </>
                        )}

                        {/* Indicador de seleção */}
                        {formData.profileImage && (
                          <div className='absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg'>
                            <SmartIcon type='check' size={16} color='white' />
                          </div>
                        )}
                      </button>

                      {/* Tooltip */}
                      <div className='absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-all duration-200 ease-out pointer-events-none z-10'>
                        <div className='bg-soft-gray-900 dark:bg-dark-bg-card text-white dark:text-dark-text-primary text-xs font-medium px-3 py-2 rounded-lg shadow-lg whitespace-nowrap'>
                          Clique para escolher seu avatar
                          <div className='absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-soft-gray-900 dark:border-t-dark-bg-card'></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  {errors.profileImage && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className='text-sm text-red-500 dark:text-red-400 flex items-center gap-2 justify-center'
                    >
                      <SmartIcon type='alert-circle' size={16} />
                      {errors.profileImage}
                    </motion.p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className='p-6 border-t border-pastel-purple-200/30 dark:border-dark-border-primary'>
          <div className='flex gap-3'>
            {currentStep > 1 && (
              <button
                onClick={handleBack}
                disabled={isAnimating}
                className='flex-1 px-4 py-3 rounded-xl font-semibold bg-white/60 dark:bg-dark-bg-glass/60 text-soft-gray-700 dark:text-dark-text-secondary border-2 border-pastel-purple-200/50 dark:border-dark-border-primary hover:bg-white/80 dark:hover:bg-dark-bg-glass/80 transition-all duration-200 disabled:opacity-50'
              >
                <SmartIcon
                  type='arrow-left'
                  size={20}
                  className='inline mr-2'
                />
                Voltar
              </button>
            )}

            <button
              onClick={handleNext}
              disabled={isAnimating}
              className='flex-1 px-4 py-3 rounded-xl font-semibold bg-button-gradient dark:bg-button-gradient-dark text-white shadow-pastel dark:shadow-dark-soft hover:shadow-pastel-lg dark:hover:shadow-dark-soft-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50'
            >
              {currentStep === totalSteps ? (
                <>
                  <SmartIcon type='check' size={20} className='inline mr-2' />
                  Finalizar
                </>
              ) : (
                <>
                  Próximo
                  <SmartIcon
                    type='arrow-right'
                    size={20}
                    className='inline ml-2'
                  />
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Profile Image Selector */}
      <ProfileImageSelector
        isOpen={showImageSelector}
        selectedImage={formData.profileImage}
        gender={formData.gender}
        onSelect={imageId => {
          handleInputChange('profileImage', imageId);
          setShowImageSelector(false);
        }}
        onClose={() => setShowImageSelector(false)}
      />
    </div>
  );
};

export default OnboardingModal;
