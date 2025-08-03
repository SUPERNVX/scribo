// Write Page Component
import React, { memo, useState, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

import { useEssays, useThemes, useModels } from '../hooks';
import { useDictionary, useTextSelection } from '../hooks/useDictionary';
import { ROUTES } from '../constants';
import { LazyEnhancedWritingSection } from '../utils/lazyImports';
import DictionaryModal from '../components/ui/DictionaryModal';

// Loading component for heavy writing components
const WritingLoader = () => (
  <div className='flex items-center justify-center min-h-[50vh]'>
    <div className='text-center'>
      <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-pastel-purple-500 mx-auto mb-4'></div>
      <p className='text-gray-600 dark:text-gray-300'>Carregando editor...</p>
    </div>
  </div>
);

/**
 * Write Page Component
 * Page for writing new essays
 */
const WritePage = memo(() => {
  const navigate = useNavigate();
  const { submitEssay, submitting } = useEssays();
  const { themes, loading: themesLoading, refreshing: themesRefreshing, refreshThemes } = useThemes();
  const { models, selectedModel, selectModel } = useModels();

  // Estados para a nova interface
  const [selectedTheme, setSelectedTheme] = useState(null);
  const [essayContent, setEssayContent] = useState('');

  // Estados para o dicionário
  const [dictionaryModalOpen, setDictionaryModalOpen] = useState(false);
  const [currentWord, setCurrentWord] = useState('');
  const [currentDefinition, setCurrentDefinition] = useState(null);

  // Hooks do dicionário
  const { getWordDefinition, loading: dictionaryLoading } = useDictionary();
  const { getSelectedText, isSingleWord } = useTextSelection();

  const handleSubmitEssay = async () => {
    if (!selectedTheme || !essayContent.trim()) {
      toast.error('Por favor, selecione um tema e escreva sua redação.');
      return;
    }

    const essayData = {
      theme: selectedTheme,
      content: essayContent,
      model: selectedModel,
    };

    const result = await submitEssay(essayData);

    if (result.success) {
      toast.success('Redação enviada e corrigida com sucesso!');
      navigate(ROUTES.DASHBOARD);
    } else {
      toast.error(result.error || 'Erro ao enviar redação');
    }
  };

  const handleWordDoubleClick = async event => {
    try {
      // Obter texto selecionado
      const selection = getSelectedText();

      if (!selection || !selection.text) {
        toast.error('Nenhuma palavra selecionada');
        return;
      }

      const { text } = selection;

      // Verificar se é uma palavra única
      if (!isSingleWord(text)) {
        toast.warning(
          'Selecione apenas uma palavra para consultar no dicionário'
        );
        return;
      }

      // Limpar palavra (remover pontuação)
      const cleanWord = text.replace(/[^\w]/g, '').toLowerCase();

      if (!cleanWord) {
        toast.error('Palavra inválida');
        return;
      }

      setCurrentWord(text);
      setCurrentDefinition(null);
      setDictionaryModalOpen(true);

      // Buscar definição
      toast.loading('Consultando dicionário...', { id: 'dictionary-search' });

      const result = await getWordDefinition(cleanWord);

      toast.dismiss('dictionary-search');

      if (result) {
        setCurrentDefinition(result.definition);

        if (result.suggestion) {
          toast.success(`Palavra similar encontrada: "${result.suggestion}"`);
        } else {
          toast.success('Definição encontrada!');
        }
      } else {
        toast.error(`Palavra "${text}" não encontrada no dicionário`);
        setCurrentDefinition(null);
      }
    } catch (error) {
      console.error('Erro ao buscar palavra:', error);
      toast.error('Erro ao consultar dicionário');
      toast.dismiss('dictionary-search');
    }
  };

  // Fechar modal do dicionário
  const handleCloseDictionary = () => {
    setDictionaryModalOpen(false);
    setCurrentWord('');
    setCurrentDefinition(null);
  };

  if (themesLoading) {
    return (
      <div className='flex items-center justify-center min-h-[50vh]'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-pastel-purple-500 mx-auto mb-4'></div>
          <p className='text-gray-600 dark:text-gray-300'>
            Carregando temas...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='max-w-7xl mx-auto'>
      <Suspense fallback={<WritingLoader />}>
        <LazyEnhancedWritingSection
          themes={themes}
          selectedTheme={selectedTheme}
          onThemeSelect={setSelectedTheme}
          essayContent={essayContent}
          onEssayChange={setEssayContent}
          onSubmitEssay={handleSubmitEssay}
          loading={submitting}
          onWordDoubleClick={handleWordDoubleClick}
          aiModel={selectedModel}
          onAiModelChange={selectModel}
          models={models}
          onRefreshThemes={refreshThemes}
          themesRefreshing={themesRefreshing}
        />
      </Suspense>

      {/* Modal do Dicionário */}
      <DictionaryModal
        isOpen={dictionaryModalOpen}
        onClose={handleCloseDictionary}
        word={currentWord}
        definition={currentDefinition}
      />
    </div>
  );
});

WritePage.displayName = 'WritePage';

export default WritePage;