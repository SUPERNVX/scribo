"""
API endpoints para gerenciamento de tiers de usuários
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timedelta
import logging

from auth import create_get_current_user_dependency
from database_adapter import db_adapter

# Create router
router = APIRouter(prefix="/api/user", tags=["user-tiers"])

# Get current user dependency
get_current_user = create_get_current_user_dependency(db_adapter)

logger = logging.getLogger(__name__)

# Request/Response models
class TierResponse(BaseModel):
    tier: str
    expires_at: Optional[str] = None
    is_active: bool
    days_remaining: Optional[int] = None

class UpdateTierRequest(BaseModel):
    tier: str
    expires_at: Optional[str] = None

class TierLimits(BaseModel):
    weekly: dict
    features: dict

@router.get("/tier", response_model=TierResponse)
async def get_user_tier(current_user = Depends(get_current_user)):
    """Get current user's tier information"""
    try:
        # Check tier expiration first
        await db_adapter.check_tier_expiration(current_user.id)
        
        # Get current tier
        tier = await db_adapter.get_user_tier(current_user.id)
        
        # Get tier details if user exists in database
        tier_details = await db_adapter.get_user_tier_details(current_user.id)
        
        expires_at = None
        days_remaining = None
        is_active = True
        
        if tier_details and tier_details.get('tier_expires_at'):
            expires_at = tier_details['tier_expires_at']
            try:
                expiry_date = datetime.fromisoformat(expires_at)
                days_remaining = (expiry_date - datetime.utcnow()).days
                is_active = days_remaining > 0
            except:
                pass
        
        return TierResponse(
            tier=tier,
            expires_at=expires_at,
            is_active=is_active,
            days_remaining=days_remaining
        )
        
    except Exception as e:
        logger.error(f"Error getting user tier: {e}")
        # Fallback to free tier
        return TierResponse(
            tier="free",
            expires_at=None,
            is_active=True,
            days_remaining=None
        )

@router.get("/tier/limits", response_model=TierLimits)
async def get_tier_limits(current_user = Depends(get_current_user)):
    """Get limits for current user's tier"""
    try:
        tier = await db_adapter.get_user_tier(current_user.id)
        
        # Define tier limits (matching frontend)
        tier_limits = {
            "free": {
                "weekly": {
                    "paragraph_analysis": 30,
                    "essay_correction": 8,
                    "deep_analysis": 3
                },
                "features": {
                    "analytics": False,
                    "advanced_reports": False,
                    "comparison": False,
                    "priority_support": False,
                    "advanced_badges": False,
                    "essay_history_days": 30
                }
            },
            "premium": {
                "weekly": {
                    "paragraph_analysis": 200,
                    "essay_correction": 50,
                    "deep_analysis": 20
                },
                "features": {
                    "analytics": True,
                    "advanced_reports": True,
                    "comparison": True,
                    "priority_support": True,
                    "advanced_badges": True,
                    "essay_history_days": None
                }
            },
            # Future implementation: vitalicio tier
            "vitalicio": {
                "weekly": {
                    "paragraph_analysis": -1,  # Unlimited
                    "essay_correction": -1,    # Unlimited
                    "deep_analysis": -1        # Unlimited
                },
                "features": {
                    "analytics": True,
                    "advanced_reports": True,
                    "comparison": True,
                    "priority_support": True,
                    "advanced_badges": True,
                    "essay_history_days": None,
                    "exclusive_features": True,
                    "api_access": True
                }
            }
        }
        
        limits = tier_limits.get(tier, tier_limits["free"])
        
        return TierLimits(
            weekly=limits["weekly"],
            features=limits["features"]
        )
        
    except Exception as e:
        logger.error(f"Error getting tier limits: {e}")
        # Fallback to free limits
        return TierLimits(
            weekly={"paragraph_analysis": 30, "essay_correction": 8, "deep_analysis": 3},
            features={"analytics": False, "advanced_reports": False, "comparison": False}
        )

# Admin endpoints
@router.post("/admin/tier/update")
async def admin_update_user_tier(
    user_id: str,
    tier_request: UpdateTierRequest,
    current_user = Depends(get_current_user)
):
    """Admin endpoint to update user tier"""
    # Check if user is admin (this would need proper admin check)
    if not getattr(current_user, 'is_admin', False):
        raise HTTPException(status_code=403, detail="Admin privileges required")
    
    try:
        success = await db_adapter.update_user_tier(
            user_id=user_id,
            tier=tier_request.tier,
            expires_at=tier_request.expires_at
        )
        
        if not success:
            raise HTTPException(status_code=404, detail="User not found or update failed")
        
        return {"message": f"User tier updated to {tier_request.tier}", "success": True}
        
    except Exception as e:
        logger.error(f"Error updating user tier: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update tier: {str(e)}")

@router.post("/admin/tier/grant-premium")
async def admin_grant_premium(
    user_id: str,
    days: int = 30,
    current_user = Depends(get_current_user)
):
    """Admin endpoint to grant premium access for specified days"""
    if not getattr(current_user, 'is_admin', False):
        raise HTTPException(status_code=403, detail="Admin privileges required")
    
    try:
        expires_at = (datetime.utcnow() + timedelta(days=days)).isoformat()
        
        success = await db_adapter.update_user_tier(
            user_id=user_id,
            tier="premium",
            expires_at=expires_at
        )
        
        if not success:
            raise HTTPException(status_code=404, detail="User not found")
        
        return {
            "message": f"Premium access granted for {days} days",
            "expires_at": expires_at,
            "success": True
        }
        
    except Exception as e:
        logger.error(f"Error granting premium: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to grant premium: {str(e)}")

@router.post("/admin/tier/grant-vitalicio")
async def admin_grant_vitalicio(
    user_id: str,
    current_user = Depends(get_current_user)
):
    """Admin endpoint to grant vitalicio (lifetime) access"""
    if not getattr(current_user, 'is_admin', False):
        raise HTTPException(status_code=403, detail="Admin privileges required")
    
    try:
        success = await db_adapter.update_user_tier(
            user_id=user_id,
            tier="vitalicio",
            expires_at=None  # Vitalicio never expires
        )
        
        if not success:
            raise HTTPException(status_code=404, detail="User not found")
        
        return {
            "message": "Vitalicio (lifetime) access granted",
            "tier": "vitalicio",
            "expires_at": None,
            "success": True
        }
        
    except Exception as e:
        logger.error(f"Error granting vitalicio: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to grant vitalicio: {str(e)}")