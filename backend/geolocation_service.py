"""
Serviço de geolocalização para capturar e processar dados de visitantes
"""

import os
import sqlite3
import geoip2.database
import geoip2.errors
from user_agents import parse
from datetime import datetime
from typing import Optional, Dict, Any
import logging

logger = logging.getLogger(__name__)

class GeolocationService:
    def __init__(self, db_path: str = None):
        self.db_path = db_path or os.path.join(os.path.dirname(__file__), 'database.db')
        self.geoip_db_path = os.path.join(os.path.dirname(__file__), 'GeoLite2-City.mmdb')
        self.geoip_reader = None
        
        # Tentar inicializar o leitor GeoIP
        if os.path.exists(self.geoip_db_path):
            try:
                self.geoip_reader = geoip2.database.Reader(self.geoip_db_path)
            except Exception as e:
                logger.warning(f"Não foi possível carregar GeoLite2-City.mmdb: {e}")
        else:
            logger.warning("GeoLite2-City.mmdb não encontrado. Funcionalidade de geolocalização limitada.")
    
    def get_location_from_ip(self, ip_address: str) -> Dict[str, Any]:
        """Obtém informações de localização a partir do IP"""
        location_data = {
            'country': None,
            'region': None,
            'city': None,
            'latitude': None,
            'longitude': None
        }
        
        if not self.geoip_reader or not ip_address or ip_address in ['127.0.0.1', 'localhost']:
            # Para IPs locais, usar dados fictícios para demonstração
            if ip_address in ['127.0.0.1', 'localhost']:
                location_data.update({
                    'country': 'Brasil',
                    'region': 'São Paulo',
                    'city': 'São Paulo',
                    'latitude': -23.5505,
                    'longitude': -46.6333
                })
            return location_data
        
        try:
            response = self.geoip_reader.city(ip_address)
            location_data.update({
                'country': response.country.name or response.country.iso_code,
                'region': response.subdivisions.most_specific.name,
                'city': response.city.name,
                'latitude': float(response.location.latitude) if response.location.latitude else None,
                'longitude': float(response.location.longitude) if response.location.longitude else None
            })
        except geoip2.errors.AddressNotFoundError:
            logger.debug(f"IP {ip_address} não encontrado na base GeoIP")
        except Exception as e:
            logger.error(f"Erro ao processar IP {ip_address}: {e}")
        
        return location_data
    
    def parse_user_agent(self, user_agent_string: str) -> Dict[str, Any]:
        """Analisa o User-Agent para extrair informações do dispositivo"""
        device_data = {
            'browser': None,
            'browser_version': None,
            'os': None,
            'os_version': None,
            'device_type': 'Desktop'
        }
        
        if not user_agent_string:
            return device_data
        
        try:
            user_agent = parse(user_agent_string)
            
            device_data.update({
                'browser': user_agent.browser.family,
                'browser_version': user_agent.browser.version_string,
                'os': user_agent.os.family,
                'os_version': user_agent.os.version_string,
                'device_type': 'Mobile' if user_agent.is_mobile else 'Tablet' if user_agent.is_tablet else 'Desktop'
            })
        except Exception as e:
            logger.error(f"Erro ao analisar User-Agent: {e}")
        
        return device_data
    
    def log_access(self, ip_address: str, user_agent: str, endpoint: str, method: str):
        """Registra um acesso no banco de dados"""
        try:
            # Obter dados de localização
            location_data = self.get_location_from_ip(ip_address)
            
            # Analisar User-Agent
            device_data = self.parse_user_agent(user_agent)
            
            # Salvar no banco
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute("""
                INSERT INTO access_logs (
                    ip_address, country, region, city, latitude, longitude,
                    browser, browser_version, os, os_version, device_type,
                    user_agent, endpoint, method, timestamp
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                ip_address,
                location_data['country'],
                location_data['region'],
                location_data['city'],
                location_data['latitude'],
                location_data['longitude'],
                device_data['browser'],
                device_data['browser_version'],
                device_data['os'],
                device_data['os_version'],
                device_data['device_type'],
                user_agent,
                endpoint,
                method,
                datetime.now().isoformat()
            ))
            
            conn.commit()
            conn.close()
            
        except Exception as e:
            logger.error(f"Erro ao registrar acesso: {e}")
    
    def get_analytics_data(self) -> Dict[str, Any]:
        """Obtém dados agregados para o dashboard"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Dados de países
            cursor.execute("""
                SELECT country, COUNT(*) as visits 
                FROM access_logs 
                WHERE country IS NOT NULL 
                GROUP BY country 
                ORDER BY visits DESC 
                LIMIT 20
            """)
            countries = [{'name': row[0], 'visits': row[1]} for row in cursor.fetchall()]
            
            # Dados de regiões
            cursor.execute("""
                SELECT region, country, COUNT(*) as visits 
                FROM access_logs 
                WHERE region IS NOT NULL 
                GROUP BY region, country 
                ORDER BY visits DESC 
                LIMIT 20
            """)
            regions = [{'name': row[0], 'country': row[1], 'visits': row[2]} for row in cursor.fetchall()]
            
            # Dados de cidades
            cursor.execute("""
                SELECT city, region, country, COUNT(*) as visits 
                FROM access_logs 
                WHERE city IS NOT NULL 
                GROUP BY city, region, country 
                ORDER BY visits DESC 
                LIMIT 20
            """)
            cities = [{'name': row[0], 'region': row[1], 'country': row[2], 'visits': row[3]} for row in cursor.fetchall()]
            
            # Dados de navegadores
            cursor.execute("""
                SELECT browser, COUNT(*) as visits 
                FROM access_logs 
                WHERE browser IS NOT NULL 
                GROUP BY browser 
                ORDER BY visits DESC 
                LIMIT 10
            """)
            browsers = [{'name': row[0], 'visits': row[1]} for row in cursor.fetchall()]
            
            # Dados de sistemas operacionais
            cursor.execute("""
                SELECT os, COUNT(*) as visits 
                FROM access_logs 
                WHERE os IS NOT NULL 
                GROUP BY os 
                ORDER BY visits DESC 
                LIMIT 10
            """)
            operating_systems = [{'name': row[0], 'visits': row[1]} for row in cursor.fetchall()]
            
            # Dados de dispositivos
            cursor.execute("""
                SELECT device_type, COUNT(*) as visits 
                FROM access_logs 
                WHERE device_type IS NOT NULL 
                GROUP BY device_type 
                ORDER BY visits DESC
            """)
            devices = [{'name': row[0], 'visits': row[1]} for row in cursor.fetchall()]
            
            conn.close()
            
            return {
                'countries': countries,
                'regions': regions,
                'cities': cities,
                'browsers': browsers,
                'operating_systems': operating_systems,
                'devices': devices
            }
            
        except Exception as e:
            logger.error(f"Erro ao obter dados de analytics: {e}")
            return {
                'countries': [],
                'regions': [],
                'cities': [],
                'browsers': [],
                'operating_systems': [],
                'devices': []
            }

# Instância global do serviço
geolocation_service = GeolocationService()