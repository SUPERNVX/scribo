// Ambient Sounds Component for Focus Mode
import React, { useEffect, useRef, useState, memo } from 'react';

/**
 * Ambient Sounds Component
 * Provides background sounds to enhance focus
 */
const AmbientSounds = memo(({ 
  enabled = false, 
  volume = 0.3, 
  soundType = 'rain' 
}) => {
  const audioRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Sound configurations with URLs to free ambient sounds
   * In a real implementation, you would host these files or use a service
   */
  const soundConfigs = {
    rain: {
      name: 'Chuva',
      // Using a placeholder URL - in production, use actual audio files
      url: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT',
      loop: true,
    },
    forest: {
      name: 'Floresta',
      url: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT',
      loop: true,
    },
    ocean: {
      name: 'Oceano',
      url: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT',
      loop: true,
    },
    cafe: {
      name: 'Café',
      url: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT',
      loop: true,
    },
    fireplace: {
      name: 'Lareira',
      url: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT',
      loop: true,
    },
    'white-noise': {
      name: 'Ruído Branco',
      url: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT',
      loop: true,
    },
  };

  /**
   * Generate procedural ambient sound
   * This is a simplified version - in production you'd use actual audio files
   */
  const generateAmbientSound = (type) => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    // Configure based on sound type
    switch (type) {
      case 'rain':
        // White noise for rain effect
        const bufferSize = audioContext.sampleRate * 2;
        const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * 0.1;
        }
        
        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        source.loop = true;
        source.connect(gainNode);
        gainNode.connect(audioContext.destination);
        gainNode.gain.value = volume;
        
        return { source, gainNode, audioContext };
        
      case 'ocean':
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(0.5, audioContext.currentTime);
        break;
        
      case 'forest':
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
        break;
        
      default:
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
    }
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    gainNode.gain.value = volume * 0.1; // Keep it subtle
    
    return { oscillator, gainNode, audioContext };
  };

  /**
   * Load and play sound
   */
  useEffect(() => {
    if (!enabled) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // For demo purposes, we'll use Web Audio API to generate simple ambient sounds
      // In production, you would load actual audio files
      const soundSystem = generateAmbientSound(soundType);
      
      if (soundSystem.source) {
        soundSystem.source.start();
        audioRef.current = soundSystem;
      } else if (soundSystem.oscillator) {
        soundSystem.oscillator.start();
        audioRef.current = soundSystem;
      }
      
      setIsLoading(false);
    } catch (err) {
      console.error('Error playing ambient sound:', err);
      setError('Erro ao carregar som ambiente');
      setIsLoading(false);
    }

    return () => {
      if (audioRef.current) {
        try {
          if (audioRef.current.source) {
            audioRef.current.source.stop();
          }
          if (audioRef.current.oscillator) {
            audioRef.current.oscillator.stop();
          }
          if (audioRef.current.audioContext) {
            audioRef.current.audioContext.close();
          }
        } catch (err) {
          console.error('Error stopping ambient sound:', err);
        }
        audioRef.current = null;
      }
    };
  }, [enabled, soundType]);

  /**
   * Update volume
   */
  useEffect(() => {
    if (audioRef.current && audioRef.current.gainNode) {
      audioRef.current.gainNode.gain.value = volume * 0.1;
    }
  }, [volume]);

  // This component doesn't render anything visible
  // It only manages audio playback
  if (!enabled) return null;

  return (
    <div className="fixed bottom-4 left-4 z-40">
      <div className="bg-black bg-opacity-50 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-2">
        {isLoading && (
          <>
            <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
            <span>Carregando som...</span>
          </>
        )}
        
        {error && (
          <>
            <span className="text-red-400">⚠️</span>
            <span>{error}</span>
          </>
        )}
        
        {!isLoading && !error && (
          <>
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span>{soundConfigs[soundType]?.name || 'Som ambiente'}</span>
            <span className="text-xs opacity-70">{Math.round(volume * 100)}%</span>
          </>
        )}
      </div>
    </div>
  );
});

AmbientSounds.displayName = 'AmbientSounds';

export default AmbientSounds;