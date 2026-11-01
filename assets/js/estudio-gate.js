/* ==========================================================================
   E-books Studio — estudio-gate.js
   Porta de entrada do estúdio: sem sessão válida, o editor não abre.

   A verificação é feita no Supabase (Auth), não no navegador. Apagar o
   localStorage não libera o estúdio — só um login válido libera.
   ========================================================================== */
(function () {
  'use strict';

  const Auth = window.EbooksAuth;
  const gate = document.getElementById('auth-gate');
  document.body.classList.add('gate-ativo');

  function mostrarErro(texto, permiteTentar) {
    if (!gate) return;
    gate.innerHTML =
      '<div class="auth-gate__box">' +
        '<span class="auth-gate__icon" aria-hidden="true">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4M12 17h.01"/><circle cx="12" cy="12" r="9"/></svg>' +
        '</span>' +
        '<p>' + texto + '</p>' +
        '<div class="auth-gate__acoes">' +
          (permiteTentar ? '<button class="btn btn--primary" type="button" id="gate-retry">Tentar de novo</button>' : '') +
          '<a class="btn btn--ghost" href="login.html">Entrar</a>' +
        '</div>' +
      '</div>';
    const retry = gate.querySelector('#gate-retry');
    if (retry) retry.addEventListener('click', () => window.location.reload());
  }

  function liberar(perfil) {
    window.EBOOKS_PERFIL = perfil || null;
    window.EBOOKS_AUTORIZADO = true;
    if (perfil && window.EbooksCreditos && typeof perfil.credits === 'number') {
      window.EbooksCreditos.definirSaldo(perfil.credits);
    }
    document.dispatchEvent(new CustomEvent('ebs:autorizado', { detail: perfil }));
    if (gate) gate.remove();
    document.body.classList.remove('gate-ativo');
  }

  async function iniciar() {
    if (!Auth) {
      mostrarErro('Não foi possível carregar o login. Recarregue a página.', true);
      return;
    }

    const verificacao = await Auth.verificarAcesso();

    if (!verificacao.ok && verificacao.motivo === 'sem_sessao') {
      const next = encodeURIComponent(location.pathname.replace(/^\//, '') + location.search);
      window.location.replace('login.html?next=' + next);
      return;
    }

    if (!verificacao.ok) {
      mostrarErro('Não conseguimos validar sua conta agora. Verifique sua conexão e tente novamente.', true);
      return;
    }

    const perfil = await Auth.perfil();
    liberar(perfil);
  }

  iniciar();
})();
