/**
 * Processador de Respostas da IA
 * Remove pensamentos e formata texto com LaTeX/Markdown
 */

/**
 * Remove os blocos de pensamento <think>...</think> da resposta da IA
 * @param {string} text - Texto da resposta da IA
 * @returns {string} - Texto limpo sem os pensamentos
 */
export const removeAIThoughts = (text) => {
  if (!text || typeof text !== 'string') {
    return text;
  }

  // Remover blocos <think>...</think> (case insensitive, multiline)
  let cleanText = text.replace(/<think>[\s\S]*?<\/think>/gi, '');
  
  // Remover texto em inglês que aparece como "pensamentos" da IA
  cleanText = cleanText.replace(/Okay, I need to evaluate.*?Now, checking each competence\./gs, '');
  cleanText = cleanText.replace(/The thesis is clear.*?dissertativo-argumentativo, following the classical structure\./gs, '');
  cleanText = cleanText.replace(/Let me start by checking.*?structure i/gs, '');
  cleanText = cleanText.replace(/Total would be \d+\/1000.*?No major errors\./gs, '');
  cleanText = cleanText.replace(/But wait, maybe some competences.*?Feedback would highlight/gs, '');
  
  // Remover espaços extras que podem ter sobrado
  return cleanText.replace(/\n\s*\n\s*\n/g, '\n\n').trim();
};

/**
 * Converte formatação LaTeX/Markdown para HTML
 * @param {string} text - Texto com formatação LaTeX/Markdown
 * @returns {string} - Texto formatado em HTML
 */
export const formatLatexMarkdown = (text) => {
  if (!text || typeof text !== 'string') {
    return text;
  }

  let formatted = text;

  // Formatação de texto em negrito
  // **texto** ou __texto__ -> <strong>texto</strong>
  formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  formatted = formatted.replace(/__(.*?)__/g, '<strong>$1</strong>');

  // Formatação de texto em itálico
  // *texto* ou _texto_ -> <em>texto</em>
  formatted = formatted.replace(/(?<!\*)\*([^*\n]+?)\*(?!\*)/g, '<em>$1</em>');
  formatted = formatted.replace(/(?<!_)_([^_\n]+?)_(?!_)/g, '<em>$1</em>');

  // Formatação de código inline
  // `código` -> <code>código</code>
  formatted = formatted.replace(/`([^`]+?)`/g, '<code>$1</code>');

  // Formatação de títulos
  // ### Título -> <h3>Título</h3>
  formatted = formatted.replace(/^### (.*$)/gm, '<h3>$1</h3>');
  formatted = formatted.replace(/^## (.*$)/gm, '<h2>$1</h2>');
  formatted = formatted.replace(/^# (.*$)/gm, '<h1>$1</h1>');

  // Formatação de listas
  // - item -> <li>item</li> (dentro de <ul>)
  formatted = formatted.replace(/^- (.+)$/gm, '<li>$1</li>');
  formatted = formatted.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

  // Formatação de listas numeradas
  // 1. item -> <li>item</li> (dentro de <ol>)
  formatted = formatted.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');
  
  // Quebras de linha duplas -> parágrafos
  formatted = formatted.replace(/\n\n/g, '</p><p>');
  formatted = `<p>${formatted}</p>`;

  // Limpar parágrafos vazios
  formatted = formatted.replace(/<p><\/p>/g, '');
  formatted = formatted.replace(/<p>\s*<\/p>/g, '');

  return formatted;
};

/**
 * Processa completamente uma resposta da IA
 * Remove pensamentos e aplica formatação
 * @param {string} aiResponse - Resposta bruta da IA
 * @returns {string} - Resposta processada e formatada
 */
export const processAIResponse = (aiResponse) => {
  if (!aiResponse || typeof aiResponse !== 'string') {
    return aiResponse;
  }

  // 1. Remover pensamentos da IA
  let processed = removeAIThoughts(aiResponse);
  
  // 2. Aplicar formatação LaTeX/Markdown
  processed = formatLatexMarkdown(processed);
  
  return processed;
};

/**
 * Processa especificamente feedback de análise de parágrafo
 * @param {string} feedback - Feedback da análise
 * @returns {object} - Objeto com feedback processado e metadados
 */
export const processParagraphFeedback = (feedback) => {
  if (!feedback) {
    return { processed: '', hasThoughts: false, originalLength: 0 };
  }

  const originalLength = feedback.length;
  const hasThoughts = /<think>/i.test(feedback);
  
  const processed = processAIResponse(feedback);
  
  return {
    processed,
    hasThoughts,
    originalLength,
    processedLength: processed.length,
    thoughtsRemoved: hasThoughts
  };
};

/**
 * Extrai conteúdo entre dois marcadores de uma string.
 * @param {string} text - O texto completo.
 * @param {string} startMarker - O marcador de início.
 * @param {string} endMarker - O marcador de fim.
 * @returns {string|null} - O conteúdo extraído ou null se não encontrado.
 */
const extractSection = (text, startMarker, endMarker) => {
  const startIndex = text.indexOf(startMarker);
  if (startIndex === -1) {
    return null;
  }
  const endIndex = text.indexOf(endMarker, startIndex);
  if (endIndex === -1) {
    return text.substring(startIndex + startMarker.length).trim();
  }
  return text.substring(startIndex + startMarker.length, endIndex).trim();
};

/**
 * Processa feedback de análise completa
 * @param {string} feedback - Feedback da análise completa
 * @returns {object} - Objeto com feedback processado e seções separadas
 */
export const processCompleteFeedback = (feedback) => {
  if (!feedback) {
    return { processed: '', sections: {}, hasThoughts: false };
  }

  const hasThoughts = /<think>/i.test(feedback);
  // 1. Remove os pensamentos da IA do texto bruto PRIMEIRO.
  const cleanFeedback = removeAIThoughts(feedback);

  const sections = {};

  // Definições para ENEM (padrão original)
  const enemSectionDefinitions = {
    analiseEstrutural: { start: '### ANÁLISE ESTRUTURAL', end: '### AVALIAÇÃO POR COMPETÊNCIAS' },
    competencia1: { start: '**===COMPETENCIA_1_INICIO===**', end: '**===COMPETENCIA_1_FIM===**' },
    competencia2: { start: '**===COMPETENCIA_2_INICIO===**', end: '**===COMPETENCIA_2_FIM===**' },
    competencia3: { start: '**===COMPETENCIA_3_INICIO===**', end: '**===COMPETENCIA_3_FIM===**' },
    competencia4: { start: '**===COMPETENCIA_4_INICIO===**', end: '**===COMPETENCIA_4_FIM===**' },
    competencia5: { start: '**===COMPETENCIA_5_INICIO===**', end: '**===COMPETENCIA_5_FIM===**' },
    sinteseAvaliativa: { start: '### SÍNTESE AVALIATIVA', end: '### DEVOLUTIVA PEDAGÓGICA' },
    pontosFortes: { start: '**===PONTOS_FORTES_INICIO===**', end: '**===PONTOS_FORTES_FIM===**' },
    pontosFracos: { start: '**===PONTOS_FRACOS_INICIO===**', end: '**===PONTOS_FRACOS_FIM===**' },
    comentariosGerais: { start: '**===COMENTARIOS_GERAIS_INICIO===**', end: '**===COMENTARIOS_GERAIS_FIM===**' },
  };

  // Definições para outras faculdades (FUVEST, ITA, PUC-RJ, UNESP, UNIFESP)
  const otherSectionDefinitions = {
    analiseEstrutural: { start: '### ANÁLISE ESTRUTURAL', end: '### AVALIAÇÃO POR CRITÉRIOS' },
    competencia1: { start: '**===CRITERIO_1_INICIO===**', end: '**===CRITERIO_1_FIM===**' },
    competencia2: { start: '**===CRITERIO_2_INICIO===**', end: '**===CRITERIO_2_FIM===**' },
    competencia3: { start: '**===CRITERIO_3_INICIO===**', end: '**===CRITERIO_3_FIM===**' },
    competencia4: { start: '**===CRITERIO_4_INICIO===**', end: '**===CRITERIO_4_FIM===**' },
    competencia5: { start: '**===CRITERIO_5_INICIO===**', end: '**===CRITERIO_5_FIM===**' },
    sinteseAvaliativa: { start: '### SÍNTESE AVALIATIVA', end: '### DEVOLUTIVA PEDAGÓGICA' },
    pontosFortes: { start: '**===PONTOS_FORTES_INICIO===**', end: '**===PONTOS_FORTES_FIM===**' },
    pontosFracos: { start: '**===PONTOS_FRACOS_INICIO===**', end: '**===PONTOS_FRACOS_FIM===**' },
    comentariosGerais: { start: '**===COMENTARIOS_GERAIS_INICIO===**', end: '**===COMENTARIOS_GERAIS_FIM===**' },
  };

  // Definições para UNESP (critérios A, B, C, D, E)
  const unespSectionDefinitions = {
    analiseEstrutural: { start: '### ANÁLISE ESTRUTURAL', end: '### AVALIAÇÃO POR CRITÉRIOS' },
    competencia1: { start: '**===CRITERIO_A_INICIO===**', end: '**===CRITERIO_A_FIM===**' },
    competencia2: { start: '**===CRITERIO_B_INICIO===**', end: '**===CRITERIO_B_FIM===**' },
    competencia3: { start: '**===CRITERIO_C_INICIO===**', end: '**===CRITERIO_C_FIM===**' },
    competencia4: { start: '**===CRITERIO_D_INICIO===**', end: '**===CRITERIO_D_FIM===**' },
    competencia5: { start: '**===CRITERIO_E_INICIO===**', end: '**===CRITERIO_E_FIM===**' },
    sinteseAvaliativa: { start: '### SÍNTESE AVALIATIVA', end: '### DEVOLUTIVA PEDAGÓGICA' },
    pontosFortes: { start: '**===PONTOS_FORTES_INICIO===**', end: '**===PONTOS_FORTES_FIM===**' },
    pontosFracos: { start: '**===PONTOS_FRACOS_INICIO===**', end: '**===PONTOS_FRACOS_FIM===**' },
    comentariosGerais: { start: '**===COMENTARIOS_GERAIS_INICIO===**', end: '**===COMENTARIOS_GERAIS_FIM===**' },
  };

  // Detectar qual tipo de feedback baseado no conteúdo
  let sectionDefinitions;
  let isEnem = false;
  let isUnesp = false;
  
  if (cleanFeedback.includes('===COMPETENCIA_1_INICIO===')) {
    sectionDefinitions = enemSectionDefinitions;
    isEnem = true;
  } else if (cleanFeedback.includes('===CRITERIO_A_INICIO===')) {
    sectionDefinitions = unespSectionDefinitions;
    isUnesp = true;
  } else {
    sectionDefinitions = otherSectionDefinitions;
  }

  // 2. Extrai as seções do texto limpo (não formatado em HTML)
  Object.keys(sectionDefinitions).forEach(key => {
    const { start, end } = sectionDefinitions[key];
    const content = extractSection(cleanFeedback, start, end);
    
    if (content) {
      if (key.startsWith('competencia')) {
        // Padrões flexíveis para diferentes faculdades
        let notaMatch, nivelMatch, analiseMatch;
        
        if (isEnem) {
          // Padrões específicos do ENEM (0-200)
          notaMatch = content.match(/\*\*NOTA:\*\*\s*(\d+)\/200/);
          nivelMatch = content.match(/\*\*NÍVEL:\*\*\s*([\w\s\d]+)/);
          analiseMatch = content.match(/\*\*ANÁLISE:\*\*([\s\S]*)/);
        } else {
          // Padrões para outras faculdades (notas variadas)
          notaMatch = content.match(/\*\*NOTA:\*\*\s*(\d+)\/(\d+)/) || 
                     content.match(/\*\*NOTA:\*\*\s*(\d+)/);
          nivelMatch = content.match(/\*\*NÍVEL:\*\*\s*([\w\s\d]+)/);
          analiseMatch = content.match(/\*\*ANÁLISE:\*\*([\s\S]*)/);
        }
        
        sections[key] = {
          nota: notaMatch ? parseInt(notaMatch[1], 10) : null,
          nivel: nivelMatch ? nivelMatch[1].trim() : null,
          // 3. Formata para HTML APENAS o conteúdo da análise
          analise: analiseMatch ? formatLatexMarkdown(analiseMatch[1].trim()) : '',
          isEnem: isEnem, // Adicionar informação se é ENEM ou não
        };
      } else {
        // 3. Formata o conteúdo das outras seções para HTML
        sections[key] = formatLatexMarkdown(content);
      }
    }
  });

  // Extrai a nota final e o nível de desempenho geral da seção de síntese (que já foi extraída)
  const sinteseContent = extractSection(cleanFeedback, sectionDefinitions.sinteseAvaliativa.start, sectionDefinitions.sinteseAvaliativa.end) || '';
  
  // Padrões flexíveis para nota final baseado na faculdade
  let notaFinalMatch, nivelGeralMatch;
  
  if (isEnem) {
    // ENEM usa escala 0-1000
    notaFinalMatch = sinteseContent.match(/\*\*NOTA FINAL:\*\*\s*(\d+)\/1000/);
  } else {
    // Outras faculdades podem usar escalas diferentes (50, 100, etc.)
    notaFinalMatch = sinteseContent.match(/\*\*NOTA FINAL:\*\*\s*(\d+)\/(\d+)/) ||
                    sinteseContent.match(/\*\*NOTA FINAL:\*\*\s*(\d+)/);
  }
  
  nivelGeralMatch = sinteseContent.match(/\*\*NÍVEL DE DESEMPENHO GERAL:\*\*\s*([\w\s]+)/);

  sections.notaFinal = notaFinalMatch ? parseInt(notaFinalMatch[1], 10) : null;
  sections.nivelGeral = nivelGeralMatch ? nivelGeralMatch[1].trim() : null;

  // 4. O `processed` principal agora é o texto limpo e formatado, para garantir retrocompatibilidade
  const processed = formatLatexMarkdown(cleanFeedback);

  return {
    processed,
    sections,
    hasThoughts,
    thoughtsRemoved: hasThoughts,
  };
};

export default {
  removeAIThoughts,
  formatLatexMarkdown,
  processAIResponse,
  processParagraphFeedback,
  processCompleteFeedback
};