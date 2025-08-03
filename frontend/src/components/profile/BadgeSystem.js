import React from 'react';
import './BadgeSystem.css';
import {
  FirstEssayBadge,
  StreakFireBadge,
  PerfectionistBadge,
  WriterBadge,
  MasterWriterBadge,
  MarathonBadge,
  PerfectScoreBadge,
  ExplorerBadge,
  SpeedBadge,
  PersistentBadge,
  BeginnerBadge,
  ApprenticeBadge,
  CompetentBadge,
  AdvancedBadge,
  ExpertBadge,
  MasterBadge,
} from '../../assets/icons/badges';

/**
 * Sistema de medalhas/conquistas
 * Exibe badges com tooltips explicativos
 */
const BadgeSystem = ({ badges = [], className = '' }) => {
  // Definição das medalhas disponíveis com imagens
  const badgeDefinitions = {
    'first-essay': {
      id: 'first-essay',
      name: 'Primeira Redação',
      description: 'Escreveu sua primeira redação',
      image: FirstEssayBadge,
      color: '#10b981',
    },
    'week-streak': {
      id: 'week-streak',
      name: '7 Dias Consecutivos',
      description: '7 dias seguidos escrevendo',
      image: StreakFireBadge,
      color: '#f59e0b',
    },
    'month-streak': {
      id: 'month-streak',
      name: '30 Dias Consecutivos',
      description: '30 dias seguidos escrevendo',
      image: StreakFireBadge,
      color: '#3b82f6',
    },
    perfectionist: {
      id: 'perfectionist',
      name: 'Perfeccionista',
      description: 'Nota 1000 em uma redação',
      image: PerfectionistBadge,
      color: '#8b5cf6',
    },
    prolific: {
      id: 'prolific',
      name: 'Prolífico',
      description: '50 redações escritas',
      image: WriterBadge,
      color: '#06b6d4',
    },
    scholar: {
      id: 'scholar',
      name: 'Acadêmico',
      description: 'Média acima de 900',
      image: MasterWriterBadge,
      color: '#84cc16',
    },
    marathoner: {
      id: 'marathoner',
      name: 'Maratonista',
      description: 'Escreveu 10 redações em um mês',
      image: MarathonBadge,
      color: '#d97706',
    },
    'perfect-score': {
      id: 'perfect-score',
      name: 'Nota Mil',
      description: 'Alcançou a nota máxima em uma redação',
      image: PerfectScoreBadge,
      color: '#f97316',
    },
    'theme-explorer': {
      id: 'theme-explorer',
      name: 'Explorador de Temas',
      description: 'Escreveu sobre 5 temas diferentes',
      image: ExplorerBadge,
      color: '#14b8a6',
    },
    sprinter: {
      id: 'sprinter',
      name: 'Velocista',
      description: 'Escreveu uma redação em menos de 30 minutos',
      image: SpeedBadge,
      color: '#6366f1',
    },
    persistent: {
      id: 'persistent',
      name: 'Persistente',
      description: 'Escreveu 100 redações',
      image: PersistentBadge,
      color: '#ef4444',
    },
    beginner: {
      id: 'beginner',
      name: 'Iniciante',
      description: 'Nível 1 alcançado',
      image: BeginnerBadge,
      color: '#a16207',
    },
    apprentice: {
      id: 'apprentice',
      name: 'Aprendiz',
      description: 'Nível 5 alcançado',
      image: ApprenticeBadge,
      color: '#a16207',
    },
    competent: {
      id: 'competent',
      name: 'Competente',
      description: 'Nível 10 alcançado',
      image: CompetentBadge,
      color: '#a16207',
    },
    advanced: {
      id: 'advanced',
      name: 'Avançado',
      description: 'Nível 15 alcançado',
      image: AdvancedBadge,
      color: '#a16207',
    },
    expert: {
      id: 'expert',
      name: 'Expert',
      description: 'Nível 20 alcançado',
      image: ExpertBadge,
      color: '#a16207',
    },
    master: {
      id: 'master',
      name: 'Mestre',
      description: 'Nível 25 alcançado',
      image: MasterBadge,
      color: '#a16207',
    },
  };

  // Filtrar apenas badges que o usuário possui
  const userBadges = badges
    .map(badgeId => badgeDefinitions[badgeId])
    .filter(Boolean);

  if (userBadges.length === 0) {
    return null;
  }

  return (
    <div className={`badge-system ${className}`}>
      {userBadges.map(badge => (
        <div
          key={badge.id}
          className='badge-item'
          title={badge.description}
          style={{ '--badge-color': badge.color }}
        >
          <div className='badge-icon'>
            <img src={badge.image} alt={badge.name} className='badge-icon-img' />
          </div>
          <div className='badge-tooltip'>
            <div className='badge-tooltip-title'>{badge.name}</div>
            <div className='badge-tooltip-description'>{badge.description}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default BadgeSystem;