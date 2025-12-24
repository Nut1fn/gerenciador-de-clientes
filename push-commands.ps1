# Script para inicializar e enviar o projeto ao GitHub
cd "c:\Users\Gadiel\Desktop\banco de dados clientes"

# Cria repositório local (se já existir, alguns comandos podem falhar — veja comentários abaixo)
git init

# Garante que o .gitignore seja adicionado antes de enviar node_modules
git add .gitignore

# Adiciona os demais arquivos
git add .

# Commit inicial
git commit -m "Initial commit (ignore node_modules)"

# Renomeia branch principal para main
git branch -M main

# Adiciona remoto (substitua se necessário)
git remote add origin https://github.com/Nut1fn/gerenciador-de-clientes.git

# Envia para o GitHub (poderá pedir suas credenciais)
git push -u origin main

# Observações:
# - Se já existir o remote 'origin', rode: git remote set-url origin <URL>
# - Se já tiver commits/remote, remova ou ajuste os comandos conforme necessário.