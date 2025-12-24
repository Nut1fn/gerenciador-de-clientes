Medidas de segurança aplicadas (resumo)

No backend (`backend/server.js`):

- Cabeçalhos HTTP: `helmet()` adiciona vários headers de segurança que reduzem vetores de ataque (XSS básico, clickjacking, sniffing de MIME types).
- Rate limiting: `express-rate-limit` aplicado nas rotas de autenticação (`/api/register` e `/api/login`) para mitigar ataques de força bruta.
- Segredo JWT via `.env`: `JWT_SECRET` é lido de `process.env` (arquivo `backend/.env`) — em produção nunca mantenha esse segredo no repositório.
- Validação de entrada: checagens básicas (tamanho mínimo de usuário/senha; senha deve conter letras e números) e sanitização mínima com `validator`.
- Uploads restritos: `multer` aceita apenas imagens (`image/*`) e limita o tamanho a 2MB por arquivo.
- CORS: em desenvolvimento a origem é restrita para `http://localhost:3000`.

Riscos residuais e recomendações para produção

1) Transporte seguro

- Utilize HTTPS (TLS) em frente ao servidor (nginx / reverse-proxy) para proteger tokens e credenciais em trânsito.

2) Gerenciamento de segredos

- Defina `JWT_SECRET` em um cofre de segredos (ex.: HashiCorp Vault, AWS Secrets Manager) ou variáveis de ambiente no host.

3) Rate limiting em escala

- Para implantações com múltiplos servidores, use um store centralizado (Redis) para rate-limiting e bloqueio de IPs.

4) Logs e monitoramento

- Centralize logs (ex.: ELK, Loki) e configure alertas para tentativas falhas de login e padrão de requisições incomum.

5) Testes de segurança

- Faça varreduras regulares (SAST/DAST) e revisões de dependências (`npm audit`) antes de publicar.

6) Hardening adicional

- Considere políticas CSP (Content Security Policy) no frontend, headers HSTS, e limitar o `sameSite` em cookies se usados.

Notas finais

Esta aplicação é um exemplo com foco em simplicidade; adaptar para produção requer as recomendações acima e auditoria de segurança por um especialista.
