/* ==========================================================================
   E-books Studio — admin-licencas.js
   Gera códigos de acesso e o bloco de hashes para colar em licencas.js.
   Roda só no navegador: nada é enviado para servidor nenhum.
   ========================================================================== */
(function () {
  'use strict';

  const $ = (s, c = document) => c.querySelector(s);
  const Lic = window.EbooksLicenca;

  // Sem caracteres ambíguos (0/O, 1/I/L) para facilitar a digitação do cliente.
  const ALFABETO = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const TAGS = { profissional: 'PRO', studio: 'STU' };

  let lote = [];

  function aleatorio(tamanho) {
    const bytes = new Uint8Array(tamanho);
    if (window.crypto && window.crypto.getRandomValues) {
      window.crypto.getRandomValues(bytes);
    } else {
      for (let i = 0; i < tamanho; i++) bytes[i] = Math.floor(Math.random() * 256);
    }
    let saida = '';
    for (let i = 0; i < tamanho; i++) saida += ALFABETO[bytes[i] % ALFABETO.length];
    return saida;
  }

  function validadeISO(meses) {
    if (!meses) return null;
    const data = new Date();
    data.setMonth(data.getMonth() + Number(meses));
    return data.toISOString().slice(0, 10);
  }

  function copiar(texto, aviso) {
    const feito = () => window.alert(aviso);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(texto).then(feito, () => fallback(texto, feito));
    } else {
      fallback(texto, feito);
    }
  }

  function fallback(texto, feito) {
    const ta = document.createElement('textarea');
    ta.value = texto;
    document.body.append(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (e) { /* ignore */ }
    ta.remove();
    feito();
  }

  function gerar() {
    const plano = $('#plano').value;
    const quantidade = Math.max(1, Math.min(200, Number($('#quantidade').value) || 1));
    const meses = Number($('#validade').value);
    const cliente = $('#cliente').value.trim();
    const expira = validadeISO(meses);

    lote = [];
    for (let i = 0; i < quantidade; i++) {
      const bruto = 'EBS' + TAGS[plano] + aleatorio(12);
      lote.push({
        codigo: Lic.formatarCodigo(bruto),
        bruto: bruto,
        hash: Lic.sha256Hex(bruto),
        plano: plano,
        expira: expira,
        cliente: cliente,
        criadoEm: new Date().toISOString()
      });
    }

    render();
  }

  function render() {
    const card = $('#card-resultado');
    const lista = $('#lista-codigos');
    lista.innerHTML = '';

    if (!lote.length) {
      card.hidden = true;
      return;
    }
    card.hidden = false;

    lote.forEach((item) => {
      const linha = document.createElement('div');
      linha.className = 'code-row';
      linha.innerHTML =
        '<span>' + item.codigo + '<br><small>' +
          (Lic.PLANOS[item.plano] ? Lic.PLANOS[item.plano].nome : item.plano) +
          ' · ' + (item.expira ? 'até ' + new Date(item.expira + 'T12:00:00').toLocaleDateString('pt-BR') : 'sem validade') +
        '</small></span>';

      const botao = document.createElement('button');
      botao.type = 'button';
      botao.className = 'btn btn--ghost btn--sm';
      botao.textContent = 'Copiar';
      botao.addEventListener('click', () => copiar(item.codigo, 'Código copiado: ' + item.codigo));
      linha.append(botao);
      lista.append(linha);
    });

    const registros = lote
      .map((item) => "  { h: '" + item.hash + "', p: '" + item.plano + "', e: " + (item.expira ? "'" + item.expira + "'" : 'null') + ' }')
      .join(',\n');

    const comentario = lote[0].cliente
      ? '  // Cliente: ' + lote[0].cliente + ' — emitido em ' + new Date().toLocaleDateString('pt-BR') + '\n'
      : '  // Emitido em ' + new Date().toLocaleDateString('pt-BR') + '\n';

    $('#snippet').value =
      'window.EBOOKS_LICENCAS = [\n' +
      comentario +
      registros + '\n' +
      '];';
  }

  function baixarCSV() {
    const linhas = [['codigo', 'plano', 'validade', 'cliente', 'hash'].join(';')];
    lote.forEach((item) => {
      linhas.push([item.codigo, item.plano, item.expira || 'sem validade', item.cliente || '', item.hash].join(';'));
    });
    const blob = new Blob([linhas.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'licencas-ebooks-studio.csv';
    document.body.append(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function init() {
    $('#btn-gerar').addEventListener('click', gerar);
    $('#btn-limpar').addEventListener('click', () => {
      lote = [];
      render();
      $('#snippet').value = '';
    });
    $('#btn-copiar-codigos').addEventListener('click', () => {
      copiar(lote.map((i) => i.codigo).join('\n'), 'Códigos copiados');
    });
    $('#btn-copiar-snippet').addEventListener('click', () => {
      copiar($('#snippet').value, 'Bloco copiado — cole em assets/js/licencas.js');
    });
    $('#btn-copiar-registros').addEventListener('click', () => {
      const registros = lote
        .map((item) => "  { h: '" + item.hash + "', p: '" + item.plano + "', e: " + (item.expira ? "'" + item.expira + "'" : 'null') + ' }')
        .join(',\n');
      copiar(registros, 'Registros copiados');
    });
    $('#btn-baixar-csv').addEventListener('click', baixarCSV);

    const ano = $('#year');
    if (ano) ano.textContent = new Date().getFullYear();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
