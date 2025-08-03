
from datetime import datetime, timedelta

# =================================================================
# Achievement Definitions
# =================================================================

ACHIEVEMENT_DEFINITIONS = {
    'first-essay': {
        'name': 'Primeira Redação',
        'description': 'Escreveu sua primeira redação.',
        'check_function': 'check_first_essay'
    },
    'week-streak': {
        'name': '7 Dias Consecutivos',
        'description': 'Escreveu redações por 7 dias seguidos.',
        'check_function': 'check_writing_streak',
        'params': {'days': 7}
    },
    'month-streak': {
        'name': '30 Dias Consecutivos',
        'description': 'Escreveu redações por 30 dias seguidos.',
        'check_function': 'check_writing_streak',
        'params': {'days': 30}
    },
    'perfectionist': {
        'name': 'Perfeccionista',
        'description': 'Nota 1000 em uma redação.',
        'check_function': 'check_perfect_score'
    },
    'prolific': {
        'name': 'Escritor Prolífico',
        'description': 'Escreveu 50 redações.',
        'check_function': 'check_essay_count',
        'params': {'count': 50}
    },
    'scholar': {
        'name': 'Acadêmico',
        'description': 'Média geral acima de 900.',
        'check_function': 'check_average_score',
        'params': {'score': 900}
    },
    'marathoner': {
        'name': 'Maratonista',
        'description': 'Escreveu 10 redações em um único mês.',
        'check_function': 'check_essays_in_month',
        'params': {'count': 10}
    },
    'perfect-score': {
        'name': 'Nota Mil',
        'description': 'Alcançou a nota máxima em uma redação.',
        'check_function': 'check_perfect_score'
    },
    'theme-explorer': {
        'name': 'Explorador de Temas',
        'description': 'Escreveu sobre 5 temas diferentes.',
        'check_function': 'check_distinct_themes',
        'params': {'count': 5}
    },
    'sprinter': {
        'name': 'Velocista',
        'description': 'Escreveu uma redação em menos de 30 minutos (não implementado).',
        'check_function': 'check_sprint_writer'
    },
    'persistent': {
        'name': 'Persistente',
        'description': 'Escreveu 100 redações.',
        'check_function': 'check_essay_count',
        'params': {'count': 100}
    },
    # Níveis (podem ser baseados no XP ou média)
    'beginner': {'name': 'Iniciante', 'description': 'Alcançou o Nível 1.', 'check_function': 'check_level', 'params': {'level': 1}},
    'apprentice': {'name': 'Aprendiz', 'description': 'Alcançou o Nível 5.', 'check_function': 'check_level', 'params': {'level': 5}},
    'competent': {'name': 'Competente', 'description': 'Alcançou o Nível 10.', 'check_function': 'check_level', 'params': {'level': 10}},
    'advanced': {'name': 'Avançado', 'description': 'Alcançou o Nível 15.', 'check_function': 'check_level', 'params': {'level': 15}},
    'expert': {'name': 'Expert', 'description': 'Alcançou o Nível 20.', 'check_function': 'check_level', 'params': {'level': 20}},
    'master': {'name': 'Mestre', 'description': 'Alcançou o Nível 25.', 'check_function': 'check_level', 'params': {'level': 25}},
}

# =================================================================
# Achievement Checking Functions
# =================================================================

async def check_first_essay(db, user_id):
    """Verifica se o usuário escreveu pelo menos uma redação."""
    count = await db.get_user_essay_count(user_id)
    return count['total_essays'] >= 1

async def check_essay_count(db, user_id, count):
    """Verifica se o usuário escreveu um número X de redações."""
    stats = await db.get_user_essay_count(user_id)
    return stats['total_essays'] >= count

async def check_perfect_score(db, user_id):
    """Verifica se o usuário alcançou nota 1000 em alguma redação."""
    stats = await db.get_user_essay_count(user_id)
    return stats['best_score'] is not None and stats['best_score'] >= 1000

async def check_average_score(db, user_id, score):
    """Verifica se a média de notas do usuário é superior a X."""
    stats = await db.get_user_essay_count(user_id)
    return stats['avg_score'] is not None and stats['avg_score'] >= score

async def check_writing_streak(db, user_id, days):
    """Verifica se o usuário escreveu redações por X dias consecutivos."""
    try:
        essays = await db.get_user_essays_dates(user_id)
        if len(essays) < days:
            return False

        dates = sorted([datetime.fromisoformat(e['created_at'].replace('Z', '+00:00')).date() for e in essays], reverse=True)
        unique_dates = sorted(list(set(dates)), reverse=True)

        if len(unique_dates) < days:
            return False

        for i in range(days - 1):
            if (unique_dates[i] - unique_dates[i+1]).days != 1:
                return False
        return True
    except Exception as e:
        print(f"Error in check_writing_streak: {e}")
        return False

async def check_distinct_themes(db, user_id, count):
    """Verifica se o usuário escreveu sobre X temas diferentes."""
    try:
        themes = await db.get_user_distinct_themes(user_id)
        return len(themes) >= count
    except Exception as e:
        print(f"Error in check_distinct_themes: {e}")
        return False

async def check_essays_in_month(db, user_id, count):
    """Verifica se o usuário escreveu X redações em um único mês."""
    try:
        essays_by_month = await db.get_user_essays_by_month(user_id)
        return any(month_count >= count for month_count in essays_by_month.values())
    except Exception as e:
        print(f"Error in check_essays_in_month: {e}")
        return False

async def check_sprint_writer(db, user_id):
    """Placeholder para verificar se escreveu uma redação rapidamente."""
    # Por enquanto, sempre retorna False pois não temos dados de tempo
    return False

async def check_level(db, user_id, level):
    """Verifica se o usuário alcançou um determinado nível."""
    try:
        stats = await db.get_user_essay_count(user_id)
        # Calcular nível baseado no XP (similar ao frontend)
        total_xp = (stats.get('total_essays', 0) * 10) + (stats.get('avg_score', 0) or 0) / 10
        user_level = int(total_xp / 100) + 1
        return user_level >= level
    except Exception as e:
        print(f"Error in check_level: {e}")
        return False

async def check_distinct_themes(db, user_id, count):
    """Verifica se o usuário escreveu sobre X temas diferentes."""
    distinct_themes = await db.get_user_distinct_themes(user_id)
    return len(distinct_themes) >= count

async def check_essays_in_month(db, user_id, count):
    """Verifica se o usuário escreveu X redações em um único mês."""
    essays_by_month = await db.get_user_essays_by_month(user_id)
    for month, num_essays in essays_by_month.items():
        if num_essays >= count:
            return True
    return False

async def check_sprint_writer(db, user_id):
    """(Não implementado) Verifica se o usuário escreveu uma redação em menos de 30 minutos."""
    # Esta lógica precisaria de timestamps de início e fim da escrita.
    return False

async def check_level(db, user_id, level):
    """Verifica se o usuário alcançou um determinado nível (baseado na média)."""
    stats = await db.get_user_essay_count(user_id)
    avg_score = stats.get('avg_score') or 0
    
    # Lógica de nível simples baseada na média
    user_level = 0
    if avg_score >= 950: user_level = 25  # Mestre
    elif avg_score >= 900: user_level = 20 # Expert
    elif avg_score >= 850: user_level = 15 # Avançado
    elif avg_score >= 800: user_level = 10 # Competente
    elif avg_score >= 700: user_level = 5  # Aprendiz
    elif avg_score > 0: user_level = 1    # Iniciante
        
    return user_level >= level

# =================================================================
# Main Achievement Service
# =================================================================

class AchievementService:
    def __init__(self, db):
        self.db = db
        self.check_functions = {
            'check_first_essay': check_first_essay,
            'check_essay_count': check_essay_count,
            'check_perfect_score': check_perfect_score,
            'check_average_score': check_average_score,
            'check_writing_streak': check_writing_streak,
            'check_distinct_themes': check_distinct_themes,
            'check_essays_in_month': check_essays_in_month,
            'check_sprint_writer': check_sprint_writer,
            'check_level': check_level,
        }

    async def get_user_achievements(self, user_id: str) -> list:
        """
        Verifica todas as conquistas para um determinado usuário e retorna uma lista
        daquelas que ele ganhou.
        """
        try:
            earned_achievements = []
            
            # Otimização: Obter estatísticas básicas uma vez
            user_stats = await self.db.get_user_essay_count(user_id)
            if not user_stats or user_stats.get('total_essays', 0) == 0:
                return []

            for achievement_id, details in ACHIEVEMENT_DEFINITIONS.items():
                func_name = details['check_function']
                func = self.check_functions.get(func_name)
                
                if func:
                    params = details.get('params', {})
                    # Passar o objeto db e user_id como primeiros argumentos
                    try:
                        if await func(self.db, user_id, **params):
                            earned_achievements.append({
                                'type': achievement_id,
                                'name': details['name'],
                                'description': details['description']
                            })
                    except TypeError as e:
                        # Lidar com funções que não aceitam parâmetros extras
                        try:
                            if await func(self.db, user_id):
                                earned_achievements.append({
                                    'type': achievement_id,
                                    'name': details['name'],
                                    'description': details['description']
                                })
                        except Exception as inner_e:
                            print(f"Error checking achievement {achievement_id}: {inner_e}")
                            continue
                    except Exception as e:
                        print(f"Error checking achievement {achievement_id}: {e}")
                        continue
            
            return earned_achievements
            
        except Exception as e:
            print(f"Error in get_user_achievements: {e}")
            return []

# Instância do serviço
# A ser inicializada no server.py com o adaptador de banco de dados
# achievement_service = AchievementService(db_adapter)

