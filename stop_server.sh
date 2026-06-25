#!/bin/bash

# stop_server.sh
# Script para encerrar o servidor do Aura Cognitive FSI Suite rodando na porta 8000.

# Resolve o diretório onde o script está localizado
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

echo "=========================================================="
echo "   Encerrando Aura Cognitive FSI Suite na porta 8000..."
echo "=========================================================="

# 1. Busca o PID do processo que está ocupando a porta 8000
PID=$(lsof -t -i:8000)

if [ -z "$PID" ]; then
  echo "[i] Nenhum processo ativo encontrado rodando na porta 8000."
  echo "=========================================================="
else
  echo "[+] Processo encontrado rodando na porta 8000 (PID: $PID)."
  echo "[+] Encerrando processo..."
  kill -9 $PID 2>/dev/null
  
  # Pequena verificação secundária
  sleep 1
  CHECK_PID=$(lsof -t -i:8000)
  if [ -z "$CHECK_PID" ]; then
    echo "[+] Servidor encerrado com sucesso!"
  else
    echo "[X] Erro: Não foi possível encerrar o processo $PID. Tente rodar com sudo se necessário."
  fi
  echo "=========================================================="
fi
