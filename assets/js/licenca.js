/* ==========================================================================
   E-books Studio — licenca.js
   Controle de planos e códigos de acesso (licenças).

   Como funciona (site 100% estático, sem servidor):
   - O código de acesso é entregue ao comprador após o pagamento.
   - Aqui guardamos apenas o SHA-256 do código, nunca o código em si.
   - Um código só vale se o hash estiver listado em licencas.js.
   - O plano e a validade ficam salvos no navegador do cliente.
   ========================================================================== */
(function () {
  'use strict';

  const CHAVE = 'ebs_licenca_v1';

  /* ------------------------------------------------------------- planos --- */
  const PLANOS = {
    essencial: {
      id: 'essencial',
      nome: 'Essencial',
      precoMensal: 0,
      precoAnual: 0,
      projetos: 1,
      ia: false,
      exportHTML: false,
      semMarcaDagua: false,
      temasPremium: false,
      capasPremium: false,
      modelosPremium: false,
      equipe: false,
      resumo: 'Para o primeiro e-book, sem custo.'
    },
    profissional: {
      id: 'profissional',
      nome: 'Profissional',
      precoMensal: 39,
      precoAnual: 31,
      projetos: Infinity,
      ia: true,
      exportHTML: true,
      semMarcaDagua: true,
      temasPremium: true,
      capasPremium: true,
      modelosPremium: true,
      equipe: false,
      resumo: 'Projetos ilimitados, IA e exportação sem marca d’água.'
    },
    studio: {
      id: 'studio',
      nome: 'Studio',
      precoMensal: 79,
      precoAnual: 63,
      projetos: Infinity,
      ia: true,
      exportHTML: true,
      semMarcaDagua: true,
      temasPremium: true,
      capasPremium: true,
      modelosPremium: true,
      equipe: true,
      resumo: 'Tudo do Profissional para até 5 pessoas.'
    }
  };

  /* ---------------------------------------------------------------- SHA-256 */
  const K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];

  const rotr = (x, n) => (x >>> n) | (x << (32 - n));

  function utf8Bytes(str) {
    const out = [];
    for (let i = 0; i < str.length; i++) {
      let c = str.charCodeAt(i);
      if (c < 0x80) {
        out.push(c);
      } else if (c < 0x800) {
        out.push(0xc0 | (c >> 6), 0x80 | (c & 63));
      } else if (c >= 0xd800 && c <= 0xdbff && i + 1 < str.length) {
        const low = str.charCodeAt(++i);
        c = 0x10000 + ((c - 0xd800) << 10) + (low - 0xdc00);
        out.push(0xf0 | (c >> 18), 0x80 | ((c >> 12) & 63), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
      } else {
        out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
      }
    }
    return out;
  }

  function sha256Hex(texto) {
    const bytes = utf8Bytes(String(texto));
    const bitLen = bytes.length * 8;
    bytes.push(0x80);
    while (bytes.length % 64 !== 56) bytes.push(0);
    bytes.push(0, 0, 0, 0);
    bytes.push((bitLen >>> 24) & 255, (bitLen >>> 16) & 255, (bitLen >>> 8) & 255, bitLen & 255);

    let H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
    const w = new Array(64);

    for (let i = 0; i < bytes.length; i += 64) {
      for (let t = 0; t < 16; t++) {
        w[t] = ((bytes[i + t * 4] << 24) | (bytes[i + t * 4 + 1] << 16) | (bytes[i + t * 4 + 2] << 8) | bytes[i + t * 4 + 3]) | 0;
      }
      for (let t = 16; t < 64; t++) {
        const s0 = rotr(w[t - 15], 7) ^ rotr(w[t - 15], 18) ^ (w[t - 15] >>> 3);
        const s1 = rotr(w[t - 2], 17) ^ rotr(w[t - 2], 19) ^ (w[t - 2] >>> 10);
        w[t] = (w[t - 16] + s0 + w[t - 7] + s1) | 0;
      }

      let a = H[0], b = H[1], c = H[2], d = H[3], e = H[4], f = H[5], g = H[6], hh = H[7];
      for (let t = 0; t < 64; t++) {
        const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
        const ch = (e & f) ^ (~e & g);
        const t1 = (hh + S1 + ch + K[t] + w[t]) | 0;
        const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
        const maj = (a & b) ^ (a & c) ^ (b & c);
        const t2 = (S0 + maj) | 0;
        hh = g; g = f; f = e; e = (d + t1) | 0;
        d = c; c = b; b = a; a = (t1 + t2) | 0;
      }
      H = [(H[0] + a) | 0, (H[1] + b) | 0, (H[2] + c) | 0, (H[3] + d) | 0,
           (H[4] + e) | 0, (H[5] + f) | 0, (H[6] + g) | 0, (H[7] + hh) | 0];
    }

    return H.map((x) => (x >>> 0).toString(16).padStart(8, '0')).join('');
  }

  /* -------------------------------------------------------------- códigos */
  // Remove hífens/espaços e padroniza em maiúsculas: "ebs-pro-..." -> "EBSPRO..."
  const normalizar = (codigo) => String(codigo || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

  // Exibição amigável: EBS-PRO-A7K2-9M4Q-XT3B
  function formatarCodigo(codigo) {
    const limpo = normalizar(codigo);
    if (!limpo) return '';
    const partes = limpo.match(/^EBS(PRO|STU)([A-Z0-9]{12})$/);
    if (partes) {
      return 'EBS-' + partes[1] + '-' + partes[2].match(/.{4}/g).join('-');
    }
    return limpo.match(/.{1,4}/g).join('-');
  }

  const registros = () => (Array.isArray(window.EBOOKS_LICENCAS) ? window.EBOOKS_LICENCAS : []);

  function fimDoDia(iso) {
    if (!iso) return null;
    const data = new Date(String(iso) + 'T23:59:59');
    return isNaN(data.getTime()) ? null : data;
  }

  function expirada(iso) {
    const data = fimDoDia(iso);
    return data ? data.getTime() < Date.now() : false;
  }

  /* ------------------------------------------------------------- armazenamento */
  function ler() {
    try {
      const raw = localStorage.getItem(CHAVE);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function gravar(registro) {
    try {
      localStorage.setItem(CHAVE, JSON.stringify(registro));
      return true;
    } catch (e) {
      console.warn('Não foi possível salvar a licença neste navegador.', e);
      return false;
    }
  }

  function avisar() {
    document.dispatchEvent(new CustomEvent('ebs:licenca', { detail: { plano: planoAtual() } }));
  }

  /* ------------------------------------------------------------------- API */
  function getAtiva() {
    const registro = ler();
    if (!registro || !registro.plano || !PLANOS[registro.plano]) return null;
    if (expirada(registro.expira)) return null;
    return registro;
  }

  function planoAtual() {
    const registro = getAtiva();
    return registro ? registro.plano : 'essencial';
  }

  function limites() {
    return PLANOS[planoAtual()] || PLANOS.essencial;
  }

  function pode(recurso) {
    const lim = limites();
    switch (recurso) {
      case 'ia': return !!lim.ia;
      case 'html': return !!lim.exportHTML;
      case 'semMarca': return !!lim.semMarcaDagua;
      case 'temas': return !!lim.temasPremium;
      case 'capas': return !!lim.capasPremium;
      case 'modelos': return !!lim.modelosPremium;
      case 'equipe': return !!lim.equipe;
      case 'projetos': return lim.projetos;
      default: return true;
    }
  }

  function podeCriarProjeto(quantosJaSalvos) {
    const lim = limites();
    return !isFinite(lim.projetos) || quantosJaSalvos < lim.projetos;
  }

  function ativar(codigo) {
    const limpo = normalizar(codigo);
    if (limpo.length < 10) {
      return { ok: false, erro: 'Código incompleto. Copie exatamente como recebeu no e-mail.' };
    }

    const hash = sha256Hex(limpo);
    const item = registros().find((r) => r && String(r.h).toLowerCase() === hash);

    if (!item) {
      return { ok: false, erro: 'Código não reconhecido. Confira os caracteres ou fale com o suporte.' };
    }
    if (expirada(item.e)) {
      return { ok: false, erro: 'Este código venceu em ' + new Date(String(item.e) + 'T12:00:00').toLocaleDateString('pt-BR') + '.' };
    }

    const registro = {
      hash: hash,
      codigo: formatarCodigo(limpo),
      plano: item.p,
      expira: item.e || null,
      ativadoEm: new Date().toISOString()
    };

    if (!gravar(registro)) {
      return { ok: false, erro: 'O navegador está bloqueando o armazenamento local. Desative o modo privado e tente de novo.' };
    }

    avisar();
    return { ok: true, plano: item.p, expira: item.e || null, nome: PLANOS[item.p] ? PLANOS[item.p].nome : item.p };
  }

  function remover() {
    try { localStorage.removeItem(CHAVE); } catch (e) { /* ignore */ }
    avisar();
  }

  // Deixa o plano disponível para o CSS: <html data-plano="essencial">
  function aplicarAoTema() {
    document.documentElement.dataset.plano = planoAtual();
  }

  window.EbooksLicenca = {
    PLANOS: PLANOS,
    sha256Hex: sha256Hex,
    normalizar: normalizar,
    formatarCodigo: formatarCodigo,
    getAtiva: getAtiva,
    planoAtual: planoAtual,
    limites: limites,
    pode: pode,
    podeCriarProjeto: podeCriarProjeto,
    ativar: ativar,
    remover: remover,
    aplicarAoTema: aplicarAoTema
  };

  aplicarAoTema();
})();
