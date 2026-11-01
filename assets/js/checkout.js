/* ==========================================================================
   E-books Studio — checkout.js
   Monta a página de assinatura: plano, período, preço e destino do pagamento.
   ========================================================================== */
(function () {
  'use strict';

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

  const Lic = window.EbooksLicenca;
  const Pag = window.EBOOKS_PAGAMENTO || { links: {}, pix: {}, suporte: {} };

  const RECURSOS = {
    profissional: [
      'Projetos ilimitados',
      'Criação com IA (sumário e capítulos)',
      'Todos os modelos, temas e capas',
      'PDF sem marca d’água + exportação HTML'
    ],
    studio: [
      'Tudo do plano Profissional',
      'Até 5 pessoas no mesmo espaço',
      'Pastas de clientes e modelos da equipe',
      'Suporte prioritário'
    ]
  };

  const money = (valor) => 'R$ ' + Number(valor).toLocaleString('pt-BR');

  const params = new URLSearchParams(window.location.search);
  const estado = {
    plano: params.get('plano') === 'studio' ? 'studio' : 'profissional',
    ciclo: params.get('ciclo') === 'anual' ? 'anual' : 'mensal'
  };

  function dados() {
    const plano = Lic.PLANOS[estado.plano];
    const mensal = estado.ciclo === 'mensal';
    const precoMes = mensal ? plano.precoMensal : plano.precoAnual;
    return {
      plano,
      mensal,
      precoMes,
      total: mensal ? precoMes : precoMes * 12,
      chave: estado.plano + '-' + estado.ciclo
    };
  }

  function renderPlanos() {
    $$('.plan-opt[data-plano]').forEach((btn) => {
      const ativo = btn.dataset.plano === estado.plano;
      btn.classList.toggle('is-active', ativo);
      btn.setAttribute('aria-checked', String(ativo));

      const alvo = btn.querySelector('[data-preco]');
      if (alvo) {
        const plano = Lic.PLANOS[btn.dataset.plano];
        const valor = estado.ciclo === 'mensal' ? plano.precoMensal : plano.precoAnual;
        alvo.innerHTML = money(valor) + '<small>por mês' + (estado.ciclo === 'anual' ? ', no plano anual' : '') + '</small>';
      }
    });

    $$('.cycle [data-ciclo]').forEach((btn) => {
      btn.classList.toggle('is-active', btn.dataset.ciclo === estado.ciclo);
    });
    $('#ciclo-save').hidden = estado.ciclo !== 'anual';
  }

  function renderResumo() {
    const d = dados();
    $('#resumo-plano').textContent = d.plano.nome;
    $('#resumo-ciclo').textContent = d.mensal ? 'Mensal' : 'Anual';
    $('#resumo-preco').textContent = money(d.precoMes) + (d.mensal ? ' / mês' : ' / mês (12x)');
    $('#resumo-total').textContent = money(d.total) + (d.mensal ? ' / mês' : ' / ano');

    const lista = $('#resumo-recursos');
    lista.innerHTML = '';
    (RECURSOS[estado.plano] || RECURSOS.profissional).forEach((item) => {
      const li = document.createElement('li');
      li.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12 5 5 9-10"/></svg>';
      li.append(document.createTextNode(item));
      lista.append(li);
    });
  }

  function renderPagamento() {
    const d = dados();
    const link = String((Pag.links || {})[d.chave] || '').trim();
    const botao = $('#btn-pagar');
    const texto = $('#btn-pagar-texto');
    const aviso = $('#aviso-pagamento');
    const hint = $('#pagamento-hint');

    if (link) {
      botao.href = link;
      botao.removeAttribute('aria-disabled');
      botao.classList.remove('is-disabled');
      texto.textContent = 'Pagar ' + money(d.total) + (d.mensal ? ' por mês' : ' por ano');
      hint.textContent = 'Você será levado ao checkout seguro do ' +
        (Pag.provedor === 'kiwify' ? 'Kiwify' : 'Hotmart') + '. Cartão, Pix e boleto.';
      aviso.hidden = true;
    } else {
      botao.removeAttribute('href');
      botao.setAttribute('aria-disabled', 'true');
      botao.classList.add('is-disabled');
      texto.textContent = 'Pagamento ainda não disponível';
      hint.textContent = 'O checkout deste plano ainda será ativado.';
      aviso.hidden = false;

      const contato = [];
      if (Pag.suporte && Pag.suporte.whatsapp) {
        contato.push('<a href="https://wa.me/55' + Pag.suporte.whatsapp.replace(/\D/g, '') + '" target="_blank" rel="noopener">falar no WhatsApp</a>');
      }
      if (Pag.suporte && Pag.suporte.email) {
        contato.push('<a href="mailto:' + Pag.suporte.email + '">' + Pag.suporte.email + '</a>');
      }
      const extra = contato.length ? ' Para fechar a assinatura agora, ' + contato.join(' ou ') + '.' : '';
      $('#aviso-contato').innerHTML = extra;
    }
  }

  function sincronizarURL() {
    const url = new URL(window.location.href);
    url.searchParams.set('plano', estado.plano);
    url.searchParams.set('ciclo', estado.ciclo);
    window.history.replaceState({}, '', url);
  }

  function renderTudo() {
    renderPlanos();
    renderResumo();
    renderPagamento();
    sincronizarURL();
  }

  function avisoLicencaAtiva() {
    const ativa = Lic.getAtiva();
    if (!ativa) return;
    const nome = Lic.PLANOS[ativa.plano] ? Lic.PLANOS[ativa.plano].nome : ativa.plano;
    const bloco = document.createElement('div');
    bloco.className = 'notice notice--ok';
    bloco.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12 5 5 9-10"/></svg>' +
      '<div>Este navegador já tem o plano <strong>' + nome + '</strong> ativo' +
      (ativa.expira ? ' até ' + new Date(ativa.expira + 'T12:00:00').toLocaleDateString('pt-BR') : '') +
      '. <a href="estudio.html">Abrir o estúdio</a> · <a href="acesso.html">gerenciar acesso</a></div>';
    $('.page-sub').insertAdjacentElement('afterend', bloco);
  }

  function init() {
    $$('.plan-opt[data-plano]').forEach((btn) => {
      btn.addEventListener('click', () => {
        estado.plano = btn.dataset.plano;
        renderTudo();
      });
    });
    $$('.cycle [data-ciclo]').forEach((btn) => {
      btn.addEventListener('click', () => {
        estado.ciclo = btn.dataset.ciclo;
        renderTudo();
      });
    });
    $('#btn-pagar').addEventListener('click', (e) => {
      if ($('#btn-pagar').getAttribute('aria-disabled') === 'true') {
        e.preventDefault();
      }
    });

    const ano = $('#year');
    if (ano) ano.textContent = new Date().getFullYear();

    const email = (Pag.suporte && Pag.suporte.email) || 'contato@ebooksstudio.com.br';
    $$('[data-suporte-email]').forEach((el) => {
      el.textContent = email;
      el.href = 'mailto:' + email;
    });
    $('#garantia').textContent = Pag.garantiaDias || 7;

    renderTudo();
    avisoLicencaAtiva();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
