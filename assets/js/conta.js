/* ==========================================================================
   E-books Studio — conta.js
   Painel da conta: dados, créditos, extrato e saída.
   ========================================================================== */
(function () {
  'use strict';

  const $ = (s, c = document) => c.querySelector(s);
  const Auth = window.EbooksAuth;

  const fmtData = (iso) => {
    const d = new Date(iso);
    return isNaN(d.getTime()) ? '' : d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  function irParaLogin() {
    const next = encodeURIComponent('conta.html');
    window.location.replace('login.html?next=' + next);
  }

  function preencher(perfil) {
    const nome = (perfil.username || 'leitor').replace(/_/g, ' ');
    $('#saudacao').textContent = 'Olá, ' + nome + ' 👋';
    $('#conta-usuario').textContent = '@' + (perfil.username || 'leitor');
    $('#conta-email').textContent = perfil.email || '';
    const inicial = (perfil.username || '?').trim().charAt(0).toUpperCase();
    $('#conta-avatar').textContent = inicial || '?';

    const plano = window.EbooksLicenca ? window.EbooksLicenca.limites().nome : 'Essencial';
    $('#conta-plano').textContent = plano;

    const creditos = typeof perfil.credits === 'number' ? perfil.credits : 0;
    window.EbooksCreditos.definirSaldo(creditos);
    $('#barra-creditos').style.width = Math.max(0, Math.min(100, (creditos / 100) * 100)) + '%';
    $('#conta-creditos-hint').textContent = creditos === 0
      ? 'Você usou todos os créditos. Assine um plano para continuar criando com IA.'
      : 'Cada geração com IA consome créditos. Veja o custo nos botões do painel de IA.';
  }

  async function carregarExtrato() {
    const host = $('#extrato');
    const itens = await Auth.extrato(12);
    host.innerHTML = '';
    if (!itens.length) {
      host.innerHTML = '<p class="muted">Nenhum lançamento ainda. Seus 100 créditos iniciais aparecem aqui após a criação da conta.</p>';
      return;
    }
    itens.forEach((item) => {
      const linha = document.createElement('div');
      linha.className = 'extrato-linha';
      const positivo = item.quantidade > 0;
      linha.innerHTML =
        '<span class="extrato-motivo">' + (item.motivo || 'uso') + '<small>' + fmtData(item.created_at) + '</small></span>' +
        '<span class="extrato-qtd ' + (positivo ? 'is-pos' : 'is-neg') + '">' + (positivo ? '+' : '') + item.quantidade + '</span>' +
        '<span class="extrato-saldo">' + (item.saldo_apos === null ? '—' : item.saldo_apos) + '</span>';
      host.append(linha);
    });
  }

  async function sair() {
    await Auth.sair();
    window.location.replace('index.html');
  }

  async function init() {
    const ano = $('#year');
    if (ano) ano.textContent = new Date().getFullYear();

    $('#btn-sair').addEventListener('click', sair);
    $('#btn-sair-head').addEventListener('click', (e) => { e.preventDefault(); sair(); });

    const usuario = await Auth.usuarioAtual();
    if (!usuario) { irParaLogin(); return; }

    const perfil = await Auth.perfil();
    if (!perfil) { irParaLogin(); return; }

    preencher(perfil);
    $('#gate').remove();
    $('#conteudo').hidden = false;
    carregarExtrato();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
