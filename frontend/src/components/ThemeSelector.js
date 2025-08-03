import React, { useState, useEffect } from 'react';
import { FileIcon, FolderIcon, FolderOpenIcon, X } from 'lucide-react';
import './ThemeSelector.css';

const ThemeSelector = ({ isOpen, onClose, onThemeSelect }) => {
  const [expandedFolders, setExpandedFolders] = useState(new Set());
  const [themes, setThemes] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadThemes();
    }
  }, [isOpen]);

  const loadThemes = async () => {
    setLoading(true);
    try {
      const faculdades = ['ENEM', 'FUVEST', 'ITA', 'PUC-RJ', 'UNESP', 'UNIFESP'];
      const themesData = {};

      for (const faculdade of faculdades) {
        try {
          const response = await fetch(`/${faculdade}.json`);
          if (response.ok) {
            const data = await response.json();
            themesData[faculdade] = data.temas || [];
          }
        } catch (error) {
          console.error(`Erro ao carregar temas de ${faculdade}:`, error);
          themesData[faculdade] = [];
        }
      }

      setThemes(themesData);
    } catch (error) {
      console.error('Erro ao carregar temas:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFolder = (faculdade) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(faculdade)) {
      newExpanded.delete(faculdade);
    } else {
      newExpanded.add(faculdade);
    }
    setExpandedFolders(newExpanded);
  };

  const handleThemeSelect = (theme) => {
    onThemeSelect(theme);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="theme-selector-overlay">
      <div className="theme-selector-modal">
        <div className="theme-selector-header">
          <h3>Selecionar Tema por Faculdade</h3>
          <button className="close-button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="theme-selector-content">
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Carregando temas...</p>
            </div>
          ) : (
            <div className="theme-tree">
              {Object.entries(themes).map(([faculdade, temasList]) => (
                <div key={faculdade} className="folder-container">
                  <div 
                    className="folder-item"
                    onClick={() => toggleFolder(faculdade)}
                  >
                    <span className="folder-icon">
                      {expandedFolders.has(faculdade) ? (
                        <FolderOpenIcon size={16} />
                      ) : (
                        <FolderIcon size={16} />
                      )}
                    </span>
                    <span className="folder-name">{faculdade}</span>
                    <span className="theme-count">({temasList.length} temas)</span>
                  </div>

                  {expandedFolders.has(faculdade) && (
                    <div className="themes-list">
                      {temasList.map((tema) => (
                        <div
                          key={tema.id}
                          className="theme-item"
                          onClick={() => handleThemeSelect(tema)}
                        >
                          <FileIcon size={14} className="file-icon" />
                          <div className="theme-info">
                            <div className="theme-title">{tema.titulo}</div>
                            <div className="theme-meta">
                              {tema.ano} • {tema.estilo} • {tema.area}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ThemeSelector;