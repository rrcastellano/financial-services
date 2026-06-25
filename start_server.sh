#!/bin/bash

# start_server.sh
# Script para iniciar o servidor do Aura Cognitive FSI Suite em segundo plano na porta 8000.

# Resolve o diretório onde o script está localizado
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

echo "=========================================================="
echo "   Iniciando Aura Cognitive FSI Suite na porta 8000..."
echo "=========================================================="

# 1. Verifica se já existe um processo utilizando a porta 8000 e o encerra
PID=$(lsof -t -i:8000)
if [ ! -z "$PID" ]; then
  echo "[!] Encontrado processo ativo rodando na porta 8000 (PID: $PID)."
  echo "[!] Encerrando processo antigo..."
  kill -9 $PID 2>/dev/null
  sleep 1
fi

# 2. Inicia o servidor em segundo plano e direciona a saída para o arquivo de log
nohup npm run dev -- --port 8000 > server.log 2>&1 &
SERVER_PID=$!

# 3. Pequeno delay para garantir inicialização inicial
sleep 2

# 4. Verifica se o processo realmente subiu com sucesso
if ps -p $SERVER_PID > /dev/null; then
  echo "[+] Servidor iniciado com sucesso em segundo plano!"
  echo "[+] PID do Processo: $SERVER_PID"
  echo "[+] Acesse no navegador: http://localhost:8000/"
  echo "[+] Logs salvos em: server.log"
  echo "=========================================================="
  open -a "Google Chrome" http://localhost:8000/
else
  echo "[X] Erro ao iniciar o servidor. Verifique os logs em server.log"
  echo "=========================================================="
  exit 1
fi
