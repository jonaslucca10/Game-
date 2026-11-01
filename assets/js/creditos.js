/* ==========================================================================
   E-books Studio — creditos.js
   Tabela de custos em créditos e ponte com o saldo do servidor.

   Cada conta nova recebe 100 créditos (definido no banco, na criação do
   perfil). O desconto acontece em gastar_creditos(), no Supabase — o
   navegador só pede, nunca altera o saldo.
   ========================================================================== */
(function () {
  'use strict';

  // Ajuste os valores aqui para mudar quanto cada ação consome.
  const CUSTOS = {
    book: { valor: 10, rotulo: 'e-book completo' },
    outline: { valor: 2, rotulo: 'sumário' },
    page: { valor: 2, rotulo: 'reescrever página' }
  };

  const ROTULOS_ACAO = { book: 'IA: e-book completo', outline: 'IA: sumário', page: 'IA: página' };

  let saldo = null;

  function custoDe(kind) {
    return CUSTOS[kind] ? CUSTOS[kind].valor : 0;
  }

  function rotuloDe(kind) {
    return CUSTOS[kind] ? CUSTOS[kind].rotulo : 'ação';
  }

  function saldoAtual() {
    return saldo;
  }

  function definirSaldo(novo) {
    if (typeof novo === 'number' && isFinite(novo)) saldo = Math.max(0, Math.round(novo));
    pintar();
    document.dispatchEvent(new CustomEvent('ebs:creditos', { detail: { saldo: saldo } }));
  }

  function pintar() {
    const alvos = document.querySelectorAll('[data-creditos-valor]');
    alvos.forEach((el) => {
      el.textContent = saldo === null ? '—' : String(saldo);
    });
    const chips = document.querySelectorAll('[data-creditos-chip]');
    chips.forEach((el) => {
      el.classList.toggle('is-empty', saldo !== null && saldo <= 0);
      el.classList.toggle('is-low', saldo !== null && saldo > 0 && saldo < 10);
      el.title = saldo === null ? 'Carregando créditos' : saldo + ' créditos disponíveis';
    });
  }

  async function sincronizar() {
    if (!window.EbooksAuth) return null;
    const valor = await window.EbooksAuth.creditos();
    if (typeof valor === 'number') definirSaldo(valor);
    return valor;
  }

  // Cobra antes de executar: se não houver saldo, a ação não acontece.
  async function cobrar(kind, motivoExtra) {
    const custo = custoDe(kind);
    if (!custo) return { ok: true, saldo: saldo };

    if (!window.EbooksAuth) return { ok: false, erro: 'sessao', saldo: saldo };

    if (saldo !== null && saldo < custo) {
      return { ok: false, erro: 'creditos', saldo: saldo };
    }

    const motivo = ROTULOS_ACAO[kind] || 'uso de IA';
    const resultado = await window.EbooksAuth.gastar(custo, motivoExtra ? motivo + ' · ' + motivoExtra : motivo);

    if (resultado.ok) {
      definirSaldo(resultado.saldo);
      return { ok: true, saldo: resultado.saldo, custo: custo };
    }

    if (typeof resultado.saldo === 'number') definirSaldo(resultado.saldo);
    return { ok: false, erro: resultado.erro || 'falha', saldo: resultado.saldo, custo: custo };
  }

  // Rótulos com o custo, usados nos botões do painel de IA.
  function decorarBotoes() {
    const mapa = [
      ['#ai-generate', 'book'],
      ['#ai-outline', 'outline'],
      ['#ai-page', 'page']
    ];
    mapa.forEach(([sel, kind]) => {
      const btn = document.querySelector(sel);
      if (!btn) return;
      const custo = custoDe(kind);
      const texto = btn.childNodes.length ? btn.lastChild : null;
      const rotulo = btn.querySelector('span') || null;
      if (rotulo) {
        if (!rotulo.dataset.base) rotulo.dataset.base = rotulo.textContent.trim();
        rotulo.textContent = rotulo.dataset.base + ' · ' + custo + ' créditos';
      } else if (texto && texto.nodeType === 3) {
        if (!btn.dataset.base) btn.dataset.base = texto.textContent.trim();
        texto.textContent = ' ' + btn.dataset.base + ' · ' + custo + ' créditos';
      }
    });
  }

  window.EbooksCreditos = {
    CUSTOS,
    custoDe,
    rotuloDe,
    saldoAtual,
    definirSaldo,
    sincronizar,
    cobrar,
    decorarBotoes,
    pintar
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', pintar);
  } else {
    pintar();
  }
})();
