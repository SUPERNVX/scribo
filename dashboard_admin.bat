@echo off
title Scribo Admin Dashboard - Inicializador
color 0B
cls

echo.
echo ===============================================
echo          SCRIBO ADMIN DASHBOARD
echo ===============================================
echo.
echo 🚀 Iniciando dashboard administrativo...
echo 📍 Com funcionalidade de geolocalização
echo.

REM Verificar se o Python está disponível
echo ⚙️  Verificando Python...
if not exist "D:\Python\python.exe" (
    echo ❌ Python não encontrado em D:\Python\python.exe
    echo 💡 Verifique se o Python está instalado no caminho correto
    pause
    exit /b 1
)
echo ✅ Python encontrado

REM Verificar se o diretório backend existe
if not exist "backend" (
    echo ❌ Diretório 'backend' não encontrado
    echo 💡 Execute este arquivo a partir da raiz do projeto Scribo
    pause
    exit /b 1
)

REM Navegar para o diretório backend
cd backend

REM Verificar se o arquivo admin_dashboard.py existe
if not exist "admin_dashboard.py" (
    echo ❌ Arquivo admin_dashboard.py não encontrado
    echo 💡 Verifique se você está na pasta correta do projeto
    pause
    exit /b 1
)

echo.
echo 📦 Verificando dependências...

REM Instalar dependências de geolocalização se necessário
echo 🔧 Instalando/verificando dependências de geolocalização...
D:\Python\Scripts\pip.exe install geoip2 user-agents --quiet

REM Executar migração de banco de dados
echo 🗄️  Executando migração do banco de dados...
if exist "migration_add_access_logs.py" (
    D:\Python\python.exe migration_add_access_logs.py
    if errorlevel 1 (
        echo ⚠️  Aviso: Erro na migração ou migração já executada
    ) else (
        echo ✅ Migração executada com sucesso
    )
) else (
    echo ⚠️  Arquivo de migração não encontrado - continuando...
)

echo.
echo ===============================================
echo 🌐 INICIANDO SERVIDOR ADMIN DASHBOARD
echo ===============================================
echo.
echo 📍 URL Principal: http://localhost:8001
echo 🗺️  Mapa Geográfico: http://localhost:8001/admin/map
echo 👤 Login: supernvxofc@gmail.com
echo 🔑 Senha: 9Lf$5;Zagaia
echo.
echo 💡 Pressione Ctrl+C para parar o servidor
echo ===============================================
echo.

REM Iniciar o dashboard administrativo
D:\Python\python.exe admin_dashboard.py

REM Se chegou aqui, o servidor foi encerrado
echo.
echo ===============================================
echo 🛑 SERVIDOR ENCERRADO
echo ===============================================
echo.
echo ✅ Dashboard administrativo finalizado
echo 📝 Pressione qualquer tecla para fechar...
pause > nul