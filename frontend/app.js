// URL base da API backend (desenvolvimento)
const API_URL = 'http://localhost:3000/api';

// Mostra mensagem de status para o usuário (erro/sucesso/info)
function showMessage(msg, type = 'info', timeout = 4000) {
	const el = document.getElementById('message');
	el.textContent = msg;
	el.className = 'message';
	if (type === 'error') el.classList.add('error');
	if (type === 'success') el.classList.add('success');
	el.style.display = 'block';
	setTimeout(() => { el.style.display = 'none'; }, timeout);
}

function setToken(token) { localStorage.setItem('token', token); }
function getToken() { return localStorage.getItem('token'); }
function clearToken() { localStorage.removeItem('token'); }

const LOCAL_USERS_KEY = 'local_users_v1';
function getLocalUsers() { try { return JSON.parse(localStorage.getItem(LOCAL_USERS_KEY) || '[]'); } catch(e){ return []; } }
function saveLocalUsers(u){ localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(u || [])); }
function saveLocalUser(username, password){ const users = getLocalUsers(); if (users.find(x=>x.username===username)) return false; users.push({ username, password }); saveLocalUsers(users); return true; }
function findLocalUser(username){ return getLocalUsers().find(x=>x.username===username); }

// Gera token simples para modo offline/local (não seguro, apenas para fallback)
function makeFakeToken(username){ const payload = { username, userId: username }; const b64 = btoa(JSON.stringify(payload)); return 'fake.'+b64+'.sig'; }

function getLocalClientsFor(username){ try{ return JSON.parse(localStorage.getItem('clients_'+username) || '[]'); }catch(e){ return []; } }
function saveLocalClientsFor(username, list){ localStorage.setItem('clients_'+username, JSON.stringify(list||[])); }
function addLocalClientFor(username, client){ const list = getLocalClientsFor(username); list.push(client); saveLocalClientsFor(username, list); }
function updateLocalClientFor(username, id, fields){ const list = getLocalClientsFor(username); const c = list.find(x=>x.id===id); if (!c) return false; Object.assign(c, fields); saveLocalClientsFor(username, list); return true; }
function removeLocalClientFor(username, id){ let list = getLocalClientsFor(username); const lenBefore = list.length; list = list.filter(x=>x.id!==id); saveLocalClientsFor(username, list); return list.length < lenBefore; }
function getUsernameFromToken(token){ try{ return JSON.parse(atob(token.split('.')[1])).username; }catch(e){ return null; } }

// Mostra a tela inicial (welcome)
function showWelcome() {
	document.getElementById('welcome').style.display = 'block';
	document.getElementById('auth').style.display = 'none';
	document.getElementById('app').style.display = 'none';
}

function showAuth(mode) {
	document.getElementById('welcome').style.display = 'none';
	document.getElementById('auth').style.display = 'block';
	document.getElementById('card-register').style.display = mode === 'register' ? 'block' : 'none';
	document.getElementById('card-login').style.display = mode === 'login' ? 'block' : 'none';
}

function showApp() {
	document.getElementById('welcome').style.display = 'none';
	document.getElementById('auth').style.display = 'none';
	document.getElementById('app').style.display = 'block';
	const uname = getUsernameFromToken(getToken()) || '---';
	const uel = document.getElementById('username'); if (uel) uel.textContent = uname;
}

function logout() { clearToken(); showWelcome(); }

// Handler de registro: tenta registrar no backend, faz auto-login; se offline, salva localmente
async function registerUser() {
	const username = document.getElementById('reg-username').value.trim();
	const password = document.getElementById('reg-password').value;
	if (!username || !password) return showMessage('Preencha usuário e senha', 'error');
	if (username.length < 4 || password.length < 4) return showMessage('Usuário e senha devem ter no mínimo 4 caracteres', 'error');
	const passHasLetter = /[A-Za-zÀ-ú]/.test(password);
	const passHasNumber = /\d/.test(password);
	if (!passHasLetter || !passHasNumber) return showMessage('Senha deve conter letras e números', 'error');

	try{
		const res = await fetch(API_URL + '/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) });
		const data = await res.json();
		if (!res.ok) return showMessage(data.error || 'Erro ao registrar', 'error');
		// auto login
		const resLogin = await fetch(API_URL + '/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) });
		if (!resLogin.ok) { showMessage('Conta criada. Faça login manualmente.', 'success'); return; }
		const dlogin = await resLogin.json();
		setToken(dlogin.token);
		showMessage('Conta criada e logado.', 'success');
		showApp();
		await initApp();
	} catch (e) {
		// fallback offline: salva usuário e cria token fictício
		const ok = saveLocalUser(username, password);
		if (!ok) return showMessage('Usuário já existe localmente', 'error');
		const token = makeFakeToken(username);
		setToken(token);
		showMessage('Conta criada localmente (offline) e logado.', 'success');
		showApp();
		await initApp();
	}
}

// Handler de login: solicita token ao backend; se offline, tenta autenticar localmente
async function loginUser() {
	const username = document.getElementById('login-username').value.trim();
	const password = document.getElementById('login-password').value;
	if (!username || !password) return showMessage('Preencha usuário e senha', 'error');
	try{
		const res = await fetch(API_URL + '/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) });
		const data = await res.json();
		if (!res.ok) return showMessage(data.error || 'Erro ao entrar', 'error');
		setToken(data.token);
		showMessage('Logado', 'success');
		showApp();
		await initApp();
	} catch(e){
		const u = findLocalUser(username);
		if (!u) return showMessage('Usuário não encontrado (offline)', 'error');
		if (u.password !== password) return showMessage('Senha incorreta (offline)', 'error');
		const token = makeFakeToken(username);
		setToken(token);
		showMessage('Logado em modo offline', 'success');
		showApp();
		await initApp();
	}
}

async function fetchClients() {
	try{
		const res = await fetch(API_URL + '/clients', { headers: { Authorization: 'Bearer ' + getToken() } });
		if (!res.ok) { showMessage('Sessão expirada ou erro', 'error'); logout(); return []; }
		return await res.json();
	} catch(e){
		const token = getToken();
		const username = getUsernameFromToken(token) || 'guest';
		return getLocalClientsFor(username);
	}
}

async function addClient() {
	const name = document.getElementById('client-name').value.trim();
	const email = document.getElementById('client-email').value.trim();
	const phone = document.getElementById('client-phone').value.trim();
	if (!name) return showMessage('Nome do cliente é obrigatório', 'error');
	const photoInput = document.getElementById('client-photo');
	try{
		const res = await fetch(API_URL + '/clients', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + getToken() }, body: JSON.stringify({ name, email, phone }) });
		const data = await res.json();
		if (!res.ok) return showMessage(data.error || 'Erro ao adicionar', 'error');
		if (photoInput && photoInput.files && photoInput.files[0]) {
			const fd = new FormData(); fd.append('photo', photoInput.files[0]);
			await fetch(API_URL + '/clients/' + data.id + '/photo', { method: 'POST', headers: { Authorization: 'Bearer ' + getToken() }, body: fd });
		}
		showMessage('Cliente adicionado', 'success');
		document.getElementById('client-name').value = '';
		document.getElementById('client-email').value = '';
		document.getElementById('client-phone').value = '';
		if (photoInput) photoInput.value = '';
		loadClients();
	} catch(e){
		const token = getToken();
		const username = getUsernameFromToken(token) || 'guest';
		const id = 'c_' + Date.now() + '_' + Math.floor(Math.random()*9999);
		const client = { id, name, email, phone };
		if (photoInput && photoInput.files && photoInput.files[0]) {
			const file = photoInput.files[0];
			const reader = new FileReader();
			reader.onload = function(ev){
				client.photoData = ev.target.result;
				addLocalClientFor(username, client);
				showMessage('Cliente adicionado (offline)', 'success');
				document.getElementById('client-name').value = '';
				document.getElementById('client-email').value = '';
				document.getElementById('client-phone').value = '';
				photoInput.value = '';
				loadClients();
			};
			reader.readAsDataURL(file);
		} else {
			addLocalClientFor(username, client);
			showMessage('Cliente adicionado (offline)', 'success');
			document.getElementById('client-name').value = '';
			document.getElementById('client-email').value = '';
			document.getElementById('client-phone').value = '';
			if (photoInput) photoInput.value = '';
			loadClients();
		}
	}
}

async function updateClient(id, fields) {
	try{
		const res = await fetch(API_URL + '/clients/' + id, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + getToken() }, body: JSON.stringify(fields) });
		const d = await res.json();
		if (!res.ok) return showMessage(d.error || 'Erro ao atualizar', 'error');
		showMessage('Cliente atualizado', 'success');
		loadClients();
	} catch(e){
		const username = getUsernameFromToken(getToken()) || 'guest';
		const ok = updateLocalClientFor(username, id, fields);
		if (!ok) return showMessage('Cliente não encontrado (offline)', 'error');
		showMessage('Cliente atualizado (offline)', 'success');
		loadClients();
	}
}

async function removeClient(id) {
	try{
		const res = await fetch(API_URL + '/clients/' + id, { method: 'DELETE', headers: { Authorization: 'Bearer ' + getToken() } });
		const d = await res.json();
		if (!res.ok) return showMessage(d.error || 'Erro ao remover', 'error');
		showMessage('Cliente removido', 'success');
		loadClients();
	} catch(e){
		const username = getUsernameFromToken(getToken()) || 'guest';
		const ok = removeLocalClientFor(username, id);
		if (!ok) return showMessage('Cliente não encontrado (offline)', 'error');
		showMessage('Cliente removido (offline)', 'success');
		loadClients();
	}
}

function renderClients(list) {
	const ul = document.getElementById('clients-list');
	ul.innerHTML = '';
	if (!list || list.length === 0) { ul.innerHTML = '<li>Nenhum cliente cadastrado</li>'; return; }
	for (const c of list) {
		const li = document.createElement('li');
		const info = document.createElement('div');
		info.className = 'client-info';
		if (c.photo || c.photoData) {
			const img = document.createElement('img');
			let src = c.photo || c.photoData;
			try { if (typeof src === 'string' && src.startsWith('/')) { if (location.protocol && location.protocol.startsWith('http')) { src = location.origin + src; } } } catch (e) {}
			img.src = src;
			img.alt = c.name || 'foto';
			info.appendChild(img);
		}
		const text = document.createElement('div');
		text.textContent = `${c.name} — ${c.email || '-'} — ${c.phone || '-'}`;
		info.appendChild(text);
		const btns = document.createElement('div'); btns.style.marginTop = '6px'; btns.className = 'client-btns';
		const edit = document.createElement('button'); edit.textContent = 'Editar';
		const del = document.createElement('button'); del.textContent = 'Excluir'; del.style.marginLeft = '8px';

		edit.addEventListener('click', () => {
			const nameIn = document.createElement('input'); nameIn.value = c.name; nameIn.style.display = 'block';
			const emailIn = document.createElement('input'); emailIn.value = c.email; emailIn.style.display = 'block';
			const phoneIn = document.createElement('input'); phoneIn.value = c.phone; phoneIn.style.display = 'block';
			const photoInLabel = document.createElement('label'); photoInLabel.textContent = 'Foto (opcional): ';
			const photoIn = document.createElement('input'); photoIn.type = 'file'; photoIn.accept = 'image/*';
			photoInLabel.appendChild(photoIn);
			const save = document.createElement('button'); save.textContent = 'Salvar';
			const cancel = document.createElement('button'); cancel.textContent = 'Cancelar'; cancel.style.marginLeft = '8px';
			li.innerHTML = '';
			li.appendChild(nameIn); li.appendChild(emailIn); li.appendChild(phoneIn); li.appendChild(photoInLabel); li.appendChild(save); li.appendChild(cancel);

			save.addEventListener('click', async () => {
				const fields = { name: nameIn.value.trim(), email: emailIn.value.trim(), phone: phoneIn.value.trim() };
				try{
					await updateClient(c.id, fields);
					if (photoIn.files && photoIn.files[0]) {
						const fd = new FormData(); fd.append('photo', photoIn.files[0]);
						await fetch(API_URL + '/clients/' + c.id + '/photo', { method: 'POST', headers: { Authorization: 'Bearer ' + getToken() }, body: fd });
					}
				} catch(e){
					const username = getUsernameFromToken(getToken()) || 'guest';
					updateLocalClientFor(username, c.id, fields);
					if (photoIn.files && photoIn.files[0]) {
						const reader = new FileReader();
						reader.onload = function(ev){ updateLocalClientFor(username, c.id, { photoData: ev.target.result }); loadClients(); };
						reader.readAsDataURL(photoIn.files[0]);
						return;
					}
				}
				loadClients();
			});
			cancel.addEventListener('click', () => { loadClients(); });
		});

		del.addEventListener('click', () => { if (confirm('Excluir este cliente?')) removeClient(c.id); });

		btns.appendChild(edit); btns.appendChild(del);
		li.appendChild(info); li.appendChild(btns);
		ul.appendChild(li);
	}
}

async function loadClients() { const list = await fetchClients(); renderClients(list); }

async function searchClients() {
	const q = document.getElementById('search-q').value.trim();
	const field = document.getElementById('search-field').value;
	try{
		const res = await fetch(API_URL + '/clients?q=' + encodeURIComponent(q) + '&field=' + encodeURIComponent(field), { headers: { Authorization: 'Bearer ' + getToken() } });
		if (!res.ok) { showMessage('Erro ao buscar', 'error'); return; }
		const data = await res.json(); renderClients(data);
	} catch(e){
		const username = getUsernameFromToken(getToken()) || 'guest';
		let list = getLocalClientsFor(username);
		const ql = q.toLowerCase();
		if (ql) {
			list = list.filter(c => {
				if (field === 'name') return (c.name||'').toLowerCase().includes(ql);
				if (field === 'email') return (c.email||'').toLowerCase().includes(ql);
				if (field === 'phone') return (c.phone||'').toLowerCase().includes(ql);
				return ((c.name||'') + ' ' + (c.email||'') + ' ' + (c.phone||'')).toLowerCase().includes(ql);
			});
		}
		renderClients(list);
	}
}

function initApp() {
	const token = getToken();
	if (!token) { showWelcome(); return; }
	showApp();
	loadClients();
}

document.addEventListener('DOMContentLoaded', () => {
	// anchors with hash (#register, #login) will trigger hashchange
	window.addEventListener('hashchange', () => {
		const h = location.hash.replace('#','');
		if (h === 'register' || h === 'login') showAuth(h);
	});

	const el = id => document.getElementById(id);
	if (el('btn-register')) el('btn-register').addEventListener('click', registerUser);
	if (el('btn-login')) el('btn-login').addEventListener('click', loginUser);
	if (el('btn-back-register')) el('btn-back-register').addEventListener('click', () => { location.hash = ''; showWelcome(); });
	if (el('btn-back-login')) el('btn-back-login').addEventListener('click', () => { location.hash = ''; showWelcome(); });
	if (el('btn-logout')) el('btn-logout').addEventListener('click', () => { logout(); });
	if (el('btn-toggle-add')) el('btn-toggle-add').addEventListener('click', () => { const f = el('add-form'); if (f) f.style.display = f.style.display === 'none' ? 'block' : 'none'; });
	if (el('btn-add-client')) el('btn-add-client').addEventListener('click', addClient);
	if (el('btn-search')) el('btn-search').addEventListener('click', searchClients);

	initApp();
});


