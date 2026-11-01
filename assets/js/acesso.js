/* ==========================================================================
   E-books Studio — acesso.js
   Página de ativação do código de acesso (licença).
   ========================================================================== */
(function () {
  'use strict';

  const $ = (s, c = document) => c.querySelector(s);
  const Lic = window.EbooksLicenca;
  const area = $('#area-licenca');
  const params = new URLSearchParams(window.location.search);

  const dataBR = (iso) => new Date(String(iso) + 'T12:00:00').toLocaleDateString('pt-BR');

  function aviso(tipo, texto) {
    const icones = {
      ok: '<path d="m5 12 5 5 9-10"/>',
      error: '<circle cx="12" cy="12" r="9"/><path d="M12 8v.001M12 12v4"/>',
      info: '<circle cx="12" cy="12" r="9"/><path d="M12 8v.001M12 12v4"/>'
    };
    const el = document.createElement('div');
    el.className = 'notice notice--' + tipo;
    el.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      (icones[tipo] || icones.info) + '</svg><div>' + texto + '</div>';
    return el;
  }

  function telaAtiva(licenca) {
    const plano = Lic.PLANOS[licenca.plano] || { nome: licenca.plano };
    const bloco = document.createElement('section');
    bloco.className = 'license';
    bloco.innerHTML =
      '<div class="license__top">' +
        '<span class="license__badge">Plano ativo</span>' +
        '<strong style="font-family:var(--font-display);font-size:19px">' + plano.nome + '</strong>' +
      '</div>' +
      '<div class="license__meta">' +
        '<span>Código: <strong class="license__code" style="display:inline-block;margin-top:6px">' + (licenca.codigo || '—') + '</span>' +
        (licenca.expira
          ? '<span>Válido até <strong>' + dataBR(licenca.expira) + '</strong></span>'
          : '<span>Licença <strong>sem prazo de validade</strong></span>') +
        '<span>Ativado em <strong>' + new Date(licenca.ativadoEm || Date.now()).toLocaleDateString('pt-BR') + '</strong></span>' +
      '</div>' +
      '<div class="row-actions" style="margin-top:4px">' +
        '<a class="btn btn--primary" href="estudio.html">Abrir o estúdio</a>' +
        '<button class="btn btn--ghost" type="button" id="btn-remover">Remover deste navegador</button>' +
      '</div>';

    bloco.querySelector('#btn-remover').addEventListener('click', () => {
      if (!window.confirm('Remover a licença deste navegador? Você pode ativar o mesmo código de novo depois.')) return;
      Lic.remover();
      render(aviso('info', 'Licença removida deste navegador. O estúdio voltou para o plano Essencial.'));
    });

    return bloco;
  }

  function telaFormulario(extra) {
    const bloco = document.createElement('section');
    bloco.className = 'card';
    bloco.innerHTML =
      '<h2 class="card__title">Código de acesso</h2>' +
      '<p class="card__hint">Formato: <strong>EBS-PRO-XXXX-XXXX-XXXX</strong>. Maiúsculas, hífens e espaços são ignorados.</p>' +
      '<form class="code-field" id="form-codigo" novalidate>' +
        '<label class="sr-only" for="codigo">Código de acesso</label>' +
        '<input id="codigo" name="codigo" type="text" placeholder="EBS-PRO-XXXX-XXXX-XXXX" autocomplete="off" spellcheck="false" autocapitalize="characters" maxlength="30">' +
        '<button class="btn btn--primary" type="submit">Ativar acesso</button>' +
      '</form>' +
      '<p class="muted" style="margin:14px 0 0">Ainda não comprou? <a href="checkout.html?plano=profissional" style="text-decoration:underline">Ver planos e preços</a>.</p>';

    if (extra) bloco.append(extra);

    const form = bloco.querySelector('#form-codigo');
    const input = bloco.querySelector('#codigo');

    input.addEventListener('input', () => {
      const pos = input.selectionStart;
      const formatado = Lic.formatarCodigo(input.value).slice(0, 30);
      if (formatado !== input.value) {
        input.value = formatado;
        input.setSelectionRange(Math.min(pos, formatado.length), Math.min(pos, formatado.length));
      }
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const anterior = bloco.querySelector('.notice');
      if (anterior) anterior.remove();

      const resultado = Lic.ativar(input.value);
      if (!resultado.ok) {
        bloco.append(aviso('error', resultado.erro));
        input.focus();
        return;
      }

      const texto = 'Plano <strong>' + resultado.nome + '</strong> liberado neste navegador' +
        (resultado.expira ? ' até ' + dataBR(resultado.expira) : '') + '. Bom trabalho!';
      render(aviso('ok', texto));
    });

    return bloco;
  }

  function render(primeiroAviso) {
    const ativa = Lic.getAtiva();
    area.innerHTML = '';
    area.append(ativa ? telaAtiva(ativa) : telaFormulario());
    if (primeiroAviso) area.append(primeiroAviso);
  }

  function init() {
    if (params.get('pago') === '1') {
      $('#pagina-eyebrow').textContent = 'Compra confirmada';
      $('#pagina-titulo').textContent = 'Pagamento recebido! Ative seu acesso';
      $('#pagina-sub').innerHTML = 'Enviamos o código de acesso para o e-mail usado na compra. Cole abaixo para liberar o plano neste navegador.';
    }

    const ano = $('#year');
    if (ano) ano.textContent = new Date().getFullYear();

    render();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
