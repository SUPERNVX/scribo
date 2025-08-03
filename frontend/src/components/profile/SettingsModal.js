import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { SmartIcon } from '../ModernIcons';
import { useAuth } from '../../contexts/AuthContext';
import {
  loadOnboardingData,
  saveOnboardingData,
} from '../../utils/onboardingStorage';
import { RateLimitIndicator } from '../ui';

import ProfileAvatar from './ProfileAvatar';
import './SettingsModal.css';

/**
 * Modal de Configurações Completo
 * Interface de tamanho completo para configurações do usuário
 */
const SettingsModal = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [profileData, setProfileData] = useState({
    name: '',
    nickname: '',
    email: '',
    profileImage: 'default',
    gender: '',
    notifications: {
      email: true,
      push: true,
      achievements: true,
      reminders: false,
    },
    preferences: {
      theme: 'light',
      language: 'pt-BR',
      autoSave: true,
      spellCheck: true,
    },
  });

  // Carregar dados do usuário
  useEffect(() => {
    if (user?.email && isOpen) {
      const onboardingData = loadOnboardingData(user.email);

      setProfileData(prev => ({
        ...prev,
        name: onboardingData?.name || user.name || '',
        nickname:
          onboardingData?.nickname ||
          user.username ||
          user.email?.split('@')[0] ||
          '',
        email: user.email,
        profileImage: onboardingData?.profileImage || 'default',
        gender: onboardingData?.gender || '',
      }));
    }
  }, [user, isOpen]);

  // Fechar com ESC
  useEffect(() => {
    const handleKeyDown = event => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleSave = () => {
    if (!user?.email) return;

    const dataToSave = {
      name: profileData.name,
      nickname: profileData.nickname,
      profileImage: profileData.profileImage,
      gender: profileData.gender,
      updatedAt: new Date().toISOString(),
    };

    const saved = saveOnboardingData(user.email, dataToSave);

    if (saved) {
      // Disparar evento para atualizar outros componentes
      window.dispatchEvent(
        new CustomEvent('userProfileUpdated', { detail: dataToSave })
      );
      onClose();
    }
  };

  const tabs = [
    { id: 'profile', label: 'Perfil', icon: 'user' },
    { id: 'notifications', label: 'Notificações', icon: 'bell' },
    { id: 'preferences', label: 'Preferências', icon: 'settings' },
    { id: 'account', label: 'Conta', icon: 'shield' },
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className='settings-modal-overlay'
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className='settings-modal'
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className='settings-header'>
            <div className='settings-title'>
              <SmartIcon type='settings' size={24} />
              <h2>Configurações</h2>
            </div>
            <button className='settings-close' onClick={onClose}>
              <SmartIcon type='x' size={24} />
            </button>
          </div>

          <div className='settings-content'>
            {/* Sidebar */}
            <div className='settings-sidebar'>
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  className={`settings-tab ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <SmartIcon type={tab.icon} size={20} />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Main Content */}
            <div className='settings-main'>
              {activeTab === 'profile' && (
                <div className='settings-section'>
                  <h3>Informações do Perfil</h3>

                  <div className='profile-avatar-section'>
                    <div className='avatar-preview'>
                      <ProfileAvatar user={user} size='large' />
                    </div>
                    <button className='change-avatar-btn'>
                      <SmartIcon type='camera' size={16} />
                      Alterar Avatar
                    </button>
                  </div>

                  <div className='form-grid'>
                    <div className='form-group'>
                      <label>Nome Completo</label>
                      <input
                        type='text'
                        value={profileData.name}
                        onChange={e =>
                          setProfileData(prev => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                        placeholder='Seu nome completo'
                      />
                    </div>

                    <div className='form-group'>
                      <label>Nome de Usuário</label>
                      <input
                        type='text'
                        value={profileData.nickname}
                        onChange={e =>
                          setProfileData(prev => ({
                            ...prev,
                            nickname: e.target.value,
                          }))
                        }
                        placeholder='Seu nome de usuário'
                      />
                    </div>

                    <div className='form-group'>
                      <label>Email</label>
                      <input
                        type='email'
                        value={profileData.email}
                        disabled
                        className='disabled'
                      />
                    </div>

                    <div className='form-group'>
                      <label>Gênero</label>
                      <select
                        value={profileData.gender}
                        onChange={e =>
                          setProfileData(prev => ({
                            ...prev,
                            gender: e.target.value,
                          }))
                        }
                      >
                        <option value=''>Selecione</option>
                        <option value='male'>Masculino</option>
                        <option value='female'>Feminino</option>
                        <option value='other'>Outro</option>
                      </select>
                    </div>

                    {/* Rate Limit Status */}
                    <div className='form-group'>
                      <label>Uso de Análises de IA</label>
                      <RateLimitIndicator variant="settings" />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div className='settings-section'>
                  <h3>Preferências de Notificação</h3>

                  <div className='notification-options'>
                    <div className='notification-item'>
                      <div className='notification-info'>
                        <h4>Notificações por Email</h4>
                        <p>Receba atualizações importantes por email</p>
                      </div>
                      <label className='toggle-switch'>
                        <input
                          type='checkbox'
                          checked={profileData.notifications.email}
                          onChange={e =>
                            setProfileData(prev => ({
                              ...prev,
                              notifications: {
                                ...prev.notifications,
                                email: e.target.checked,
                              },
                            }))
                          }
                        />
                        <span className='toggle-slider'></span>
                      </label>
                    </div>

                    <div className='notification-item'>
                      <div className='notification-info'>
                        <h4>Notificações Push</h4>
                        <p>Receba notificações no navegador</p>
                      </div>
                      <label className='toggle-switch'>
                        <input
                          type='checkbox'
                          checked={profileData.notifications.push}
                          onChange={e =>
                            setProfileData(prev => ({
                              ...prev,
                              notifications: {
                                ...prev.notifications,
                                push: e.target.checked,
                              },
                            }))
                          }
                        />
                        <span className='toggle-slider'></span>
                      </label>
                    </div>

                    <div className='notification-item'>
                      <div className='notification-info'>
                        <h4>Conquistas</h4>
                        <p>Seja notificado sobre novas conquistas</p>
                      </div>
                      <label className='toggle-switch'>
                        <input
                          type='checkbox'
                          checked={profileData.notifications.achievements}
                          onChange={e =>
                            setProfileData(prev => ({
                              ...prev,
                              notifications: {
                                ...prev.notifications,
                                achievements: e.target.checked,
                              },
                            }))
                          }
                        />
                        <span className='toggle-slider'></span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'preferences' && (
                <div className='settings-section'>
                  <h3>Preferências do Sistema</h3>

                  <div className='form-grid'>
                    <div className='form-group'>
                      <label>Tema</label>
                      <select
                        value={profileData.preferences.theme}
                        onChange={e =>
                          setProfileData(prev => ({
                            ...prev,
                            preferences: {
                              ...prev.preferences,
                              theme: e.target.value,
                            },
                          }))
                        }
                      >
                        <option value='light'>Claro</option>
                        <option value='dark'>Escuro</option>
                        <option value='auto'>Automático</option>
                      </select>
                    </div>

                    <div className='form-group'>
                      <label>Idioma</label>
                      <select
                        value={profileData.preferences.language}
                        onChange={e =>
                          setProfileData(prev => ({
                            ...prev,
                            preferences: {
                              ...prev.preferences,
                              language: e.target.value,
                            },
                          }))
                        }
                      >
                        <option value='pt-BR'>Português (Brasil)</option>
                        <option value='en-US'>English (US)</option>
                        <option value='es-ES'>Español</option>
                      </select>
                    </div>
                  </div>

                  <div className='preference-options'>
                    <div className='preference-item'>
                      <div className='preference-info'>
                        <h4>Salvamento Automático</h4>
                        <p>Salvar automaticamente enquanto escreve</p>
                      </div>
                      <label className='toggle-switch'>
                        <input
                          type='checkbox'
                          checked={profileData.preferences.autoSave}
                          onChange={e =>
                            setProfileData(prev => ({
                              ...prev,
                              preferences: {
                                ...prev.preferences,
                                autoSave: e.target.checked,
                              },
                            }))
                          }
                        />
                        <span className='toggle-slider'></span>
                      </label>
                    </div>

                    <div className='preference-item'>
                      <div className='preference-info'>
                        <h4>Correção Ortográfica</h4>
                        <p>Verificar ortografia automaticamente</p>
                      </div>
                      <label className='toggle-switch'>
                        <input
                          type='checkbox'
                          checked={profileData.preferences.spellCheck}
                          onChange={e =>
                            setProfileData(prev => ({
                              ...prev,
                              preferences: {
                                ...prev.preferences,
                                spellCheck: e.target.checked,
                              },
                            }))
                          }
                        />
                        <span className='toggle-slider'></span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'account' && (
                <div className='settings-section'>
                  <h3>Configurações da Conta</h3>

                  <div className='account-actions'>
                    <div className='account-item'>
                      <div className='account-info'>
                        <h4>Exportar Dados</h4>
                        <p>Baixe uma cópia de todos os seus dados</p>
                      </div>
                      <button className='btn-secondary'>
                        <SmartIcon type='download' size={16} />
                        Exportar
                      </button>
                    </div>

                    <div className='account-item'>
                      <div className='account-info'>
                        <h4>Limpar Cache</h4>
                        <p>Limpar dados temporários do navegador</p>
                      </div>
                      <button className='btn-secondary'>
                        <SmartIcon type='trash' size={16} />
                        Limpar
                      </button>
                    </div>

                    <div className='account-item danger'>
                      <div className='account-info'>
                        <h4>Excluir Conta</h4>
                        <p>Remover permanentemente sua conta e dados</p>
                      </div>
                      <button className='btn-danger'>
                        <SmartIcon type='trash' size={16} />
                        Excluir
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className='settings-footer'>
            <button className='btn-secondary' onClick={onClose}>
              Cancelar
            </button>
            <button className='btn-primary' onClick={handleSave}>
              <SmartIcon type='check' size={16} />
              Salvar Alterações
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SettingsModal;
