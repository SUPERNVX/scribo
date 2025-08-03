import React from 'react';

import { loadOnboardingData } from '../../utils/onboardingStorage';
import './ProfileAvatar.css';

/**
 * Componente para renderizar avatar do perfil
 * Sincroniza com dados do onboarding
 */
const ProfileAvatar = ({ user, size = 'medium', className = '' }) => {
  const avatarOptions = [
    { id: 'default', emoji: '👤', name: 'Padrão' },
    { id: 'student', emoji: '🎓', name: 'Estudante' },
    { id: 'writer', emoji: '✍️', name: 'Escritor' },
    { id: 'scholar', emoji: '📚', name: 'Acadêmico' },
    { id: 'genius', emoji: '🧠', name: 'Gênio' },
    { id: 'star', emoji: '⭐', name: 'Estrela' },
  ];

  const renderAvatar = () => {
    if (!user?.email) {
      return <span className='avatar-emoji'>👤</span>;
    }

    const onboardingData = loadOnboardingData(user.email);

    // Se há dados do onboarding e uma imagem específica
    if (
      onboardingData?.profileImage &&
      onboardingData.profileImage.includes('_')
    ) {
      const parts = onboardingData.profileImage.split('_');
      const gender = parts[0];
      const imageNumber = parts[1];
      const finalGender = onboardingData.gender || gender;
      const imagePath = `/avatars/${finalGender}/avatar_${imageNumber}.png`;

      return (
        <div className={`avatar-image-container ${className}`}>
          <img
            src={imagePath}
            alt='Avatar do perfil'
            className={`avatar-image avatar-${size}`}
            onError={e => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'block';
            }}
          />
          <span className='avatar-emoji-fallback' style={{ display: 'none' }}>
            {user.name?.charAt(0).toUpperCase() || '👤'}
          </span>
        </div>
      );
    }

    // Se há avatar emoji selecionado
    if (onboardingData?.profileImage) {
      const selectedAvatar = avatarOptions.find(
        a => a.id === onboardingData.profileImage
      );
      if (selectedAvatar) {
        return (
          <span className={`avatar-emoji avatar-${size} ${className}`}>
            {selectedAvatar.emoji}
          </span>
        );
      }
    }

    // Fallback para inicial do nome
    return (
      <span className={`avatar-initial avatar-${size} ${className}`}>
        {user.name?.charAt(0).toUpperCase() || '👤'}
      </span>
    );
  };

  return renderAvatar();
};

export default ProfileAvatar;
