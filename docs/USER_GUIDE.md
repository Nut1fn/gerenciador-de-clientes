Guia do Usuário — Sistema de Gestão de Clientes

Visão geral da interface

1) Tela inicial

- A tela inicial apresenta botões para `Criar conta` e `Login`.
- Os links direcionam para formulários embutidos (hash `#register` e `#login`).

2) Registrar uma nova conta

Passos:

1. Clique em `Criar conta`.
2. Preencha o campo `Usuário` (mínimo 4 caracteres).
3. Preencha `Senha` (mínimo 4 caracteres; deve conter letras e números).
4. Clique em `Criar conta`.

Comportamento esperado:

- Se o backend estiver disponível, a conta será criada e o aplicativo tentará fazer login automático.
- Se o backend não estiver disponível, a conta será salva localmente no `localStorage` (modo offline) e você será logado localmente.

3) Login

Passos:

1. Clique em `Login`.
2. Informe `Usuário` e `Senha`.
3. Clique em `Entrar`.

Comportamento esperado:

- Quando autenticado com sucesso, o token JWT retornado é salvo em `localStorage` e você verá a tela principal (`app`).
- Em caso de falha de rede, o frontend tenta autenticar usando as credenciais salvas localmente.

4) Tela principal (após login)

- No topo aparece "Logado como <usuário>" e o botão `Sair`.
- A área principal mostra a lista de clientes do usuário (nome, email, telefone e miniatura da foto).

5) Adicionar cliente

Passos:

1. Clique no botão `+` no título "Clientes" para abrir o formulário de adicionar.
2. Preencha `Nome` (obrigatório). Opcionalmente preencha `Email`, `Telefone` e faça upload de `Foto`.
3. Clique em `Adicionar`.

Comportamento esperado:

- Se o backend estiver disponível, o cliente será salvo no servidor; se for enviado arquivo de foto, a foto será enviada em seguida para o endpoint `/clients/:id/photo`.
- Se offline, o cliente é salvo localmente em `localStorage` com um id gerado localmente e exibido na lista.

6) Editar e excluir

- `Editar`: substitui o item por campos editáveis e permite salvar alterações; foto pode ser enviada novamente.
- `Excluir`: pergunta confirmação e remove o cliente do servidor (ou do `localStorage` quando offline).

7) Pesquisa

- Use o campo `Pesquisar clientes...` e selecione o campo (Nome, Email, Telefone ou Todos) para filtrar a lista.

Modo offline (comportamento importante)

- O aplicativo foi projetado para funcionar em modo offline para demonstração básica: usuários e clientes podem ser criados localmente quando o backend não responde.
- Dados offline ficam limitados ao navegador do usuário (armazenamento local via `localStorage`) e não são sincronizados automaticamente com o servidor.

Dicas e problemas comuns

- Senha inválida: verifique se ela contém letras e números e tem pelo menos 4 caracteres.
- Foto muito grande: uploads são limitados (2MB). Reduza a imagem antes de enviar.
- Sessão expirada: faça logout e login novamente.

Suporte

- Se algo não funcionar, verifique o console do navegador (DevTools) e o log do servidor (`backend/server.js`).
- Consulte `docs/INSTALLATION.md` se houver problemas na instalação.