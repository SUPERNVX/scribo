import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { SmartIcon } from './ModernIcons';

const ProfileImageSelector = ({
  isOpen,
  onSelect,
  onClose,
  selectedImage,
  gender,
}) => {
  const [hoveredImage, setHoveredImage] = useState(null);

  // Configuração das imagens por gênero
  const avatarConfig = {
    male: [
      {
        id: 'male_1',
        name: 'Avatar Masculino 1',
        path: '/avatars/male/avatar_1.png',
      },
      {
        id: 'male_2',
        name: 'Avatar Masculino 2',
        path: '/avatars/male/avatar_2.png',
      },
      {
        id: 'male_3',
        name: 'Avatar Masculino 3',
        path: '/avatars/male/avatar_3.png',
      },
      {
        id: 'male_4',
        name: 'Avatar Masculino 4',
        path: '/avatars/male/avatar_4.png',
      },
      {
        id: 'male_5',
        name: 'Avatar Masculino 5',
        path: '/avatars/male/avatar_5.png',
      },
      {
        id: 'male_6',
        name: 'Avatar Masculino 6',
        path: '/avatars/male/avatar_6.png',
      },
      {
        id: 'male_7',
        name: 'Avatar Masculino 7',
        path: '/avatars/male/avatar_7.png',
      },
      {
        id: 'male_8',
        name: 'Avatar Masculino 8',
        path: '/avatars/male/avatar_8.png',
      },
      {
        id: 'male_9',
        name: 'Avatar Masculino 9',
        path: '/avatars/male/avatar_9.png',
      },
    ],
    female: [
      {
        id: 'female_1',
        name: 'Avatar Feminino 1',
        path: '/avatars/female/avatar_1.png',
      },
      {
        id: 'female_2',
        name: 'Avatar Feminino 2',
        path: '/avatars/female/avatar_2.png',
      },
      {
        id: 'female_3',
        name: 'Avatar Feminino 3',
        path: '/avatars/female/avatar_3.png',
      },
      {
        id: 'female_4',
        name: 'Avatar Feminino 4',
        path: '/avatars/female/avatar_4.png',
      },
      {
        id: 'female_5',
        name: 'Avatar Feminino 5',
        path: '/avatars/female/avatar_5.png',
      },
      {
        id: 'female_6',
        name: 'Avatar Feminino 6',
        path: '/avatars/female/avatar_6.png',
      },
    ],
  };

  // Selecionar avatares baseado no gênero
  const profileImages = gender ? avatarConfig[gender] || [] : [];

  const handleImageSelect = image => {
    onSelect(image.id);
    onClose();
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
        className='relative w-[32rem] h-[42rem] bg-white/90 dark:bg-dark-bg-card/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 dark:border-dark-border-secondary overflow-hidden flex flex-col'
      >
        {/* Header */}
        <div className='p-6 text-center border-b border-pastel-purple-200/30 dark:border-dark-border-primary'>
          <div className='flex items-center justify-between mb-4'>
            <h3 className='text-xl font-display font-bold text-soft-gray-900 dark:text-dark-text-primary'>
              Escolha sua imagem de perfil
            </h3>
            <button
              onClick={onClose}
              className='p-2 rounded-xl bg-white/60 dark:bg-dark-bg-glass/60 hover:bg-white/80 dark:hover:bg-dark-bg-glass/80 transition-all duration-200'
            >
              <SmartIcon type='x' size={20} color='#6b7280' />
            </button>
          </div>
          <p className='text-sm text-soft-gray-600 dark:text-dark-text-secondary mb-4'>
            {gender === 'male'
              ? 'Avatares Masculinos'
              : gender === 'female'
                ? 'Avatares Femininos'
                : 'Selecione um avatar que represente você'}
          </p>
        </div>

        {/* Content */}
        <div className='p-6 flex-1 overflow-y-auto'>
          {profileImages.length === 0 && (
            <div className='text-center py-8'>
              <SmartIcon
                type='user'
                size={48}
                color='#9ca3af'
                className='mx-auto mb-4'
              />
              <p className='text-soft-gray-500 dark:text-dark-text-muted'>
                {gender
                  ? 'Nenhum avatar disponível para este gênero'
                  : 'Selecione um gênero primeiro'}
              </p>
            </div>
          )}
          <div className='grid grid-cols-3 gap-4 justify-center items-start max-w-sm mx-auto'>
            {profileImages.map((image, index) => {
              // Para grid 2x3 feminino, mostrar apenas nas primeiras 6 posições
              if (gender === 'female' && index >= 6) return null;

              // Para grid 3x3 masculino, mostrar apenas nas primeiras 9 posições
              if (gender === 'male' && index >= 9) return null;

              // Para feminino, pular posições para criar layout 2x3
              const shouldShow =
                gender === 'male' ||
                (gender === 'female' &&
                  (index === 0 ||
                    index === 1 || // primeira linha
                    index === 2 ||
                    index === 3 || // segunda linha
                    index === 4 ||
                    index === 5)); // terceira linha

              if (!shouldShow)
                return (
                  <div key={`empty-${index}`} className='aspect-square'></div>
                );

              return (
                <motion.button
                  key={image.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  onClick={() => handleImageSelect(image)}
                  onMouseEnter={() => setHoveredImage(image.id)}
                  onMouseLeave={() => setHoveredImage(null)}
                  className={`relative aspect-square rounded-2xl transition-all duration-300 ease-out ${
                    selectedImage === image.id
                      ? 'ring-4 ring-green-400 dark:ring-green-500 bg-green-50/80 dark:bg-green-900/20'
                      : 'hover:ring-2 hover:ring-pastel-purple-400 dark:hover:ring-dark-accent-purple bg-white/60 dark:bg-dark-bg-glass/60'
                  } ${hoveredImage === image.id ? 'scale-105 shadow-lg' : ''}`}
                  title={image.name}
                >
                  {/* Avatar Image */}
                  <div className='w-full h-full rounded-2xl overflow-hidden bg-gradient-to-br from-white/80 to-white/60 flex items-center justify-center p-2'>
                    <img
                      src={image.path}
                      alt={image.name}
                      className='w-full h-full object-contain rounded-xl'
                      onError={e => {
                        // Fallback para ícone se a imagem não carregar
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    <div
                      className='w-full h-full rounded-2xl bg-gradient-to-br from-pastel-purple-100 to-pastel-blue-100 dark:from-dark-bg-glass to-dark-bg-card flex items-center justify-center'
                      style={{ display: 'none' }}
                    >
                      <SmartIcon type='user' size={32} color='#8b5cf6' />
                    </div>
                  </div>

                  {/* Selection Indicator */}
                  {selectedImage === image.id && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className='absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg'
                    >
                      <SmartIcon type='check' size={16} color='white' />
                    </motion.div>
                  )}

                  {/* Hover Effect */}
                  <div className='absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none' />
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className='p-6 border-t border-pastel-purple-200/30 dark:border-dark-border-primary'>
          <div className='flex gap-3'>
            <button
              onClick={onClose}
              className='flex-1 px-4 py-3 rounded-xl font-semibold bg-white/60 dark:bg-dark-bg-glass/60 text-soft-gray-700 dark:text-dark-text-secondary border-2 border-pastel-purple-200/50 dark:border-dark-border-primary hover:bg-white/80 dark:hover:bg-dark-bg-glass/80 transition-all duration-200'
            >
              Cancelar
            </button>

            {selectedImage && (
              <button
                onClick={() =>
                  handleImageSelect(
                    profileImages.find(img => img.id === selectedImage)
                  )
                }
                className='flex-1 px-4 py-3 rounded-xl font-semibold bg-button-gradient dark:bg-button-gradient-dark text-white shadow-pastel dark:shadow-dark-soft hover:shadow-pastel-lg dark:hover:shadow-dark-soft-lg transform hover:scale-105 transition-all duration-200'
              >
                <SmartIcon type='check' size={20} className='inline mr-2' />
                Confirmar
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ProfileImageSelector;
