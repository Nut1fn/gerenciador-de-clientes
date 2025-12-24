Instalação e execução (desenvolvimento) — passo a passo

Este guia mostra como preparar e executar o projeto localmente, cobrindo Windows e macOS/Linux.

1) Clonar o repositório

```bash
git clone <URL-DO-REPOSITORIO>
cd "projeto 2"
```

2) Preparar variáveis de ambiente

Copie o arquivo de exemplo e edite `backend/.env`:

Windows (PowerShell):

```powershell
copy backend\.env.example backend\.env
notepad backend\.env
```

macOS/Linux:

```bash
cp backend/.env.example backend/.env
nano backend/.env
```

Defina `JWT_SECRET` com uma string forte.

3) Instalar dependências

No root do repositório (recomendado):

```bash
npm install
```

Isso instalará as dependências do `backend` graças ao `package.json` na raiz que usa workspaces.

4) Iniciar o servidor

```bash
npm start
```

Ou no Windows use o script de conveniência `run.ps1`:

```powershell
.\run.ps1
```

5) Acessar a aplicação

Abra seu navegador em `http://localhost:3000/`.

Observações e dicas

- Dados persistem em `backend/data.json`.
- Se a porta `3000` estiver ocupada: exporte uma variável `PORT` no `backend/.env` (ex.: `PORT=4000`) ou finalize o processo que usa `3000`.
- Para produção: use um process manager (PM2, systemd) e um reverse-proxy (nginx) com TLS.

Erros comuns

- `EADDRINUSE`: porta em uso — veja o PID com `netstat`/`ss` e encerre.
- `npm install` falha: verifique versão do Node e permissões (no Windows rode Powershell como administrador se necessário).

Próximos passos

- Consulte `docs/USER_GUIDE.md` para uso da aplicação.
- Consulte `docs/SECURITY.md` para recomendações antes de publicar em produção.