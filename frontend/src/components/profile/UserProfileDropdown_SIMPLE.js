import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';

import { useAuth } from '../../contexts/AuthContext';
import useUserTier from '../../hooks/useUserTier';
import { SmartIcon } from '../ModernIcons';
import {
  loadOnboardingData,
  saveOnboardingData,
  markOnboardingCompleted,
} from '../../utils/onboardingStorage';

import BadgeSystem from './BadgeSystem';
import ProfileAvatar from './ProfileAvatar';
import './UserProfileDropdown.css';
import api from '../../services/api'; // Import the api service

const UserProfileDropdownSimple = ({ user, isOpen, onClose, onLogout }) => {
  const { token } = useAuth();
  const { isPremium, userTier } = useUserTier();
  const dropdownRef = useRef(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedUsername, setEditedUsername] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('default');
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);
  const [userAchievements, setUserAchievements] = useState([]);
  const [userStats, setUserStats] = useState({
    level: 1,
    levelName: 'Iniciante',
    xp: 0,
    essaysCount: 0,
    consecutiveDays: 0,
  });

  const avatarOptions = [
    { id: 'default', emoji: '👤', name: 'Padrão' },
    { id: 'student', emoji: '🎓', name: 'Estudante' },
    { id: 'writer', emoji: '✍️', name: 'Escritor' },
    { id: 'scholar', emoji: '📚', name: 'Acadêmico' },
    { id: 'genius', emoji: '🧠', name: 'Gênio' },
    { id: 'star', emoji: '⭐', name: 'Estrela' },
  ];

  useEffect(() => {
    if (user?.email) {
      const onboardingData = loadOnboardingData(user.email);
      if (onboardingData) {
        setEditedName(onboardingData.name || user.name || '');
        setEditedUsername(
          onboardingData.nickname ||
            user.username ||
            user.email?.split('@')[0] ||
            ''
        );
        setSelectedAvatar(onboardingData.profileImage || 'default');
      } else {
        setEditedName(user.name || '');
        setEditedUsername(user.username || user.email?.split('@')[0] || '');
        setSelectedAvatar('default');
      }

      const fetchAchievements = async () => {
        try {
          const response = await fetch('http://localhost:8000/api/achievements/my', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            setUserAchievements(data.achievements || []);
          }
        } catch (error) {
          console.error('Error fetching achievements:', error);
          setUserAchievements([]);
        }
      };

      const fetchStats = async () => {
        try {
          const response = await fetch('http://localhost:8000/api/stats/my', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            setUserStats(prevStats => ({ ...prevStats, ...data }));
          }
        } catch (error) {
          console.error('Error fetching user stats:', error);
          setUserStats({});
        }
      };

      fetchAchievements();
      fetchStats();
    }
  }, [user, isOpen]);

  useEffect(() => {
    const handleClickOutside = event => {
      const isProfileButton = event.target.closest('[data-profile-button="true"]');
      const isInsideDropdown = dropdownRef.current && dropdownRef.current.contains(event.target);
      
      if (!isInsideDropdown && !isProfileButton) {
        onClose();
        setIsEditing(false);
        setShowAvatarSelector(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const renderProfileAvatar = () => {
    return <ProfileAvatar user={user} size='large' />;
  };

  const handleSave = () => {
    if (!user?.email) return;
    const profileData = {
      name: editedName,
      nickname: editedUsername,
      profileImage: selectedAvatar,
      gender: '',
      updatedAt: new Date().toISOString(),
    };
    const saved = saveOnboardingData(user.email, profileData);
    if (saved) {
      markOnboardingCompleted(user.email);
      setIsEditing(false);
      window.dispatchEvent(
        new CustomEvent('userProfileUpdated', { detail: profileData })
      );
    }
  };

  const handleCancel = () => {
    if (user?.email) {
      const onboardingData = loadOnboardingData(user.email);
      if (onboardingData) {
        setEditedName(onboardingData.name || user.name || '');
        setEditedUsername(
          onboardingData.nickname ||
            user.username ||
            user.email?.split('@')[0] ||
            ''
        );
        setSelectedAvatar(onboardingData.profileImage || 'default');
      } else {
        setEditedName(user.name || '');
        setEditedUsername(user.username || user.email?.split('@')[0] || '');
        setSelectedAvatar('default');
      }
    }
    setIsEditing(false);
  };

  const handleAvatarSelect = avatarId => {
    setSelectedAvatar(avatarId);
    setShowAvatarSelector(false);
  };

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className='profile-dropdown-overlay'>
      <div className='profile-dropdown' ref={dropdownRef}>
        <div className='profile-avatar-section'>
          <div
            className='profile-avatar-large'
            onClick={() => setShowAvatarSelector(!showAvatarSelector)}
            title='Clique para trocar avatar'
          >
            {renderProfileAvatar()}
            <div className='avatar-edit-indicator'>
              <SmartIcon type='camera' size={12} />
            </div>
          </div>
          {showAvatarSelector && (
            <div className='avatar-selector-popup'>
              <div className='avatar-grid'>
                {avatarOptions.map(avatar => (
                  <button
                    key={avatar.id}
                    className={`avatar-option ${selectedAvatar === avatar.id ? 'selected' : ''}`}
                    onClick={() => handleAvatarSelect(avatar.id)}
                    title={avatar.name}
                  >
                    <span className='avatar-emoji'>{avatar.emoji}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className='profile-info-section'>
          {isEditing ? (
            <div className='profile-edit-form'>
              <div className='input-group'>
                <label>Nome</label>
                <input
                  type='text'
                  value={editedName}
                  onChange={e => setEditedName(e.target.value)}
                  placeholder='Seu nome'
                  autoFocus
                />
              </div>
              <div className='input-group'>
                <label>Nome de Usuário</label>
                <input
                  type='text'
                  value={editedUsername}
                  onChange={e => setEditedUsername(e.target.value)}
                  placeholder='Seu nome de usuário'
                />
              </div>
              <div className='edit-actions'>
                <button className='btn-cancel' onClick={handleCancel}>
                  <SmartIcon type='x' size={14} />
                  Cancelar
                </button>
                <button className='btn-save' onClick={handleSave}>
                  <SmartIcon type='check' size={14} />
                  Salvar
                </button>
              </div>
            </div>
          ) : (
            <div className='profile-display'>
              <div className={`user-tier-badge ${userTier}`}>
                {isPremium ? 'Premium' : 'Gratuito'}
              </div>
              <h3 className='profile-name'>{editedName || user?.name}</h3>
              <p className='profile-username'>@{editedUsername}</p>
              <button
                className='edit-profile-btn'
                onClick={() => setIsEditing(true)}
                title='Editar perfil'
              >
                <SmartIcon type='edit' size={14} />
                Editar
              </button>
            </div>
          )}
        </div>
        {/* Seção de Conquistas e Estatísticas */}
        <div className='profile-stats-badges-section'>
          <div className='quick-stats'>
            <div className='quick-stat'>
              <SmartIcon type='file-text' size={12} />
              <span>{userStats.total_essays} redações</span>
            </div>
            <div className='quick-stat'>
              <SmartIcon type='award' size={12} />
              <span>{userAchievements.length} conquistas</span>
            </div>
            <div className='quick-stat'>
              <SmartIcon type='calendar' size={12} />
              <span>{userStats.consecutiveDays} dias seguidos</span>
            </div>
          </div>
          <BadgeSystem badges={userAchievements} />
        </div>
        <div className='profile-gamification-section'>
          <div className='level-display'>
            <div className='level-badge-small'>
              <SmartIcon type='crown' size={14} />
              <span>Nível {userStats.level}</span>
            </div>
            <span className='level-name'>{userStats.levelName}</span>
          </div>
          <div className='xp-display'>
            <SmartIcon type='star' size={14} />
            <span>{userStats.xp} XP</span>
          </div>
        </div>
        <div className='profile-actions'>
          <button
            className='action-btn secondary'
            onClick={() => {
              onClose();
              window.dispatchEvent(new CustomEvent('openSettingsModal'));
            }}
          >
            <SmartIcon type='settings' size={16} />
            Configurações
          </button>
          <button className='action-btn danger' onClick={onLogout}>
            <SmartIcon type='log-out' size={16} />
            Sair
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default UserProfileDropdownSimple;