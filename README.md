Projeto: Sistema de Gestão de Clientes

Resumo
-------
Este projeto é uma aplicação web simples para gerenciamento de clientes. Ele oferece cadastro e autenticação de usuários, CRUD (criar, ler, atualizar, excluir) de clientes, upload de fotos dos clientes e um modo **offline/local** que permite uso básico quando o backend não está disponível.

Ideia e propósito
------------------
- Objetivo: permitir que um pequeno time ou usuário gerencie uma lista de clientes (nome, email, telefone, foto) de forma rápida e sem dependências complexas.
- Cenário de uso: uso local/pequenas empresas, protótipo ou aplicação educativa que mostra conceitos como autenticação, upload de arquivos e sincronização básica.
- Offline-first: o frontend implementa fallback em `localStorage` para autenticação e armazenamento de clientes quando o backend não responde.

Estrutura do projeto
---------------------
- `backend/` — servidor Node.js (Express), responsáve lpelas rotas de autenticação e gestão de clientes; possui pasta `uploads/` para imagens.
- `frontend/` — aplicação estática (HTML/CSS/JS) que consome a API do backend via `fetch` e também oferece fallback offline.
- `experiencia.md` — este arquivo, com a documentação do projeto.

Principais arquivos (resumo)
- `backend/package.json` — lista de dependências do servidor.
- `backend/server.js` — arquivo principal do servidor (rotas: `/register`, `/login`, `/clients`, `/clients/:id/photo`).
- `frontend/index.html` — interface do usuário.
- `frontend/app.js` — lógica do cliente (login, CRUD, fallback local, upload de imagens).

Dependências e por que foram usadas (backend)
---------------------------------------------
- `express`: framework HTTP minimal e popular para criar a API e rotas; simples e suficiente para esse escopo.
- `bcrypt`: hashing de senhas com salt — evita armazenar senhas em texto puro. Escolhido pela robustez e ampla adoção.
- `jsonwebtoken`: geração e verificação de tokens JWT para autenticação baseada em token (Bearer token nas chamadas do frontend).
- `multer`: middleware para processamento de `multipart/form-data` (uploads de fotos). Permite salvar arquivos localmente em `uploads/`.
- `uuid`: geração de IDs únicos (identificadores de clientes, arquivos, etc.).
- `cors`: habilita requisições cross-origin do frontend de desenvolvimento (`http://localhost:...`).
- `helmet`: aplica cabeçalhos HTTP de segurança (CSP básico, X-Frame-Options, etc.).
- `express-rate-limit`: limitação de taxa para proteger endpoints sensíveis (ex.: /login) contra brute force.
- `dotenv`: carregar variáveis de ambiente (porta, segredos) sem expor valores no código.
- `validator`: validação e sanitização de entradas (e-mails, strings), reduz risco de injeção.

Tecnologias e decisões (frontend)
---------------------------------
- Vanila JS (sem frameworks) — arquivo `frontend/app.js` faz requisições `fetch` para a API.
- `localStorage` para fallback offline: usuários e clientes são armazenados localmente quando o backend estiver indisponível. Implementação simples e prática para protótipos.
- `FormData` e `FileReader` — usados para subida de fotos e para salvar imagens como dataURL no fallback offline.

API e endpoints (visão geral)
----------------------------
- `POST /api/register` — cria usuário (valida, hash da senha com `bcrypt`).
- `POST /api/login` — autentica usuário e retorna um JWT (`jsonwebtoken`).
- `GET /api/clients` — lista clientes do usuário autenticado.
- `POST /api/clients` — cria cliente (associado ao usuário).
- `PUT /api/clients/:id` — atualiza cliente.
- `DELETE /api/clients/:id` — remove cliente.
- `POST /api/clients/:id/photo` — faz upload de foto (usando `multer`) e associa ao cliente.

Métodos de segurança implementados e recomendações
-------------------------------------------------
Implementados (conforme dependências e frontend):
- Hash de senhas: `bcrypt` para armazenar apenas hashes; evita vazamento de senhas legíveis.
- Autenticação via JWT: `jsonwebtoken` gera tokens assinados; rotas protegidas exigem o token no header `Authorization: Bearer <token>`.
- Cabeçalhos de segurança: `helmet` adiciona vários cabeçalhos HTTP para reduzir vetores básicos (clickjacking, MIME sniffing, etc.).
- Rate limiting: `express-rate-limit` protege endpoints como `/login` contra tentativas de força bruta.
- Validação de entrada: `validator` (e validações no backend) evita dados inválidos e reduz risco de injeção.
- CORS: `cors` limita de onde o frontend pode acessar a API no cenário de desenvolvimento; em produção restringir a origem.
- Uploads gerenciados via `multer`: permite limitar tamanho, tipo e destino dos arquivos (recomendado configurar restrições).

Riscos conhecidos e recomendações adicionais (boas práticas):
- Armazenamento de token no `localStorage`: simples, mas vulnerável a XSS. Recomenda-se, em produção, usar `httpOnly` cookies com SameSite e CSRF tokens, ou ao menos minimizar exposição a XSS.
- HTTPS obrigatório em produção: sempre usar TLS para proteger tokens em trânsito.
- Refresh tokens / expiração: implementar tokens de acesso de curta duração e refresh tokens para melhorar segurança de sessão.
- Sanitização e verificação de uploads: validar MIME-type, extensão, tamanho máximo; renomear arquivos com `uuid`; armazenar fora da webroot quando possível e servir via rota autenticada.
- CSP (Content Security Policy): complementar `helmet` com políticas CSP restritivas para reduzir risco XSS.
- Auditoria de senhas: exigir política de senha mínima (o frontend já verifica letras e números), e considerar bloqueio temporário após várias tentativas.
- Logging e monitoramento: registrar tentativas falhas de login e erros de upload para detectar abuso.

Considerações sobre offline-first e trade-offs
---------------------------------------------
- Vantagens: permite uso básico sem backend (útil em rede instável), prototipagem rápida.
- Desvantagens: dados locais não são sincronizados automaticamente; risco de inconsistência; segurança reduzida (tokens falsos e senhas em localStorage). O modo offline aqui é um fallback prático para protótipos, não recomendado para dados sensíveis em produção.

Observações finais
------------------
Este projeto foi um bom ponto de partida para aprender conceitos de autenticação, uploads e estratégias de fallback offline para mim. aprender a aplicar as recomendações de segurança acima sem duvida foi essencial (HTTPS, armazenamento seguro de tokens, validação rigorosa de uploads e políticas de senha/lockout).

usei tudo que aprendi na fase Learning, e somei conteudo de foruns do reddit e videos no youtube. e claro usando a propía ia do vscode para me ajudar a construir e corrigir bugs do projeto.
