// Parser para distribuir o feedback da IA nas seções corretas
import { processCompleteFeedback } from '../utils/aiResponseProcessor';

export const parseFeedback = feedback => {
  if (!feedback) return null;
  
  // Processar feedback da IA (remover pensamentos e formatar)
  const processedData = processCompleteFeedback(feedback);
  const processedFeedback = processedData.processed;

  const sections = {
    competencia1: '',
    competencia2: '',
    competencia3: '',
    competencia4: '',
    competencia5: '',
    pontosFortes: '',
    pontosFracos: '',
    comentariosGerais: '',
  };

  // Dividir o feedback em seções baseado em padrões comuns
  const text = processedFeedback.toLowerCase();

  // Padrões para identificar seções
  const patterns = {
    comp1:
      /competência\s*1|competencia\s*1|c1\s*[:|-]|domínio.*língua|modalidade.*escrita/i,
    comp2:
      /competência\s*2|competencia\s*2|c2\s*[:|-]|compreender.*proposta|aplicar.*conceitos/i,
    comp3:
      /competência\s*3|competencia\s*3|c3\s*[:|-]|selecionar.*informações|organizar.*argumentos/i,
    comp4:
      /competência\s*4|competencia\s*4|c4\s*[:|-]|mecanismos.*linguísticos|construção.*argumentação/i,
    comp5:
      /competência\s*5|competencia\s*5|c5\s*[:|-]|proposta.*intervenção|direitos.*humanos/i,
    fortes: /pontos?\s*fortes?|aspectos?\s*positivos?|qualidades|acertos/i,
    fracos:
      /pontos?\s*fracos?|pontos?\s*a\s*melhorar|aspectos?\s*negativos?|problemas|erros/i,
    gerais:
      /comentários?\s*gerais?|observações?\s*gerais?|considerações?\s*finais?|resumo/i,
  };

  // Dividir o texto em parágrafos
  const paragraphs = processedFeedback
    .split(/\n\s*\n|\r\n\s*\r\n/)
    .filter(p => p.trim());

  paragraphs.forEach(paragraph => {
    const lowerParagraph = paragraph.toLowerCase();

    // Verificar qual seção este parágrafo pertence
    if (patterns.comp1.test(lowerParagraph)) {
      sections.competencia1 += paragraph + '\n\n';
    } else if (patterns.comp2.test(lowerParagraph)) {
      sections.competencia2 += paragraph + '\n\n';
    } else if (patterns.comp3.test(lowerParagraph)) {
      sections.competencia3 += paragraph + '\n\n';
    } else if (patterns.comp4.test(lowerParagraph)) {
      sections.competencia4 += paragraph + '\n\n';
    } else if (patterns.comp5.test(lowerParagraph)) {
      sections.competencia5 += paragraph + '\n\n';
    } else if (patterns.fortes.test(lowerParagraph)) {
      sections.pontosFortes += paragraph + '\n\n';
    } else if (patterns.fracos.test(lowerParagraph)) {
      sections.pontosFracos += paragraph + '\n\n';
    } else if (patterns.gerais.test(lowerParagraph)) {
      sections.comentariosGerais += paragraph + '\n\n';
    } else {
      // Se não conseguir identificar, adicionar aos comentários gerais
      sections.comentariosGerais += paragraph + '\n\n';
    }
  });

  // Limpar strings vazias e espaços extras
  Object.keys(sections).forEach(key => {
    sections[key] = sections[key].trim();
  });

  return sections;
};

// Parser recriado baseado EXATAMENTE no system prompt do ENEM
export const parseStructuredFeedback = feedback => {
  if (!feedback) return null;
  
  // Processar feedback da IA (remover pensamentos e formatar)
  const processedData = processCompleteFeedback(feedback);
  let processedFeedback = processedData.processed;
  
  console.log('Feedback original:', feedback);
  console.log('Feedback processado:', processedFeedback);

  const sections = {
    competencia1: '',
    competencia2: '',
    competencia3: '',
    competencia4: '',
    competencia5: '',
    pontosFortes: '',
    pontosFracos: '',
    comentariosGerais: '',
  };

  // Marcadores EXATOS do system prompt do ENEM (sem asteriscos extras)
  const exactMarkers = {
    '**===COMPETENCIA_1_INICIO===**': {
      section: 'competencia1',
      end: '**===COMPETENCIA_1_FIM===**',
    },
    '**===COMPETENCIA_2_INICIO===**': {
      section: 'competencia2',
      end: '**===COMPETENCIA_2_FIM===**',
    },
    '**===COMPETENCIA_3_INICIO===**': {
      section: 'competencia3',
      end: '**===COMPETENCIA_3_FIM===**',
    },
    '**===COMPETENCIA_4_INICIO===**': {
      section: 'competencia4',
      end: '**===COMPETENCIA_4_FIM===**',
    },
    '**===COMPETENCIA_5_INICIO===**': {
      section: 'competencia5',
      end: '**===COMPETENCIA_5_FIM===**',
    },
    '**===PONTOS_FORTES_INICIO===**': {
      section: 'pontosFortes',
      end: '**===PONTOS_FORTES_FIM===**',
    },
    '**===PONTOS_FRACOS_INICIO===**': {
      section: 'pontosFracos',
      end: '**===PONTOS_FRACOS_FIM===**',
    },
    '**===COMENTARIOS_GERAIS_INICIO===**': {
      section: 'comentariosGerais',
      end: '**===COMENTARIOS_GERAIS_FIM===**',
    },
  };

  // Tentar extrair usando os marcadores exatos
  let foundExactFormat = false;
  Object.keys(exactMarkers).forEach(startMarker => {
    const { section, end: endMarker } = exactMarkers[startMarker];
    const startIndex = processedFeedback.indexOf(startMarker);
    const endIndex = processedFeedback.indexOf(endMarker);

    if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
      foundExactFormat = true;
      const content = processedFeedback
        .substring(startIndex + startMarker.length, endIndex)
        .trim();
      sections[section] = content;
      console.log(`Seção ${section} encontrada:`, content.substring(0, 100) + '...');
    }
  });

  if (foundExactFormat) {
    console.log('Formato exato encontrado, retornando seções:', sections);
    return sections;
  }

  // Fallback: buscar por padrões simples se os marcadores exatos não funcionarem
  console.log('Marcadores exatos não encontrados, usando fallback...');
  
  // Extrair competências por padrão simples
  for (let i = 1; i <= 5; i++) {
    const competenciaPattern = new RegExp(`Competência ${i}:([\\s\\S]*?)(?=Competência ${i + 1}:|✅ PONTOS FORTES|❌ PONTOS FRACOS|Comentários Gerais:|$)`, 'i');
    const match = processedFeedback.match(competenciaPattern);
    if (match) {
      sections[`competencia${i}`] = match[1].trim();
      console.log(`Competência ${i} extraída por fallback`);
    }
  }

  // Extrair pontos fortes
  const pontosFortes = processedFeedback.match(/✅ PONTOS FORTES([\\s\\S]*?)(?=❌ PONTOS FRACOS|Comentários Gerais:|$)/i);
  if (pontosFortes) {
    sections.pontosFortes = pontosFortes[1].trim();
    console.log('Pontos fortes extraídos por fallback');
  }

  // Extrair pontos fracos
  const pontosFracos = processedFeedback.match(/❌ PONTOS FRACOS([\\s\\S]*?)(?=Comentários Gerais:|$)/i);
  if (pontosFracos) {
    sections.pontosFracos = pontosFracos[1].trim();
    console.log('Pontos fracos extraídos por fallback');
  }

  // Extrair comentários gerais
  const comentarios = processedFeedback.match(/Comentários Gerais:([\\s\\S]*?)$/i);
  if (comentarios) {
    let comentariosTexto = comentarios[1].trim();
    // Remover texto em inglês dos comentários
    comentariosTexto = comentariosTexto.replace(/Okay, I need to evaluate.*$/gs, '');
    comentariosTexto = comentariosTexto.replace(/The thesis is clear.*$/gs, '');
    sections.comentariosGerais = comentariosTexto.trim();
    console.log('Comentários gerais extraídos por fallback');
  }

  console.log('Seções finais extraídas:', sections);
  return sections;
};

// Parser recriado para extrair notas baseado no system prompt do ENEM
export const parseCompetencyScores = feedback => {
  if (!feedback) return {};

  const scores = {
    comp1_score: null,
    comp2_score: null,
    comp3_score: null,
    comp4_score: null,
    comp5_score: null,
  };

  console.log('Extraindo notas do feedback...');

  // Padrões EXATOS baseados no system prompt do ENEM
  const exactPatterns = [
    /\*\*===COMPETENCIA_1_INICIO===\*\*[\s\S]*?\*\*NOTA:\*\*\s*(\d+)\/200/i,
    /\*\*===COMPETENCIA_2_INICIO===\*\*[\s\S]*?\*\*NOTA:\*\*\s*(\d+)\/200/i,
    /\*\*===COMPETENCIA_3_INICIO===\*\*[\s\S]*?\*\*NOTA:\*\*\s*(\d+)\/200/i,
    /\*\*===COMPETENCIA_4_INICIO===\*\*[\s\S]*?\*\*NOTA:\*\*\s*(\d+)\/200/i,
    /\*\*===COMPETENCIA_5_INICIO===\*\*[\s\S]*?\*\*NOTA:\*\*\s*(\d+)\/200/i,
  ];

  // Tentar extrair notas do formato exato
  let foundExact = false;
  exactPatterns.forEach((pattern, index) => {
    const match = feedback.match(pattern);
    if (match) {
      foundExact = true;
      const scoreKey = `comp${index + 1}_score`;
      scores[scoreKey] = parseInt(match[1]);
      console.log(`Nota Competência ${index + 1} encontrada:`, scores[scoreKey]);
    }
  });

  if (foundExact) {
    console.log('Notas extraídas com formato exato:', scores);
    return scores;
  }

  // Fallback para padrões antigos
  const patterns = [
    // Padrões como "Competência 1: 180/200" ou "C1: 180"
    /competência\s*1[:\-\s]*(\d+)(?:\/200)?/i,
    /competência\s*2[:\-\s]*(\d+)(?:\/200)?/i,
    /competência\s*3[:\-\s]*(\d+)(?:\/200)?/i,
    /competência\s*4[:\-\s]*(\d+)(?:\/200)?/i,
    /competência\s*5[:\-\s]*(\d+)(?:\/200)?/i,
  ];

  // Padrões alternativos
  const altPatterns = [
    /c1[:\-\s]*(\d+)/i,
    /c2[:\-\s]*(\d+)/i,
    /c3[:\-\s]*(\d+)/i,
    /c4[:\-\s]*(\d+)/i,
    /c5[:\-\s]*(\d+)/i,
  ];

  // Padrões para formato "NOTA:"
  const notePatterns = [
    /\*\*NOTA:\*\*\s*(\d+)\/200[\s\S]*?competência\s*1/i,
    /competência\s*1[\s\S]*?\*\*NOTA:\*\*\s*(\d+)\/200/i,
    /competência\s*2[\s\S]*?\*\*NOTA:\*\*\s*(\d+)\/200/i,
    /competência\s*3[\s\S]*?\*\*NOTA:\*\*\s*(\d+)\/200/i,
    /competência\s*4[\s\S]*?\*\*NOTA:\*\*\s*(\d+)\/200/i,
    /competência\s*5[\s\S]*?\*\*NOTA:\*\*\s*(\d+)\/200/i,
  ];

  // Tentar encontrar notas com padrões principais
  patterns.forEach((pattern, index) => {
    const match = feedback.match(pattern);
    if (match) {
      const scoreKey = `comp${index + 1}_score`;
      scores[scoreKey] = parseInt(match[1]);
    }
  });

  // Se não encontrou com padrões principais, tentar alternativos
  altPatterns.forEach((pattern, index) => {
    const scoreKey = `comp${index + 1}_score`;
    if (!scores[scoreKey]) {
      const match = feedback.match(pattern);
      if (match) {
        scores[scoreKey] = parseInt(match[1]);
      }
    }
  });

  // Tentar padrões de NOTA:
  notePatterns.forEach((pattern, index) => {
    const scoreKey = `comp${index + 1}_score`;
    if (!scores[scoreKey]) {
      const match = feedback.match(pattern);
      if (match) {
        scores[scoreKey] = parseInt(match[1]);
      }
    }
  });

  // Padrão para tabela de notas
  const tablePattern = /competência\s*(\d+)[^\d]*(\d+)/gi;
  let match;
  while ((match = tablePattern.exec(feedback)) !== null) {
    const compNum = parseInt(match[1]);
    const score = parseInt(match[2]);
    if (compNum >= 1 && compNum <= 5) {
      scores[`comp${compNum}_score`] = score;
    }
  }

  return scores;
};
