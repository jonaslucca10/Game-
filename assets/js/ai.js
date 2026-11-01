/* ==========================================================================
   E-books Studio — ai.js
   Assistente de escrita: geração local (sem chave) e opcional em nuvem.
   ========================================================================== */
(function () {
  'use strict';

  const TONES = {
    pratico: {
      label: 'Prático e direto',
      intro: [
        'Vamos direto ao ponto: o que separa um e-book bom de mais um arquivo esquecido é a clareza com que ele resolve um problema específico.',
        'Nada de teoria sem aplicação. Cada ideia deste capítulo termina em uma ação pequena, que cabe na sua semana.',
        'Aqui você encontra o essencial sobre {topic}, sem enrolação e sem promessa milagrosa.'
      ],
      closing: 'Reserve vinte minutos hoje e execute apenas o primeiro passo. O restante fica muito mais fácil depois disso.'
    },
    didatico: {
      label: 'Didático e acolhedor',
      intro: [
        'Se este é o seu primeiro contato com {topic}, respire: vamos construir o entendimento em blocos pequenos, do começo.',
        'Antes de avançar, vale combinar uma coisa: você não precisa saber tudo para começar. Precisa apenas do próximo passo.',
        'Ao longo das próximas páginas, cada conceito vem acompanhado de um exemplo, para que você reconheça a ideia na sua própria rotina.'
      ],
      closing: 'Releia este capítulo com um caderno ao lado e anote as três ideias que mais se aplicam ao seu momento.'
    },
    profissional: {
      label: 'Profissional e sóbrio',
      intro: [
        'Gerir {topic} exige método, indicadores e constância. Este capítulo organiza os elementos que sustentam essa prática.',
        'Do ponto de vista estratégico, {topic} deixa de ser iniciativa isolada e passa a integrar a operação.',
        'A análise a seguir foi estruturada para quem precisa justificar decisões com critérios objetivos.'
      ],
      closing: 'Formalize o que foi decidido: registre responsáveis, prazos e indicadores antes do próximo ciclo.'
    },
    inspirador: {
      label: 'Inspirador',
      intro: [
        'Toda transformação relevante começa com uma decisão silenciosa: a de tratar {topic} com a seriedade que ele merece.',
        'Existe um momento em que o conhecimento para de ser curiosidade e vira responsabilidade. Este capítulo é sobre esse momento.',
        'Você já tem o que precisa para começar. O que falta é permissão para dar o primeiro passo — e ela vem de você.'
      ],
      closing: 'Escolha uma pessoa para compartilhar o que aprendeu aqui. Ensinar é a forma mais rápida de consolidar.'
    },
    provocativo: {
      label: 'Provocativo / sem rodeios',
      intro: [
        'Vamos combinar: a maior parte do que se fala sobre {topic} é repetição de lugar-comum. Este capítulo foi escrito para incomodar.',
        'Se o seu resultado com {topic} não mudou nos últimos seis meses, o problema não é falta de informação. É falta de decisão.',
        'Pare de procurar a ferramenta perfeita. O gargalo quase nunca está onde você imagina.'
      ],
      closing: 'Se este capítulo não mudou nenhuma das suas próximas 48 horas, releia. Algo passou batido.'
    }
  };

  const CHAPTER_PATTERNS = [
    { title: 'Por que {topic} importa mais do que parece', kicker: 'Fundamentos' },
    { title: 'Diagnóstico honesto: onde você está hoje', kicker: 'Diagnóstico' },
    { title: '{topicTitle}: o que realmente importa', kicker: 'Visão geral' },
    { title: 'O método em quatro passos', kicker: 'Método' },
    { title: 'Os erros que mais travam {audience}', kicker: 'Armadilhas' },
    { title: 'Ferramentas, rotinas e o que descartar', kicker: 'Ferramentas' },
    { title: 'Como medir o que realmente importa', kicker: 'Métricas' },
    { title: 'Escalar sem perder qualidade', kicker: 'Escala' },
    { title: 'Um plano de 30 dias para começar hoje', kicker: 'Plano de ação' },
    { title: 'O que fazer quando os resultados demoram', kicker: 'Constância' },
    { title: 'Conclusão: o próximo passo é seu', kicker: 'Fechamento' }
  ];

  const H3 = ['O ponto de partida', 'O que funciona na prática', 'Um exemplo concreto', 'O erro mais comum', 'Como aplicar nesta semana', 'O que ninguém conta'];
  const CALLOUT_LABEL = ['Na prática', 'Dica do estúdio', 'Atenção', 'Checklist rápido'];
  const QUOTES = [
    'Clareza vence talento quando o assunto é execução.',
    'Quem escreve para todo mundo não é lido por ninguém.',
    'O primeiro rascunho existe para ser melhorado — não para ser admirado.',
    'Resultado é consequência de repetição bem feita.'
  ];

  /* ----------------------------------------------------------- utilitários */
  function hash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const clean = (s) => String(s || '').replace(/\s+/g, ' ').trim();
  const lowerFirst = (s) => (s ? s.charAt(0).toLowerCase() + s.slice(1) : s);
  const upperFirst = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
  const trimPeriod = (s) => clean(s).replace(/[.!?]+$/, '');

  function topicLabel(topic) {
    const t = trimPeriod(topic);
    return t || 'seu tema';
  }

  function audienceLabel(audience) {
    const a = lowerFirst(trimPeriod(audience));
    return a || 'quem está começando agora';
  }

  function fill(template, ctx) {
    return template
      .replace(/\{topicTitle\}/g, ctx.topicTitle)
      .replace(/\{topic\}/g, ctx.topic)
      .replace(/\{audience\}/g, ctx.audience)
      .replace(/\{audienceShort\}/g, ctx.audienceShort)
      .replace(/\{benefit\}/g, ctx.benefit);
  }

  function makeContext(opts) {
    const topic = topicLabel(opts.topic);
    const audience = audienceLabel(opts.audience);
    const isHow = /^como\s+/i.test(topic);
    const phrase = isHow ? 'o processo de ' + lowerFirst(topic.replace(/^como\s+/i, '')) : lowerFirst(topic);
    return {
      topic: phrase,
      topicTitle: upperFirst(topic),
      audience,
      audienceShort: audience.split(/ (?:que|com|de) /)[0] || audience,
      benefit: opts.benefit || 'resultados consistentes',
      tone: TONES[opts.tone] ? opts.tone : 'pratico'
    };
  }

  /* ------------------------------------------------------------- sumário */
  function buildOutline(opts) {
    const ctx = makeContext(opts);
    const total = Math.max(3, Math.min(10, Number(opts.chapters) || 5));
    const patterns = CHAPTER_PATTERNS.slice();
    const items = [{ title: 'Introdução: por que este e-book existe', kicker: 'Abertura' }];

    for (let i = 0; i < total - 2; i++) {
      const p = patterns[i % patterns.length];
      items.push({ title: upperFirst(fill(p.title, ctx)), kicker: p.kicker });
    }
    items.push({ title: 'Encerramento: o próximo passo é seu', kicker: 'Fechamento' });
    return items;
  }

  /* ------------------------------------------------------------ capítulo */
  function buildChapter(opts, chapterTitle, index, total) {
    const ctx = makeContext(opts);
    const rand = rng(hash(ctx.topic + '|' + chapterTitle + '|' + index));
    const pick = (arr) => arr[Math.floor(rand() * arr.length)];
    const tone = TONES[ctx.tone];
    const audience = ctx.audience;
    const topic = ctx.topic;
    const isIntro = index === 0;
    const isLast = index === total - 1;

    const blocks = [];
    const introA = fill(pick(tone.intro), ctx);
    const introB = isIntro
      ? `Ao final deste material, ${audience} deverão conseguir aplicar ${topic} com um plano simples, revisável e mensurável.`
      : `Este capítulo trata de ${lowerFirst(clean(chapterTitle)).replace(/:.*$/, '')} — um dos pontos em que ${audience} mais perdem tempo por falta de método.`;
    blocks.push({ type: 'p', text: introA });
    blocks.push({ type: 'p', text: introB });

    blocks.push({ type: 'h3', text: pick(H3) });
    blocks.push({
      type: 'p',
      text: `Quando o assunto é ${topic}, o primeiro ajuste é de expectativa. Não existe atalho que substitua constância, mas existe ordem — e ordem economiza meses. Comece pequeno, meça o que dá para medir e só então amplie o escopo.`
    });

    const lists = [
      [
        `Defina em uma frase o resultado que ${audience} devem alcançar com ${topic}.`,
        'Liste os três entraves que hoje consomem mais energia do que deveriam.',
        'Escolha uma única ação para as próximas 48 horas.',
        'Marque uma revisão semanal de 15 minutos para ajustar o rumo.'
      ],
      [
        `Escreva o problema que ${topic} resolve, do ponto de vista de quem lê.`,
        'Separe o que é essencial do que é apenas desejável.',
        'Estabeleça um indicador simples — de preferência, um número.',
        'Documente o processo para não depender da memória.'
      ],
      [
        'Comece pelo que já existe: aproveite o que está funcionando.',
        'Elimine uma etapa antes de adicionar duas.',
        'Teste em pequena escala por duas semanas.',
        'Só depois transforme o teste em rotina oficial.'
      ]
    ];
    blocks.push({ type: 'list', text: pick(lists).join('\n') });

    blocks.push({ type: 'h3', text: pick(H3.slice(1)) });
    blocks.push({
      type: 'p',
      text: `Na prática, ${audience} costumam travar no mesmo ponto: tentar resolver tudo de uma vez. Um caminho mais sustentável é tratar ${topic} como um sistema com três partes — entrada de informação, decisão e execução. Quando uma delas falha, o resultado trava, mesmo que o esforço continue alto.`
    });
    blocks.push({
      type: 'callout',
      text: pick(CALLOUT_LABEL) + '\n' + `Reserve 20 minutos para responder: qual é a única decisão que, se tomada hoje, deixa ${topic} mais simples na próxima semana? Anote a resposta e cumpra antes de abrir qualquer outra frente.`
    });

    if (index % 2 === 0) {
      blocks.push({ type: 'quote', text: pick(QUOTES) });
    }

    blocks.push({
      type: 'p',
      text: isLast
        ? tone.closing
        : `Feche este capítulo com uma ação concreta. ${upperFirst(audience)} que apenas consomem conteúdo acumulam informação; quem executa acumula resultado.`
    });

    if (isIntro) {
      blocks.unshift({ type: 'p', text: `Este e-book foi escrito para ${audience}. A linguagem é direta, os exemplos são próximos da rotina real e cada capítulo termina com algo que você pode aplicar imediatamente.` });
    }

    return blocks;
  }

  /* --------------------------------------------------------- e-book inteiro */
  function buildBook(opts) {
    const ctx = makeContext(opts);
    const outline = buildOutline(opts);
    const pages = outline.map((item, index) => ({
      type: 'chapter',
      title: item.title,
      kicker: item.kicker,
      blocks: buildChapter(opts, item.title, index, outline.length)
    }));

    return {
      title: ctx.topicTitle,
      subtitle: opts.subtitle || `Um guia prático de ${ctx.topic} para ${ctx.audience}`,
      author: opts.author || 'E-books Studio',
      pages
    };
  }

  /* ------------------------------------------------------------- nuvem */
  async function buildWithCloud(opts, onStep) {
    const key = opts.apiKey;
    const model = opts.model || 'gpt-4o-mini';
    const outline = buildOutline(opts);
    const prompt = [
      'Você é um ghostwriter sênior de e-books em português do Brasil.',
      `Tema: ${opts.topic}`,
      `Público: ${opts.audience || 'leigos motivados'}`,
      `Tom de voz: ${TOENS_LABEL(opts.tone)}`,
      'Estrutura de capítulos (mantenha os títulos):',
      outline.map((o, i) => `${i + 1}. ${o.title}`).join('\n'),
      '',
      'Para cada capítulo, escreva de 4 a 6 blocos. Responda SOMENTE com JSON válido no formato:',
      '{"chapters":[{"title":"...","blocks":[{"type":"p|h3|list|quote|callout","text":"..."}]}]}',
      'Em blocos do tipo list, separe os itens com \\n. Textos com 2 a 4 frases, sem clichês, com exemplos concretos.'
    ].join('\n');

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + key
      },
      body: JSON.stringify({
        model,
        temperature: 0.8,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: 'Você escreve e-books claros, úteis e bem estruturados. Responda apenas com JSON.' },
          { role: 'user', content: prompt }
        ]
      })
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      throw new Error('Falha na API (' + res.status + '). ' + detail.slice(0, 160));
    }

    const data = await res.json();
    const raw = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
    if (!raw) throw new Error('Resposta vazia da API.');
    const parsed = JSON.parse(raw);
    if (!parsed.chapters || !Array.isArray(parsed.chapters)) throw new Error('Formato inesperado na resposta.');

    if (onStep) onStep('Texto recebido da nuvem.');
    return {
      title: upperFirst(topicLabel(opts.topic)),
      subtitle: opts.subtitle || `Um guia prático de ${lowerFirst(topicLabel(opts.topic))} para ${audienceLabel(opts.audience)}`,
      author: opts.author || 'E-books Studio',
      pages: parsed.chapters.map((ch, i) => ({
        type: 'chapter',
        title: ch.title || outline[i]?.title || 'Capítulo ' + (i + 1),
        kicker: outline[i]?.kicker || 'Capítulo',
        blocks: (ch.blocks || []).map((b) => ({
          type: ['p', 'h3', 'list', 'quote', 'callout'].includes(b.type) ? b.type : 'p',
          text: String(b.text || '')
        })).filter((b) => b.text.trim())
      }))
    };
  }

  function TOENS_LABEL(tone) {
    return (TONES[tone] || TONES.pratico).label;
  }

  window.EbooksAI = {
    tones: TONES,
    buildOutline,
    buildChapter,
    buildBook,
    buildWithCloud,
    toneLabel: TOENS_LABEL
  };
})();
