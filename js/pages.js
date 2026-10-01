/* =====================================================================
   SÓCIO, CONTAS E ÁREA DO SÓCIO
   Tudo roda no navegador (localStorage). Site fictício: sem servidor.
   ===================================================================== */
const SOC_PLANS = {
  lobo: { key:'lobo', name:'Sócio Lobo', ico:'🐺', color:'#5b6377', badge:'Ingresso na Matilha', price:24.90, ticketDisc:0.20, ticketMax:2, storeDisc:0.05, mult:1, presale:'lobo',
    perks:['20% de desconto em até 2 ingressos por jogo, em qualquer setor','Carteirinha virtual oficial com QR Code','Pré-venda com prioridade 3','Direito a voto nas pesquisas do clube','5% de desconto na Loja Oficial'] },
  terror: { key:'terror', name:'Sócio Terror', ico:'⚡', color:'#3b82c4', badge:'Mais popular', price:54.90, ticketDisc:0.50, ticketMax:2, storeDisc:0.10, mult:1.5, presale:'terror', feat:true,
    perks:['50% de desconto em até 2 ingressos por jogo','Pré-venda com prioridade 2 (clássico do vale)','10% de desconto na Loja Oficial','Tour anual na Toca do Lobo, com agendamento','Carteirinha com QR Code exclusivo','Pontos SCEC x1,5 em cada compra'] },
  vale: { key:'vale', name:'Sócio Vale', ico:'👑', color:'#a0622e', badge:'Exclusivo', price:109.90, ticketFree:1, extraDisc:0.25, extraMax:3, storeDisc:0.20, mult:2, presale:'vale',
    perks:['1 ingresso gratuito por jogo, em qualquer setor, inclusive o camarote','Camarote com vaga exclusiva e tour pelos bastidores 2h antes','Até 3 acompanhantes com 25% de desconto','Pré-venda com prioridade máxima','20% de desconto na Loja Oficial e pontos SCEC x2','Camisa oficial autografada por ano e encontro com o elenco 1x ao ano'] }
};
const SOC_BY_NAME = Object.fromEntries(Object.values(SOC_PLANS).map(p => [p.name, p]));
const SOC_PRESALE = { name:'Clássico do Vale', when:'25 de outubro • 16:00', open:{ vale:'2026-09-29T00:00', terror:'2026-09-30T10:00', lobo:'2026-10-01T10:00', publico:'2026-10-02T10:00' } };
const SOC_MEET = ['14 de novembro de 2026', '20 de fevereiro de 2027'];
const SOC_REWARDS = [
  { id:'loja10', t:'Cupom de R$ 10 na Loja', cost:300, coupon:10 },
  { id:'loja25', t:'Cupom de R$ 25 na Loja', cost:700, coupon:25 },
  { id:'vale-verde', t:'Vale-ingresso: 1 entrada no Setor Verde', cost:500, ticket:'VERDE' }
];
let socCycle = 'mensal', ACC = {}, socPending = null, socUseCoupon = true;
try { ACC = JSON.parse(localStorage.getItem('scec_accounts') || '{}') || {}; } catch (e) { ACC = {}; }

const $s = id => document.getElementById(id);
const socMoney = v => 'R$ ' + (Math.round(v * 100) / 100).toFixed(2).replace('.', ',');
const socEsc = t => String(t == null ? '' : t).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const isLogged = () => !!(userSession && !userSession.guest);
const socPlan = () => (isLogged() && !socSuspended()) ? (SOC_BY_NAME[userSession.plan] || null) : null;
function socPersist() { try { localStorage.setItem('scec_accounts', JSON.stringify(ACC)); } catch (e) {} }
function socSave() {
  if (isLogged()) socPersist();
  else { try { localStorage.setItem('scec_guest', JSON.stringify({ cart: userSession.cart || [] })); } catch (e) {} }
}
const _origSetStored = window.setStored;
window.setStored = function (k, v) { if (k === 'scec_user') socSave(); else _origSetStored(k, v); };

function socToast(msg) {
  const t = $s('socToast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(socToast._t); socToast._t = setTimeout(() => t.classList.remove('show'), 3200);
}

/* ---------- Sessão ---------- */
function socGuest() {
  let cart = []; try { cart = (JSON.parse(localStorage.getItem('scec_guest') || '{}').cart) || []; } catch (e) {}
  return { guest:true, name:'Visitante', plan:null, code:'', points:0, tickets:[], cart };
}
function socNormalize(a) {
  a.points = a.points || 0; a.tickets = a.tickets || []; a.cart = a.cart || []; a.coupons = a.coupons || [];
  a.benefits = a.benefits || {}; a.invoices = a.invoices || []; a.log = a.log || []; a.presales = a.presales || []; a.saved = a.saved || 0; a.plan = a.plan || null;
  return a;
}
function socSessionEmail() {
  try {
    const raw = localStorage.getItem('scec_session') || sessionStorage.getItem('scec_session');
    const s = JSON.parse(raw || 'null');
    if (s && s.exp > Date.now() && ACC[s.email]) return s.email;
  } catch (e) {}
  return null;
}
function socLoad() {
  const em = socSessionEmail();
  if (em) userSession = socNormalize(ACC[em]); else userSession = socGuest();
  socRefreshUI();
}
function socStartSession(email, remember) {
  const s = JSON.stringify({ email, exp: Date.now() + (remember ? 30 : 1) * 86400000 });
  try { localStorage.removeItem('scec_session'); sessionStorage.removeItem('scec_session'); (remember ? localStorage : sessionStorage).setItem('scec_session', s); } catch (e) {}
}
function socLogout() {
  try { localStorage.removeItem('scec_session'); sessionStorage.removeItem('scec_session'); } catch (e) {}
  closeModal('memberAreaModal'); userSession = socGuest(); socRefreshUI(); socToast('Você saiu da sua conta. Até o próximo jogo!');
}
function socRefreshUI() {
  const b = $s('fanAreaBtn');
  if (b) b.textContent = isLogged() ? '🐺 ' + userSession.name.split(' ')[0] : '🔐 Entrar';
  const mm = document.querySelector('#mobileMenu button.btn-primary');
  if (mm) mm.textContent = isLogged() ? '🐺 Área do Sócio' : '🔐 Entrar';
  const bn = $s('ticketBuyerName'); if (bn && isLogged() && !bn.value) bn.value = userSession.name;
  try { updateFanBadges(); } catch (e) {}
  socRenderSocio();
  try { renderStore(); } catch (e) {}
  if (typeof updateTicketSummary === 'function') try { updateTicketSummary(); } catch (e) {}
}

/* ---------- Hash de senha (PBKDF2 quando disponível) ---------- */
async function socHash(pass, salt) {
  try {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey('raw', enc.encode(pass), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits({ name:'PBKDF2', salt:enc.encode(salt), iterations:120000, hash:'SHA-256' }, key, 256);
    return Array.from(new Uint8Array(bits)).map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (e) {
    let h = 5381; const s = salt + pass;
    for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
    return 'x' + (h >>> 0).toString(16);
  }
}
const socSalt = () => Array.from(crypto.getRandomValues ? crypto.getRandomValues(new Uint8Array(12)) : Array.from({ length:12 }, () => Math.floor(Math.random() * 256))).map(b => b.toString(16).padStart(2, '0')).join('');
function socStrength(p) {
  let s = 0; if (p.length >= 8) s++; if (p.length >= 12) s++; if (/[a-z]/.test(p) && /[A-Z]/.test(p)) s++; if (/\d/.test(p)) s++; if (/[^A-Za-z0-9]/.test(p)) s++;
  if (/^(12345678|senha123|password|qwerty12|santaclara)/i.test(p)) s = Math.min(s, 1);
  return Math.min(4, s);
}
function socPassOk(p) { return p.length >= 8 && /[A-Za-z]/.test(p) && /\d/.test(p); }
function socMeter(p) {
  const s = socStrength(p), bar = $s('authMeterBar');
  bar.style.width = (p ? (s + 1) * 20 : 0) + '%';
  bar.style.background = ['#e5675f', '#e5675f', '#c9a84c', '#5bb974', '#2e9e4f'][s];
  $s('authMeterTxt').textContent = p ? ['Muito fraca', 'Fraca', 'Média', 'Boa', 'Forte'][s] + (socPassOk(p) ? '' : ' — use 8+ caracteres com letras e números') : 'Mínimo 8 caracteres, com letras e números.';
}
function socTogglePass(id, btn) { const i = $s(id); i.type = i.type === 'password' ? 'text' : 'password'; btn.textContent = i.type === 'password' ? '👁' : '🙈'; }
const socDigits = t => String(t || '').replace(/\W/g, '').toLowerCase();
const socEmailOk = e => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);
function socLocks() { try { return JSON.parse(localStorage.getItem('scec_lock') || '{}'); } catch (e) { return {}; } }

/* ---------- Telas de autenticação ---------- */
function socOpenAuth(tab, opts) {
  opts = opts || {}; socPending = opts.then || null;
  const n = $s('authNotice'); n.style.display = opts.notice ? 'block' : 'none'; n.textContent = opts.notice || '';
  socAuthTab(tab || 'login'); openModal('authModal');
  setTimeout(() => { const f = $s(tab === 'register' ? 'authRegName' : 'authLoginEmail'); if (f) f.focus(); }, 60);
}
function socAuthTab(t) {
  ['login', 'register', 'recover'].forEach(k => { $s('auth' + k[0].toUpperCase() + k.slice(1)).style.display = k === t ? 'block' : 'none'; });
  $s('authTabLogin').classList.toggle('on', t === 'login'); $s('authTabRegister').classList.toggle('on', t === 'register');
  ['authLoginErr', 'authRegErr', 'authRecErr'].forEach(i => $s(i).textContent = '');
}
function socAfterAuth(msg) {
  closeModal('authModal'); socLoad(); socToast(msg);
  const cb = socPending; socPending = null; if (cb) setTimeout(cb, 250);
}
async function socLogin(e) {
  e.preventDefault();
  const email = $s('authLoginEmail').value.trim().toLowerCase(), pass = $s('authLoginPass').value, err = $s('authLoginErr');
  if (!socEmailOk(email) || !pass) { err.textContent = 'Informe e-mail e senha.'; return; }
  const L = socLocks(), l = L[email] || { n:0, until:0 };
  if (l.until > Date.now()) { err.textContent = `Muitas tentativas. Tente de novo em ${Math.ceil((l.until - Date.now()) / 1000)}s.`; return; }
  const a = ACC[email];
  const ok = a && (await socHash(pass, a.salt)) === a.hash;
  if (!ok) {
    l.n = (l.n || 0) + 1; if (l.n >= 5) { l.until = Date.now() + 60000; l.n = 0; }
    L[email] = l; try { localStorage.setItem('scec_lock', JSON.stringify(L)); } catch (x) {}
    err.textContent = l.until > Date.now() ? 'Conta bloqueada por 60s após várias tentativas.' : 'E-mail ou senha incorretos.'; return;
  }
  delete L[email]; try { localStorage.setItem('scec_lock', JSON.stringify(L)); } catch (x) {}
  a.lastLogin = new Date().toISOString(); socPersist();
  socStartSession(email, $s('authRemember').checked); $s('authLoginPass').value = '';
  socAfterAuth(`Bem-vindo de volta, ${a.name.split(' ')[0]}!`);
}
async function socRegister(e) {
  e.preventDefault();
  const name = $s('authRegName').value.trim().replace(/\s+/g, ' '), email = $s('authRegEmail').value.trim().toLowerCase(), doc = $s('authRegDoc').value.trim();
  const p1 = $s('authRegPass').value, p2 = $s('authRegPass2').value, err = $s('authRegErr');
  if (name.split(' ').length < 2 || name.length < 5) { err.textContent = 'Informe nome e sobrenome.'; return; }
  if (!socEmailOk(email)) { err.textContent = 'E-mail inválido.'; return; }
  if (socDigits(doc).length < 5) { err.textContent = 'Informe um CPF ou documento (mín. 5 caracteres).'; return; }
  if (!socPassOk(p1)) { err.textContent = 'A senha precisa de 8+ caracteres, com letras e números.'; return; }
  if (p1 !== p2) { err.textContent = 'As senhas não coincidem.'; return; }
  if (!$s('authTerms').checked) { err.textContent = 'Aceite os termos para continuar.'; return; }
  if (ACC[email]) { err.textContent = 'Já existe uma conta com este e-mail. Tente entrar.'; return; }
  const salt = socSalt();
  ACC[email] = socNormalize({ name, email, docMasked: (() => { const d = socDigits(doc); return d.length === 11 ? '•••.•••.•••-' + d.slice(-2) : '••••' + d.slice(-3); })(), docHash: await socHash(socDigits(doc), salt + 'doc'), salt, hash: await socHash(p1, salt),
    code: 'SCEC-2026-' + String(1000 + Math.floor(Math.random() * 9000)), points:100, created: new Date().toISOString() });
  ACC[email].log = [{ t:'Conta criada (+100 pontos de boas-vindas)', at:new Date().toISOString() }];
  socPersist(); socStartSession(email, true);
  ['authRegPass', 'authRegPass2'].forEach(i => $s(i).value = '');
  socAfterAuth('Conta criada! Você ganhou 100 pontos SCEC.');
}
async function socRecover(e) {
  e.preventDefault();
  const email = $s('authRecEmail').value.trim().toLowerCase(), doc = $s('authRecDoc').value, np = $s('authRecPass').value, err = $s('authRecErr'), a = ACC[email];
  if (!socPassOk(np)) { err.textContent = 'A nova senha precisa de 8+ caracteres, com letras e números.'; return; }
  if (!a || (await socHash(socDigits(doc), a.salt + 'doc')) !== a.docHash) { err.textContent = 'Os dados não conferem.'; return; }
  a.salt = socSalt(); a.docHash = await socHash(socDigits(doc), a.salt + 'doc'); a.hash = await socHash(np, a.salt); socPersist();
  $s('authRecPass').value = ''; $s('authLoginEmail').value = email; socAuthTab('login'); socToast('Senha redefinida. Faça login com a nova senha.');
}


/* ---------- Benefícios efetivos: ingressos ---------- */
function socQuote(plan, sectorKey, qty) {
  const p = SECTOR_DATA[sectorKey].price, sub = p * qty, lines = [];
  let total = sub;
  if (plan && plan.ticketFree) {
    const free = Math.min(plan.ticketFree, qty), extra = Math.min(plan.extraMax, Math.max(0, qty - free)), full = qty - free - extra;
    total = extra * p * (1 - plan.extraDisc) + full * p;
    lines.push(`${free} × ingresso gratuito (${plan.name})`);
    if (extra) lines.push(`${extra} × ${Math.round(plan.extraDisc * 100)}% off (acompanhantes)`);
  } else if (plan) {
    const d = Math.min(plan.ticketMax, qty);
    total = d * p * (1 - plan.ticketDisc) + (qty - d) * p;
    lines.push(`${d} × ${Math.round(plan.ticketDisc * 100)}% off (${plan.name})`);
  }
  total = Math.round(total * 100) / 100;
  return { subtotal:sub, total, saved:Math.round((sub - total) * 100) / 100, lines };
}
window.updateTicketSummary = function () {
  const s = SECTOR_DATA[chosenTicketSector], pl = socPlan(), q = socQuote(pl, chosenTicketSector, ticketQty);
  $s('selectedSectorLabel').textContent = `${s.emoji} ${s.name}`;
  $s('totalTicketPrice').textContent = brl(q.total);
  const sub = $s('ticketTotalDetail');
  if (sub) sub.textContent = `${ticketQty} × ${brl(s.price)} • ${SECTOR_ACCESS[chosenTicketSector].gate}` + (SECTOR_TAGS[chosenTicketSector] ? ' • ' + SECTOR_TAGS[chosenTicketSector] : '');
  let note = $s('ticketMemberNote');
  if (!note && sub) { note = document.createElement('div'); note.id = 'ticketMemberNote'; sub.after(note); }
  if (note) {
    note.style.cssText = 'margin-top:10px;padding:9px 12px;border-radius:8px;font-size:0.78rem;';
    if (pl) { note.style.background = 'rgba(46,158,79,.14)'; note.style.border = '1px solid #2e9e4f'; note.innerHTML = `💚 <strong>Benefício ${pl.name} aplicado</strong>: ${q.lines.join(' + ')}. ${q.saved > 0 ? 'Você economiza <strong>' + brl(q.saved) + '</strong>.' : ''}`; }
    else { note.style.background = 'rgba(201,168,76,.12)'; note.style.border = '1px solid var(--club-gold)'; note.innerHTML = `🐺 ${isLogged() ? 'Você ainda não é sócio.' : 'Faça login para emitir seu ingresso.'} <a href="socio.html#socio" style="color:var(--club-gold);font-weight:800;">Seja sócio e pague até 50% menos ou nada →</a>`; }
  }
  const pn = $s('ticketSectorPerkNote');
  if (s.perk) { pn.style.display = 'block'; pn.textContent = s.perk; } else pn.style.display = 'none';
};
const _origTicketCheckout = window.handleTicketCheckout;
window.handleTicketCheckout = function (e) {
  e.preventDefault();
  if (!isLogged()) {
    socOpenAuth('login', { notice:'Entre ou crie sua conta para emitir o ingresso e usar seus benefícios.', then: () => { const f = $s('ticketOrderForm'); if (f && f.requestSubmit) f.requestSubmit(); } });
    return;
  }
  const pl = socPlan(), q = socQuote(pl, chosenTicketSector, ticketQty), n0 = userSession.tickets.length;
  _origTicketCheckout(e);
  const t = userSession.tickets[n0];
  if (t) {
    t.paid = q.total; t.saved = q.saved; t.plan = pl ? pl.name : null;
    if (pl && pl.mult > 1) userSession.points += Math.round(50 * ticketQty * (pl.mult - 1));
    userSession.saved = (userSession.saved || 0) + q.saved;
    socLog(`Ingresso emitido: ${t.sectorName} (${t.quantity}x, ${socMoney(q.total)})`); socSave(); socToast(pl ? `Ingresso emitido. Economia de ${brl(q.saved)} com o ${pl.name}!` : 'Ingresso emitido e salvo na sua conta.');
  }
};

/* ---------- Benefícios efetivos: loja ---------- */
function socCartQuote() {
  const sub = userSession.cart.reduce((n, i) => n + i.price * (i.qty || 1), 0), pl = socPlan();
  const disc = pl ? Math.round(sub * pl.storeDisc * 100) / 100 : 0;
  const cp = isLogged() ? (userSession.coupons || []).find(c => !c.used) : null;
  const cpv = cp && socUseCoupon ? Math.min(cp.value, sub - disc) : 0;
  return { sub, disc, cp, cpv, total:Math.max(0, sub - disc - cpv), pl };
}
window.renderCartModal = function () {
  const cont = $s('cartItemsContainer');
  if (!userSession.cart.length) { cont.innerHTML = '<p style="color:var(--club-muted); font-size:0.9rem;">Sua sacola está vazia.</p>'; $s('cartTotalPrice').textContent = 'R$ 0,00'; return; }
  const q = socCartQuote();
  cont.innerHTML = userSession.cart.map((item, idx) => `
    <div style="display:flex; justify-content:space-between; align-items:center; background:var(--club-dark); padding:10px; border-radius:var(--radius-sm);">
      <div><strong style="font-size:0.85rem;">${socEsc(item.name)}</strong><div style="color:var(--club-gold); font-size:0.8rem;">${socMoney(item.price)}</div></div>
      <button onclick="removeFromCart(${idx})" style="background:none; border:none; color:var(--club-accent); font-size:0.8rem; cursor:pointer;">Remover</button>
    </div>`).join('') + `<div class="cart-sum">
      <div><span>Subtotal</span><span>${socMoney(q.sub)}</span></div>
      ${q.pl ? `<div class="ok"><span>${q.pl.name} (${Math.round(q.pl.storeDisc * 100)}% off)</span><span>− ${socMoney(q.disc)}</span></div>` : `<div><span style="color:var(--club-muted)">${isLogged() ? 'Sócios têm de 5% a 20% de desconto na loja.' : 'Entre na sua conta para usar benefícios.'}</span><span></span></div>`}
      ${q.cp ? `<label style="display:flex;gap:6px;align-items:center;cursor:pointer;"><input type="checkbox" ${socUseCoupon ? 'checked' : ''} onchange="socUseCoupon=this.checked;renderCartModal()"> Usar cupom de ${socMoney(q.cp.value)}${q.cpv ? ' (− ' + socMoney(q.cpv) + ')' : ''}</label>` : ''}
    </div>`;
  $s('cartTotalPrice').textContent = socMoney(q.total);
};
const _origStoreCheckout = window.handleStoreCheckout;
window.handleStoreCheckout = function () {
  if (!userSession.cart.length) return alert('Seu carrinho está vazio.');
  if (!isLogged()) { closeModal('cartModal'); socOpenAuth('login', { notice:'Entre para finalizar o pedido e usar seus descontos de sócio.', then: () => { renderCartModal(); openModal('cartModal'); } }); return; }
  const q = socCartQuote();
  if (q.cp && q.cpv) q.cp.used = true;
  userSession.saved = (userSession.saved || 0) + q.disc + q.cpv;
  const mult = q.pl ? q.pl.mult : 1;
  _origStoreCheckout();
  if (mult > 1) userSession.points += Math.round(150 * (mult - 1));
  socLog(`Pedido da loja: ${socMoney(q.total)}`); socSave(); socToast(`Pedido feito! Total ${socMoney(q.total)}${q.disc + q.cpv > 0 ? ' — você economizou ' + socMoney(q.disc + q.cpv) : ''}.`);
};

/* ---------- Adesão ao plano ---------- */
window.openMembershipJoinModal = function (planName) {
  const pl = SOC_BY_NAME[planName]; if (!pl) return;
  if (!isLogged()) { socOpenAuth('register', { notice:`Crie sua conta gratuita para aderir ao ${pl.name}.`, then: () => openMembershipJoinModal(planName) }); return; }
  const same = userSession.plan === pl.name, val = socCycle === 'anual' ? pl.price * 10 : pl.price;
  document.querySelector('#membershipModal .modal-card').innerHTML = `
    <button class="modal-close" onclick="closeModal('membershipModal')" aria-label="Fechar">✕</button>
    <h3 style="font-family:var(--font-display); font-size:1.6rem; text-transform:uppercase;">${pl.ico} ${same ? 'Você já é ' : 'Adesão: '}${pl.name}</h3>
    <ul class="soc-perks" style="--pc:${pl.color};margin:14px 0;">${pl.perks.map(p => `<li>${p}</li>`).join('')}</ul>
    <div class="soc-toggle"><button type="button" class="${socCycle === 'mensal' ? 'on' : ''}" onclick="socCycle='mensal';openMembershipJoinModal('${pl.name}')">Mensal</button><button type="button" class="${socCycle === 'anual' ? 'on' : ''}" onclick="socCycle='anual';openMembershipJoinModal('${pl.name}')">Anual (−2 meses)</button></div>
    <div class="form-group"><label>Forma de pagamento (simulada)</label><select id="joinPay" class="form-control"><option>Pix</option><option>Cartão de crédito</option><option>Boleto</option></select></div>
    <p style="font-size:0.75rem;color:var(--club-muted);margin-bottom:12px;">Site fictício: nenhum pagamento real é feito nem dado financeiro é guardado. Total: <strong style="color:var(--club-gold)">${socMoney(val)}</strong> ${socCycle === 'anual' ? '/ ano' : '/ mês'}.</p>
    <button type="button" class="btn-primary" style="width:100%;justify-content:center;padding:12px;${same ? 'opacity:.5;' : ''}" ${same ? 'disabled' : ''} onclick="socConfirmJoin('${pl.key}')">${same ? 'Plano atual' : (userSession.plan ? 'Trocar para ' : 'Confirmar adesão ao ') + pl.name}</button>`;
  openModal('membershipModal');
};
window.handleJoinMembership = function (e) { if (e) e.preventDefault(); };
function socConfirmJoin(key) {
  const pl = SOC_PLANS[key], first = !userSession.plan;
  const pay = ($s('joinPay') || {}).value || 'Pix';
  userSession.plan = pl.name; userSession.planSince = new Date().toISOString(); userSession.cycle = socCycle;
  if (first) userSession.points += 500;
  socStartBilling(pl, pay); socLog(first ? `Adesão ao ${pl.name} (+500 pontos)` : `Plano alterado para ${pl.name}`);
  socSave(); closeModal('membershipModal'); socRefreshUI();
  socToast(first ? `Bem-vindo à Matilha! ${pl.name} ativo (+500 pontos).` : `Plano alterado para ${pl.name}.`);
  socOpenArea('painel');
}
window.openFanAreaModal = function () { socOpenArea('painel'); };


/* ---------- Seção pública "Seja Sócio" ---------- */
function socRenderSocio() {
  const root = $s('socioRoot'); if (!root) return;
  const cur = socPlan(), anual = socCycle === 'anual';
  const rows = [
    ['Desconto em ingressos', '20% (até 2)', '50% (até 2)', '1 grátis + 25% (até 3)'],
    ['Camarote com vaga e tour 2h antes', '—', '—', '✔'],
    ['Pré-venda', 'Prioridade 3', 'Prioridade 2', 'Prioridade máxima'],
    ['Desconto na loja', '5%', '10%', '20%'],
    ['Pontos SCEC por compra', 'x1', 'x1,5', 'x2'],
    ['Tour anual na Toca do Lobo', '—', '✔', '✔'],
    ['Camisa autografada e encontro com o elenco', '—', '—', '✔'],
    ['Voto nas pesquisas do clube', '✔', '✔', '✔']
  ];
  root.innerHTML = `
    ${isLogged() ? `<div class="soc-banner"><div>${cur ? `${cur.ico} Você é <strong>${cur.name}</strong>. Seus benefícios já valem no site.` : `👋 Olá, <strong>${socEsc(userSession.name.split(' ')[0])}</strong>! Escolha um plano para ativar seus benefícios.`}</div><button class="btn-primary" onclick="socOpenArea('painel')">Abrir Área do Sócio</button></div>`
      : `<div class="soc-banner"><div>🔐 Já é da Matilha? Entre para ver seus benefícios e ingressos.</div><div style="display:flex;gap:8px;"><button class="btn-outline" onclick="socOpenAuth('login')">Entrar</button><button class="btn-primary" onclick="socOpenAuth('register')">Criar conta grátis</button></div></div>`}
    <div class="soc-stats">
      <div class="soc-stat"><b>12.480</b><span>Sócios na Matilha</span></div>
      <div class="soc-stat"><b>até 100%</b><span>de desconto em ingressos</span></div>
      <div class="soc-stat"><b>x2</b><span>pontos por compra</span></div>
      <div class="soc-stat"><b>1 ano</b><span>de tour, pré-venda e voto</span></div>
    </div>
    <div style="text-align:center;"><div class="soc-toggle" role="group" aria-label="Ciclo de cobrança"><button type="button" class="${anual ? '' : 'on'}" onclick="socCycle='mensal';socRenderSocio()">Mensal</button><button type="button" class="${anual ? 'on' : ''}" onclick="socCycle='anual';socRenderSocio()">Anual • 2 meses grátis</button></div></div>
    <div class="soc-plans">${Object.values(SOC_PLANS).map(p => `
      <div class="soc-plan${p.feat ? ' feat' : ''}" style="--pc:${p.color}">
        <span class="soc-ribbon">${p.badge}</span>
        <div><div class="ico">${p.ico}</div><h3>${p.name}</h3>
        <div class="soc-price">${socMoney(anual ? p.price * 10 : p.price)} <small>/${anual ? 'ano' : 'mês'}</small></div>
        <div class="soc-save">${anual ? 'Economia de ' + socMoney(p.price * 2) + ' por ano' : '&nbsp;'}</div>
        <ul class="soc-perks" style="margin-top:14px;">${p.perks.map(x => `<li>${x}</li>`).join('')}</ul></div>
        <div>${cur && cur.key === p.key ? '<div class="cur">✔ SEU PLANO ATUAL</div>' : ''}
        <button class="${p.feat ? 'btn-primary' : 'btn-outline'}" style="width:100%;justify-content:center;margin-top:8px;" onclick="openMembershipJoinModal('${p.name}')">${cur && cur.key === p.key ? 'Ver meus benefícios' : (cur ? 'Trocar para ' : 'Aderir ao ') + p.name.replace('Sócio ', '')}</button></div>
      </div>`).join('')}</div>
    <div class="soc-block"><h3>Compare os planos</h3><div class="soc-table-wrap"><table class="soc-table"><thead><tr><th>Benefício</th><th>Lobo</th><th>Terror</th><th>Vale</th></tr></thead><tbody>
      ${rows.map(r => `<tr><td>${r[0]}</td>${r.slice(1).map(c => `<td class="${c === '—' ? 'n' : 'y'}">${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div></div>
    <div class="soc-block"><h3>Quanto você economiza?</h3><div class="soc-calc">
      <div class="soc-calc-row"><label>Jogos por mês: <strong id="calcGamesLbl">2</strong> <input type="range" id="calcGames" min="1" max="4" value="2" oninput="socCalc()"></label>
        <label>Setor: <select id="calcSector" onchange="socCalc()">${Object.entries(SECTOR_DATA).map(([k, s]) => `<option value="${k}"${k === 'CAMAROTE' ? ' selected' : ''}>${s.emoji} ${s.name.split(' — ')[0]}</option>`).join('')}</select></label>
        <label>Acompanhantes por jogo: <select id="calcComp" onchange="socCalc()"><option>0</option><option>1</option><option>2</option><option>3</option></select></label></div>
      <div class="soc-res" id="calcRes"></div>
      <div style="font-size:0.72rem;color:var(--club-muted);">Custo mensal = mensalidade + ingressos. Não inclui o desconto na loja nem os pontos SCEC.</div></div></div>`;
  socCalc();
}
function socCalc() {
  const g = +$s('calcGames').value, sec = $s('calcSector').value, qty = 1 + +$s('calcComp').value;
  $s('calcGamesLbl').textContent = g;
  const opts = [{ n:'Sem plano', c:socQuote(null, sec, qty).total * g }].concat(Object.values(SOC_PLANS).map(p => ({ n:p.name, c:p.price + socQuote(p, sec, qty).total * g })));
  const best = Math.min.apply(null, opts.map(o => o.c));
  $s('calcRes').innerHTML = opts.map(o => `<div class="${o.c === best ? 'best' : ''}">${o.n}<b>${socMoney(o.c)}</b>${o.c === best ? 'melhor custo' : '/ mês'}</div>`).join('');
}

/* ---------- Área do Sócio ---------- */
let maTab = 'painel';
function socOpenArea(tab) {
  if (!isLogged()) { socOpenAuth('login', { notice:'Entre na sua conta para acessar a Área do Sócio.', then: () => socOpenArea(tab) }); return; }
  maTab = tab || maTab; socRenderArea(); openModal('memberAreaModal');
}
function maPresaleStatus(key) {
  const t = new Date(SOC_PRESALE.open[key]).getTime(), now = Date.now();
  if (now >= t) return { open:true, txt:'Aberta agora' };
  const h = Math.ceil((t - now) / 3600000); return { open:false, txt: h > 47 ? `Abre em ${Math.ceil(h / 24)} dias` : `Abre em ${h}h` };
}
function maBeneficios() {
  const pl = socPlan(), u = userSession, b = u.benefits, out = [];
  if (!pl) return `<div class="ma-item"><strong>Você ainda não tem um plano</strong><p>Escolha um plano para liberar descontos, pré-venda, tour e mais.</p><button class="btn-primary" onclick="closeModal('memberAreaModal');goSection('socio')">Ver planos</button></div>`;
  const auto = (ico, t, d) => `<div class="ma-item" style="--pc:${pl.color}"><div class="top"><strong>${ico} ${t}</strong><span class="ma-tag">Ativo</span></div><p>${d}</p></div>`;
  out.push('<div class="ma-h">Aplicados automaticamente</div><div class="ma-list">');
  out.push(auto('🎟️', 'Desconto em ingressos', pl.ticketFree ? '1 ingresso gratuito por jogo e 25% off para até 3 acompanhantes. Aplicado no valor da compra.' : `${Math.round(pl.ticketDisc * 100)}% off em até ${pl.ticketMax} ingressos por jogo. Aplicado no valor da compra.`));
  out.push(auto('🛍️', 'Desconto na Loja Oficial', `${Math.round(pl.storeDisc * 100)}% off na sacola, mais cupons de pontos.`));
  out.push(auto('⭐', 'Pontos SCEC x' + String(pl.mult).replace('.', ','), 'Ganhe mais pontos em cada ingresso e pedido da loja.'));
  if (pl.key === 'vale') out.push(auto('🧭', 'Camarote com tour', 'Ingresso do camarote inclui vaga exclusiva e tour pelos bastidores 2h antes da partida.'));
  out.push('</div><div class="ma-h">Para você usar</div><div class="ma-list">');
  const ps = maPresaleStatus(pl.presale), done = u.presales.find(x => x.event === SOC_PRESALE.name);
  out.push(`<div class="ma-item" style="--pc:${pl.color}"><div class="top"><strong>🚀 Pré-venda: ${SOC_PRESALE.name}</strong><span class="ma-tag ${ps.open ? '' : 'lock'}">${ps.txt}</span></div><p>${SOC_PRESALE.when}. Sócios compram antes do público geral (abertura ao público: 2 de outubro, 10:00).</p>
    ${done ? `<span class="ma-tag">Reservado • ${done.sector} • ${done.hash}</span>` : ps.open ? `<select id="psSector">${Object.entries(SECTOR_DATA).map(([k, s]) => `<option value="${k}">${s.emoji} ${s.name.split(' — ')[0]} (${socMoney(socQuote(pl, k, 1).total)})</option>`).join('')}</select><button class="btn-primary" onclick="maReservePresale()">Reservar ingresso</button>` : ''}</div>`);
  if (pl.key === 'terror' || pl.key === 'vale') {
    const tr = b.tour; out.push(`<div class="ma-item" style="--pc:${pl.color}"><div class="top"><strong>🧭 Tour anual na Toca do Lobo</strong><span class="ma-tag ${tr ? 'warn' : ''}">${tr ? 'Agendado' : '1 por ano'}</span></div><p>Conheça vestiários, túnel e gramado com guia do clube.</p>
      ${tr ? `<span>${new Date(tr.date + 'T12:00').toLocaleDateString('pt-BR')} às ${tr.time}</span>` : `<input type="date" id="tourDate" min="${new Date().toISOString().slice(0, 10)}"><select id="tourTime">${ESPLANADA_DATA.tourHorarios.map(h => `<option>${h}</option>`).join('')}</select><button class="btn-outline" onclick="maBook('tour')">Agendar</button>`}</div>`);
  }
  if (pl.key === 'vale') {
    const sh = b.shirt, mt = b.meet;
    out.push(`<div class="ma-item" style="--pc:${pl.color}"><div class="top"><strong>👕 Camisa oficial autografada</strong><span class="ma-tag ${sh ? 'warn' : ''}">${sh ? 'Solicitada' : '1 por ano'}</span></div><p>${sh ? 'Pedido feito em ' + new Date(sh.at).toLocaleDateString('pt-BR') + '. Retirada na Central do Torcedor em até 30 dias.' : 'Solicite sua camisa do ano para retirada na Central do Torcedor.'}</p>${sh ? '' : '<button class="btn-outline" onclick="maBook(\'shirt\')">Solicitar camisa</button>'}</div>`);
    out.push(`<div class="ma-item" style="--pc:${pl.color}"><div class="top"><strong>🤝 Encontro com o elenco</strong><span class="ma-tag ${mt ? 'warn' : ''}">${mt ? 'Reservado' : '1 por ano'}</span></div><p>${mt ? 'Sua vaga: ' + mt.slot : 'Escolha a data do encontro deste ano.'}</p>${mt ? '' : `<select id="meetSlot">${SOC_MEET.map(s => `<option>${s}</option>`).join('')}</select><button class="btn-outline" onclick="maBook('meet')">Reservar vaga</button>`}</div>`);
  }
  const vk = new Date().toISOString().slice(0, 7), voted = u.benefits.vote && u.benefits.vote.month === vk;
  out.push(`<div class="ma-item" style="--pc:${pl.color}"><div class="top"><strong>🗳️ Votação: craque do mês</strong><span class="ma-tag ${voted ? 'warn' : ''}">${voted ? 'Voto registrado' : 'Aberta'}</span></div><p>Só sócios votam. Um voto por mês.</p>${maPoll(voted)}</div></div>`);
  return out.join('');
}
function maPollData() {
  let d = {}; try { d = JSON.parse(localStorage.getItem('scec_poll') || '{}'); } catch (e) {}
  return d;
}
function maPoll(voted) {
  const opts = DB.players.slice(0, 5), d = maPollData(), tot = opts.reduce((n, p, i) => n + (d[p.name] || 0) + 8 + i * 3, 0);
  return opts.map((p, i) => { const v = (d[p.name] || 0) + 8 + i * 3, pc = Math.round(100 * v / tot);
    return voted ? `<div style="font-size:0.78rem;">${socEsc(p.name)} <span style="color:var(--club-muted)">${pc}%</span><div class="ma-bar"><i style="width:${pc}%"></i></div></div>` : `<button class="btn-outline" style="margin:0 6px 6px 0;" onclick="maVote(${i})">${socEsc(p.name)}</button>`; }).join('');
}
function maVote(i) {
  const p = DB.players[i], d = maPollData(); d[p.name] = (d[p.name] || 0) + 1;
  try { localStorage.setItem('scec_poll', JSON.stringify(d)); } catch (e) {}
  userSession.benefits.vote = { month:new Date().toISOString().slice(0, 7), pick:p.name }; userSession.points += 20; socLog('Voto: craque do mês'); socSave(); socRenderArea(); socToast(`Voto em ${p.name} registrado (+20 pontos).`);
}
function maBook(kind) {
  const b = userSession.benefits;
  if (kind === 'tour') { const d = $s('tourDate').value; if (!d) return socToast('Escolha uma data para o tour.'); b.tour = { date:d, time:$s('tourTime').value }; }
  if (kind === 'shirt') b.shirt = { at:new Date().toISOString() };
  if (kind === 'meet') b.meet = { slot:$s('meetSlot').value };
  socLog('Benefício registrado: ' + kind); socSave(); socRenderArea(); socToast('Benefício registrado com sucesso!');
}
function maReservePresale() {
  const pl = socPlan(), k = $s('psSector').value, q = socQuote(pl, k, 1), s = SECTOR_DATA[k], hash = 'SCEC-' + Math.random().toString(36).slice(2, 9).toUpperCase() + '-PRE';
  userSession.tickets.push({ name:userSession.name, sector:k, sectorName:`${s.emoji} ${s.name}`, gate:s.gate, quantity:1, hash, date:new Date().toLocaleDateString('pt-BR'), match:SOC_PRESALE.name + ' (pré-venda)', paid:q.total, saved:q.saved, plan:pl.name });
  userSession.presales.push({ event:SOC_PRESALE.name, sector:s.name.split(' — ')[0], hash });
  userSession.points += Math.round(50 * pl.mult); userSession.saved = (userSession.saved || 0) + q.saved; socLog(`Reserva na pré-venda: ${s.name.split(' — ')[0]}`); socSave(); socRenderArea(); socToast(`Reserva confirmada por ${socMoney(q.total)}!`);
}
function maIngressos() {
  const t = userSession.tickets;
  if (!t.length) return `<div class="ma-item"><strong>Nenhum ingresso ainda</strong><p>Seus ingressos e QR Codes aparecem aqui, com o desconto de sócio já aplicado.</p><button class="btn-primary" onclick="closeModal('memberAreaModal');goSection('ingressos')">Comprar ingresso</button></div>`;
  return '<div class="ma-list">' + t.map((x, i) => `<div class="ma-item"><div class="top"><strong>${socEsc(x.match)}</strong><span class="ma-tag">${x.quantity || 1}x</span></div>
    <div style="display:flex;gap:14px;align-items:center;flex-wrap:wrap;"><div class="ma-qr" id="tkQr${i}" style="background:#fff;padding:5px;border-radius:6px;"></div>
    <div><p style="margin:0;">${socEsc(x.sectorName || 'Setor')} • ${socEsc(x.gate || '')}<br>Emitido em ${socEsc(x.date || '')}${x.paid != null ? '<br>Pago: <strong>' + socMoney(x.paid) + '</strong>' + (x.saved > 0 ? ' <span style="color:#2e9e4f">(economia ' + socMoney(x.saved) + ')</span>' : '') : ''}</p><small style="font-family:monospace;color:var(--club-gold)">${socEsc(x.hash)}</small></div></div></div>`).join('') + '</div>';
}
function maPontos() {
  const u = userSession, pl = socPlan(), nxt = u.points >= 2000 ? null : (u.points >= 500 ? 2000 : 500);
  return `<div class="ma-item"><div class="top"><strong>⭐ ${u.points} pontos SCEC</strong><span class="ma-tag ${pl ? '' : 'lock'}">${pl ? 'x' + String(pl.mult).replace('.', ',') + ' de bônus' : 'sem bônus de plano'}</span></div>
    ${nxt ? `<div class="ma-bar"><i style="width:${Math.min(100, Math.round(100 * u.points / nxt))}%"></i></div><p>Faltam ${nxt - u.points} pontos para o próximo nível.</p>` : '<p>Você é Alfa da Matilha!</p>'}</div>
    <div class="ma-h">Troque seus pontos</div><div class="ma-list">${SOC_REWARDS.map(r => `<div class="ma-item"><div class="top"><strong>${r.t}</strong><span class="ma-tag ${u.points >= r.cost ? '' : 'lock'}">${r.cost} pts</span></div>
      <button class="btn-outline" ${u.points >= r.cost ? '' : 'disabled style="opacity:.5"'} onclick="maRedeem('${r.id}')">Resgatar</button></div>`).join('')}</div>
    ${(u.coupons || []).length ? '<div class="ma-h">Seus cupons</div>' + u.coupons.map(c => `<div class="ma-item"><strong>${socMoney(c.value)} na loja</strong> <span class="ma-tag ${c.used ? 'lock' : ''}">${c.used ? 'usado' : 'disponível — aplicado na sacola'}</span></div>`).join('') : ''}`;
}
function maRedeem(id) {
  const r = SOC_REWARDS.find(x => x.id === id), u = userSession;
  if (!r || u.points < r.cost) return socToast('Pontos insuficientes.');
  u.points -= r.cost;
  if (r.coupon) u.coupons.push({ value:r.coupon, used:false, at:new Date().toISOString() });
  if (r.ticket) { const s = SECTOR_DATA[r.ticket]; u.tickets.push({ name:u.name, sector:r.ticket, sectorName:`${s.emoji} ${s.name}`, gate:s.gate, quantity:1, hash:'SCEC-' + Math.random().toString(36).slice(2, 9).toUpperCase() + '-VALE', date:new Date().toLocaleDateString('pt-BR'), match:VAJ_MATCH.title + ' (vale-ingresso)', paid:0, saved:0 }); }
  socLog('Resgate: ' + r.t); socSave(); socRenderArea(); socToast('Resgate feito! ' + (r.coupon ? 'O cupom já vale na sua sacola.' : 'Veja o ingresso na aba Ingressos.'));
}
/* ---------- Inicialização ---------- */
document.addEventListener('DOMContentLoaded', () => {
  socLoad();
  const b = $s('fanAreaBtn'); if (b) b.onclick = () => (isLogged() ? socOpenArea('painel') : socOpenAuth('login'));
  try { updateTicketSummary(); } catch (e) {}
});


/* ---------- Loja: filtros, tamanhos, quantidade, preço de sócio ---------- */
let storeCat = 'Todos', storeSort = 'rel', storeQuery = '';
const STORE_FREE_SHIP = 300;
window.renderStore = function () {
  const cats = ['Todos'].concat(Array.from(new Set(DB.products.map(p => p.cat))));
  const tb = $s('storeToolbar');
  if (tb && !tb.dataset.ok) {
    tb.dataset.ok = '1'; tb.className = 'store-bar';
    tb.innerHTML = `<input type="search" id="storeSearch" placeholder="Buscar produto..." aria-label="Buscar produto" oninput="storeQuery=this.value;renderStore()">
      <div id="storeChips" style="display:flex;gap:6px;flex-wrap:wrap;"></div>
      <select id="storeSortSel" aria-label="Ordenar" onchange="storeSort=this.value;renderStore()"><option value="rel">Relevância</option><option value="asc">Menor preço</option><option value="desc">Maior preço</option></select>`;
  }
  const ch = $s('storeChips'); if (ch) ch.innerHTML = cats.map(c => `<button type="button" class="store-chip${c === storeCat ? ' on' : ''}" onclick="storeCat='${c}';renderStore()">${c}</button>`).join('');
  let list = DB.products.filter(p => (storeCat === 'Todos' || p.cat === storeCat) && p.name.toLowerCase().includes(storeQuery.toLowerCase().trim()));
  if (storeSort === 'asc') list = list.slice().sort((a, b) => a.price - b.price);
  if (storeSort === 'desc') list = list.slice().sort((a, b) => b.price - a.price);
  const pl = socPlan();
  $s('storeContainer').innerHTML = list.length ? list.map(p => {
    const thumb = p.img ? `<img src="${p.img}" alt="${socEsc(p.name)}" loading="lazy" ${p.imgur ? `data-id="${p.imgur}" data-tried="0" ` : ''}data-emoji="${p.emoji || '🐺'}" onerror="storeImgFail(this)">` : `<span class="product-emoji">${p.emoji || '🐺'}</span>`;
    const price = pl
      ? `<div class="product-price"><span class="product-old">${socMoney(p.price)}</span>${socMoney(p.price * (1 - pl.storeDisc))}</div><div class="product-member">✔ Preço ${pl.name} (−${Math.round(pl.storeDisc * 100)}%)</div>`
      : `<div class="product-price">${socMoney(p.price)}</div><div class="product-member tease">Sócio Vale paga ${socMoney(p.price * 0.8)}</div>`;
    const sizes = p.sizes ? `<div class="size-row" role="radiogroup" aria-label="Tamanho">${p.sizes.map((z, i) => `<label><input type="radio" name="sz${p.id}" value="${z}" ${i === 1 ? 'checked' : ''}><span>${z}</span></label>`).join('')}</div>` : '';
    return `<div class="product-card">${p.badge ? `<span class="product-badge">${p.badge}</span>` : ''}
      <div class="product-thumb">${thumb}</div>
      <div class="product-details"><div class="product-name">${socEsc(p.name)}</div>${price}${sizes}
        <button class="btn-primary" style="margin-top:12px; justify-content:center; width:100%;" onclick="addToCart(${p.id})">Adicionar à sacola</button></div></div>`;
  }).join('') : '<p style="color:var(--club-muted)">Nenhum produto encontrado.</p>';
};
function storeImgFail(img) {
  const exts = ['jpeg', 'png', 'webp', 'gif'], n = parseInt(img.dataset.tried || '0', 10);
  if (img.dataset.id && n < exts.length) { img.dataset.tried = n + 1; img.src = `https://i.imgur.com/${img.dataset.id}.${exts[n]}`; return; }
  img.outerHTML = `<span class="product-emoji">${img.dataset.emoji || '🐺'}</span>`;
}
window.addToCart = function (id) {
  const p = DB.products.find(x => x.id === id); if (!p) return;
  const r = document.querySelector(`input[name="sz${id}"]:checked`), size = r ? r.value : null;
  const line = userSession.cart.find(i => i.id === id && (i.size || null) === size);
  if (line) line.qty = (line.qty || 1) + 1;
  else userSession.cart.push({ id:p.id, name:p.name, price:p.price, img:p.img, size, qty:1 });
  setStored('scec_user', userSession); updateFanBadges();
  socToast(`${p.name}${size ? ' (' + size + ')' : ''} adicionado à sacola.`);
};
function socCartQty(idx, d) {
  const it = userSession.cart[idx]; if (!it) return;
  it.qty = (it.qty || 1) + d;
  if (it.qty < 1) userSession.cart.splice(idx, 1);
  setStored('scec_user', userSession); renderCartModal(); updateFanBadges();
}
const _origBadges = window.updateFanBadges;
window.updateFanBadges = function () {
  _origBadges();
  const b = $s('cartCountBadge'); if (b) b.textContent = userSession.cart.reduce((n, i) => n + (i.qty || 1), 0);
};
window.renderCartModal = function () {
  const cont = $s('cartItemsContainer');
  if (!userSession.cart.length) { cont.innerHTML = '<p style="color:var(--club-muted); font-size:0.9rem;">Sua sacola está vazia.</p>'; $s('cartTotalPrice').textContent = 'R$ 0,00'; return; }
  const q = socCartQuote(), left = Math.max(0, STORE_FREE_SHIP - q.total);
  cont.innerHTML = userSession.cart.map((item, idx) => `
    <div style="display:flex; justify-content:space-between; align-items:center; gap:10px; background:var(--club-dark); padding:10px; border-radius:var(--radius-sm);">
      <div><strong style="font-size:0.85rem;">${socEsc(item.name)}${item.size ? ' • ' + item.size : ''}</strong>
        <div style="color:var(--club-gold); font-size:0.8rem;">${socMoney(item.price * (item.qty || 1))}</div>
        <div class="cart-qty"><button type="button" onclick="socCartQty(${idx},-1)" aria-label="Diminuir">−</button><span>${item.qty || 1}</span><button type="button" onclick="socCartQty(${idx},1)" aria-label="Aumentar">+</button></div></div>
      <button onclick="removeFromCart(${idx})" style="background:none; border:none; color:var(--club-accent); font-size:0.8rem; cursor:pointer;">Remover</button>
    </div>`).join('') + `<div class="cart-sum">
      <div><span>Subtotal</span><span>${socMoney(q.sub)}</span></div>
      ${q.pl ? `<div class="ok"><span>${q.pl.name} (${Math.round(q.pl.storeDisc * 100)}% off)</span><span>− ${socMoney(q.disc)}</span></div>` : `<div><span style="color:var(--club-muted)">${isLogged() ? 'Sócios têm de 5% a 20% de desconto na loja.' : 'Entre na sua conta para usar benefícios.'}</span><span></span></div>`}
      ${q.cp ? `<label style="display:flex;gap:6px;align-items:center;cursor:pointer;"><input type="checkbox" ${socUseCoupon ? 'checked' : ''} onchange="socUseCoupon=this.checked;renderCartModal()"> Usar cupom de ${socMoney(q.cp.value)}${q.cpv ? ' (− ' + socMoney(q.cpv) + ')' : ''}</label>` : ''}
      <div class="ship-bar">${left ? `🚚 Faltam <strong>${socMoney(left)}</strong> para frete grátis` : '🚚 <strong style="color:#2e9e4f">Você ganhou frete grátis!</strong>'}<div class="ma-bar"><i style="width:${Math.min(100, Math.round(100 * q.total / STORE_FREE_SHIP))}%"></i></div></div>
    </div>`;
  $s('cartTotalPrice').textContent = socMoney(q.total);
};
document.addEventListener('DOMContentLoaded', () => { try { renderStore(); updateFanBadges(); } catch (e) {} });

/* =====================================================================
   ÁREA DO SÓCIO v2: carteirinha real, financeiro, perfil, atividade
   ===================================================================== */
const MA_TABS = [['painel', '🏠 Início'], ['beneficios', '🎁 Benefícios'], ['ingressos', '🎟️ Ingressos'], ['financeiro', '💳 Financeiro'], ['pontos', '⭐ Pontos'], ['perfil', '👤 Perfil']];
const DAY = 86400000, GRACE = 5;
let maPayId = null, maReceiptId = null, maFlip = false;
const socFmt = d => new Date(d).toLocaleDateString('pt-BR');
function socLog(t) { const u = userSession; u.log = u.log || []; u.log.unshift({ t, at:new Date().toISOString() }); u.log = u.log.slice(0, 40); }

/* ---------- Faturas (mensalidades) ---------- */
function socPlanStep() { return userSession.cycle === 'anual' ? 365 : 30; }
function socStartBilling(pl, method) {
  const u = userSession, val = u.cycle === 'anual' ? pl.price * 10 : pl.price, now = new Date().toISOString();
  u.invoices = (u.invoices || []).map(i => i.status === 'aberta' ? Object.assign(i, { status:'cancelada' }) : i);
  u.payMethod = method || u.payMethod || 'Pix';
  u.invoices.push({ id:'FAT-' + Math.random().toString(36).slice(2, 8).toUpperCase(), plan:pl.name, value:val, due:now, status:'paga', paidAt:now, method:u.payMethod, ref:new Date().toLocaleDateString('pt-BR', { month:'2-digit', year:'numeric' }) });
  socNextInvoice();
}
function socNextInvoice() {
  const u = userSession, pl = SOC_BY_NAME[u.plan]; if (!pl) return;
  if (u.invoices.some(i => i.status === 'aberta')) return;
  const last = u.invoices.filter(i => i.status === 'paga' && i.plan === pl.name).pop(); if (!last) return;
  const due = new Date(new Date(last.due).getTime() + socPlanStep() * DAY);
  u.invoices.push({ id:'FAT-' + Math.random().toString(36).slice(2, 8).toUpperCase(), plan:pl.name, value:u.cycle === 'anual' ? pl.price * 10 : pl.price, due:due.toISOString(), status:'aberta', method:u.payMethod, ref:due.toLocaleDateString('pt-BR', { month:'2-digit', year:'numeric' }) });
}
const socOpenInvoice = () => (userSession.invoices || []).find(i => i.status === 'aberta');
function socInvState(i) {
  if (i.status === 'paga') return ['Paga', ''];
  if (i.status === 'cancelada') return ['Cancelada', 'lock'];
  const late = (Date.now() - new Date(i.due).getTime()) / DAY;
  if (late > GRACE) return ['Vencida', 'bad']; if (late > 0) return ['Em atraso', 'bad'];
  const left = Math.ceil(-late); return [left <= 7 ? `Vence em ${left}d` : 'A vencer', 'warn'];
}
function socSuspended() { const u = userSession; return !!(u && u.plan && (u.invoices || []).some(i => i.status === 'aberta' && (Date.now() - new Date(i.due).getTime()) / DAY > GRACE)); }

/* ---------- Carteirinha ---------- */
function socInitials(n) { return n.split(' ').filter(Boolean).slice(0, 2).map(x => x[0]).join('').toUpperCase(); }
function socBarcode(code) {
  let x = 0, bars = '';
  for (const ch of code + code) { const c = ch.charCodeAt(0); [1 + (c % 3), 1 + ((c >> 2) % 2), 1 + ((c >> 3) % 3)].forEach((w, i) => { if (i % 2 === 0) bars += `<rect x="${x}" y="0" width="${w}" height="34" fill="#111"/>`; x += w + 1; }); }
  return `<svg viewBox="0 0 ${x} 34" preserveAspectRatio="none" style="width:100%;height:34px;background:#fff;border-radius:3px;padding:2px 4px">${bars}</svg>`;
}
function maCardHtml() {
  const u = userSession, base = SOC_BY_NAME[u.plan], pl = base, sus = socSuspended(), inv = socOpenInvoice();
  const color = pl ? pl.color : '#3a4560', since = u.planSince ? new Date(u.planSince).toLocaleDateString('pt-BR', { month:'2-digit', year:'numeric' }) : '—';
  const valid = inv ? new Date(new Date(inv.due).getTime() + GRACE * DAY).toLocaleDateString('pt-BR', { month:'2-digit', year:'2-digit' }) : '—';
  const photo = u.photo ? `<img src="${u.photo}" alt="Foto do sócio" style="width:100%;height:100%;object-fit:cover">` : `<span style="font-family:var(--font-display);font-size:1.6rem">${socInitials(u.name)}</span>`;
  const st = !pl ? 'SEM PLANO' : sus ? 'SUSPENSO' : 'ATIVO';
  return `<div class="mc${maFlip ? ' flip' : ''}" id="maCard" style="--pc:${color}" onclick="maFlip=!maFlip;this.classList.toggle('flip')" role="button" aria-label="Virar carteirinha" tabindex="0">
    <div class="mc-in">
      <div class="mc-f mc-front"><div class="mc-holo"></div>
        <div style="display:flex;align-items:center;gap:8px;"><img src="https://i.imgur.com/HWoq88J.png" alt="" style="width:30px;height:34px;object-fit:contain" onerror="this.style.display='none'"><div><div style="font-size:0.58rem;letter-spacing:.14em;opacity:.8">SANTA CLARA ESPORTE CLUBE</div><div style="font-family:var(--font-display);font-size:1.15rem;text-transform:uppercase;line-height:1">${pl ? pl.ico + ' ' + pl.name : 'Torcedor Cadastrado'}</div></div></div>
        <div style="display:flex;gap:12px;margin-top:12px;align-items:center;"><div class="mc-photo">${photo}</div>
          <div style="min-width:0"><div style="font-size:0.55rem;opacity:.7;text-transform:uppercase">Nome</div><div style="font-weight:800;font-size:0.9rem;text-transform:uppercase;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${socEsc(u.name)}</div>
          <div style="display:flex;gap:14px;margin-top:6px;font-size:0.72rem"><div><div style="font-size:0.5rem;opacity:.7">Nº SÓCIO</div><b style="font-family:monospace">${u.code}</b></div><div><div style="font-size:0.5rem;opacity:.7">DESDE</div><b>${since}</b></div><div><div style="font-size:0.5rem;opacity:.7">VALIDADE</div><b>${valid}</b></div></div></div></div>
        <span class="mc-st ${sus || !pl ? 'off' : ''}">${st}</span><span style="position:absolute;left:16px;bottom:12px;font-size:0.55rem;opacity:.6">Toque para virar</span></div>
      <div class="mc-f mc-back"><div style="height:30px;background:#000;margin:-16px -16px 10px"></div>
        <div style="display:flex;gap:12px;align-items:center;"><div class="ma-qr" id="maQr"></div><div style="font-size:0.62rem;line-height:1.5;opacity:.9">Documento pessoal e intransferível. Apresente com documento de identidade com foto nos portões e na Central do Torcedor. Dúvidas: atendimento ao torcedor na esplanada da Toca do Lobo.</div></div>
        <div style="margin-top:10px">${socBarcode(u.code)}</div><div style="text-align:center;font-family:monospace;font-size:0.7rem;margin-top:3px;letter-spacing:.2em">${u.code}</div></div>
    </div></div>`;
}
function maPhotoPick(inp) {
  const f = inp.files && inp.files[0]; if (!f) return;
  if (!/^image\//.test(f.type)) return socToast('Escolha um arquivo de imagem.');
  const r = new FileReader();
  r.onload = () => { const im = new Image(); im.onload = () => {
    const c = document.createElement('canvas'); c.width = 240; c.height = 300; const x = c.getContext('2d'), k = Math.max(240 / im.width, 300 / im.height);
    x.drawImage(im, (240 - im.width * k) / 2, (300 - im.height * k) / 2, im.width * k, im.height * k);
    userSession.photo = c.toDataURL('image/jpeg', 0.82); socLog('Foto da carteirinha atualizada'); socSave(); socRenderArea(); socToast('Foto atualizada!'); };
    im.onerror = () => socToast('Não foi possível ler a imagem.'); im.src = r.result; };
  r.readAsDataURL(f);
}
/* Modo catraca: QR grande com código que renova a cada 30s */
let gateTimer = null;
function maGateMode() {
  if (socSuspended()) return socToast('Carteirinha suspensa: regularize sua fatura.');
  let g = $s('gateMode');
  if (!g) { g = document.createElement('div'); g.id = 'gateMode'; g.className = 'gate-mode'; document.body.appendChild(g); }
  g.style.display = 'flex';
  const draw = () => {
    const u = userSession, slot = Math.floor(Date.now() / 30000), tok = ((slot * 2654435761) >>> 0).toString(36).toUpperCase().slice(-5), left = 30 - Math.floor((Date.now() / 1000) % 30);
    g.innerHTML = `<button class="gate-x" onclick="maGateClose()" aria-label="Fechar">✕</button><div style="font-weight:800;letter-spacing:.1em;font-size:0.8rem">MODO CATRACA</div><div id="gateQr" style="margin:18px 0"></div><div style="font-family:var(--font-display);font-size:1.5rem;text-transform:uppercase">${socEsc(u.name)}</div><div>${(SOC_BY_NAME[u.plan] || {}).name || 'Torcedor'} • ${u.code}</div><div style="margin-top:14px;font-family:monospace;font-size:1.1rem">${tok}</div><div style="font-size:0.8rem;color:#555;margin-top:4px">Código renova em ${left}s • aumente o brilho da tela</div>`;
    new QRCode($s('gateQr'), { text:`${u.code}|${tok}`, width:min(260), height:min(260) });
  };
  function min(n) { return Math.min(n, window.innerWidth - 80); }
  draw(); clearInterval(gateTimer); gateTimer = setInterval(draw, 1000 * 5);
}
function maGateClose() { clearInterval(gateTimer); const g = $s('gateMode'); if (g) g.style.display = 'none'; }

/* ---------- Abas ---------- */
window.socRenderArea = function () {
  $s('maTabs').innerHTML = MA_TABS.map(t => `<button type="button" class="${t[0] === maTab ? 'on' : ''}" onclick="maTab='${t[0]}';maPayId=null;maReceiptId=null;socRenderArea()">${t[1]}</button>`).join('');
  if (userSession.plan) { socNextInvoice(); }
  $s('maBody').innerHTML = { painel:maPainel, beneficios:maBeneficios, ingressos:maIngressos, financeiro:maFinanceiro, pontos:maPontos, perfil:maPerfil }[maTab]();
  if (maTab === 'painel') { const q = $s('maQr'); if (q) { q.innerHTML = ''; new QRCode(q, { text:userSession.code, width:70, height:70 }); } }
  if (maTab === 'ingressos') userSession.tickets.forEach((t, i) => { const q = $s('tkQr' + i); if (q && !q.innerHTML) new QRCode(q, { text:t.hash, width:96, height:96 }); });
  if (maTab === 'financeiro' && maPayId) { const q = $s('pixQr'); if (q) { q.innerHTML = ''; new QRCode(q, { text:maPixCode(maPayId), width:150, height:150 }); } }
};
function maPainel() {
  const u = userSession, pl = SOC_BY_NAME[u.plan], h = new Date().getHours(), inv = socOpenInvoice(), sus = socSuspended();
  const lvl = u.points >= 2000 ? 'Alfa da Matilha' : u.points >= 500 ? 'Lobo de Elite' : 'Filhote';
  let alert = '';
  if (sus) alert = `<div class="ma-alert bad"><strong>⛔ Benefícios suspensos</strong><br>Sua fatura de ${inv.ref} está vencida. Regularize para reativar descontos, carteirinha e pré-venda.<br><button class="btn-primary" style="margin-top:8px" onclick="maTab='financeiro';maPayId='${inv.id}';socRenderArea()">Regularizar agora</button></div>`;
  else if (inv) { const s = socInvState(inv); if (s[1] !== '') alert = `<div class="ma-alert"><strong>💳 Próxima cobrança: ${socMoney(inv.value)}</strong> • vence em ${socFmt(inv.due)} (${s[0].toLowerCase()})<br><button class="btn-outline" style="margin-top:8px" onclick="maTab='financeiro';socRenderArea()">Ver fatura</button></div>`; }
  const ticketNext = u.tickets.find(t => (t.match || '').includes('Araçuaí'));
  const log = (u.log || []).slice(0, 5);
  return `<div style="margin-bottom:14px"><div style="font-size:0.8rem;color:var(--club-muted)">${h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'},</div><div style="font-family:var(--font-display);font-size:1.5rem;text-transform:uppercase">${socEsc(u.name.split(' ')[0])} <span class="ma-tag ${sus || !pl ? 'lock' : ''}" style="vertical-align:middle">${pl ? (sus ? 'Suspenso' : 'Sócio ativo') : 'Sem plano'}</span></div></div>
    ${alert}${maCardHtml()}
    <div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin:14px 0">
      <button class="btn-primary" onclick="maGateMode()">📲 Modo catraca</button>
      <label class="btn-outline" style="cursor:pointer">📷 ${u.photo ? 'Trocar' : 'Adicionar'} foto<input type="file" accept="image/*" hidden onchange="maPhotoPick(this)"></label></div>
    <div class="ma-kpis"><div class="ma-kpi"><b>${u.points}</b>Pontos SCEC</div><div class="ma-kpi"><b>${u.tickets.length}</b>Ingressos</div><div class="ma-kpi"><b>${socMoney(u.saved || 0)}</b>Economizado</div><div class="ma-kpi"><b style="font-size:1rem">${lvl}</b>Nível</div></div>
    ${pl ? '' : `<div class="ma-item"><strong>Ative seus benefícios</strong><p>Com um plano você paga menos (ou nada) nos ingressos, ganha desconto na loja, pré-venda e muito mais.</p><button class="btn-primary" onclick="closeModal('memberAreaModal');goSection('socio')">Ver planos de sócio</button></div>`}
    <div class="ma-item"><div class="top"><strong>⚽ ${VAJ_MATCH.title}</strong><span class="ma-tag warn">${VAJ_MATCH.dateLabel}</span></div><p>${ticketNext ? '✅ Você tem ingresso: ' + socEsc(ticketNext.sectorName) + '. Portões abrem às ' + VAJ_MATCH.gates + '.' : 'Você ainda não tem ingresso para este jogo. Portões abrem às ' + VAJ_MATCH.gates + '.'}</p>
      <button class="btn-outline" onclick="closeModal('memberAreaModal');goSection('ingressos')">${ticketNext ? 'Comprar mais' : 'Comprar ingresso'}</button> <button class="btn-outline" onclick="closeModal('memberAreaModal');goSection('vou-ao-jogo')">Plano do dia de jogo</button></div>
    <div class="ma-h">Atividade recente</div>${log.length ? '<div class="ma-list">' + log.map(l => `<div class="ma-item" style="padding:9px 12px"><div class="top"><span>${socEsc(l.t)}</span><small style="color:var(--club-muted)">${new Date(l.at).toLocaleDateString('pt-BR')} ${new Date(l.at).toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' })}</small></div></div>`).join('') + '</div>' : '<p style="color:var(--club-muted);font-size:0.82rem">Suas compras, pagamentos e resgates aparecem aqui.</p>'}`;
}

/* ---------- Financeiro ---------- */
function maPixCode(id) { return `00020126580014BR.GOV.BCB.PIX0136scec-fake-${id.toLowerCase()}5204000053039865802BR5913SANTA CLARA EC6009JEQUITINH62070503***6304TEST`; }
function maFinanceiro() {
  const u = userSession, pl = SOC_BY_NAME[u.plan], inv = (u.invoices || []).slice().reverse();
  if (!pl && !inv.length) return `<div class="ma-item"><strong>Sem cobranças</strong><p>Quando você aderir a um plano, suas faturas aparecem aqui.</p><button class="btn-primary" onclick="closeModal('memberAreaModal');goSection('socio')">Ver planos</button></div>`;
  const cur = pl ? `<div class="ma-item" style="--pc:${pl.color}"><div class="top"><strong>${pl.ico} ${pl.name}</strong><span class="ma-tag ${socSuspended() ? 'bad' : ''}">${socSuspended() ? 'Suspenso' : 'Em dia'}</span></div>
      <p>${socMoney(u.cycle === 'anual' ? pl.price * 10 : pl.price)} / ${u.cycle === 'anual' ? 'ano' : 'mês'} • Forma de pagamento: <strong>${socEsc(u.payMethod || 'Pix')}</strong></p>
      <select id="payChange"><option ${u.payMethod === 'Pix' ? 'selected' : ''}>Pix</option><option ${u.payMethod === 'Cartão de crédito' ? 'selected' : ''}>Cartão de crédito</option><option ${u.payMethod === 'Boleto' ? 'selected' : ''}>Boleto</option></select><button class="btn-outline" onclick="maSetPay()">Alterar forma</button></div>` : '';
  let panel = '';
  if (maPayId) { const i = (u.invoices || []).find(x => x.id === maPayId); if (i && i.status === 'aberta') panel = `<div class="ma-item"><div class="top"><strong>Pagar fatura ${i.ref}</strong><span class="ma-tag">${socMoney(i.value)}</span></div>
      <p>Pix simulado: aponte a câmera do banco para o QR ou copie o código. Nenhum valor real é cobrado.</p><div style="display:flex;gap:14px;flex-wrap:wrap;align-items:center"><div class="ma-qr" id="pixQr"></div><div style="flex:1;min-width:180px"><code style="font-size:0.62rem;word-break:break-all;display:block;margin-bottom:8px">${maPixCode(i.id)}</code>
      <button class="btn-outline" onclick="navigator.clipboard&&navigator.clipboard.writeText('${maPixCode(i.id)}');socToast('Código Pix copiado.')">Copiar código</button> <button class="btn-primary" onclick="maPay('${i.id}')">Simular pagamento</button></div></div></div>`; }
  let rec = '';
  if (maReceiptId) { const i = (u.invoices || []).find(x => x.id === maReceiptId); if (i) rec = `<div class="ma-item" style="border-left-color:#2e9e4f"><div class="top"><strong>🧾 Comprovante ${i.id}</strong><button class="auth-link" onclick="maReceiptId=null;socRenderArea()">fechar</button></div>
      <p style="margin:6px 0">${socEsc(i.plan)} • referência ${i.ref}<br>Valor: <strong>${socMoney(i.value)}</strong><br>Pago em ${socFmt(i.paidAt)} via ${socEsc(i.method || 'Pix')}<br>Sócio: ${socEsc(u.name)} (${u.code})<br><small style="color:var(--club-muted)">Documento simulado, sem valor fiscal.</small></p></div>`; }
  return `${cur}${panel}${rec}<div class="ma-h">Faturas</div><div class="ma-list">${inv.map(i => { const s = socInvState(i);
    return `<div class="ma-item"><div class="top"><strong>${i.ref} • ${socMoney(i.value)}</strong><span class="ma-tag ${s[1]}">${s[0]}</span></div><p style="margin:2px 0 6px">${socEsc(i.plan)} • vencimento ${socFmt(i.due)}${i.paidAt ? ' • pago em ' + socFmt(i.paidAt) : ''}</p>
      ${i.status === 'aberta' ? `<button class="btn-primary" onclick="maPayId='${i.id}';socRenderArea()">Pagar</button>` : i.status === 'paga' ? `<button class="btn-outline" onclick="maReceiptId='${i.id}';socRenderArea()">Comprovante</button>` : ''}</div>`; }).join('')}</div>`;
}
function maSetPay() { userSession.payMethod = $s('payChange').value; const o = socOpenInvoice(); if (o) o.method = userSession.payMethod; socLog('Forma de pagamento alterada para ' + userSession.payMethod); socSave(); socRenderArea(); socToast('Forma de pagamento atualizada.'); }
function maPay(id) {
  const u = userSession, i = u.invoices.find(x => x.id === id); if (!i) return;
  const early = Date.now() <= new Date(i.due).getTime();
  i.status = 'paga'; i.paidAt = new Date().toISOString(); i.method = 'Pix'; maPayId = null; maReceiptId = i.id;
  if (early) u.points += 50; socNextInvoice(); socLog(`Fatura ${i.ref} paga (${socMoney(i.value)})`); socSave(); socRefreshUI(); socRenderArea();
  socToast(early ? 'Pagamento confirmado! +50 pontos por pagar em dia.' : 'Pagamento confirmado. Benefícios reativados.');
}

/* ---------- Perfil ---------- */
function socProfilePct() { const u = userSession; return Math.round(100 * [u.photo, u.phone, u.birth, u.city, u.name, u.email].filter(Boolean).length / 6); }
function maPerfil() {
  const u = userSession, pl = SOC_BY_NAME[u.plan], pct = socProfilePct(), pf = u.prefs || { jogos:true, ofertas:true, prevenda:true };
  return `<div class="ma-item"><div class="top"><strong>Perfil ${pct}% completo</strong><span class="ma-tag ${pct === 100 ? '' : 'warn'}">${u.profileBonus ? 'bônus recebido' : '+50 pontos ao completar'}</span></div><div class="ma-bar"><i style="width:${pct}%"></i></div></div>
    <div class="ma-h">Dados cadastrais</div><div class="ma-item">
      <div class="form-group"><label>Nome completo</label><input id="pfName" class="form-control" value="${socEsc(u.name)}"></div>
      <div class="form-group"><label>E-mail</label><input class="form-control" value="${socEsc(u.email)}" disabled></div>
      <div class="form-group"><label>CPF / documento</label><input class="form-control" value="${socEsc(u.docMasked || '••••••')}" disabled></div>
      <div class="form-group"><label>Telefone (WhatsApp)</label><input id="pfPhone" class="form-control" inputmode="tel" placeholder="(38) 99999-0000" value="${socEsc(u.phone || '')}" oninput="this.value=socMaskPhone(this.value)"></div>
      <div class="form-group"><label>Data de nascimento</label><input type="date" id="pfBirth" class="form-control" max="${new Date().toISOString().slice(0, 10)}" value="${socEsc(u.birth || '')}"></div>
      <div class="form-group"><label>Cidade / UF</label><input id="pfCity" class="form-control" placeholder="Ex.: Januária / MG" value="${socEsc(u.city || '')}"></div>
      <div class="auth-err" id="pfErr"></div><button class="btn-primary" onclick="maSaveProfile()">Salvar dados</button></div>
    <div class="ma-h">Preferências de comunicação</div><div class="ma-item" style="display:grid;gap:8px">
      ${[['jogos', 'Avisos de jogos e escalações'], ['ofertas', 'Ofertas da loja e do sócio'], ['prevenda', 'Abertura de pré-venda']].map(([k, t]) => `<label style="display:flex;gap:8px;cursor:pointer"><input type="checkbox" ${pf[k] ? 'checked' : ''} onchange="maPref('${k}',this.checked)"> ${t}</label>`).join('')}</div>
    <div class="ma-h">Segurança</div><div class="ma-item"><div class="form-group"><label>Senha atual</label><input type="password" id="cfOld" class="form-control" autocomplete="current-password"></div><div class="form-group"><label>Nova senha</label><input type="password" id="cfNew" class="form-control" autocomplete="new-password"></div><div class="auth-err" id="cfErr"></div><button class="btn-outline" onclick="maChangePass()">Atualizar senha</button>
      <p style="font-size:0.72rem;color:var(--club-muted);margin-top:10px">Último acesso: ${u.lastLogin ? new Date(u.lastLogin).toLocaleString('pt-BR') : 'agora'}</p></div>
    <div class="ma-h">Plano</div><div class="ma-item"><p style="margin:0 0 8px">${pl ? pl.ico + ' ' + pl.name + ' • desde ' + socFmt(u.planSince) : 'Você não tem plano ativo.'}</p><button class="btn-outline" onclick="closeModal('memberAreaModal');goSection('socio')">${pl ? 'Trocar de plano' : 'Ver planos'}</button> ${pl ? '<button class="btn-outline" onclick="maCancelPlan()">Cancelar plano</button>' : ''}</div>
    <div class="ma-h">Conta</div><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn-primary" onclick="socLogout()">Sair da conta</button><button class="btn-outline" style="border-color:#e5675f;color:#e5675f" onclick="maDelete()">Excluir minha conta</button></div>`;
}
function socMaskPhone(v) { const d = v.replace(/\D/g, '').slice(0, 11); return d.length > 6 ? `(${d.slice(0, 2)}) ${d.slice(2, d.length > 10 ? 7 : 6)}-${d.slice(d.length > 10 ? 7 : 6)}` : d.length > 2 ? `(${d.slice(0, 2)}) ${d.slice(2)}` : d; }
function maPref(k, v) { userSession.prefs = Object.assign({ jogos:true, ofertas:true, prevenda:true }, userSession.prefs, { [k]:v }); socSave(); }
function maSaveProfile() {
  const u = userSession, n = $s('pfName').value.trim().replace(/\s+/g, ' '), ph = $s('pfPhone').value.trim(), b = $s('pfBirth').value, c = $s('pfCity').value.trim(), err = $s('pfErr');
  if (n.split(' ').length < 2) { err.textContent = 'Informe nome e sobrenome.'; return; }
  if (ph && ph.replace(/\D/g, '').length < 10) { err.textContent = 'Telefone incompleto.'; return; }
  if (b && new Date(b) > new Date()) { err.textContent = 'Data de nascimento inválida.'; return; }
  u.name = n; u.phone = ph; u.birth = b; u.city = c;
  if (socProfilePct() === 100 && !u.profileBonus) { u.profileBonus = true; u.points += 50; socToast('Perfil completo! +50 pontos SCEC.'); } else socToast('Dados salvos.');
  socLog('Dados cadastrais atualizados'); socSave(); socRefreshUI(); socRenderArea();
}
async function maChangePass() {
  const o = $s('cfOld').value, n = $s('cfNew').value, err = $s('cfErr');
  if ((await socHash(o, userSession.salt)) !== userSession.hash) { err.textContent = 'Senha atual incorreta.'; return; }
  if (!socPassOk(n)) { err.textContent = 'A nova senha precisa de 8+ caracteres, com letras e números.'; return; }
  userSession.hash = await socHash(n, userSession.salt); socLog('Senha alterada'); socSave(); $s('cfOld').value = $s('cfNew').value = ''; err.textContent = ''; socToast('Senha atualizada.');
}
function maCancelPlan() {
  if (!confirm('Cancelar seu plano? Descontos e carteirinha de sócio deixam de valer agora. Faturas em aberto serão canceladas.')) return;
  const nm = userSession.plan; userSession.plan = null; userSession.invoices.forEach(i => { if (i.status === 'aberta') i.status = 'cancelada'; });
  socLog(nm + ' cancelado'); socSave(); socRefreshUI(); socRenderArea(); socToast('Plano cancelado.');
}
function maDelete() {
  if (!confirm('Excluir sua conta e todos os dados (ingressos, pontos, faturas)? Isso não pode ser desfeito.')) return;
  delete ACC[userSession.email]; socPersist(); socLogout(); socToast('Conta excluída.');
}


/* ---------- Transmissão: próxima partida, contagem e lembretes ---------- */
const BC_EXTRA = {
  'SportiNet': { chips:['⭐ Transmissão principal', '📺 Vídeo', 'TV 1'], off:-30, note:'Pré-jogo 30 min antes' },
  'SuperSports': { chips:['📺 Vídeo', 'TV 2', 'Alternativa'], off:-30, note:'Pré-jogo 30 min antes' },
  'Pop 96': { chips:['⭐ Recomendada', '🎧 Alta qualidade', '📊 Resultado no site'], off:-60, note:'Pré-jogo 1h antes' },
  'Rádio Oficial do Estádio': { chips:['📡 Acesso a 3 rádios', '🔉 Qualidade menor', 'Sinal oficial'], off:-60, note:'Pré-jogo 1h antes' }
};
const BC_FAQ = [
  ['Qual TV é a principal?', 'A SportiNet é a TV 1, com a transmissão principal do jogo. A SuperSports é a TV 2, a segunda opção.'],
  ['Qual rádio escolher?', 'A Pop 96 tem áudio em alta qualidade e mostra o resultado no próprio site. A Rádio Oficial do Estádio dá acesso a 3 rádios, mas com qualidade mais baixa.'],
  ['O que é a Rádio Oficial do Estádio?', 'É a emissora da Toca do Lobo. Ela distribui o sinal para muitas rádios, por isso um mesmo som chega por várias emissoras.'],
  ['Estou sem TV, e agora?', 'Ouça pela Pop 96 e acompanhe o resultado no site da rádio.'],
  ['Prefiro ir ao estádio.', 'Melhor ainda! Veja os ingressos e o plano do dia de jogo nas seções Ingressos e Vou ao Jogo.']
];
function bcGet() { try { return JSON.parse(localStorage.getItem('scec_bc_remind') || '{}'); } catch (e) { return {}; } }
function bcState() {
  const k = new Date(VAJ_MATCH.date).getTime(), now = Date.now();
  if (now >= k && now <= k + 115 * 60000) return 'live';
  return now > k ? 'done' : 'soon';
}
function bcCountdown() {
  const diff = Math.max(0, new Date(VAJ_MATCH.date).getTime() - Date.now());
  return [['dias', Math.floor(diff / 86400000)], ['horas', Math.floor(diff % 86400000 / 3600000)], ['min', Math.floor(diff % 3600000 / 60000)]];
}
function bcHeroHtml() {
  const st = bcState(), M = VAJ_MATCH, ch = DB.broadcast;
  const label = st === 'live' ? 'Ao vivo agora' : st === 'done' ? 'Partida encerrada' : 'Próxima transmissão';
  const rows = [['Pré', 'Pré-jogo ao vivo', -60], ['Jogo', 'Bola rolando', 0], ['Pós', 'Pós-jogo e melhores momentos', 105]].map(r => `<div><b>${fmtMatchTime('16:00', r[2])}</b><span>${r[1]}</span></div>`).join('');
  return `<div><span class="bc-live ${st === 'live' ? 'on' : ''}">${label}</span>
      <h3 style="font-family:var(--font-display);font-size:1.8rem;text-transform:uppercase;margin:12px 0 4px">${M.title}</h3>
      <div style="color:var(--club-muted);font-size:0.85rem">${M.comp} • 📅 ${M.dateLabel}</div>
      <div style="font-size:0.8rem;margin-top:8px">📺 <strong>SportiNet</strong> (TV 1) • <strong>SuperSports</strong> (TV 2) • 🎧 <strong>Pop 96</strong></div>
      ${st === 'soon' ? `<div class="bc-count" id="bcCount">${bcCountdown().map(c => `<div><b>${String(c[1]).padStart(2, '0')}</b><span>${c[0]}</span></div>`).join('')}</div>` : '<div style="height:14px"></div>'}
      <div style="display:flex;flex-wrap:wrap;gap:8px"><button class="btn-primary" onclick="bcRemind('geral')">🔔 Me lembrar do jogo</button><button class="btn-outline" onclick="bcShare()">💬 Chamar a Matilha</button></div></div>
    <div class="bc-sched"><strong style="font-size:0.72rem;text-transform:uppercase;letter-spacing:.08em;color:var(--club-muted)">Programação do dia</strong>${rows}</div>`;
}
window.renderBroadcast = function () {
  const rem = bcGet(), st = bcState(), k = new Date(VAJ_MATCH.date).getTime();
  $s('broadcastHero').innerHTML = `<div class="bc-hero">${bcHeroHtml()}</div>`;
  $s('broadcastList').innerHTML = DB.broadcast.map(b => {
    const x = BC_EXTRA[b.name] || { chips:['🆓 Grátis'], off:0, note:'' }, at = new Date(k + x.off * 60000), on = !!rem[b.name];
    const live = st === 'live' && k + x.off * 60000 <= Date.now();
    return `<div class="sponsor-card">
      <div class="sponsor-header">${b.imgur ? `<img src="${b.logo}" alt="${b.name}" class="sponsor-logo" data-id="${b.imgur}" data-tried="0" data-emoji="${b.icon}" onerror="bcLogoFail(this)">` : `<span class="sponsor-logo-placeholder" style="font-size:1.7rem">${b.icon}</span>`}<div><div class="sponsor-tier">${b.tier}</div><div class="sponsor-name">${b.name}</div></div></div>
      <p class="sponsor-desc">${b.desc}</p>
      <div class="bc-chips">${x.chips.map(c => `<span class="sector-tag" style="--sector-color:var(--club-accent)">${c}</span>`).join('')}</div>
      <div style="font-size:0.8rem;margin-bottom:10px">${live ? '<strong style="color:#e5675f">🔴 No ar agora</strong>' : `⏰ Começa às <strong>${at.toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' })}</strong> • ${x.note}`}</div>
      <button class="${on ? 'btn-primary' : 'btn-outline'}" style="width:100%;justify-content:center" onclick="bcRemind('${b.name.replace(/'/g, "\\'")}')">${on ? '🔔 Lembrete ativo' : '🔔 Lembrar desta transmissão'}</button></div>`;
  }).join('');
  $s('broadcastFaq').innerHTML = BC_FAQ.map(([q, r]) => `<details><summary>${q}</summary><p>${r}</p></details>`).join('');
};
function bcLogoFail(img) {
  const exts = ['jpeg', 'png', 'webp', 'gif'], n = parseInt(img.dataset.tried || '0', 10);
  if (n < exts.length) { img.dataset.tried = n + 1; img.src = `https://i.imgur.com/${img.dataset.id}.${exts[n]}`; return; }
  img.outerHTML = `<span class="sponsor-logo-placeholder" style="font-size:1.7rem">${img.dataset.emoji}</span>`;
}
function bcRemind(name) {
  const rem = bcGet(), x = BC_EXTRA[name] || { off:-30 };
  rem[name] = true; try { localStorage.setItem('scec_bc_remind', JSON.stringify(rem)); } catch (e) {}
  const start = new Date(new Date(VAJ_MATCH.date).getTime() + x.off * 60000), end = new Date(new Date(VAJ_MATCH.date).getTime() + 115 * 60000);
  const f = d => d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0') + 'T' + String(d.getHours()).padStart(2, '0') + String(d.getMinutes()).padStart(2, '0') + '00';
  const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//SCEC//Transmissao//PT', 'BEGIN:VEVENT', 'UID:scec-tv-' + start.getTime() + '@scec', 'DTSTAMP:' + f(new Date()), 'DTSTART:' + f(start), 'DTEND:' + f(end),
    'SUMMARY:' + VAJ_MATCH.title + (name === 'geral' ? '' : ' — ' + name), 'DESCRIPTION:' + VAJ_MATCH.comp + '. Assista na SportiNet (TV 1) ou SuperSports (TV 2) e ouça a Pop 96.', 'BEGIN:VALARM', 'TRIGGER:-PT15M', 'ACTION:DISPLAY', 'DESCRIPTION:O jogo do Santa Clara já vai começar!', 'END:VALARM', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
  const l = document.createElement('a'); l.href = URL.createObjectURL(new Blob([ics], { type:'text/calendar' })); l.download = 'transmissao-scec.ics';
  document.body.appendChild(l); l.click(); l.remove();
  socToast('Lembrete salvo no seu calendário, com alerta 15 min antes.'); renderBroadcast();
}
function bcShare() { window.open('https://wa.me/?text=' + encodeURIComponent(`🐺 ${VAJ_MATCH.title}\n${VAJ_MATCH.comp}\n📅 ${VAJ_MATCH.dateLabel}\nAssista na SportiNet (TV 1) ou SuperSports (TV 2) e ouça a Pop 96. Bora, Matilha!`), '_blank'); }
document.addEventListener('DOMContentLoaded', () => {
  try { renderBroadcast(); } catch (e) {}
  setInterval(() => { const c = $s('bcCount'); if (c && bcState() === 'soon') c.innerHTML = bcCountdown().map(x => `<div><b>${String(x[1]).padStart(2, '0')}</b><span>${x[0]}</span></div>`).join(''); else if (bcState() !== 'soon') { try { renderBroadcast(); } catch (e) {} } }, 30000);
});

/* ---------- Extras: elenco, comunidade, navegação e hero ---------- */
let squadPos = 'TODOS', squadQ = '', squadSort = 'num';
window.renderSquad = function (filter) {
  if (typeof filter === 'string') squadPos = filter;
  const box = $s('squadContainer');
  if (!$s('squadTools')) box.insertAdjacentHTML('beforebegin', `<div class="squad-tools" id="squadTools"><input type="search" id="squadSearch" placeholder="Buscar por nome, apelido ou número..." aria-label="Buscar jogador" oninput="squadQ=this.value;renderSquad()"><select aria-label="Ordenar" onchange="squadSort=this.value;renderSquad()"><option value="num">Ordenar por número</option><option value="name">Ordenar por nome</option></select><small id="squadCount"></small></div>`);
  const q = squadQ.toLowerCase().trim().replace(/^#/, '');
  let list = DB.players.filter(p => (squadPos === 'TODOS' || p.pos === squadPos) && (!q || (p.name + ' ' + p.nick + ' ' + p.num).toLowerCase().includes(q)));
  list = list.slice().sort((a, b) => squadSort === 'name' ? a.name.localeCompare(b.name, 'pt-BR') : a.num - b.num);
  $s('squadCount').textContent = list.length + (list.length === 1 ? ' jogador' : ' jogadores');
  const def = 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=350&auto=format&fit=crop';
  box.innerHTML = list.length ? list.map(p => `
    <div class="player-card" onclick="openPlayerDetail(${p.id})">
      <div class="player-card-photo"><span class="player-badge-num">#${p.num}</span><img src="${p.img || def}" alt="${socEsc(p.name)}" loading="lazy" onerror="this.src='${def}'"></div>
      <div class="player-card-info"><span class="player-card-pos">${p.pos}</span><div class="player-card-name">${socEsc(p.name)}</div><span style="font-size:0.75rem; color:var(--club-muted);">${socEsc(p.nick)}</span></div>
    </div>`).join('') : '<p style="color:var(--club-muted)">Nenhum jogador encontrado.</p>';
};
const COMM_VOLS = [34, 52];
window.renderSocialProjects = function () {
  const projects = [
    { title: 'Futebol nas Vilas do Vale', meta: 'R$ 18.000', arrecadado: '78%', desc: 'Aulas e materiais esportivos para 120 crianças das comunidades do Vale do Jequitinhonha.' },
    { title: 'Campanha do Agasalho — A Matilha Aquece', meta: '1.800 Peças', arrecadado: '89%', desc: 'Arrecadação de agasalhos para famílias do Vale durante o período de seca.' }
  ];
  const mine = isLogged() ? (userSession.campaigns || []) : [];
  const root = $s('socialCampaignsList');
  if (!$s('commImpact')) root.insertAdjacentHTML('beforebegin', '<div id="commImpact"></div>');
  $s('commImpact').innerHTML = `<div class="comm-impact">🤝 ${isLogged() ? `<span>Você participa de <b>${mine.length}</b> ${mine.length === 1 ? 'campanha' : 'campanhas'}. Cada inscrição vale <b>+30</b> pontos SCEC.</span>` : '<span>Entre na sua conta para se inscrever como voluntário e ganhar <b>+30</b> pontos SCEC por campanha.</span>'}</div>`;
  root.innerHTML = projects.map((p, i) => {
    const joined = mine.includes(p.title);
    return `<div class="comm-card"><span class="news-tag" style="background:var(--club-brown); position:static; display:inline-block; margin-bottom:10px; align-self:flex-start;">Projeto Social</span>
      <h4 style="font-size:1.1rem; margin-bottom:8px;">${p.title}</h4>
      <p style="color:var(--club-muted); font-size:0.85rem;">${p.desc}</p>
      <div class="vols">👥 ${COMM_VOLS[i] + (joined ? 1 : 0)} voluntários • meta ${p.meta}</div>
      <div class="stat-bar-label"><span>Meta Atingida</span><span>${p.arrecadado}</span></div>
      <div class="bar-track" style="margin:6px 0 16px;"><div class="bar-fill" style="width:${p.arrecadado};"></div></div>
      ${joined ? '<div class="done">✅ Você é voluntário desta campanha</div>' : `<button class="btn-outline" style="width:100%;" onclick="commJoin(${i})">Quero ser voluntário</button>`}</div>`;
  }).join('');
};
function commJoin(i) {
  const names = ['Futebol nas Vilas do Vale', 'Campanha do Agasalho — A Matilha Aquece'];
  if (!isLogged()) { socOpenAuth('login', { notice:'Entre ou crie sua conta para se inscrever como voluntário.', then: () => commJoin(i) }); return; }
  const u = userSession; u.campaigns = u.campaigns || [];
  if (u.campaigns.includes(names[i])) return;
  u.campaigns.push(names[i]); u.points += 30; socLog('Voluntário: ' + names[i] + ' (+30 pontos)'); socSave();
  renderSocialProjects(); socToast('Inscrição registrada! A Matilha agradece. +30 pontos SCEC.');
}
(function () {
  document.addEventListener('DOMContentLoaded', () => {
    try { renderSquad(); renderSocialProjects(); } catch (e) {}
    const bar = document.createElement('div'); bar.id = 'scrollBar'; document.body.appendChild(bar);
    const top = document.createElement('button'); top.id = 'toTop'; top.setAttribute('aria-label', 'Voltar ao topo'); top.textContent = '↑'; top.onclick = () => window.scrollTo({ top:0, behavior:'smooth' }); document.body.appendChild(top);
    const nav = document.createElement('nav'); nav.id = 'mobileNav'; nav.setAttribute('aria-label', 'Atalhos');
    nav.innerHTML = '<button onclick="goSection(\'ingressos\')"><span>🎟️</span>Ingressos</button><button onclick="goSection(\'vou-ao-jogo\')"><span>⚽</span>Jogo</button><button onclick="goSection(\'transmissao\')"><span>📺</span>Assistir</button><button onclick="isLogged()?socOpenArea(\'painel\'):goSection(\'socio\')"><span>🐺</span>Sócio</button>';
    document.body.appendChild(nav);
    let tick = false;
    window.addEventListener('scroll', () => { if (tick) return; tick = true; requestAnimationFrame(() => { const h = document.documentElement.scrollHeight - innerHeight; bar.style.width = (h > 0 ? 100 * scrollY / h : 0) + '%'; top.classList.toggle('show', scrollY > 700); tick = false; }); }, { passive:true });
    const act = document.querySelector('.hero-match .hero-actions');
    if (act && !document.getElementById('heroQuick')) {
      act.insertAdjacentHTML('afterend', '<div class="hero-quick" id="heroQuick"></div>'); heroQuick();
    }
  });
  window.heroQuick = function () {
    const q = document.getElementById('heroQuick'); if (!q) return;
    const has = isLogged() && userSession.tickets.some(t => (t.match || '').includes('Araçuaí'));
    q.innerHTML = `<button onclick="goSection('transmissao')">📺 SportiNet • SuperSports</button><button onclick="goSection('transmissao')">🎧 Pop 96</button><button onclick="goSection('vou-ao-jogo')">⚽ Plano do dia de jogo</button>${has ? '<button onclick="socOpenArea(\'ingressos\')" style="border-color:#2e9e4f">✅ Você tem ingresso</button>' : ''}`;
  };
})();
const _refreshUI0 = window.socRefreshUI;
window.socRefreshUI = function () { _refreshUI0(); try { renderSocialProjects(); heroQuick(); } catch (e) {} };

/* ======================================================================
   A MATILHA — escalação, palpite, simulador, calendário, comparador,
   arena de jogos, galeria, mural, cartão, missões, hino e dúvidas
   ====================================================================== */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const esc = t => socEsc(t);
  const lsGet = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  const pad = n => String(n).padStart(2, '0');
  const dayKey = (d = new Date()) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const rnd = n => Math.floor(Math.random() * n);
  const shuffle = a => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = rnd(i + 1); [b[i], b[j]] = [b[j], b[i]]; } return b; };
  const lastName = p => p.name.split(' ').slice(-1)[0];
  const oppName = () => String(VAJ_MATCH.title.split('×')[1] || 'Adversário').trim();
  const matchTime = () => new Date(VAJ_MATCH.date).getTime();
  const nx = window.nx = {};

  const SECTIONS = [
    ['escalacao', 'Escalação'], ['palpite', 'Palpite e craque'], ['simulador', 'Simulador'], ['calendario', 'Calendário'],
    ['comparador', 'Comparador'], ['arena', 'Arena de jogos'], ['galeria', 'Galeria'], ['mural', 'Mural'],
    ['cartao', 'Cartão do torcedor'], ['missoes', 'Missões'], ['hino', 'Hino'], ['duvidas', 'Dúvidas']
  ];

  /* ---------------------------------------------------------------
     MISSÕES E PONTOS
     --------------------------------------------------------------- */
  const MISSIONS = [
    { id: 'palpite', label: 'Dar o palpite do jogo', pts: 10, go: 'palpite' },
    { id: 'craque', label: 'Votar no craque do jogo', pts: 10, go: 'palpite' },
    { id: 'quiz', label: 'Terminar o Quiz do Lobo', pts: 15, go: 'arena' },
    { id: 'penalti', label: 'Bater 5 pênaltis', pts: 10, go: 'arena' },
    { id: 'mural', label: 'Deixar um recado no mural', pts: 10, go: 'mural' },
    { id: 'cartao', label: 'Baixar seu cartão de torcedor', pts: 5, go: 'cartao' }
  ];
  const RANK_SEED = [['Dona Rita do Vale', 3420], ['Zé da Toca', 2980], ['Camila Uivante', 2610], ['Nego Jequi', 2175], ['Tia Neide', 1890], ['Pedrão Marrom', 1530], ['Luana 12', 1320], ['Seu Aristides', 990]];
  const yesterdayKey = () => dayKey(new Date(Date.now() - 864e5));

  function mLoad() {
    const s = lsGet('nx_missions', null) || { day: '', done: {}, streak: 0, last: '', earned: 0 };
    if (s.day !== dayKey()) { s.day = dayKey(); s.done = {}; s.earned = 0; }
    return s;
  }
  function nxDone(id) {
    const s = mLoad(), m = MISSIONS.find(x => x.id === id);
    if (!m || s.done[id]) return;
    s.done[id] = true;
    if (s.last !== dayKey()) { s.streak = s.last === yesterdayKey() ? (s.streak || 0) + 1 : 1; s.last = dayKey(); }
    if (isLogged()) s.earned = (s.earned || 0) + m.pts;
    lsSet('nx_missions', s);
    if (isLogged()) {
      userSession.points = (userSession.points || 0) + m.pts;
      try { socLog('Missão: ' + m.label + ' (+' + m.pts + ' pontos)'); socSave(); socRefreshUI(); } catch (e) {}
      socToast('Missão cumprida: ' + m.label + '. +' + m.pts + ' pontos SCEC.');
    } else {
      socToast('Missão cumprida! Entre na sua conta para somar +' + m.pts + ' pontos.');
    }
    renderMissions(); renderRank();
  }
  function renderMissions() {
    const el = $('nxMissions'); if (!el) return;
    const s = mLoad(), done = MISSIONS.filter(m => s.done[m.id]).length, pct = Math.round(100 * done / MISSIONS.length);
    const tot = MISSIONS.reduce((a, m) => a + m.pts, 0);
    const streak = (s.last === dayKey() || s.last === yesterdayKey()) ? s.streak : 0;
    el.innerHTML = `
      <div class="nx-panel nx-mis-head">
        <div class="nx-ring" style="--p:${pct}"><b>${done}/${MISSIONS.length}</b></div>
        <div>
          <h4>Missões de hoje</h4>
          <p class="nx-note">${isLogged() ? `Você ganhou <b>${s.earned || 0}</b> de ${tot} pontos hoje.` : `Entre na sua conta para transformar missões em pontos (até ${tot} por dia).`}</p>
          <p class="nx-note">Sequência: <b>${streak}</b> ${streak === 1 ? 'dia seguido' : 'dias seguidos'}</p>
        </div>
      </div>
      <ul class="nx-mlist">${MISSIONS.map(m => `
        <li class="${s.done[m.id] ? 'done' : ''}"><span class="ck">${s.done[m.id] ? '✓' : ''}</span><span class="t">${m.label}</span><span class="pt">+${m.pts}</span>
        ${s.done[m.id] ? '<span class="nx-note">Feita</span>' : `<button class="btn-outline" onclick="goSection('${m.go}')">Ir</button>`}</li>`).join('')}
      </ul>`;
  }
  function renderRank() {
    const el = $('nxRank'); if (!el) return;
    const list = RANK_SEED.map(([n, p]) => ({ n, p, me: false }));
    if (isLogged()) list.push({ n: userSession.name || 'Você', p: userSession.points || 0, me: true });
    list.sort((a, b) => b.p - a.p);
    const mi = list.findIndex(x => x.me), top = list.slice(0, 8);
    let html = top.map(x => `<li class="${x.me ? 'me' : ''}"><span>${esc(x.n)}${x.me ? ' (você)' : ''}</span><span class="nx-gold">${x.p.toLocaleString('pt-BR')} pts</span></li>`).join('');
    if (mi >= 8) html += `<li class="gap">Sua posição: ${mi + 1}º com ${list[mi].p.toLocaleString('pt-BR')} pts</li>`;
    if (!isLogged()) html += '<li class="gap">Entre na sua conta para aparecer no ranking.</li>';
    el.innerHTML = html;
  }

  /* ---------------------------------------------------------------
     ESCALAÇÃO PROVÁVEL
     --------------------------------------------------------------- */
  const FORM = { '4-3-3': [4, 3, 3], '4-4-2': [4, 4, 2], '3-5-2': [3, 5, 2] };
  let lineupF = '4-3-3';
  function pickXI(f) {
    const by = pos => DB.players.filter(p => p.pos === pos);
    const [d, m, a] = FORM[f];
    const gk = by('GOLEIRO').sort((x, y) => y.games - x.games).slice(0, 1);
    const df = by('DEFENSOR').sort((x, y) => y.games - x.games).slice(0, d);
    const md = by('MEIO-CAMPISTA').sort((x, y) => y.games - x.games).slice(0, m);
    const at = by('ATACANTE').sort((x, y) => y.goals - x.goals).slice(0, a);
    return { rows: [{ ps: at, y: 17 }, { ps: md, y: 41 }, { ps: df, y: 66 }, { ps: gk, y: 89, gk: true }] };
  }
  const flatXI = f => pickXI(f).rows.flatMap(r => r.ps);
  function renderLineup() {
    $('nxFormTabs').innerHTML = Object.keys(FORM).map(f => `<button class="tab-btn ${f === lineupF ? 'active' : ''}" onclick="nx.setForm('${f}')">${f}</button>`).join('');
    const xi = pickXI(lineupF);
    const lines = '<svg viewBox="0 0 100 130" aria-hidden="true"><rect x="3" y="3" width="94" height="124"/><line x1="3" y1="65" x2="97" y2="65"/><circle cx="50" cy="65" r="10"/><rect x="22" y="3" width="56" height="20"/><rect x="36" y="3" width="28" height="8"/><rect x="22" y="107" width="56" height="20"/><rect x="36" y="119" width="28" height="8"/></svg>';
    $('nxPitch').innerHTML = lines + xi.rows.map(r => r.ps.map((p, i) =>
      `<button class="nx-pl ${r.gk ? 'gk' : ''}" style="left:${((i + 1) * 100 / (r.ps.length + 1)).toFixed(1)}%;top:${r.y}%" onclick="openPlayerDetail(${p.id})" aria-label="${esc(p.name)}, camisa ${p.num}"><b>${p.num}</b><span>${esc(lastName(p))}</span></button>`).join('')).join('');
    const all = flatXI(lineupF), ids = new Set(all.map(p => p.id));
    const age = (all.reduce((a, p) => a + p.age, 0) / all.length).toFixed(1).replace('.', ',');
    const goals = all.reduce((a, p) => a + p.goals, 0);
    const bench = DB.players.filter(p => !ids.has(p.id)).sort((a, b) => a.num - b.num);
    $('nxLineupInfo').innerHTML = `
      <h4>Santa Clara × ${esc(oppName())}</h4>
      <p class="nx-note">${esc(VAJ_MATCH.dateLabel)} • ${esc(VAJ_MATCH.comp)}</p>
      <div class="nx-xi-stats">
        <div><strong>${age}</strong><span>idade média</span></div>
        <div><strong>${goals}</strong><span>gols do time</span></div>
        <div><strong>${lineupF}</strong><span>esquema</span></div>
      </div>
      <h4 style="margin-top:6px;">Banco de reservas</h4>
      <div class="nx-bench">${bench.map(p => `<button onclick="openPlayerDetail(${p.id})">${p.num} ${esc(lastName(p))}</button>`).join('')}</div>
      <p class="nx-note" style="margin-top:14px;">Escalação sugerida pelos jogos e gols da temporada. A lista oficial sai pouco antes da bola rolar.</p>`;
  }
  nx.setForm = f => { lineupF = f; renderLineup(); renderMvp(); };

  /* ---------------------------------------------------------------
     PALPITE E CRAQUE
     --------------------------------------------------------------- */
  const PRED_SEED = { '2-0': 620, '1-0': 440, '2-1': 360, '1-1': 250, '3-0': 180, '3-1': 90, '0-0': 60, '0-1': 80, '1-2': 40 };
  const predKey = () => 'nx_pred_' + VAJ_MATCH.date;
  let pred = null, draft = { a: 2, b: 0 };
  const predClosed = () => Date.now() >= matchTime();
  function predStats() {
    const c = Object.assign({}, PRED_SEED);
    if (pred) { const k = pred.a + '-' + pred.b; c[k] = (c[k] || 0) + 1; }
    let w = 0, d = 0, l = 0, tot = 0;
    Object.entries(c).forEach(([k, n]) => { const [a, b] = k.split('-').map(Number); tot += n; if (a > b) w += n; else if (a === b) d += n; else l += n; });
    const top = Object.entries(c).sort((x, y) => y[1] - x[1]).slice(0, 3).map(([k, n]) => ({ k: k.replace('-', ' × '), p: Math.round(100 * n / tot) }));
    return { w, d, l, tot, top };
  }
  function renderPred() {
    const st = predStats(), closed = predClosed(), pc = n => Math.round(100 * n / st.tot);
    $('nxPred').innerHTML = `
      <h4>Qual vai ser o placar?</h4>
      <p class="nx-note">Santa Clara × ${esc(oppName())} • ${esc(VAJ_MATCH.dateLabel)}</p>
      <div class="nx-score">
        ${[['a', 'Santa Clara'], ['b', oppName()]].map(([s, n], i) => `${i ? '<span class="nx-x">×</span>' : ''}
          <div class="nx-step"><small>${esc(n)}</small>
            <button onclick="nx.step('${s}',1)" aria-label="Mais um gol para ${esc(n)}" ${closed ? 'disabled' : ''}>+</button>
            <output aria-live="polite">${draft[s]}</output>
            <button onclick="nx.step('${s}',-1)" aria-label="Menos um gol para ${esc(n)}" ${closed ? 'disabled' : ''}>−</button></div>`).join('')}
      </div>
      <div class="nx-row-btns" style="justify-content:center;">
        <button class="btn-primary" onclick="nx.savePred()" ${closed ? 'disabled' : ''}>${closed ? 'Palpites encerrados' : pred ? 'Atualizar palpite' : 'Salvar palpite'}</button>
      </div>
      ${pred ? `<div class="nx-pred-box">Seu palpite: <b>Santa Clara ${pred.a} × ${pred.b} ${esc(oppName())}</b></div>` : ''}
      <div class="nx-dist">
        <div class="nx-dist-row"><span>Vitória do Santa Clara</span><div class="nx-bar"><i style="width:${pc(st.w)}%"></i></div><strong>${pc(st.w)}%</strong></div>
        <div class="nx-dist-row"><span>Empate</span><div class="nx-bar gold"><i style="width:${pc(st.d)}%"></i></div><strong>${pc(st.d)}%</strong></div>
        <div class="nx-dist-row"><span>Vitória do ${esc(oppName().replace('Atl. ', ''))}</span><div class="nx-bar"><i style="width:${pc(st.l)}%;background:linear-gradient(90deg,var(--club-brown),var(--club-brown-light))"></i></div><strong>${pc(st.l)}%</strong></div>
      </div>
      <p class="nx-note" style="margin-top:12px;">Placares mais votados: ${st.top.map(t => `<b>${t.k}</b> (${t.p}%)`).join(', ')}.</p>`;
  }
  nx.step = (s, d) => { draft[s] = Math.max(0, Math.min(9, draft[s] + d)); renderPred(); };
  nx.savePred = () => {
    if (predClosed()) return;
    pred = { a: draft.a, b: draft.b }; lsSet(predKey(), pred);
    renderPred(); socToast('Palpite salvo: Santa Clara ' + pred.a + ' × ' + pred.b + '.'); nxDone('palpite');
  };

  const mvpKey = () => 'nx_mvp_' + VAJ_MATCH.date;
  let myVote = null;
  const mvpSeed = p => 40 + p.goals * 14 + p.games * 3;
  function renderMvp() {
    const xi = flatXI(lineupF);
    if (myVote && !xi.some(p => p.id === myVote)) { const mp = DB.players.find(p => p.id === myVote); if (mp) xi.push(mp); }
    const rows = xi.map(p => ({ p, v: mvpSeed(p) + (myVote === p.id ? 1 : 0) })).sort((a, b) => b.v - a.v);
    const tot = rows.reduce((a, r) => a + r.v, 0);
    $('nxMvp').innerHTML = `
      <h4>Quem será o craque do jogo?</h4>
      <p class="nx-note">Vote no seu favorito da escalação provável. Você pode trocar o voto até a bola rolar.</p>
      <div style="margin-top:8px;">${rows.map((r, i) => `
        <div class="nx-mvp-row ${myVote === r.p.id ? 'mine' : ''}">
          <span class="nx-note">${i + 1}</span>
          <div class="nm"><b>${esc(r.p.name)}</b><small>${esc(r.p.nick)}</small><div class="nx-bar" style="margin-top:5px;"><i style="width:${Math.round(100 * r.v / rows[0].v)}%"></i></div></div>
          <span class="pct">${Math.round(100 * r.v / tot)}%</span>
          <button onclick="nx.vote(${r.p.id})" ${predClosed() ? 'disabled' : ''}>${myVote === r.p.id ? 'Seu voto' : 'Votar'}</button>
        </div>`).join('')}</div>`;
  }
  nx.vote = id => {
    if (predClosed() || myVote === id) return;
    myVote = id; lsSet(mvpKey(), id); renderMvp();
    const p = DB.players.find(x => x.id === id); socToast('Voto registrado em ' + (p ? p.name : 'seu craque') + '.'); nxDone('craque');
  };

  /* ---------------------------------------------------------------
     SIMULADOR DA RODADA
     --------------------------------------------------------------- */
  const SIM_ROUND = [['Santa Clara EC', 'Atl. Araçuaí'], ['Democrata GV', 'Uberlândia EC'], ['Ipatinga FC', 'EC Montes Claros'], ['Pouso Alegre FC', 'Diamantina EC'], ['Muriaé Sport', 'Teófilo Otoni FC']];
  let simRes = SIM_ROUND.map(() => ['', '']);
  function simCompute(withRes) {
    const rows = DB.standings.map(t => ({ name: t.name, logo: t.logo, j: t.j, v: t.v, sg: t.sg, pts: t.pts }));
    if (withRes) SIM_ROUND.forEach((m, i) => {
      const r = simRes[i]; if (r[0] === '' || r[1] === '') return;
      const h = rows.find(x => x.name === m[0]), a = rows.find(x => x.name === m[1]); if (!h || !a) return;
      const gh = +r[0], ga = +r[1];
      h.j++; a.j++; h.sg += gh - ga; a.sg += ga - gh;
      if (gh > ga) { h.v++; h.pts += 3; } else if (ga > gh) { a.v++; a.pts += 3; } else { h.pts++; a.pts++; }
    });
    rows.sort((x, y) => y.pts - x.pts || y.v - x.v || y.sg - x.sg || x.name.localeCompare(y.name, 'pt-BR'));
    rows.forEach((r, i) => { r.pos = i + 1; });
    return rows;
  }
  function renderSimMatches() {
    $('nxSimBtns').innerHTML = `<button class="tab-btn" onclick="nx.simPreset('win')">Santa Clara vence</button><button class="tab-btn" onclick="nx.simPreset('draw')">Empate</button><button class="tab-btn" onclick="nx.simPreset('loss')">Santa Clara perde</button><button class="tab-btn" onclick="nx.simPreset('rand')">Sortear tudo</button><button class="tab-btn" onclick="nx.simPreset('clear')">Limpar</button>`;
    $('nxSimMatches').innerHTML = SIM_ROUND.map((m, i) => `
      <div class="nx-sim-match ${i === 0 ? 'scec' : ''}">
        <span class="h">${esc(m[0])}</span>
        <input type="number" inputmode="numeric" min="0" max="9" value="${simRes[i][0]}" aria-label="Gols de ${esc(m[0])}" oninput="nx.simSet(${i},0,this.value)">
        <span class="nx-x" style="font-size:1rem;text-align:center;">×</span>
        <input type="number" inputmode="numeric" min="0" max="9" value="${simRes[i][1]}" aria-label="Gols de ${esc(m[1])}" oninput="nx.simSet(${i},1,this.value)">
        <span class="a">${esc(m[1])}</span>
      </div>`).join('');
  }
  function renderSimTable() {
    const base = {}; simCompute(false).forEach(r => { base[r.name] = r.pos; });
    const rows = simCompute(true);
    $('nxSimTable').innerHTML = `<table class="nx-table"><thead><tr><th>#</th><th>Clube</th><th>J</th><th>V</th><th>SG</th><th>PTS</th><th></th></tr></thead><tbody>${rows.map(r => {
      const d = base[r.name] - r.pos, me = r.name.includes('Santa Clara');
      const mv = d > 0 ? `<span class="nx-mv-up">▲${d}</span>` : d < 0 ? `<span class="nx-mv-down">▼${-d}</span>` : '<span class="nx-mv-eq">–</span>';
      return `<tr class="${me ? 'me' : ''}"><td>${r.pos}</td><td class="team">${crestBadge(r.name, r.logo, 22)}${esc(r.name)}</td><td>${r.j}</td><td>${r.v}</td><td>${r.sg}</td><td>${r.pts}</td><td>${mv}</td></tr>`;
    }).join('')}</tbody></table>`;
    const me = rows.find(r => r.name.includes('Santa Clara')), lead = rows[0];
    $('nxSimSum').innerHTML = me ? (me.pos === 1
      ? `Com esse cenário o Santa Clara fecha a rodada na <b>liderança</b>, com ${me.pts} pontos${rows[1] ? ` e ${me.pts - rows[1].pts} de vantagem sobre o 2º` : ''}.`
      : lead.pts === me.pts ? `Com esse cenário o Santa Clara fica em <b>${me.pos}º</b>, empatado em ${me.pts} pontos com o líder (${esc(lead.name)}) e atrás nos critérios de desempate.`
      : `Com esse cenário o Santa Clara fica em <b>${me.pos}º</b>, com ${me.pts} pontos e ${lead.pts - me.pts} de distância do líder (${esc(lead.name)}).`) : '';
  }
  nx.simSet = (i, k, v) => { const n = parseInt(v, 10); simRes[i][k] = isNaN(n) ? '' : String(Math.max(0, Math.min(9, n))); renderSimTable(); };
  nx.simPreset = p => {
    const r5 = () => [String(rnd(4)), String(rnd(4))];
    if (p === 'clear') simRes = SIM_ROUND.map(() => ['', '']);
    else if (p === 'rand') simRes = SIM_ROUND.map(r5);
    else {
      if (simRes.every(r => r[0] === '' && r[1] === '')) simRes = SIM_ROUND.map(r5);
      simRes[0] = p === 'win' ? ['2', '0'] : p === 'draw' ? ['1', '1'] : ['0', '1'];
    }
    renderSimMatches(); renderSimTable();
  };

  /* ---------------------------------------------------------------
     CALENDÁRIO
     --------------------------------------------------------------- */
  const FIX = [
    { round: 8, opp: 'Atl. Araçuaí', home: true, date: '2026-10-04T16:00:00', tag: 'Clássico do Vale' },
    { round: 9, opp: 'Uberlândia EC', home: false, date: '2026-10-11T16:00:00' },
    { round: 10, opp: 'EC Montes Claros', home: true, date: '2026-10-18T16:00:00' },
    { round: 11, opp: 'Pouso Alegre FC', home: false, date: '2026-10-25T16:00:00' },
    { round: 12, opp: 'Diamantina EC', home: true, date: '2026-11-01T16:00:00' },
    { round: 13, opp: 'Muriaé Sport', home: false, date: '2026-11-08T16:00:00' }
  ];
  let fxF = 'TODOS';
  const fxVenue = f => f.home ? 'Estádio Vale de Santa Clara' : 'Campo do ' + f.opp;
  const fxTitle = f => f.home ? 'Santa Clara EC × ' + f.opp : f.opp + ' × Santa Clara EC';
  const icsStamp = d => d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + 'T' + pad(d.getHours()) + pad(d.getMinutes()) + '00';
  function icsEvents(list) {
    const ev = list.map(f => {
      const s = new Date(f.date), e = new Date(s.getTime() + 115 * 60000);
      return ['BEGIN:VEVENT', 'UID:scec-r' + f.round + '-' + s.getTime() + '@scec', 'DTSTAMP:' + icsStamp(new Date()), 'DTSTART:' + icsStamp(s), 'DTEND:' + icsStamp(e),
        'SUMMARY:' + fxTitle(f), 'LOCATION:' + fxVenue(f), 'DESCRIPTION:Campeonato Mineiro Módulo II — ' + f.round + 'ª Rodada', 'BEGIN:VALARM', 'TRIGGER:-PT60M', 'ACTION:DISPLAY', 'DESCRIPTION:Santa Clara joga em 1 hora', 'END:VALARM', 'END:VEVENT'].join('\r\n');
    });
    return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//SCEC//Calendario//PT'].concat(ev, ['END:VCALENDAR']).join('\r\n');
  }
  function download(name, content, type) {
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([content], { type })); a.download = name;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1500);
  }
  const startOfDay = d => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  function renderFx() {
    $('nxFxTabs').innerHTML = [['TODOS', 'Todos'], ['CASA', 'Em casa'], ['FORA', 'Fora']].map(([k, l]) => `<button class="tab-btn ${fxF === k ? 'active' : ''}" onclick="nx.fxFilter('${k}')">${l}</button>`).join('');
    const now = Date.now();
    const list = FIX.map((f, i) => ({ f, i })).filter(x => fxF === 'TODOS' || (fxF === 'CASA') === x.f.home);
    const nextIdx = FIX.findIndex(f => new Date(f.date).getTime() > now);
    $('nxFxList').innerHTML = list.length ? list.map(({ f, i }) => {
      const d = new Date(f.date), past = d.getTime() < now, diff = Math.round((startOfDay(d) - startOfDay(new Date())) / 864e5);
      const when = past ? 'Encerrado' : diff === 0 ? 'Hoje' : diff === 1 ? 'Amanhã' : 'Em ' + diff + ' dias';
      return `<div class="nx-fx ${i === nextIdx ? 'next' : ''} ${past ? 'past' : ''}">
        <div class="nx-fx-date"><strong>${pad(d.getDate())}</strong><span>${d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}</span></div>
        <div class="nx-fx-main"><b>${esc(fxTitle(f))}</b><span class="nx-tag ${f.home ? '' : 'away'}">${f.home ? 'Casa' : 'Fora'}</span>${f.tag ? `<span class="nx-tag hot">${esc(f.tag)}</span>` : ''}
          <small>${f.round}ª rodada • ${d.toLocaleDateString('pt-BR', { weekday: 'long' })}, ${pad(d.getHours())}h${pad(d.getMinutes())} • ${esc(fxVenue(f))} • ${when}</small></div>
        <div>${past ? '' : `<button class="btn-outline" onclick="nx.fxOne(${i})">Adicionar ao calendário</button>`}</div>
      </div>`;
    }).join('') : '<p class="nx-note">Nenhum jogo nesse filtro.</p>';
  }
  nx.fxFilter = k => { fxF = k; renderFx(); };
  nx.fxOne = i => { download('santa-clara-rodada-' + FIX[i].round + '.ics', icsEvents([FIX[i]]), 'text/calendar'); socToast('Jogo salvo no calendário, com alerta 1 hora antes.'); };
  nx.fxAll = () => { download('santa-clara-calendario.ics', icsEvents(FIX.filter(f => new Date(f.date).getTime() > Date.now())), 'text/calendar'); socToast('Calendário baixado.'); };

  /* ---------------------------------------------------------------
     COMPARADOR
     --------------------------------------------------------------- */
  let cmpA = 7, cmpB = 8;
  function renderCmp() {
    const A = DB.players.find(p => p.id === cmpA), B = DB.players.find(p => p.id === cmpB); if (!A || !B) return;
    const opts = sel => ['GOLEIRO', 'DEFENSOR', 'MEIO-CAMPISTA', 'ATACANTE'].map(pos => `<optgroup label="${pos}">${DB.players.filter(p => p.pos === pos).sort((a, b) => a.num - b.num).map(p => `<option value="${p.id}" ${p.id === sel ? 'selected' : ''}>${p.num} • ${esc(p.name)}</option>`).join('')}</optgroup>`).join('');
    const gpg = p => p.games ? p.goals / p.games : 0, fmt2 = v => v.toFixed(2).replace('.', ',');
    const who = p => `<div class="nx-cmp-who">${p.img ? `<img class="nx-cmp-photo" src="${esc(p.img)}" alt="${esc(p.name)}" onerror="this.style.visibility='hidden'">` : `<div class="nx-cmp-photo" style="display:grid;place-items:center;font-family:var(--font-display);font-size:2rem;">${p.num}</div>`}<b>${esc(p.name)}</b><small>${esc(p.nick)} • ${p.pos}</small></div>`;
    const stats = [['Jogos', A.games, B.games, v => v, true], ['Gols', A.goals, B.goals, v => v, true], ['Gols por jogo', gpg(A), gpg(B), fmt2, true], ['Idade', A.age, B.age, v => v, false]];
    $('nxCmp').innerHTML = `
      <div class="nx-cmp-head">
        <select aria-label="Primeiro jogador" onchange="nx.cmpSet('A',this.value)">${opts(cmpA)}</select>
        <button class="tab-btn" onclick="nx.cmpSwap()" aria-label="Trocar lados">⇄</button>
        <select aria-label="Segundo jogador" onchange="nx.cmpSet('B',this.value)">${opts(cmpB)}</select>
      </div>
      <div class="nx-cmp-head" style="margin-bottom:6px;align-items:start;">${who(A)}<span class="vs">VS</span>${who(B)}</div>
      ${stats.map(([lbl, a, b, f, hl]) => {
        const mx = Math.max(a, b, 0.0001);
        return `<div class="nx-cmp-row"><div class="l"><b class="${hl && a > b ? 'win' : ''}">${f(a)}</b><div class="nx-bar ${hl && a > b ? 'gold' : ''}"><i style="width:${Math.round(100 * a / mx)}%"></i></div></div><em>${lbl}</em><div class="r"><b class="${hl && b > a ? 'win' : ''}">${f(b)}</b><div class="nx-bar ${hl && b > a ? 'gold' : ''}"><i style="width:${Math.round(100 * b / mx)}%"></i></div></div></div>`;
      }).join('')}`;
  }
  nx.cmpSet = (w, v) => { if (w === 'A') cmpA = +v; else cmpB = +v; renderCmp(); };
  nx.cmpSwap = () => { const t = cmpA; cmpA = cmpB; cmpB = t; renderCmp(); };

  /* ---------------------------------------------------------------
     ARENA: PÊNALTI, QUIZ E BATERIA
     --------------------------------------------------------------- */
  let arenaT = 'pen';
  nx.arenaTab = t => {
    arenaT = t;
    document.querySelectorAll('#nxArenaTabs button').forEach(b => b.classList.toggle('active', b.dataset.t === t));
    $('nxPanePen').classList.toggle('on', t === 'pen'); $('nxPaneQuiz').classList.toggle('on', t === 'quiz'); $('nxPaneBat').classList.toggle('on', t === 'bat');
    if (t !== 'bat') stopRhythm();
  };
  nx.openBat = () => { nx.arenaTab('bat'); goSection('arena'); };

  /* Pênalti do Lobo */
  const PEN_C = [[16.7, 25], [50, 25], [83.3, 25], [16.7, 75], [50, 75], [83.3, 75]];
  let pen = { n: 0, goals: 0, busy: false, log: [] };
  function penInit() {
    $('nxPanePen').innerHTML = `
      <div class="nx-goal" id="nxGoal"><div class="nx-keeper" id="nxKeeper">🧤</div>
        <div class="nx-zones" id="nxZones">${PEN_C.map((c, i) => `<button onclick="nx.shoot(${i})" aria-label="Chutar no canto ${i + 1} do gol"></button>`).join('')}</div>
        <div class="nx-ball" id="nxBall">⚽</div></div>
      <div class="nx-dots" id="nxDots"></div>
      <div class="nx-status" id="nxPenStatus" aria-live="polite"></div>
      <div class="nx-row-btns" style="justify-content:center;"><button class="btn-outline" id="nxPenReset" onclick="nx.penReset()" style="display:none;">Cobrar de novo</button></div>
      <p class="nx-note" style="text-align:center;margin-top:10px;" id="nxPenBest"></p>`;
    penUpdate();
  }
  function penUpdate(msg) {
    const best = lsGet('nx_pen_best', 0), over = pen.n >= 5;
    $('nxDots').innerHTML = [0, 1, 2, 3, 4].map(i => `<i class="${pen.log[i] || ''}"></i>`).join('');
    document.querySelectorAll('#nxZones button').forEach(b => { b.disabled = pen.busy || over; });
    $('nxPenReset').style.display = over ? '' : 'none';
    $('nxPenBest').textContent = best ? 'Seu recorde: ' + best + ' de 5 gols.' : 'Escolha o canto e bata. São 5 cobranças.';
    $('nxPenStatus').innerHTML = msg || (over ? `<strong>${pen.goals} de 5</strong>${pen.goals >= 4 ? 'Lobo de pênalti. A Toca do Lobo é sua.' : pen.goals >= 2 ? 'Boa série. Dá pra melhorar.' : 'Hoje o goleiro estava inspirado.'}` : `Cobrança ${pen.n + 1} de 5`);
  }
  nx.shoot = i => {
    if (pen.busy || pen.n >= 5) return; pen.busy = true; penUpdate('Bateu...');
    const ball = $('nxBall'), kp = $('nxKeeper'), miss = Math.random() < 0.12, kz = rnd(6);
    const col = i % 3, target = miss ? [col === 0 ? -8 : col === 2 ? 108 : 50, -16] : PEN_C[i];
    ball.style.left = target[0] + '%'; ball.style.top = target[1] + '%';
    kp.style.left = PEN_C[kz][0] + '%'; kp.style.top = PEN_C[kz][1] + '%';
    setTimeout(() => {
      const res = miss ? 'fora' : kz === i ? 'def' : 'gol';
      pen.log.push(res); pen.n++; if (res === 'gol') pen.goals++;
      const over = pen.n >= 5;
      if (over) { pen.busy = false; if (pen.goals > lsGet('nx_pen_best', 0)) lsSet('nx_pen_best', pen.goals); }
      penUpdate(`<strong>${res === 'gol' ? 'GOOOL!' : res === 'def' ? 'Defendeu!' : 'Pra fora!'}</strong>${over ? '' : 'Prepare a próxima.'}`);
      if (over) { setTimeout(() => { penUpdate(); nxDone('penalti'); }, 1100); return; }
      setTimeout(() => { ball.style.left = '50%'; ball.style.top = '135%'; kp.style.left = '50%'; kp.style.top = '62%'; pen.busy = false; penUpdate(); }, 900);
    }, 650);
  };
  nx.penReset = () => {
    pen = { n: 0, goals: 0, busy: false, log: [] };
    const ball = $('nxBall'), kp = $('nxKeeper');
    ball.style.left = '50%'; ball.style.top = '135%'; kp.style.left = '50%'; kp.style.top = '62%'; penUpdate();
  };

  /* Quiz do Lobo */
  const QUIZ = [
    { q: 'Em que ano o Santa Clara Esporte Clube foi fundado?', o: ['1998', '2000', '2003', '2007'], a: 1, w: 'O clube nasceu em 2000, no Vale do Jequitinhonha.' },
    { q: 'Como a torcida chama o Estádio Vale de Santa Clara?', o: ['A Fortaleza Azul', 'O Caldeirão do Vale', 'A Toca do Lobo', 'A Pedreira'], a: 2, w: 'A Toca do Lobo: na cidade é estádio, para o Santa Clara é território.' },
    { q: 'Com quantos lugares o estádio foi inaugurado, em 2007?', o: ['15 mil', '20 mil', '25 mil', '30 mil'], a: 2, w: 'A inauguração, em 2007, foi com 25 mil lugares.' },
    { q: 'Quantas vezes o Santa Clara ganhou a Copa do Vale do Jequitinhonha?', o: ['1', '2', '3', '5'], a: 2, w: 'Três títulos: 2015, 2019 e 2022.' },
    { q: 'Em que ano o clube foi campeão do Mineiro Módulo II?', o: ['2012', '2016', '2018', '2022'], a: 2, w: 'O título do Módulo II veio em 2018.' },
    { q: 'Contra qual time o Santa Clara joga o Clássico do Vale?', o: ['Democrata GV', 'Atlético de Araçuaí', 'Diamantina EC', 'Ipatinga FC'], a: 1, w: 'O Clássico do Vale é contra o Atlético de Araçuaí.' },
    { q: 'Qual é o primeiro critério de desempate no Módulo II?', o: ['Número de vitórias', 'Saldo de gols', 'Gols marcados', 'Confronto direto'], a: 0, w: 'Primeiro as vitórias, depois saldo de gols, gols marcados e confronto direto.' },
    { q: 'Qual é o nome da torcida organizada do clube?', o: ['Matilha Azul', 'Terror do Vale', 'Fúria Marrom', 'Gaviões do Vale'], a: 1, w: 'A Terror do Vale prepara mosaicos e bandeirões para os clássicos.' },
    { q: 'Em que ano começou a Era SAF no clube?', o: ['2020', '2022', '2024', '2026'], a: 2, w: 'Em 2024 o clube se estruturou como SAF.' },
    { q: 'Complete: "Subestimado por muitos. Temido no ___."', o: ['Estado', 'Vale', 'Sertão', 'Campo'], a: 1, w: 'O lema do Lobo: subestimado por muitos, temido no Vale.' }
  ];
  let qz = null;
  function renderQuiz() {
    const el = $('nxPaneQuiz'), best = lsGet('nx_quiz_best', null);
    if (!qz) { el.innerHTML = `<h4>Quiz do Lobo</h4><p class="nx-note" style="margin:6px 0 14px;">8 perguntas sobre a história do Santa Clara. ${best != null ? 'Seu recorde: <b>' + best + '/8</b>.' : 'Veja quanto você sabe do clube.'}</p><button class="btn-primary" onclick="nx.quizStart()">Começar o quiz</button>`; return; }
    if (qz.i >= qz.list.length) {
      const s = qz.score, msg = s >= 7 ? 'Lobo de carteirinha. Você conhece a Matilha de cor.' : s >= 4 ? 'Torcedor firme. Falta pouco para ser lenda.' : 'Filhote da Matilha. Passe pela Linha do Tempo e tente de novo.';
      el.innerHTML = `<h4>Resultado</h4><div class="nx-big-score" style="margin:10px 0;">${s}<small style="font-size:1.4rem;color:var(--club-muted)"> / ${qz.list.length}</small></div><p style="margin-bottom:14px;">${msg}</p><div class="nx-row-btns"><button class="btn-primary" onclick="nx.quizStart()">Jogar de novo</button><button class="btn-outline" onclick="goSection('memorial')">Ver a Linha do Tempo</button></div>`; return;
    }
    const cur = qz.list[qz.i], ans = qz.ans, L = ['A', 'B', 'C', 'D'];
    el.innerHTML = `
      <div class="nx-row-btns" style="justify-content:space-between;"><span class="nx-note">Pergunta ${qz.i + 1} de ${qz.list.length}</span><span class="nx-note">Acertos: ${qz.score}</span></div>
      <div class="nx-bar" style="margin-top:8px;"><i style="width:${Math.round(100 * qz.i / qz.list.length)}%"></i></div>
      <h4 class="nx-q-title">${esc(cur.q)}</h4>
      ${cur.o.map((o, k) => `<button class="nx-opt ${ans === null ? '' : k === cur.a ? 'ok' : k === ans ? 'bad' : ''}" onclick="nx.quizAnswer(${k})" ${ans === null ? '' : 'disabled'}><b>${L[k]}.</b> ${esc(o)}</button>`).join('')}
      ${ans === null ? '' : `<div class="nx-why"><b>${ans === cur.a ? 'Acertou.' : 'Não foi dessa vez.'}</b> ${esc(cur.w)}</div><button class="btn-primary" onclick="nx.quizNext()">${qz.i + 1 >= qz.list.length ? 'Ver resultado' : 'Próxima pergunta'}</button>`}`;
  }
  nx.quizStart = () => { qz = { list: shuffle(QUIZ).slice(0, 8), i: 0, score: 0, ans: null }; renderQuiz(); };
  nx.quizAnswer = k => { if (!qz || qz.ans !== null) return; qz.ans = k; if (k === qz.list[qz.i].a) qz.score++; renderQuiz(); };
  nx.quizNext = () => {
    qz.i++; qz.ans = null;
    if (qz.i >= qz.list.length) { if (qz.score > lsGet('nx_quiz_best', -1)) lsSet('nx_quiz_best', qz.score); nxDone('quiz'); }
    renderQuiz();
  };

  /* Bateria da Matilha */
  let ac = null, noise = null, rhythm = null, rhythmStep = 0;
  const PADS = [{ id: 'surdo', name: 'Surdo', key: '1', ic: '🥁' }, { id: 'caixa', name: 'Caixa', key: '2', ic: '🪘' }, { id: 'tamborim', name: 'Tamborim', key: '3', ic: '🔔' }, { id: 'apito', name: 'Apito', key: '4', ic: '📯' }];
  const PATTERN = { surdo: [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0], caixa: [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0], tamborim: [1,0,0,1,0,0,1,0,1,0,0,1,0,0,1,0], apito: [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0] };
  function audio() {
    if (!ac) { const C = window.AudioContext || window.webkitAudioContext; if (!C) return null; ac = new C(); }
    if (ac.state === 'suspended') ac.resume();
    return ac;
  }
  function noiseBuf(a) {
    if (!noise) { noise = a.createBuffer(1, a.sampleRate * 0.3, a.sampleRate); const d = noise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
    return noise;
  }
  function burst(a, t, type, freq, q, vol, dur) {
    const s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain();
    s.buffer = noiseBuf(a); f.type = type; f.frequency.value = freq; f.Q.value = q;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    s.connect(f); f.connect(g); g.connect(a.destination); s.start(t); s.stop(t + dur + 0.02);
  }
  function tone(a, t, type, f0, f1, vol, dur) {
    const o = a.createOscillator(), g = a.createGain(); o.type = type;
    o.frequency.setValueAtTime(f0, t); if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + dur + 0.02);
  }
  const VOICES = {
    surdo(a, t) { tone(a, t, 'sine', 150, 48, 0.9, 0.45); },
    caixa(a, t) { burst(a, t, 'highpass', 1800, 0.7, 0.5, 0.16); tone(a, t, 'triangle', 190, 150, 0.25, 0.09); },
    tamborim(a, t) { burst(a, t, 'bandpass', 3800, 3, 0.55, 0.08); tone(a, t, 'sine', 950, 700, 0.18, 0.06); },
    apito(a, t) {
      const o = a.createOscillator(), lfo = a.createOscillator(), lg = a.createGain(), g = a.createGain();
      o.type = 'sine'; o.frequency.value = 2600; lfo.frequency.value = 32; lg.gain.value = 0.1;
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.2, t + 0.02); g.gain.setValueAtTime(0.2, t + 0.22); g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      lfo.connect(lg); lg.connect(g.gain); o.connect(g); g.connect(a.destination); o.start(t); lfo.start(t); o.stop(t + 0.32); lfo.stop(t + 0.32);
    }
  };
  function flash(id) { const b = document.querySelector('.nx-pad[data-id="' + id + '"]'); if (!b) return; b.classList.add('hit'); setTimeout(() => b.classList.remove('hit'), 110); }
  nx.hit = id => { const a = audio(); if (!a || !VOICES[id]) return; VOICES[id](a, a.currentTime + 0.005); flash(id); };
  function stopRhythm() { if (rhythm) { clearInterval(rhythm); rhythm = null; } const b = $('nxRhythmBtn'); if (b) b.textContent = 'Tocar o ritmo da Matilha'; }
  nx.rhythm = () => {
    if (rhythm) { stopRhythm(); return; }
    const a = audio(); if (!a) { socToast('Seu navegador não liberou o áudio.'); return; }
    rhythmStep = 0; $('nxRhythmBtn').textContent = 'Parar o ritmo';
    rhythm = setInterval(() => { PADS.forEach(p => { if (PATTERN[p.id][rhythmStep % 16]) { VOICES[p.id](a, a.currentTime + 0.01); flash(p.id); } }); rhythmStep++; }, 130);
  };
  function renderBat() {
    $('nxPaneBat').innerHTML = `<h4>Bateria da Matilha</h4><p class="nx-note" style="margin:6px 0 14px;">Toque nos pads ou use as teclas 1, 2, 3 e 4. Ou deixe o ritmo rolando e cante junto.</p>
      <div class="nx-pads">${PADS.map(p => `<button class="nx-pad" data-id="${p.id}" onclick="nx.hit('${p.id}')" aria-label="${p.name}, tecla ${p.key}"><span aria-hidden="true">${p.ic}</span>${p.name}<small>tecla ${p.key}</small></button>`).join('')}</div>
      <button class="btn-primary" id="nxRhythmBtn" onclick="nx.rhythm()">Tocar o ritmo da Matilha</button>`;
  }
  document.addEventListener('keydown', e => {
    if (arenaT !== 'bat' || e.ctrlKey || e.metaKey || e.altKey || /INPUT|TEXTAREA|SELECT/.test((e.target.tagName || ''))) return;
    const p = PADS.find(x => x.key === e.key); if (!p) return;
    const r = $('arena').getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return;
    nx.hit(p.id);
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopRhythm(); });

  /* ---------------------------------------------------------------
     GALERIA E LIGHTBOX
     --------------------------------------------------------------- */
  const U = id => 'https://images.unsplash.com/photo-' + id + '?q=80&w=900&auto=format&fit=crop';
  const GAL = [
    { src: 'https://i.imgur.com/Nd2lKZl.jpg', cat: 'Estádio', t: 'Vista aérea do Estádio Vale de Santa Clara' },
    { src: U('1579952363873-27f3bade9f55'), cat: 'Jogos', t: 'Bola rolando na Toca do Lobo' },
    { src: 'https://i.imgur.com/Wei7EvA.jpg', cat: 'Estádio', t: 'Exterior da Toca do Lobo' },
    { src: U('1471295253337-3ceaaedca402'), cat: 'Torcida', t: 'A Matilha na arquibancada' },
    { src: 'https://i.imgur.com/VHp6QrV.jpg', cat: 'Estádio', t: 'Setor Verde' },
    { src: U('1517927033932-b3d18e61fb3a'), cat: 'Base', t: 'Garotos do Sub-20' },
    { src: 'https://i.imgur.com/S91TqQv.jpg', cat: 'Estádio', t: 'Setor Roxo' },
    { src: U('1508098682722-e99c43a406b2'), cat: 'Jogos', t: 'Treino da semana' },
    { src: 'https://i.imgur.com/09VLLjz.jpg', cat: 'Estádio', t: 'Setor Azul' },
    { src: U('1489944440615-453fc2b6a9a9'), cat: 'Clube', t: 'Bastidores do clube' }
  ];
  let galF = 'Todas', lb = { list: [], i: 0 };
  const galList = () => GAL.filter(g => galF === 'Todas' || g.cat === galF);
  function renderGal() {
    $('nxGalTabs').innerHTML = ['Todas', 'Estádio', 'Jogos', 'Torcida', 'Base', 'Clube'].map(c => `<button class="tab-btn ${galF === c ? 'active' : ''}" onclick="nx.galFilter('${c}')">${c}</button>`).join('');
    $('nxGal').innerHTML = galList().map((g, i) => `<figure><img src="${g.src}" alt="${esc(g.t)}" loading="lazy" onerror="this.closest('figure').style.display='none'"><button aria-label="Ampliar: ${esc(g.t)}" onclick="nx.lbOpen(${i})"></button><figcaption>${esc(g.t)}</figcaption></figure>`).join('');
  }
  nx.galFilter = c => { galF = c; renderGal(); };
  function lbShow() { const g = lb.list[lb.i]; $('nxLbImg').src = g.src; $('nxLbImg').alt = g.t; $('nxLbCap').textContent = g.t + '  (' + (lb.i + 1) + '/' + lb.list.length + ')'; }
  nx.lbOpen = i => { lb = { list: galList(), i }; lbShow(); $('nxLightbox').classList.add('open'); };
  nx.lbClose = () => $('nxLightbox').classList.remove('open');
  nx.lbStep = d => { lb.i = (lb.i + d + lb.list.length) % lb.list.length; lbShow(); };
  document.addEventListener('keydown', e => {
    if (!$('nxLightbox').classList.contains('open')) return;
    if (e.key === 'Escape') nx.lbClose(); else if (e.key === 'ArrowRight') nx.lbStep(1); else if (e.key === 'ArrowLeft') nx.lbStep(-1);
  });
  document.addEventListener('click', e => { if (e.target === $('nxLightbox')) nx.lbClose(); });

  /* ---------------------------------------------------------------
     MURAL DA TORCIDA
     --------------------------------------------------------------- */
  let lastPost = 0;
  function wallLoad() {
    let w = lsGet('nx_wall', null);
    if (!w) {
      const now = Date.now();
      w = [
        { id: 's1', n: 'Dona Rita do Vale', t: 'Domingo a Toca do Lobo vai tremer. Bora, Matilha! 💙🤎', ts: now - 2 * 36e5, likes: 42 },
        { id: 's2', n: 'Zé da Toca', t: 'Já garanti meu setor. Quem vai de ônibus da praça?', ts: now - 5 * 36e5, likes: 17 },
        { id: 's3', n: 'Camila Uivante', t: 'Menino do Sub-20 jogando muito. O futuro do Vale está garantido.', ts: now - 26 * 36e5, likes: 29 },
        { id: 's4', n: 'Pedrão Marrom', t: 'Subestimado por muitos. Temido no Vale. É isso! 🐺', ts: now - 50 * 36e5, likes: 51 }
      ];
      lsSet('nx_wall', w);
    }
    return w;
  }
  const ago = ts => { const s = Math.max(0, (Date.now() - ts) / 1000); return s < 60 ? 'agora' : s < 3600 ? 'há ' + Math.floor(s / 60) + ' min' : s < 86400 ? 'há ' + Math.floor(s / 3600) + ' h' : 'há ' + Math.floor(s / 86400) + ' d'; };
  function renderCompose() {
    const name = isLogged() ? userSession.name : lsGet('nx_wall_name', '');
    $('nxCompose').innerHTML = `
      <h4>Deixe seu recado</h4>
      <p class="nx-note" style="margin-bottom:10px;">Mensagens ficam salvas neste navegador. Respeite a Matilha: sem ofensas e sem links.</p>
      ${isLogged() ? `<p class="nx-note">Publicando como <b>${esc(name)}</b></p>` : `<input type="text" id="nxWallName" maxlength="24" placeholder="Seu nome" aria-label="Seu nome" value="${esc(name)}">`}
      <textarea id="nxWallText" maxlength="140" placeholder="O que você quer dizer ao Lobo?" aria-label="Sua mensagem" oninput="$s('nxWallCnt').textContent=this.value.length+'/140'"></textarea>
      <div class="nx-row-btns" style="justify-content:space-between;">
        <div class="nx-emojis">${['🐺', '💙', '🤎', '🔥', '👏'].map(e => `<button onclick="nx.emoji('${e}')" aria-label="Inserir ${e}">${e}</button>`).join('')}</div>
        <span class="nx-note" id="nxWallCnt">0/140</span>
      </div>
      <button class="btn-primary" style="margin-top:12px;" onclick="nx.post()">Publicar no mural</button>`;
  }
  function renderWall() {
    const w = wallLoad(), liked = lsGet('nx_wall_liked', []);
    $('nxWall').innerHTML = w.slice().sort((a, b) => b.ts - a.ts).map(p => `
      <article class="nx-post ${p.mine ? 'mine' : ''}"><header><b>${esc(p.n)}</b><span>${ago(p.ts)}</span></header><p>${esc(p.t)}</p>
        <footer><button class="${liked.includes(p.id) ? 'on' : ''}" onclick="nx.like('${p.id}')" aria-pressed="${liked.includes(p.id)}">🐺 ${p.likes}</button>${p.mine ? `<button onclick="nx.del('${p.id}')">Apagar</button>` : ''}</footer></article>`).join('');
  }
  nx.emoji = e => { const t = $('nxWallText'); if (t.value.length + e.length <= 140) { t.value += e; $('nxWallCnt').textContent = t.value.length + '/140'; } t.focus(); };
  nx.post = () => {
    const txt = $('nxWallText').value.replace(/https?:\/\/\S+|www\.\S+/gi, '').trim();
    if (!txt) { socToast('Escreva uma mensagem antes de publicar.'); return; }
    if (Date.now() - lastPost < 8000) { socToast('Aguarde alguns segundos para publicar de novo.'); return; }
    let name = isLogged() ? userSession.name : ($('nxWallName').value.trim() || 'Torcedor');
    if (!isLogged()) lsSet('nx_wall_name', name === 'Torcedor' ? '' : name);
    const w = wallLoad(); w.push({ id: 'u' + Date.now(), n: name.slice(0, 24), t: txt.slice(0, 140), ts: Date.now(), likes: 0, mine: true });
    lsSet('nx_wall', w.sort((a, b) => b.ts - a.ts).slice(0, 40)); lastPost = Date.now();
    $('nxWallText').value = ''; $('nxWallCnt').textContent = '0/140'; renderWall(); socToast('Recado publicado no mural.'); nxDone('mural');
  };
  nx.like = id => {
    const w = wallLoad(), p = w.find(x => x.id === id), liked = lsGet('nx_wall_liked', []); if (!p) return;
    const k = liked.indexOf(id); if (k >= 0) { liked.splice(k, 1); p.likes = Math.max(0, p.likes - 1); } else { liked.push(id); p.likes++; }
    lsSet('nx_wall', w); lsSet('nx_wall_liked', liked); renderWall();
  };
  nx.del = id => { lsSet('nx_wall', wallLoad().filter(p => p.id !== id)); renderWall(); };

  /* ---------------------------------------------------------------
     CARTÃO DO TORCEDOR (canvas)
     --------------------------------------------------------------- */
  const THEMES = { azul: { a: '#1a3a6b', b: '#0b1830', line: '#3b82c4', label: 'Azul Vale' }, marrom: { a: '#7a4a2a', b: '#2a170c', line: '#e0a96a', label: 'Marrom Terra' }, dourado: { a: '#1a3a6b', b: '#07101f', line: '#c9a84c', label: 'Dourado Campeão' } };
  let card = { name: '', num: '10', theme: 'azul' };
  function cardFormInit() {
    card.name = isLogged() ? userSession.name : lsGet('nx_card_name', 'Torcedor Lobo');
    $('nxCardForm').innerHTML = `
      <h4 style="margin-bottom:14px;">Monte o seu</h4>
      <label class="nx-field">Seu nome<input type="text" id="nxCardName" maxlength="20" value="${esc(card.name)}" oninput="nx.cardSet('name',this.value)"></label>
      <label class="nx-field">Número da camisa (0 a 99)<input type="number" id="nxCardNum" min="0" max="99" value="${card.num}" oninput="nx.cardSet('num',this.value)"></label>
      <label class="nx-field">Cor<select id="nxCardTheme" onchange="nx.cardSet('theme',this.value)">${Object.entries(THEMES).map(([k, t]) => `<option value="${k}">${t.label}</option>`).join('')}</select></label>
      <div class="nx-row-btns"><button class="btn-primary" onclick="nx.cardSave(false)">Baixar imagem</button><button class="btn-outline" onclick="nx.cardSave(true)">Compartilhar</button></div>`;
    drawCard();
  }
  nx.cardSet = (k, v) => {
    if (k === 'num') { const n = parseInt(v, 10); v = isNaN(n) ? '' : String(Math.max(0, Math.min(99, n))); }
    card[k] = v; if (k === 'name' && !isLogged()) lsSet('nx_card_name', v); drawCard();
  };
  function drawCard() {
    const cv = $('nxCardCv'); if (!cv) return; const c = cv.getContext('2d'), W = 600, H = 840, th = THEMES[card.theme] || THEMES.azul;
    const g = c.createLinearGradient(0, 0, W, H); g.addColorStop(0, th.a); g.addColorStop(1, th.b); c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.save(); c.globalAlpha = 0.07; c.fillStyle = '#fff';
    for (let x = -H; x < W; x += 76) { c.beginPath(); c.moveTo(x, H); c.lineTo(x + H, 0); c.lineTo(x + H + 34, 0); c.lineTo(x + 34, H); c.closePath(); c.fill(); }
    c.restore();
    c.strokeStyle = th.line; c.lineWidth = 6; c.strokeRect(26, 26, W - 52, H - 52);
    const sx = W / 2 - 62, sy = 66, sw = 124, sh = 146;
    c.beginPath(); c.moveTo(sx + sw / 2, sy); c.lineTo(sx + sw, sy + sh * 0.1); c.lineTo(sx + sw, sy + sh * 0.7); c.lineTo(sx + sw / 2, sy + sh); c.lineTo(sx, sy + sh * 0.7); c.lineTo(sx, sy + sh * 0.1); c.closePath();
    const sg = c.createLinearGradient(sx, sy, sx, sy + sh); sg.addColorStop(0, '#1a3a6b'); sg.addColorStop(1, '#0f2447'); c.fillStyle = sg; c.fill(); c.lineWidth = 5; c.strokeStyle = '#fff'; c.stroke();
    c.fillStyle = '#fff'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = '34px Impact, "Arial Black", sans-serif'; c.fillText('SCEC', W / 2, sy + sh * 0.46);
    c.fillStyle = th.line; c.font = '700 20px Arial, sans-serif'; if ('letterSpacing' in c) c.letterSpacing = '4px'; c.fillText('SANTA CLARA ESPORTE CLUBE', W / 2, 260);
    c.font = '360px Impact, "Arial Black", sans-serif'; if ('letterSpacing' in c) c.letterSpacing = '0px'; c.fillStyle = 'rgba(255,255,255,0.13)'; c.strokeStyle = 'rgba(255,255,255,0.5)'; c.lineWidth = 4;
    const num = card.num === '' ? '0' : card.num; c.textBaseline = 'alphabetic'; c.fillText(num, W / 2, 590); c.strokeText(num, W / 2, 590);
    const nm = (card.name || 'Torcedor').toUpperCase(); let fs = 88; c.fillStyle = '#fff';
    do { c.font = fs + 'px Impact, "Arial Black", sans-serif'; fs -= 4; } while (c.measureText(nm).width > W - 120 && fs > 28);
    c.fillText(nm, W / 2, 668);
    c.fillStyle = th.line; c.font = '700 22px Arial, sans-serif'; if ('letterSpacing' in c) c.letterSpacing = '5px'; c.fillText('TORCEDOR DA MATILHA', W / 2, 716);
    c.fillStyle = 'rgba(255,255,255,0.7)'; c.font = '600 18px Arial, sans-serif'; if ('letterSpacing' in c) c.letterSpacing = '2px'; c.fillText('SUBESTIMADO POR MUITOS. TEMIDO NO VALE.', W / 2, 776);
    if ('letterSpacing' in c) c.letterSpacing = '0px';
  }
  nx.cardSave = share => {
    $('nxCardCv').toBlob(blob => {
      if (!blob) { socToast('Não foi possível gerar a imagem.'); return; }
      const file = (typeof File === 'function') ? new File([blob], 'cartao-matilha.png', { type: 'image/png' }) : null;
      if (share && file && navigator.canShare && navigator.canShare({ files: [file] })) {
        navigator.share({ files: [file], text: 'Sou da Matilha! 🐺' }).then(() => nxDone('cartao')).catch(() => {});
        return;
      }
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'cartao-matilha.png'; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 1500); socToast('Cartão baixado.'); nxDone('cartao');
    }, 'image/png');
  };

  /* ---------------------------------------------------------------
     HINO, DÚVIDAS E NEWSLETTER
     --------------------------------------------------------------- */
  nx.bigLyrics = () => { const on = $('nxLyrics').classList.toggle('big'); $('nxBigBtn').classList.toggle('active', on); };
  const FAQ = [
    ['Como compro ingressos?', 'Na seção Ingressos, escolha o setor e finalize a compra. O e-ticket com QR code fica salvo na sua área do torcedor.'],
    ['Posso escolher o meu assento?', 'Não. O ingresso é geral por setor: você senta onde quiser dentro do setor que comprou.'],
    ['A que horas abrem os portões?', 'No próximo jogo, os portões abrem às ' + VAJ_MATCH.gates + '. Chegar cedo evita fila e garante o melhor lugar no setor.'],
    ['O Camarote tem estacionamento?', 'Sim. Quem compra o Camarote ganha uma vaga no estacionamento exclusivo.'],
    ['Como viro sócio?', 'Na seção Seja Sócio você compara os planos e assina direto pelo site. Sócios têm benefícios e descontos nos ingressos e na loja.'],
    ['Como ganho pontos SCEC?', 'Com sua conta, você soma pontos ao se inscrever nas campanhas de voluntariado (+30 cada) e ao cumprir as missões diárias da Matilha.'],
    ['Onde assisto aos jogos?', 'Na seção Transmissão você vê os canais de TV (SportiNet e SuperSports) e a rádio Pop 96, além de criar um lembrete no calendário.'],
    ['Como posso ajudar a comunidade?', 'Na seção Comunidade você se inscreve como voluntário nas campanhas do clube, como o Futebol nas Vilas do Vale e a Campanha do Agasalho.']
  ];
  nx.faqFilter = q => {
    q = String(q || '').toLowerCase().trim();
    const list = FAQ.filter(([a, b]) => !q || (a + ' ' + b).toLowerCase().includes(q));
    $('nxFaqList').innerHTML = list.length ? list.map(([a, b]) => `<details><summary>${esc(a)}</summary><p>${esc(b)}</p></details>`).join('') : '<p class="nx-note">Nenhuma dúvida encontrada. Tente outra palavra.</p>';
  };
  nx.subscribe = e => {
    e.preventDefault(); const inp = $('nxEmail'), v = inp.value.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) { inp.setAttribute('aria-invalid', 'true'); socToast('Digite um e-mail válido, como nome@email.com.'); inp.focus(); return false; }
    inp.removeAttribute('aria-invalid');
    const list = lsGet('nx_newsletter', []);
    if (list.includes(v)) socToast('Esse e-mail já está inscrito.'); else { list.push(v); lsSet('nx_newsletter', list); socToast('Inscrição registrada. Obrigado, Matilha!'); }
    inp.value = ''; return false;
  };

  /* ---------------------------------------------------------------
     INICIALIZAÇÃO
     --------------------------------------------------------------- */
  function init() {
    pred = lsGet(predKey(), null); if (pred) draft = { a: pred.a, b: pred.b };
    myVote = lsGet(mvpKey(), null);
    lastWho = who();
    if ($('nxChips')) $('nxChips').innerHTML = SECTIONS.map(([id, l]) => `<button class="nx-chip" onclick="goSection('${id}')">${l}</button>`).join('');
    /* [multipágina] cada painel só é desenhado na página que tem o seu contêiner */
    const NX_BOX = { renderLineup:'nxPitch', renderPred:'nxPred', renderMvp:'nxMvp', renderSimMatches:'nxSimMatches', renderSimTable:'nxSimTable', renderFx:'nxFxList', renderCmp:'nxCmp', penInit:'nxPanePen', renderQuiz:'nxPaneQuiz', renderBat:'nxPaneBat', renderGal:'nxGal', renderCompose:'nxCompose', renderWall:'nxWall', cardFormInit:'nxCardForm', renderMissions:'nxMissions', renderRank:'nxRank', '':'nxFaqList' };
    [renderLineup, renderPred, renderMvp, renderSimMatches, renderSimTable, renderFx, renderCmp, penInit, renderQuiz, renderBat, renderGal,
      renderCompose, renderWall, cardFormInit, renderMissions, renderRank, () => nx.faqFilter('')].forEach(fn => { if (NX_BOX[fn.name] !== undefined && !$(NX_BOX[fn.name])) return; try { fn(); } catch (e) { console.error('Matilha:', fn.name, e); } });
    setInterval(() => { try { renderWall(); renderFx(); } catch (e) {} }, 60000);
  }

  /* Atualiza o que depende da conta quando alguém entra ou sai */
  const who = () => isLogged() ? (userSession.code || userSession.name || 'conta') : 'visitante';
  let lastWho = null;
  const prevRefresh = window.socRefreshUI;
  window.socRefreshUI = function () {
    prevRefresh();
    try {
      renderMissions(); renderRank();
      if (lastWho !== null && who() !== lastWho) { renderCompose(); cardFormInit(); }
      lastWho = who();
    } catch (e) {}
  };

  /* Atalhos no topo da página */
  const prevQuick = window.heroQuick;
  window.heroQuick = function () {
    prevQuick();
    const q = document.getElementById('heroQuick'); if (!q) return;
    q.insertAdjacentHTML('beforeend', '<button onclick="goSection(\'palpite\')">🎯 Dar palpite</button><button onclick="goSection(\'simulador\')">🧮 Simulador</button>');
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();

/* Busca (/): seções novas */
window.nxSearch = [
  ['escalacao','Escalação provável','time titulares formação campo'],['palpite','Palpite e craque do jogo','placar votar craque mvp'],
  ['simulador','Simulador da rodada','classificação tabela simular'],['calendario','Próximos jogos','calendário agenda rodadas'],
  ['comparador','Comparador de jogadores','comparar atletas'],['arena','Arena da Matilha','pênalti quiz bateria jogos'],
  ['galeria','Galeria','fotos imagens'],['mural','Mural da torcida','recados mensagens'],['cartao','Cartão do torcedor','camisa imagem'],
  ['missoes','Missões e ranking','pontos diárias'],['hino','Hino e cânticos','letra gritos'],['duvidas','Dúvidas frequentes','faq ajuda newsletter']
];
