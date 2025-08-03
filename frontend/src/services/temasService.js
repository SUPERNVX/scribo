// Serviço para gerenciar temas de redação
import temasData from '../data/temas.json';

// Temas preset que sempre aparecem
const TEMAS_PRESET = [
  {
    id: 'preset_1',
    titulo: 'A importância da educação digital na formação cidadã',
    descricao:
      'Discuta como a educação digital pode contribuir para a formação de cidadãos mais conscientes e participativos na sociedade contemporânea.',
    faculdade: 'USP',
    estilo: 'Dissertativo-Argumentativo',
    ano: 2024,
    area: 'Educação e Tecnologia',
    caracteristicas: [
      'Argumentação sólida',
      'Exemplificação',
      'Proposta de intervenção',
      'Coesão textual',
    ],
  },
  {
    id: 'preset_2',
    titulo:
      'Sustentabilidade urbana: desafios e soluções para as cidades do futuro',
    descricao:
      'Analise os principais desafios ambientais enfrentados pelas grandes cidades e proponha soluções sustentáveis para o desenvolvimento urbano.',
    faculdade: 'UNESP',
    estilo: 'Dissertativo-Argumentativo',
    ano: 2024,
    area: 'Meio Ambiente',
    caracteristicas: [
      'Análise crítica',
      'Dados estatísticos',
      'Proposta viável',
      'Linguagem formal',
    ],
  },
  {
    id: 'preset_3',
    titulo: 'O papel das redes sociais na construção da identidade juvenil',
    descricao:
      'Examine como as plataformas digitais influenciam a formação da identidade dos jovens e seus impactos na sociedade.',
    faculdade: 'UFRJ',
    estilo: 'Dissertativo-Argumentativo',
    ano: 2024,
    area: 'Sociedade e Tecnologia',
    caracteristicas: [
      'Contextualização',
      'Argumentos consistentes',
      'Exemplos atuais',
      'Conclusão reflexiva',
    ],
  },
  {
    id: 'preset_4',
    titulo: 'Desigualdade social e acesso à saúde no Brasil',
    descricao:
      'Discuta como as desigualdades socioeconômicas afetam o acesso aos serviços de saúde e proponha medidas para democratizar o atendimento médico.',
    faculdade: 'UFMG',
    estilo: 'Dissertativo-Argumentativo',
    ano: 2024,
    area: 'Saúde Pública',
    caracteristicas: [
      'Problematização',
      'Argumentação social',
      'Dados relevantes',
      'Solução prática',
    ],
  },
  {
    id: 'preset_5',
    titulo: 'A influência da inteligência artificial no mercado de trabalho',
    descricao:
      'Analise os impactos da automação e da IA nas profissões tradicionais e discuta estratégias de adaptação para os trabalhadores.',
    faculdade: 'PUC-SP',
    estilo: 'Dissertativo-Argumentativo',
    ano: 2024,
    area: 'Tecnologia e Trabalho',
    caracteristicas: [
      'Visão futurista',
      'Análise econômica',
      'Propostas inovadoras',
      'Coerência argumentativa',
    ],
  },
];

// Definições de estilos de redação
const ESTILOS_DEFINICOES = {
  'Dissertativo-Argumentativo': {
    nome: 'Dissertativo-Argumentativo',
    descricao:
      'Texto que apresenta uma tese e a defende com argumentos consistentes, dados e exemplos, culminando em uma proposta de intervenção.',
    caracteristicas: [
      'Tese clara',
      'Argumentação sólida',
      'Exemplificação',
      'Proposta de intervenção',
      'Coesão textual',
    ],
  },
  Dissertativo: {
    nome: 'Dissertativo',
    descricao:
      'Texto expositivo que desenvolve um tema de forma objetiva, apresentando informações e reflexões sem necessariamente defender uma tese.',
    caracteristicas: [
      'Exposição clara',
      'Desenvolvimento lógico',
      'Linguagem formal',
      'Estrutura organizada',
      'Imparcialidade',
    ],
  },
};

/**
 * Serviço para gerenciar temas de redação com seleção aleatória
 */
class TemasService {
  constructor() {
    // Combinar temas preset com temas do arquivo JSON
    this.todosOsTemas = [...TEMAS_PRESET, ...temasData.temas];
    this.estilosDefinicoes = ESTILOS_DEFINICOES;
    this.temasExibidos = new Set(); // Para evitar repetição na mesma sessão
  }

  /**
   * Obtém 5 temas aleatórios para exibição (mistura presets + temas do JSON)
   * @returns {Array} Array com 5 temas aleatórios
   */
  getTemasAleatorios(quantidade = 5) {
    // Combinar todos os temas disponíveis
    const todosOsTemasDisponiveis = [...this.todosOsTemas];
    
    // Embaralhar todos os temas
    const temasEmbaralhados = todosOsTemasDisponiveis.sort(() => Math.random() - 0.5);
    
    // Retornar a quantidade solicitada
    return temasEmbaralhados.slice(0, quantidade);
  }

  /**
   * Obtém um tema específico por ID
   * @param {string|number} id - ID do tema
   * @returns {Object|null} Tema encontrado ou null
   */
  getTemaById(id) {
    return this.todosOsTemas.find(tema => tema.id == id) || null;
  }

  /**
   * Obtém definição de um estilo de redação
   * @param {string} estilo - Nome do estilo
   * @returns {Object|null} Definição do estilo ou null
   */
  getEstiloDefinicao(estilo) {
    return this.estilosDefinicoes[estilo] || null;
  }

  /**
   * Obtém todos os temas disponíveis
   * @returns {Array} Array com todos os temas
   */
  getTodosOsTemas() {
    return this.todosOsTemas;
  }

  /**
   * Filtra temas por critérios
   * @param {Object} filtros - Objeto com critérios de filtro
   * @returns {Array} Temas filtrados
   */
  filtrarTemas(filtros = {}) {
    let temasFiltrados = this.todosOsTemas;

    if (filtros.faculdade) {
      temasFiltrados = temasFiltrados.filter(tema =>
        tema.faculdade.toLowerCase().includes(filtros.faculdade.toLowerCase())
      );
    }

    if (filtros.area) {
      temasFiltrados = temasFiltrados.filter(tema =>
        tema.area.toLowerCase().includes(filtros.area.toLowerCase())
      );
    }

    if (filtros.estilo) {
      temasFiltrados = temasFiltrados.filter(tema =>
        tema.estilo.toLowerCase().includes(filtros.estilo.toLowerCase())
      );
    }

    if (filtros.ano) {
      temasFiltrados = temasFiltrados.filter(tema => tema.ano == filtros.ano);
    }

    return temasFiltrados;
  }

  /**
   * Busca temas por texto
   * @param {string} texto - Texto para busca
   * @returns {Array} Temas encontrados
   */
  buscarTemas(texto) {
    if (!texto || texto.trim() === '') {
      return this.todosOsTemas;
    }

    const textoBusca = texto.toLowerCase().trim();

    return this.todosOsTemas.filter(
      tema =>
        tema.titulo.toLowerCase().includes(textoBusca) ||
        tema.descricao.toLowerCase().includes(textoBusca) ||
        tema.area.toLowerCase().includes(textoBusca) ||
        tema.faculdade.toLowerCase().includes(textoBusca)
    );
  }

  /**
   * Obtém estatísticas dos temas
   * @returns {Object} Estatísticas
   */
  getEstatisticas() {
    const faculdades = [
      ...new Set(this.todosOsTemas.map(tema => tema.faculdade)),
    ];
    const areas = [...new Set(this.todosOsTemas.map(tema => tema.area))];
    const estilos = [...new Set(this.todosOsTemas.map(tema => tema.estilo))];
    const anos = [...new Set(this.todosOsTemas.map(tema => tema.ano))].sort();

    return {
      totalTemas: this.todosOsTemas.length,
      faculdades: faculdades.length,
      areas: areas.length,
      estilos: estilos.length,
      anoMaisAntigo: Math.min(...anos),
      anoMaisRecente: Math.max(...anos),
      listaFaculdades: faculdades,
      listaAreas: areas,
      listaEstilos: estilos,
    };
  }

  /**
   * Reseta a sessão de temas exibidos
   */
  resetarSessao() {
    this.temasExibidos.clear();
  }

  /**
   * Obtém temas por dificuldade
   * @param {string} dificuldade - Nível de dificuldade
   * @returns {Array} Temas da dificuldade especificada
   */
  getTemasPorDificuldade(dificuldade) {
    return this.todosOsTemas.filter(
      tema =>
        tema.dificuldade &&
        tema.dificuldade.toLowerCase() === dificuldade.toLowerCase()
    );
  }

  /**
   * Obtém um tema aleatório de uma categoria específica
   * @param {string} categoria - Categoria (area, faculdade, etc.)
   * @param {string} valor - Valor da categoria
   * @returns {Object|null} Tema aleatório ou null
   */
  getTemaAleatorioCategoria(categoria, valor) {
    const temasFiltrados = this.todosOsTemas.filter(
      tema =>
        tema[categoria] &&
        tema[categoria].toLowerCase().includes(valor.toLowerCase())
    );

    if (temasFiltrados.length === 0) return null;

    const indiceAleatorio = Math.floor(Math.random() * temasFiltrados.length);
    return temasFiltrados[indiceAleatorio];
  }
}

// Instância única do serviço
const temasService = new TemasService();

export default temasService;
