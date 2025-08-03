import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { processCompleteFeedback } from '../utils/aiResponseProcessor';

// Componente para renderizar HTML de forma segura
const SafeHTML = ({ htmlContent }) => {
  if (!htmlContent) return null;
  return (
    <div
      className='html-content'
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
};

const EssayDetailsModal = ({ selectedEssay, onClose }) => {
  // Usar o novo processador para obter as seções de feedback
  const feedbackData = selectedEssay?.feedback
    ? processCompleteFeedback(selectedEssay.feedback)
    : null;

  const sections = feedbackData?.sections || {};

  return (
    <AnimatePresence>
      {selectedEssay && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className='fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50'
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className='bg-white/95 dark:bg-soft-gray-800/95 backdrop-blur-md rounded-3xl w-[95vw] h-[90vh] overflow-hidden border border-pastel-purple-200/50 dark:border-pastel-purple-400/30 shadow-pastel-xl'
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className='flex justify-between items-center p-6 border-b border-pastel-purple-200/30 dark:border-pastel-purple-400/20'>
              <h3 className='text-2xl font-display font-bold text-soft-gray-900 dark:text-soft-gray-100'>
                {selectedEssay.theme_title}
              </h3>
              <button
                onClick={onClose}
                className='p-2 rounded-xl hover:bg-pastel-purple-100/50 dark:hover:bg-pastel-purple-400/20 transition-colors'
              >
                <span className='text-2xl text-soft-gray-600 dark:text-soft-gray-300'>
                  ×
                </span>
              </button>
            </div>

            {/* Content */}
            <div className='flex h-[calc(90vh-80px)]'>
              {/* Redação - 40% */}
              <div className='w-[40%] p-6 overflow-y-auto'>
                <h4 className='text-lg font-display font-semibold text-soft-gray-900 dark:text-soft-gray-100 mb-4'>
                  Sua Redação
                </h4>
                <div className='bg-white/60 dark:bg-soft-gray-700/60 rounded-2xl p-6 border border-pastel-purple-200/30 dark:border-pastel-purple-400/20'>
                  <div className='whitespace-pre-wrap leading-relaxed font-body text-soft-gray-900 dark:text-soft-gray-100'>
                    <SafeHTML htmlContent={selectedEssay.content} />
                  </div>
                </div>
              </div>

              {/* Espaço - 5% */}
              <div className='w-[5%]'></div>

              {/* Análise da IA - 55% */}
              <div className='w-[55%] p-6 overflow-y-auto'>
                <h4 className='text-lg font-display font-semibold text-soft-gray-900 dark:text-soft-gray-100 mb-6'>
                  Análise da IA
                </h4>

                {/* Nota Final */}
                {sections.notaFinal && (
                  <div className='mb-6 p-4 bg-pastel-purple-50 dark:bg-pastel-purple-900/20 rounded-2xl border border-pastel-purple-200/30 dark:border-pastel-purple-400/20'>
                    <div className='flex justify-between items-center'>
                      <span className='font-display font-semibold text-soft-gray-900 dark:text-soft-gray-100'>
                        Nota Final:
                      </span>
                      <span className='text-3xl font-display font-bold text-pastel-purple-custom'>
                        {sections.notaFinal}
                      </span>
                    </div>
                  </div>
                )}

                {/* Grid de Competências */}
                <div className='space-y-4'>
                  {/* Competência/Critério 1 */}
                  <div className='bg-white/60 dark:bg-soft-gray-700/60 rounded-2xl p-4 border border-pastel-purple-200/30 dark:border-pastel-purple-400/20'>
                    <h5 className='font-display font-semibold text-pastel-purple-custom mb-2'>
                      {sections.competencia1?.isEnem !== false ? 'Competência 1' : 'Critério 1'}
                    </h5>
                    <p className='text-xs font-body text-soft-gray-600 dark:text-soft-gray-400 mb-2'>
                      Demonstrar domínio da modalidade escrita formal da língua portuguesa.
                    </p>
                    <div className='mb-2 text-lg font-bold text-pastel-purple-custom'>
                      {sections.competencia1?.nota || 'N/A'}
                    </div>
                    {sections.competencia1?.analise && (
                      <div className='text-xs font-body text-soft-gray-900 dark:text-soft-gray-200'>
                        <SafeHTML htmlContent={sections.competencia1.analise} />
                      </div>
                    )}
                  </div>
                  {/* Competência/Critério 2 */}
                  <div className='bg-white/60 dark:bg-soft-gray-700/60 rounded-2xl p-4 border border-pastel-purple-200/30 dark:border-pastel-purple-400/20'>
                    <h5 className='font-display font-semibold text-pastel-purple-custom mb-2'>
                      {sections.competencia2?.isEnem !== false ? 'Competência 2' : 'Critério 2'}
                    </h5>
                    <p className='text-xs font-body text-soft-gray-600 dark:text-soft-gray-400 mb-2'>
                      Compreender a proposta de redação e aplicar conceitos das várias áreas de conhecimento.
                    </p>
                    <div className='mb-2 text-lg font-bold text-pastel-purple-custom'>
                      {sections.competencia2?.nota || 'N/A'}
                    </div>
                    {sections.competencia2?.analise && (
                      <div className='text-xs font-body text-soft-gray-900 dark:text-soft-gray-200'>
                        <SafeHTML htmlContent={sections.competencia2.analise} />
                      </div>
                    )}
                  </div>
                  {/* Competência/Critério 3 */}
                  <div className='bg-white/60 dark:bg-soft-gray-700/60 rounded-2xl p-4 border border-pastel-purple-200/30 dark:border-pastel-purple-400/20'>
                    <h5 className='font-display font-semibold text-pastel-purple-custom mb-2'>
                      {sections.competencia3?.isEnem !== false ? 'Competência 3' : 'Critério 3'}
                    </h5>
                    <p className='text-xs font-body text-soft-gray-600 dark:text-soft-gray-400 mb-2'>
                      Selecionar, relacionar, organizar e interpretar informações, fatos, opiniões e argumentos.
                    </p>
                    <div className='mb-2 text-lg font-bold text-pastel-purple-custom'>
                      {sections.competencia3?.nota || 'N/A'}
                    </div>
                    {sections.competencia3?.analise && (
                      <div className='text-xs font-body text-soft-gray-900 dark:text-soft-gray-200'>
                        <SafeHTML htmlContent={sections.competencia3.analise} />
                      </div>
                    )}
                  </div>
                  {/* Competência/Critério 4 */}
                  <div className='bg-white/60 dark:bg-soft-gray-700/60 rounded-2xl p-4 border border-pastel-purple-200/30 dark:border-pastel-purple-400/20'>
                    <h5 className='font-display font-semibold text-pastel-purple-custom mb-2'>
                      {sections.competencia4?.isEnem !== false ? 'Competência 4' : 'Critério 4'}
                    </h5>
                    <p className='text-xs font-body text-soft-gray-600 dark:text-soft-gray-400 mb-2'>
                      Demonstrar conhecimento dos mecanismos linguísticos necessários para a construção da argumentação.
                    </p>
                    <div className='mb-2 text-lg font-bold text-pastel-purple-custom'>
                      {sections.competencia4?.nota || 'N/A'}
                    </div>
                    {sections.competencia4?.analise && (
                      <div className='text-xs font-body text-soft-gray-900 dark:text-soft-gray-200'>
                        <SafeHTML htmlContent={sections.competencia4.analise} />
                      </div>
                    )}
                  </div>
                  {/* Competência/Critério 5 */}
                  <div className='bg-white/60 dark:bg-soft-gray-700/60 rounded-2xl p-4 border border-pastel-purple-200/30 dark:border-pastel-purple-400/20'>
                    <h5 className='font-display font-semibold text-pastel-purple-custom mb-2'>
                      {sections.competencia5?.isEnem !== false ? 'Competência 5' : 'Critério 5'}
                    </h5>
                    <p className='text-xs font-body text-soft-gray-600 dark:text-soft-gray-400 mb-2'>
                      Elaborar proposta de intervenção para o problema abordado, respeitando os direitos humanos.
                    </p>
                    <div className='mb-2 text-lg font-bold text-pastel-purple-custom'>
                      {sections.competencia5?.nota || 'N/A'}
                    </div>
                    {sections.competencia5?.analise && (
                      <div className='text-xs font-body text-soft-gray-900 dark:text-soft-gray-200'>
                        <SafeHTML htmlContent={sections.competencia5.analise} />
                      </div>
                    )}
                  </div>

                  {/* Análise Final da IA */}
                  {feedbackData && (
                    <div className='bg-pastel-blue-50 dark:bg-pastel-blue-900/20 rounded-2xl p-6 border border-pastel-blue-200/30 dark:border-pastel-blue-400/20'>
                      <h5 className='font-display font-semibold text-pastel-purple-custom mb-4'>
                        Análise Final da IA
                      </h5>
                      <div className='space-y-4'>
                        <div>
                          <h6 className='font-semibold text-green-600 dark:text-green-400 mb-2'>
                            Pontos Fortes:
                          </h6>
                          <div className='text-sm font-body text-soft-gray-900 dark:text-soft-gray-200'>
                            <SafeHTML htmlContent={sections.pontosFortes || 'Análise detalhada dos pontos fortes será exibida aqui.'} />
                          </div>
                        </div>
                        <div>
                          <h6 className='font-semibold text-orange-600 dark:text-orange-400 mb-2'>
                            Pontos a Melhorar:
                          </h6>
                          <div className='text-sm font-body text-soft-gray-900 dark:text-soft-gray-200'>
                            <SafeHTML htmlContent={sections.pontosFracos || 'Sugestões de melhoria serão exibidas aqui.'} />
                          </div>
                        </div>
                        <div>
                          <h6 className='font-semibold text-blue-600 dark:text-blue-400 mb-2'>
                            Comentários Gerais:
                          </h6>
                          <div className='text-sm font-body text-soft-gray-900 dark:text-soft-gray-200 whitespace-pre-wrap'>
                            <SafeHTML htmlContent={sections.comentariosGerais || 'Comentários gerais da análise serão exibidos aqui.'} />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default EssayDetailsModal;
