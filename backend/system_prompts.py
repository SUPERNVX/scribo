"""
Sistema de System Prompts Personalizados por Faculdade
Carrega e gerencia prompts específicos para cada vestibular
"""
import os
import json
from typing import Dict, Optional, Any
from pathlib import Path

class SystemPromptsManager:
    """Gerenciador de system prompts personalizados por faculdade"""
    
    def __init__(self):
        self.prompts_cache = {}
        project_root = Path(__file__).parent.parent
        self.analysis_folder = project_root / "Análise"
        print(f"[DEBUG] Caminho absoluto para a pasta Análise: {self.analysis_folder}")
        
        # Mapeamento de theme_id para faculdade baseado nos JSONs reais
        self.theme_id_to_faculdade = {
            # ITA: IDs 32-47 (baseado no ITA.json)
            **{i: "ITA" for i in range(32, 48)},
            # FUVEST: IDs estimados 48-70
            **{i: "FUVEST" for i in range(48, 71)},
            # UNESP: IDs estimados 71-90
            **{i: "UNESP" for i in range(71, 91)},
            # UNIFESP: IDs estimados 91-110
            **{i: "UNIFESP" for i in range(91, 111)},
            # PUC-RJ: IDs estimados 111-130
            **{i: "PUC-RJ" for i in range(111, 131)},
            # ENEM: IDs 1-31 (padrão)
            **{i: "ENEM" for i in range(1, 32)}
        }
        
        self.load_all_prompts()
    
    def load_all_prompts(self):
        """Carrega todos os system prompts disponíveis"""
        try:
            if not self.analysis_folder.exists():
                print(f"[DEBUG] A pasta de análise não foi encontrada: {self.analysis_folder}")
                self._load_default_prompts()
                return
            
            print(f"Carregando prompts de: {self.analysis_folder}")
            faculdades = ['ITA', 'ENEM', 'FUVEST', 'UNESP', 'UNIFESP', 'PUC-RJ']
            
            for faculdade in faculdades:
                faculdade_path = self.analysis_folder / faculdade
                if faculdade_path.exists():
                    self._load_faculdade_prompts(faculdade, faculdade_path)
                else:
                    print(f"[DEBUG] Pasta não encontrada para {faculdade}")
            
            print(f"Prompts carregados para: {list(self.prompts_cache.keys())}")
            
        except Exception as e:
            print(f"Erro ao carregar prompts: {e}")
            self._load_default_prompts()
    
    def _load_faculdade_prompts(self, faculdade: str, faculdade_path: Path):
        """Carrega prompts de uma faculdade específica"""
        try:
            self.prompts_cache[faculdade] = {}
            prompt_files = {
                'paragraph': ['análise_parágrafo.txt', 'paragrafo.txt', 'paragraph.txt'],
                'full': ['análise_completa.txt', 'completa.txt', 'full.txt'],
                'deep': ['análise_profunda.txt', 'profunda.txt', 'deep.txt']
            }
            for analysis_type, possible_files in prompt_files.items():
                prompt_content = None
                for filename in possible_files:
                    file_path = faculdade_path / filename
                    if file_path.exists():
                        try:
                            with open(file_path, 'r', encoding='utf-8') as f:
                                prompt_content = f.read().strip()
                            print(f"[DEBUG] Prompt {faculdade}/{analysis_type} carregado de: {filename}")
                            break
                        except Exception as e:
                            print(f"[DEBUG] Erro ao ler {file_path}: {e}")
                if prompt_content:
                    self.prompts_cache[faculdade][analysis_type] = prompt_content
        except Exception as e:
            print(f"Erro ao carregar prompts de {faculdade}: {e}")
    
    def _load_default_prompts(self):
        """Carrega prompts padrão quando não há arquivos específicos"""
        print("Carregando prompts de fallback...")
        self.prompts_cache['ENEM'] = {
            'paragraph': """**Responda sempre em português do Brasil.** Analise este parágrafo de redação ENEM, avaliando adequação ao tema, argumentação, coesão e linguagem. Forneça feedback construtivo.\n\nParágrafo: {conteudo_paragrafo}\nTema: {tema}""",
            'full': """**Responda sempre em português do Brasil.** Analise esta redação ENEM completa, avaliando as 5 competências oficiais e fornecendo uma nota de 0 a 1000. Forneça feedback detalhado para cada competência.\n\nRedação: {conteudo_paragrafo}\nTema: {tema}"""
        }
    
    def get_prompt(self, faculdade: str, analysis_type: str, content: str, theme: str, metadata: Optional[Dict[str, Any]] = None) -> str:
        """
        Obtém o prompt personalizado para uma faculdade e tipo de análise
        """
        try:
            faculdade_norm = faculdade.upper().strip()
            if metadata is None: metadata = {}

            prompt_template = self.prompts_cache.get(faculdade_norm, {}).get(analysis_type)
            if not prompt_template:
                print(f"Prompt para {faculdade_norm}/{analysis_type} não encontrado. Usando fallback do ENEM.")
                prompt_template = self.prompts_cache.get('ENEM', {}).get(analysis_type, "Analise o texto a seguir em português: {conteudo_paragrafo}")
            else:
                print(f"Usando prompt personalizado para {faculdade_norm}/{analysis_type}")

            format_dict = {
                'conteudo_paragrafo': content,
                'tema': theme,
                'posicao': metadata.get('position', 'Não especificada'),
                'paragraph_content': content,
                'theme': theme,
                'position': metadata.get('position', 'Não especificada'),
                'content': content
            }
            
            try:
                return prompt_template.format(**format_dict)
            except KeyError as e:
                print(f"[DEBUG] Chave faltando na formatação do prompt: {e}. Usando formatação simples.")
                return prompt_template.format(conteudo_paragrafo=content, tema=theme, posicao=metadata.get('position', 'Não especificada'))

        except Exception as e:
            print(f"Erro crítico ao obter prompt: {e}")
            return f"**Responda em português.** Analise o seguinte texto sobre '{theme}':\n\n{content}"
    
    def detect_faculdade_from_theme(self, theme_data: Dict[str, Any]) -> str:
        """Detecta a faculdade baseada nos dados do tema"""
        try:
            print(f"[DEBUG] Detectando faculdade para: {theme_data}")
            
            if isinstance(theme_data, dict):
                # Primeiro, verifica se há campo 'faculdade' explícito
                faculdade = theme_data.get('faculdade', '').upper()
                if faculdade: 
                    print(f"[DEBUG] Faculdade detectada pelo campo 'faculdade': {faculdade}")
                    return faculdade
                
                # Verifica no título do tema
                title = theme_data.get('title', '').upper()
                print(f"[DEBUG] Verificando título: {title}")
                
                # Verificação específica para ENEM
                if 'ENEM' in title or 'DEMOCRATIZAÇÃO' in title or 'SAÚDE MENTAL' in title or 'EDUCAÇÃO FINANCEIRA' in title:
                    print(f"[DEBUG] Faculdade detectada pelo título: ENEM")
                    return 'ENEM'
                    
                if 'ITA' in title: 
                    print(f"[DEBUG] Faculdade detectada pelo título: ITA")
                    return 'ITA'
                if 'FUVEST' in title: 
                    print(f"[DEBUG] Faculdade detectada pelo título: FUVEST")
                    return 'FUVEST'
                if 'UNESP' in title: 
                    print(f"[DEBUG] Faculdade detectada pelo título: UNESP")
                    return 'UNESP'
                if 'UNIFESP' in title: 
                    print(f"[DEBUG] Faculdade detectada pelo título: UNIFESP")
                    return 'UNIFESP'
                if 'PUC' in title: 
                    print(f"[DEBUG] Faculdade detectada pelo título: PUC-RJ")
                    return 'PUC-RJ'
                
                # Verifica no theme_id se contém informação da faculdade
                theme_id = theme_data.get('theme_id', '')
                if theme_id:
                    print(f"[DEBUG] Verificando theme_id: {theme_id}")
                    # Se o theme_id for numérico, usa o mapeamento direto
                    try:
                        id_num = int(theme_id)
                        if id_num in self.theme_id_to_faculdade:
                            faculdade_detectada = self.theme_id_to_faculdade[id_num]
                            print(f"[DEBUG] Faculdade detectada pelo theme_id {id_num}: {faculdade_detectada}")
                            return faculdade_detectada
                    except (ValueError, TypeError):
                        print(f"[DEBUG] Theme_id não é numérico: {theme_id}")
                        pass
                
            elif isinstance(theme_data, str):
                theme_str = theme_data.upper()
                if 'ITA' in theme_str: 
                    print(f"[DEBUG] Faculdade detectada pela string: ITA")
                    return 'ITA'
                if 'FUVEST' in theme_str: 
                    print(f"[DEBUG] Faculdade detectada pela string: FUVEST")
                    return 'FUVEST'
                if 'UNESP' in theme_str: 
                    print(f"[DEBUG] Faculdade detectada pela string: UNESP")
                    return 'UNESP'
                if 'UNIFESP' in theme_str: 
                    print(f"[DEBUG] Faculdade detectada pela string: UNIFESP")
                    return 'UNIFESP'
                if 'PUC' in theme_str: 
                    print(f"[DEBUG] Faculdade detectada pela string: PUC-RJ")
                    return 'PUC-RJ'
            
            print(f"[DEBUG] Nenhuma faculdade específica detectada, usando ENEM como padrão")
            return 'ENEM'
        except Exception as e:
            print(f"Erro ao detectar faculdade: {e}")
            return 'ENEM'
    
    def get_available_faculdades(self) -> list:
        return list(self.prompts_cache.keys())
    
    def reload_prompts(self):
        self.prompts_cache.clear()
        self.load_all_prompts()

system_prompts_manager = SystemPromptsManager()