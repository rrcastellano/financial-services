#!/bin/bash

# start_server.command
# Script de dois cliques para iniciar o servidor do Aura Cognitive FSI Suite no macOS.

# Resolve o diretório onde o script está localizado e faz o cd
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

echo "=========================================================="
echo "   Iniciando Aura Cognitive FSI Suite na porta 8000..."
echo "=========================================================="

PID=$(lsof -t -i:8000)
if [ ! -z "$PID" ]; then
  echo "[!] Encontrado processo ativo rodando na porta 8000 (PID: $PID)."
  echo "[!] Encerrando processo antigo..."
  kill -9 $PID 2>/dev/null
  sleep 1
fi

nohup npm run dev -- --port 8000 > server.log 2>&1 &
SERVER_PID=$!

sleep 2

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
fi

# Mantém a janela do Terminal aberta para visualização do sucesso
echo "Pressione qualquer tecla para fechar esta janela..."
read -n 1 -s
