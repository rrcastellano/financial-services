@echo off
rem stop_server.bat
rem Script para encerrar o servidor do Aura Cognitive FSI Suite no Windows.
chcp 65001 >nul

rem Altera para o diretório onde o script está localizado
cd /d "%~dp0"

echo ==========================================================
echo    Encerrando Aura Cognitive FSI Suite na porta 8000...
echo ==========================================================

rem 1. Busca o PID do processo que está ocupando a porta 8000
set PID=
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000 ^| findstr LISTENING') do (
    set PID=%%a
)

if "%PID%"=="" (
    echo [i] Nenhum processo ativo encontrado rodando na porta 8000.
    echo ==========================================================
) else (
    echo [+] Processo encontrado rodando na porta 8000 (PID: %PID%^).
    echo [+] Encerrando processo...
    taskkill /F /PID %PID% >nul 2>&1
    
    rem Pequena verificação secundária
    ping -n 2 127.0.0.1 >nul
    set CHECK_PID=
    for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000 ^| findstr LISTENING') do (
        set CHECK_PID=%%a
    )
    
    if "%CHECK_PID%"=="" (
        echo [+] Servidor encerrado com sucesso!
    ) else (
        echo [X] Erro: Não foi possível encerrar o processo %PID%.
    )
    echo ==========================================================
)

echo Pressione qualquer tecla para fechar esta janela...
pause >nul
