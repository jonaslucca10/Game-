/* ==========================================================================
   E-books Studio — login.js
   Página de entrada: abas, validação, checagem de nome de usuário e Google.
   ========================================================================== */
(function () {
  'use strict';

  const $ = (s, c = document) => c.querySelector(s);
  const Auth = window.EbooksAuth;
  const params = new URLSearchParams(window.location.search);

  // Só aceita caminho relativo no "next" — evita redirecionamento para fora.
  function destino() {
    const bruto = params.get('next') || '';
    if (!bruto || /^https?:|^\/\//i.test(bruto)) return 'estudio.html';
    return bruto.replace(/^\//, '');
  }

  let tipo = 'info';
  function mensagem(texto, novo) {
    tipo = novo || 'info';
    const el = $('#auth-msg');
    el.textContent = texto || '';
    el.className = 'auth-msg' + (texto ? ' is-' + tipo : '');
  }

  function ocupado(botao, ativo, textoOriginal) {
    botao.disabled = ativo;
    if (ativo) {
      botao.dataset.texto = botao.textContent;
      botao.textContent = 'Aguarde…';
    } else if (botao.dataset.texto || textoOriginal) {
      botao.textContent = textoOriginal || botao.dataset.texto;
    }
  }

  function trocarAba(aba) {
    ['entrar', 'criar'].forEach((nome) => {
      const botao = document.querySelector('[data-aba="' + nome + '"]');
      const painel = document.getElementById('painel-' + nome);
      const ativo = nome === aba;
      botao.classList.toggle('is-active', ativo);
      botao.setAttribute('aria-selected', String(ativo));
      painel.hidden = !ativo;
    });
    mensagem('');
  }

  /* ------------------------------------------------------- nome de usuário */
  let timerNome = null;
  function checarNome() {
    const campo = $('#criar-usuario');
    const status = $('#usuario-status');
    const limpo = Auth.limparNome(campo.value);
    campo.value = limpo;

    const problema = Auth.validarNomeUsuario(limpo);
    if (problema) {
      status.className = 'field-hint';
      status.textContent = problema;
      return;
    }

    status.className = 'field-hint';
    status.textContent = 'Verificando disponibilidade…';

    clearTimeout(timerNome);
    timerNome = setTimeout(async () => {
      const livre = await Auth.usernameDisponivel(limpo);
      status.className = 'field-hint ' + (livre ? 'is-ok' : 'is-erro');
      status.textContent = livre ? '@' + limpo + ' está livre ✓' : 'Esse nome já está em uso. Tente outro.';
    }, 450);
  }

  /* ------------------------------------------------------------- eventos */
  function init() {
    const ano = $('#year');
    if (ano) ano.textContent = new Date().getFullYear();

    document.querySelectorAll('[data-aba]').forEach((botao) => {
      botao.addEventListener('click', () => trocarAba(botao.dataset.aba));
    });

    if (params.get('aba') === 'criar') trocarAba('criar');

    $('#criar-usuario').addEventListener('input', checarNome);

    /* entrar */
    $('#painel-entrar').addEventListener('submit', async (e) => {
      e.preventDefault();
      const botao = $('#btn-entrar');
      mensagem('');
      ocupado(botao, true);
      const resultado = await Auth.entrar($('#entrar-email').value, $('#entrar-senha').value);
      ocupado(botao, false, 'Entrar no estúdio');
      if (!resultado.ok) {
        mensagem(resultado.erro, 'erro');
        return;
      }
      mensagem('Tudo certo! Abrindo o estúdio…', 'ok');
      window.location.replace(destino());
    });

    /* criar conta */
    $('#painel-criar').addEventListener('submit', async (e) => {
      e.preventDefault();
      const botao = $('#btn-criar');
      mensagem('');
      ocupado(botao, true);
      const resultado = await Auth.criarConta({
        username: $('#criar-usuario').value,
        email: $('#criar-email').value,
        senha: $('#criar-senha').value
      });
      ocupado(botao, false, 'Criar conta com 100 créditos');
      if (!resultado.ok) {
        mensagem(resultado.erro, 'erro');
        return;
      }
      mensagem('Conta criada com 100 créditos! Abrindo o estúdio…', 'ok');
      window.location.replace(destino());
    });

    /* Google */
    $('#btn-google').addEventListener('click', async () => {
      const botao = $('#btn-google');
      mensagem('');
      ocupado(botao, true);
      const resultado = await Auth.entrarComGoogle(window.location.origin + '/' + destino());
      if (!resultado.ok) {
        ocupado(botao, false);
        mensagem(resultado.erro + ' Use e-mail e senha enquanto isso.', 'erro');
      }
    });

    /* esqueci a senha */
    $('#btn-esqueci').addEventListener('click', async () => {
      const email = $('#entrar-email').value.trim() || window.prompt('Qual e-mail você usou no cadastro?') || '';
      if (!email) return;
      mensagem('Enviando…', 'info');
      const resultado = await Auth.recuperarSenha(email);
      if (!resultado.ok) {
        mensagem(resultado.erro, 'erro');
        return;
      }
      mensagem('Enviamos um link de redefinição para ' + email + '. Confira a caixa de entrada e o spam.', 'ok');
    });

    /* já logado? vai direto */
    Auth.usuarioAtual().then((usuario) => {
      if (usuario) {
        mensagem('Você já está logado. Abrindo o estúdio…', 'ok');
        window.location.replace(destino());
      }
    });

    // mensagens de retorno do Supabase (confirmação / redefinição de senha)
    const hash = window.location.hash || '';
    if (/access_token|error_description/.test(hash)) {
      if (/error_description=/.test(hash)) {
        mensagem('Não foi possível concluir a verificação do link. Tente entrar novamente.', 'erro');
      } else {
        mensagem('Link confirmado. Você já pode entrar.', 'ok');
      }
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
