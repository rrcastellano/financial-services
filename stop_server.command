#!/bin/bash

# stop_server.command
# Script de dois cliques para encerrar o servidor do Aura Cognitive FSI Suite no macOS.

# Resolve o diretório onde o script está localizado e faz o cd
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

echo "=========================================================="
echo "   Encerrando Aura Cognitive FSI Suite na porta 8000..."
echo "=========================================================="

PID=$(lsof -t -i:8000)

if [ -z "$PID" ]; then
  echo "[i] Nenhum processo ativo encontrado rodando na porta 8000."
  echo "=========================================================="
else
  echo "[+] Processo encontrado rodando na porta 8000 (PID: $PID)."
  echo "[+] Encerrando processo..."
  kill -9 $PID 2>/dev/null
  
  sleep 1
  CHECK_PID=$(lsof -t -i:8000)
  if [ -z "$CHECK_PID" ]; then
    echo "[+] Servidor encerrado com sucesso!"
  else
    echo "[X] Erro: Não foi possível encerrar o processo $PID."
  fi
  echo "=========================================================="
fi

# Mantém a janela do Terminal aberta para confirmação
echo "Pressione qualquer tecla para fechar esta janela..."
read -n 1 -s
