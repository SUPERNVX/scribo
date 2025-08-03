# Adicionar rota de logout ao admin_dashboard.py

@app.get("/logout")
async def logout(request: Request):
    """Logout - limpar sessão"""
    session_token = request.cookies.get("session_token")
    
    if session_token and session_token in ACTIVE_SESSIONS:
        del ACTIVE_SESSIONS[session_token]
        print(f"SESSION DELETED: {session_token}")
    
    response = RedirectResponse(url="/", status_code=302)
    response.delete_cookie("session_token")
    print("LOGOUT: Redirecionando para login")
    return response