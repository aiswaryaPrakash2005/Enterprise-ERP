from typing import List
from fastapi import Depends, HTTPException, status
from app.auth.jwt import get_current_user
from app.models.user import User

def require_roles(allowed_roles: List[str]):
    def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role not in allowed_roles and current_user.role != "Admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"User role '{current_user.role}' is not authorized to perform this operation. Allowed: {allowed_roles}"
            )
        return current_user
    return role_checker
