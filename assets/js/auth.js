/* ==========================================================================
   E-books Studio — auth.js
   Login, criação de conta e sessão (Supabase Auth).

   Regra do produto: o estúdio só abre com conta logada. A sessão é validada
   pelo Supabase, não pelo navegador — limpar o localStorage não cria acesso.
   ========================================================================== */
(function () {
  'use strict';

  const cli = () => window.EbooksBackend.clientePronto();

  const ERROS = [
    [/invalid login credentials/i, 'E-mail ou senha incorretos.'],
    [/email not confirmed/i, 'Confirme seu e-mail antes de entrar.'],
    [/user already registered/i, 'Já existe uma conta com este e-mail.'],
    [/password should be at least (\d+)/i, 'A senha precisa ter pelo menos $1 caracteres.'],
    [/password.*weak|weak.*password/i, 'Escolha uma senha mais forte.'],
    [/email rate limit|over_.*email.*rate/i, 'Muitas tentativas de e-mail. Aguarde alguns minutos.'],
    [/rate limit/i, 'Muitas tentativas em pouco tempo. Aguarde um instante.'],
    [/provider is not enabled|unsupported provider/i, 'O login com Google ainda não está habilitado nesta conta.'],
    [/unable to validate email|invalid email/i, 'E-mail inválido. Confira e tente de novo.'],
    [/signups? not allowed|signup.*disabled/i, 'A criação de contas está desativada no momento.'],
    [/network|fetch/i, 'Falha de conexão. Verifique sua internet e tente de novo.']
  ];

  function traduzir(mensagem, codigo) {
    const texto = String(mensagem || '') + ' ' + String(codigo || '');
    for (const [padrao, traducao] of ERROS) {
      const achou = texto.match(padrao);
      if (achou) return traducao.replace('$1', achou[1] || '6');
    }
    return mensagem || 'Não foi possível concluir. Tente novamente.';
  }

  const limparNome = (nome) => String(nome || '').trim().toLowerCase().replace(/[^a-z0-9_]/g, '');

  function validarNomeUsuario(nome) {
    const limpo = limparNome(nome);
    if (limpo.length < 3) return 'O nome de usuário precisa ter pelo menos 3 caracteres (letras, números ou _).';
    if (limpo.length > 20) return 'O nome de usuário pode ter no máximo 20 caracteres.';
    return null;
  }

  function validarEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(String(email || '').trim())
      ? null
      : 'Informe um e-mail válido.';
  }

  function validarSenha(senha) {
    if (String(senha || '').length < 6) return 'A senha precisa ter pelo menos 6 caracteres.';
    return null;
  }

  /* ------------------------------------------------------------- sessão --- */
  async function sessao() {
    try {
      const c = await cli();
      const { data } = await c.auth.getSession();
      return data.session || null;
    } catch (e) {
      return null;
    }
  }

  async function usuarioAtual() {
    const s = await sessao();
    return s && s.user ? s.user : null;
  }

  // Distingue "não está logado" de "não deu para verificar" — o estúdio
  // precisa saber a diferença para não expulsar quem só está sem internet.
  async function verificarAcesso() {
    try {
      const c = await cli();
      const { data, error } = await c.auth.getSession();
      if (error) return { ok: false, motivo: 'indisponivel', erro: error.message };
      if (!data || !data.session) return { ok: false, motivo: 'sem_sessao' };
      return { ok: true, user: data.session.user };
    } catch (e) {
      return { ok: false, motivo: 'indisponivel', erro: (e && e.message) || 'SDK' };
    }
  }

  /* ------------------------------------------------------------- perfil --- */
  async function perfil() {
    const c = await cli();
    const { data: sess } = await c.auth.getSession();
    const user = sess && sess.session ? sess.session.user : null;
    if (!user) return null;

    const { data, error } = await c
      .from('profiles')
      .select('username, email, credits, plan')
      .eq('id', user.id)
      .single();

    if (error) {
      // perfil ainda não materializado: tenta de novo em instantes
      await new Promise((r) => setTimeout(r, 600));
      const retry = await c.from('profiles').select('username, email, credits, plan').eq('id', user.id).maybeSingle();
      if (retry.data) return Object.assign({ id: user.id }, retry.data);
      return { id: user.id, username: (user.email || '').split('@')[0], email: user.email, credits: 0, plan: 'essencial' };
    }
    return Object.assign({ id: user.id }, data);
  }

  /* ------------------------------------------------------------ cadastro --- */
  async function usernameDisponivel(nome) {
    try {
      const c = await cli();
      const { data, error } = await c.rpc('username_disponivel', { nome: limparNome(nome) });
      if (error) return true;
      return data === true;
    } catch (e) {
      return true;
    }
  }

  async function criarConta({ email, senha, username }) {
    const problemaNome = validarNomeUsuario(username);
    if (problemaNome) return { ok: false, erro: problemaNome };
    const problemaEmail = validarEmail(email);
    if (problemaEmail) return { ok: false, erro: problemaEmail };
    const problemaSenha = validarSenha(senha);
    if (problemaSenha) return { ok: false, erro: problemaSenha };

    const livre = await usernameDisponivel(username);
    if (!livre) return { ok: false, erro: 'Esse nome de usuário já está em uso. Escolha outro.' };

    try {
      const c = await cli();
      const { data, error } = await c.auth.signUp({
        email: String(email).trim(),
        password: senha,
        options: { data: { username: limparNome(username) } }
      });
      if (error) return { ok: false, erro: traduzir(error.message, error.code) };
      if (!data.session) {
        return { ok: false, erro: 'Conta criada! Confirme o e-mail para entrar.' };
      }
      return { ok: true, user: data.user };
    } catch (e) {
      return { ok: false, erro: 'Falha ao conectar. Tente novamente.' };
    }
  }

  /* -------------------------------------------------------------- entrar --- */
  async function entrar(email, senha) {
    const problemaEmail = validarEmail(email);
    if (problemaEmail) return { ok: false, erro: problemaEmail };
    if (!senha) return { ok: false, erro: 'Informe sua senha.' };

    try {
      const c = await cli();
      const { data, error } = await c.auth.signInWithPassword({ email: String(email).trim(), password: senha });
      if (error) return { ok: false, erro: traduzir(error.message, error.code) };
      return { ok: true, user: data.user };
    } catch (e) {
      return { ok: false, erro: 'Falha ao conectar. Tente novamente.' };
    }
  }

  async function entrarComGoogle(destino) {
    try {
      const c = await cli();
      const { error } = await c.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: destino || window.location.origin + '/estudio.html' }
      });
      if (error) return { ok: false, erro: traduzir(error.message, error.code) };
      return { ok: true };
    } catch (e) {
      return { ok: false, erro: 'Falha ao conectar com o Google.' };
    }
  }

  async function sair() {
    try {
      const c = await cli();
      await c.auth.signOut();
    } catch (e) { /* ignore */ }
  }

  async function recuperarSenha(email) {
    const problemaEmail = validarEmail(email);
    if (problemaEmail) return { ok: false, erro: problemaEmail };
    try {
      const c = await cli();
      const { error } = await c.auth.resetPasswordForEmail(String(email).trim(), {
        redirectTo: window.location.origin + '/login.html'
      });
      if (error) return { ok: false, erro: traduzir(error.message, error.code) };
      return { ok: true };
    } catch (e) {
      return { ok: false, erro: 'Falha ao conectar. Tente novamente.' };
    }
  }

  /* ------------------------------------------------------------ créditos --- */
  async function creditos() {
    try {
      const c = await cli();
      const { data, error } = await c.rpc('meus_creditos');
      if (error) return null;
      return typeof data === 'number' ? data : null;
    } catch (e) {
      return null;
    }
  }

  // Consome créditos no servidor (função SQL atômica). O saldo nunca é
  // alterado pelo cliente: a tabela bloqueia update de "credits".
  async function gastar(quantidade, motivo) {
    const qtd = Math.max(0, Math.round(Number(quantidade) || 0));
    if (!qtd) return { ok: true, saldo: await creditos() };
    try {
      const c = await cli();
      const { data, error } = await c.rpc('gastar_creditos', { qtd: qtd, motivo: motivo || 'uso de IA' });
      if (error) {
        const msg = String(error.message || '');
        if (/CREDITOS_INSUFICIENTES/i.test(msg)) {
          return { ok: false, erro: 'creditos', saldo: await creditos() };
        }
        if (/NAO_AUTENTICADO/i.test(msg)) {
          return { ok: false, erro: 'sessao', saldo: null };
        }
        return { ok: false, erro: traduzir(error.message, error.code), saldo: await creditos() };
      }
      return { ok: true, saldo: typeof data === 'number' ? data : await creditos() };
    } catch (e) {
      return { ok: false, erro: 'Falha ao conectar. Tente novamente.', saldo: null };
    }
  }

  async function extrato(limite) {
    try {
      const c = await cli();
      const { data, error } = await c
        .from('credit_events')
        .select('quantidade, motivo, saldo_apos, created_at')
        .order('created_at', { ascending: false })
        .limit(limite || 10);
      if (error) return [];
      return data || [];
    } catch (e) {
      return [];
    }
  }

  window.EbooksAuth = {
    sessao,
    usuarioAtual,
    verificarAcesso,
    perfil,
    criarConta,
    entrar,
    entrarComGoogle,
    sair,
    recuperarSenha,
    usernameDisponivel,
    validarNomeUsuario,
    validarEmail,
    validarSenha,
    limparNome,
    creditos,
    gastar,
    extrato,
    traduzir
  };
})();
