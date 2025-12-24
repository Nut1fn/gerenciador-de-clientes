Instalação e Execução (Passo a Passo)

Pré-requisitos

- Node.js 16+ e npm instalados.
- Git (opcional, para clonar o repositório).

1) Clonar o repositório

```bash
git clone <URL-DO-REPOSITORIO>
cd "banco de dados clientes"
```

2) Instalar dependências (modo simplificado)

No Windows (PowerShell):

npm install

3) Preparar variáveis de ambiente

Copie o arquivo de exemplo em `backend/.env.example` para `backend/.env` e defina uma chave forte para `JWT_SECRET`:

```powershell
copy backend\.env.example backend\.env
# edite backend\.env e substitua JWT_SECRET
```

4) Iniciar o servidor

```bash
npm start
```

5) Acessar o frontend

Abra no navegador:

```
http://localhost:3000/
```

Uso (fluxo básico)

- Criar conta: clique em "Criar conta" e preencha `Usuário` e `Senha` (mínimo 4 caracteres; senha deve conter letras e números).
- Login: clique em "Login" e forneça credenciais; ao autenticar, um token JWT é armazenado no `localStorage`.
- Gerenciar clientes: após logar você pode adicionar, editar, excluir e pesquisar clientes.

API - endpoints principais

- `POST /api/register` — corpo JSON: `{ "username": "nome", "password": "senha" }`.
- `POST /api/login` — corpo JSON: `{ "username": "nome", "password": "senha" }` → resposta `{ "token": "..." }`.
- `GET /api/clients` — cabeçalho: `Authorization: Bearer <token>` → lista de clientes do usuário.
- `POST /api/clients` — cria cliente: body `{ name, email, phone }`.
- `POST /api/clients/:id/photo` — envia foto (multipart/form-data, campo `photo`).
- `PUT /api/clients/:id` — atualiza campos do cliente.
- `DELETE /api/clients/:id` — remove cliente.

Arquitetura e funcionamento

- Autenticação: o backend gera um JWT com `userId` e `username` e valida em cada chamada protegida.
- Persistência: dados são gravados em `backend/data.json` (estrutura simples para demonstração).
- Uploads: fotos são armazenadas em `backend/uploads` e servidas em `/uploads`.
- Offline: quando o backend está inacessível, o frontend usa `localStorage` para armazenar usuários e clientes localmente; ações offline são isoladas ao navegador do usuário.

Segurança (resumo)

- `helmet` adiciona headers HTTP seguros.
- `express-rate-limit` aplicado em rotas de autenticação.
- Uploads limitados (2MB) e aceitando apenas imagens.
- `JWT_SECRET` lido a partir de `backend/.env` (não colocar secrets no repositório).

Mais detalhes e guias
- Guia de instalação detalhado: `docs/INSTALLATION.md`
- Guia do usuário com passo-a-passo: `docs/USER_GUIDE.md`
- Medidas de segurança e recomendações: `docs/SECURITY.md`

Suporte e troubleshooting

- Porta em uso: se `3000` já estiver ocupada, encerre o processo que a utiliza ou exporte `PORT` no `backend/.env`.
- Erros de CORS: verifique origem no navegador e se o servidor está rodando em `http://localhost:3000`.
