"""
Tier-based Rate Limiter
Implements rate limiting based on user tiers and analysis types
"""

import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, Tuple
from enum import Enum
from dataclasses import dataclass

from database_adapter import db_adapter

logger = logging.getLogger(__name__)

class AnalysisType(Enum):
    """Types of analysis available"""
    PARAGRAPH = "paragraph_analysis"
    COMPLETE = "essay_correction" 
    DEEP = "deep_analysis"

class UserTier(Enum):
    """User tier levels"""
    FREE = "free"
    PREMIUM = "premium"
    VITALICIO = "vitalicio"

@dataclass
class TierLimits:
    """Rate limits for each tier"""
    paragraph_weekly: int
    complete_weekly: int
    deep_weekly: int
    
    def get_limit(self, analysis_type: AnalysisType) -> int:
        """Get limit for specific analysis type"""
        if analysis_type == AnalysisType.PARAGRAPH:
            return self.paragraph_weekly
        elif analysis_type == AnalysisType.COMPLETE:
            return self.complete_weekly
        elif analysis_type == AnalysisType.DEEP:
            return self.deep_weekly
        return 0

class TierRateLimiter:
    """Rate limiter based on user tiers and analysis types"""
    
    def __init__(self):
        # Define tier limits as per requirements
        self.tier_limits = {
            UserTier.FREE: TierLimits(
                paragraph_weekly=30,
                complete_weekly=8,
                deep_weekly=3
            ),
            UserTier.PREMIUM: TierLimits(
                paragraph_weekly=200,
                complete_weekly=50,
                deep_weekly=20
            ),
            UserTier.VITALICIO: TierLimits(
                paragraph_weekly=-1,  # Unlimited
                complete_weekly=-1,   # Unlimited
                deep_weekly=-1        # Unlimited
            )
        }
        
        # Cache for user tiers to avoid frequent DB queries
        self._tier_cache: Dict[str, Tuple[UserTier, datetime]] = {}
        self._cache_ttl = timedelta(minutes=5)  # Cache tier for 5 minutes
    
    async def _get_user_tier(self, user_id: str) -> UserTier:
        """Get user tier with caching"""
        now = datetime.now()
        
        # Check cache first
        if user_id in self._tier_cache:
            cached_tier, cached_time = self._tier_cache[user_id]
            if now - cached_time < self._cache_ttl:
                return cached_tier
        
        # Fetch from database
        try:
            tier_str = await db_adapter.get_user_tier(user_id)
            tier = UserTier(tier_str) if tier_str in [t.value for t in UserTier] else UserTier.FREE
            
            # Update cache
            self._tier_cache[user_id] = (tier, now)
            return tier
            
        except Exception as e:
            logger.error(f"Error fetching user tier for {user_id}: {e}")
            return UserTier.FREE  # Default to free on error
    
    async def _get_weekly_usage(self, user_id: str, analysis_type: AnalysisType) -> int:
        """Get user's usage count for the current week"""
        try:
            # Get start of current week (Monday)
            now = datetime.now()
            days_since_monday = now.weekday()
            week_start = now - timedelta(days=days_since_monday, hours=now.hour, 
                                       minutes=now.minute, seconds=now.second, 
                                       microseconds=now.microsecond)
            
            # Query database for usage count
            usage_count = await db_adapter.get_user_analysis_usage(
                user_id=user_id,
                analysis_type=analysis_type.value,
                since=week_start
            )
            
            return usage_count
            
        except Exception as e:
            logger.error(f"Error getting weekly usage for {user_id}: {e}")
            return 0
    
    async def is_allowed(self, user_id: str, analysis_type: AnalysisType) -> Tuple[bool, Optional[str]]:
        """
        Check if user is allowed to make this type of analysis
        
        Returns:
            Tuple[bool, Optional[str]]: (is_allowed, error_message)
        """
        try:
            # Get user tier
            user_tier = await self._get_user_tier(user_id)
            
            # Check if user has unlimited access (vitalicio)
            if user_tier == UserTier.VITALICIO:
                return True, None
            
            # Get tier limits
            limits = self.tier_limits[user_tier]
            analysis_limit = limits.get_limit(analysis_type)
            
            # If limit is -1, it's unlimited
            if analysis_limit == -1:
                return True, None
            
            # Get current usage
            current_usage = await self._get_weekly_usage(user_id, analysis_type)
            
            # Check if under limit
            if current_usage < analysis_limit:
                return True, None
            
            # Generate appropriate error message
            analysis_names = {
                AnalysisType.PARAGRAPH: "análises de parágrafo",
                AnalysisType.COMPLETE: "correções completas",
                AnalysisType.DEEP: "análises profundas"
            }
            
            error_msg = f"Limite semanal de {analysis_names[analysis_type]} atingido ({current_usage}/{analysis_limit}). "
            
            if user_tier == UserTier.FREE:
                error_msg += "Considere fazer upgrade para Premium para mais análises."
            else:
                error_msg += "Limite será renovado na próxima segunda-feira."
            
            return False, error_msg
            
        except Exception as e:
            logger.error(f"Error checking rate limit for {user_id}: {e}")
            return False, "Erro interno ao verificar limite de uso"
    
    async def log_usage(self, user_id: str, analysis_type: AnalysisType) -> bool:
        """
        Log usage of an analysis type
        
        Returns:
            bool: True if logged successfully
        """
        try:
            await db_adapter.log_analysis_usage(
                user_id=user_id,
                analysis_type=analysis_type.value,
                timestamp=datetime.now()
            )
            return True
            
        except Exception as e:
            logger.error(f"Error logging usage for {user_id}: {e}")
            return False
    
    async def get_user_status(self, user_id: str) -> Dict[str, Any]:
        """
        Get comprehensive rate limit status for user
        
        Returns:
            Dict with usage information for all analysis types
        """
        try:
            user_tier = await self._get_user_tier(user_id)
            limits = self.tier_limits[user_tier]
            
            status = {
                "user_tier": user_tier.value,
                "analysis_types": {}
            }
            
            # Get status for each analysis type
            for analysis_type in AnalysisType:
                limit = limits.get_limit(analysis_type)
                
                if limit == -1:  # Unlimited
                    usage = await self._get_weekly_usage(user_id, analysis_type)
                    status["analysis_types"][analysis_type.value] = {
                        "usage": usage,
                        "limit": -1,
                        "remaining": -1,
                        "unlimited": True
                    }
                else:
                    usage = await self._get_weekly_usage(user_id, analysis_type)
                    remaining = max(0, limit - usage)
                    
                    status["analysis_types"][analysis_type.value] = {
                        "usage": usage,
                        "limit": limit,
                        "remaining": remaining,
                        "unlimited": False
                    }
            
            # Calculate next reset time (next Monday)
            now = datetime.now()
            days_until_monday = (7 - now.weekday()) % 7
            if days_until_monday == 0:  # If today is Monday
                days_until_monday = 7
            
            next_reset = now + timedelta(days=days_until_monday)
            next_reset = next_reset.replace(hour=0, minute=0, second=0, microsecond=0)
            
            status["reset_time"] = next_reset.isoformat()
            
            return status
            
        except Exception as e:
            logger.error(f"Error getting user status for {user_id}: {e}")
            return {
                "user_tier": "free",
                "analysis_types": {},
                "error": "Erro ao carregar status"
            }
    
    def clear_tier_cache(self, user_id: Optional[str] = None):
        """Clear tier cache for specific user or all users"""
        if user_id:
            self._tier_cache.pop(user_id, None)
        else:
            self._tier_cache.clear()

# Global instance
tier_rate_limiter = TierRateLimiter()