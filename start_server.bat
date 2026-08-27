@echo off
rem start_server.bat
rem Script para iniciar o servidor do Aura Cognitive FSI Suite no Windows.
chcp 65001 >nul

rem Altera para o diretório onde o script está localizado
cd /d "%~dp0"

echo ==========================================================
echo    Iniciando Aura Cognitive FSI Suite na porta 8000...
echo ==========================================================

rem 1. Verifica se já existe um processo utilizando a porta 8000
set OLD_PID=
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000 ^| findstr LISTENING') do (
    set OLD_PID=%%a
)

if not "%OLD_PID%"=="" (
    echo [!] Encontrado processo ativo rodando na porta 8000 (PID: %OLD_PID%^).
    echo [!] Encerrando processo antigo...
    taskkill /F /PID %OLD_PID% >nul 2>&1
    ping -n 2 127.0.0.1 >nul
)

rem 2. Inicia o servidor em uma janela minimizada em segundo plano e direciona a saída para o arquivo de log
rem O comando 'start /MIN' cria uma nova janela minimizada para que o processo continue rodando após fechar esta janela.
start "Aura Server" /MIN cmd /c "npm run dev -- --port 8000 > server.log 2>&1"

rem 3. Pequeno delay para garantir inicialização
ping -n 3 127.0.0.1 >nul

rem 4. Verifica se o processo realmente subiu com sucesso na porta 8000
set NEW_PID=
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000 ^| findstr LISTENING') do (
    set NEW_PID=%%a
)

if not "%NEW_PID%"=="" (
    echo [+] Servidor iniciado com sucesso em segundo plano!
    echo [+] PID do Processo: %NEW_PID%
    echo [+] Acesse no navegador: http://localhost:8000/
    echo [+] Logs salvos em: server.log
    echo ==========================================================
    start http://localhost:8000/
) else (
    echo [X] Erro ao iniciar o servidor. Verifique os logs em server.log
    echo ==========================================================
)

echo Pressione qualquer tecla para fechar esta janela...
pause >nul
