/* ==========================================================================
   E-books Studio — main.js
   Interações da página institucional
   ========================================================================== */
(function () {
  'use strict';

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------------- Navbar */
  const nav = $('#topbar');
  const menu = $('#mobile-menu');
  const toggle = $('#nav-toggle');

  const onScroll = () => {
    if (nav) nav.classList.toggle('is-stuck', window.scrollY > 12);
    updateActiveLink();
  };
  window.addEventListener('scroll', onScroll, { passive: true });

  function closeMenu() {
    if (!menu || !toggle) return;
    menu.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Abrir menu');
  }

  if (toggle && menu) {
    toggle.addEventListener('click', () => {
      const open = menu.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    });
    $$('a', menu).forEach((a) => a.addEventListener('click', closeMenu));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeMenu();
    });
    window.addEventListener('resize', () => {
      if (window.innerWidth > 880) closeMenu();
    });
  }

  /* ------------------------------------------------------- Link ativo no menu */
  const navLinks = $$('.nav__links a');
  const sections = navLinks
    .map((a) => {
      const id = a.getAttribute('href');
      return id && id.startsWith('#') ? document.getElementById(id.slice(1)) : null;
    })
    .filter(Boolean);

  function updateActiveLink() {
    if (!sections.length) return;
    const offset = window.scrollY + 140;
    let current = sections[0].id;
    sections.forEach((sec) => {
      if (sec.offsetTop <= offset) current = sec.id;
    });
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 8) {
      current = sections[sections.length - 1].id;
    }
    navLinks.forEach((a) => {
      a.classList.toggle('is-active', a.getAttribute('href') === '#' + current);
    });
  }

  onScroll();

  /* ---------------------------------------------------------- Reveal on scroll */
  const revealEls = $$('[data-reveal]');
  if (prefersReduced || !('IntersectionObserver' in window)) {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  } else {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    revealEls.forEach((el) => revealObserver.observe(el));
  }

  /* ------------------------------------------------------------ Contadores */
  const counters = $$('[data-count]');
  const fmt = new Intl.NumberFormat('pt-BR');

  function animateCounter(el) {
    const target = Number(el.dataset.count) || 0;
    const prefix = el.dataset.prefix || '';
    const suffix = el.dataset.suffix || '';
    if (prefersReduced) {
      el.textContent = prefix + fmt.format(target) + suffix;
      return;
    }
    const duration = 1400;
    const start = performance.now();
    const step = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = prefix + fmt.format(Math.round(target * eased)) + suffix;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  if (counters.length) {
    if (!('IntersectionObserver' in window)) {
      counters.forEach(animateCounter);
    } else {
      const counterObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              animateCounter(entry.target);
              counterObserver.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.6 }
      );
      counters.forEach((el) => counterObserver.observe(el));
    }
  }

  /* --------------------------------------------------------- Planos (toggle) */
  const billingButtons = $$('[data-billing]');
  billingButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      billingButtons.forEach((b) => b.classList.toggle('is-active', b === btn));
      const yearly = btn.dataset.billing === 'anual';
      $$('.plan__price .val').forEach((val) => {
        const next = Number(val.dataset[yearly ? 'yearly' : 'monthly'] || 0);
        val.style.transform = 'translateY(-6px)';
        val.style.opacity = '0';
        setTimeout(() => {
          val.textContent = String(next);
          val.style.transition = 'transform .25s ease, opacity .25s ease';
          val.style.transform = 'none';
          val.style.opacity = '1';
        }, 140);
      });
      $$('.plan__note').forEach((note, i) => {
        if (i === 0) return;
        note.textContent = yearly
          ? (i === 1 ? 'Projetos ilimitados, IA inclusa · cobrado anualmente' : 'Até 5 pessoas · cobrado anualmente')
          : (i === 1 ? 'Projetos ilimitados e IA inclusa.' : 'Até 5 pessoas no mesmo espaço.');
      });
    });
  });

  /* ------------------------------------------------------- FAQ (um por vez) */
  const faqItems = $$('.faq__item');
  faqItems.forEach((item) => {
    item.addEventListener('toggle', () => {
      if (!item.open) return;
      faqItems.forEach((other) => {
        if (other !== item) other.open = false;
      });
    });
  });

  /* ------------------------------------------------------------ Newsletter */
  const form = $('#news-form');
  const msg = $('#news-msg');
  if (form && msg) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = ($('#news-email') || {}).value || '';
      const valid = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email.trim());
      msg.classList.toggle('is-error', !valid);
      if (!valid) {
        msg.textContent = 'Digite um e-mail válido para receber o conteúdo.';
        return;
      }
      const saved = JSON.parse(localStorage.getItem('ebs_newsletter') || '[]');
      if (!saved.includes(email.trim().toLowerCase())) saved.push(email.trim().toLowerCase());
      localStorage.setItem('ebs_newsletter', JSON.stringify(saved));
      msg.textContent = 'Pronto! Você está na lista — o próximo e-mail sai na quinta.';
      form.reset();
    });
  }

  /* ------------------------------------------------------------ Ano no rodapé */
  const year = $('#year');
  if (year) year.textContent = String(new Date().getFullYear());

  /* ------------------------------------------------------------- Blog modal */
  const posts = [
    {
      meta: 'Escrita · 6 min de leitura',
      title: 'Como estruturar um e-book que as pessoas terminam de ler',
      body: [
        'A maioria dos e-books não é abandonada porque o assunto é ruim, mas porque a estrutura cobra esforço de quem lê. Um material bem arquitetado conduz a pessoa por uma linha de raciocínio única, com começo, virada e aplicação prática.',
        ['Comece pela promessa, não pelo capítulo 1', 'Antes de escrever, defina em uma frase o que a pessoa será capaz de fazer ao terminar. Cada capítulo precisa aproximá-la dessa frase. Se um capítulo não muda nada nessa jornada, ele provavelmente é outro e-book.'],
        ['Capítulos curtos, blocos de 5 a 7 minutos', 'Um capítulo de e-book é lido em uma sessão curta: no transporte, entre duas reuniões. Trabalhe com 700 a 1.200 palavras, subtítulos a cada três parágrafos e um fechamento com a ação da vez.'],
        ['Repita o padrão até virar respiro', 'Contexto, conceito, exemplo, aplicação. Quando o leitor reconhece o ritmo, ele para de se esforçar para entender a forma e passa a absorver o conteúdo. É a diagramação e a estrutura trabalhando a favor da mensagem.'],
        ['Um fechamento que devolve o controle', 'Termine com um checklist, um roteiro de 7 dias ou um convite claro para o próximo passo. Um e-book bom não termina no ponto final: termina com o leitor sabendo exatamente o que fazer agora.'
        ]
      ]
    },
    {
      meta: 'Inteligência artificial · 8 min de leitura',
      title: 'IA escrevendo com a sua voz: 5 ajustes de prompt',
      body: [
        'A diferença entre um texto que parece ter saído de uma máquina e um texto com a sua voz está menos na IA e mais no briefing que você entrega a ela. Cinco ajustes resolvem 90% dos casos.',
        ['1. Descreva o público em uma linha concreta', '“Empreendedores” não diz nada. “Donas de clínica de estética que já têm agenda cheia e querem subir o ticket” muda o vocabulário, os exemplos e o nível de explicação.'],
        ['2. Dê o tom com três referências', 'Em vez de pedir “linguagem informal”, diga: “como uma conversa entre colegas de trabalho, frases curtas, sem jargão de marketing”. Referências concretas funcionam melhor que adjetivos.'],
        ['3. Imponha a estrutura do capítulo', 'Peça: um parágrafo de abertura com uma cena, dois subtítulos, um exemplo brasileiro e um fechamento com ação. A IA fica muito mais útil quando não precisa adivinhar a forma.'],
        ['4. Peça o rascunho, nunca a versão final', 'Trate a primeira resposta como matéria-prima. Leia em voz alta, corte o que não é seu e reescreva as três primeiras frases — é ali que a voz pessoal se instala.'],
        ['5. Guarde o que funcionou', 'Salve os prompts que geraram bons textos no seu projeto. Com o tempo, você constrói um estilo próprio reutilizável — e a IA passa a soar cada vez mais com você.']
      ]
    },
    {
      meta: 'Conversão · 5 min de leitura',
      title: 'Isca digital ou produto: onde cada e-book se encaixa',
      body: [
        'Todo e-book tem um papel na jornada de compra. Definir esse papel antes da capa evita meses de trabalho no formato errado.',
        ['Isca digital: o objetivo é a troca', 'Materiais de 15 a 30 páginas, um problema específico e uma solução aplicável em uma tarde. A capa precisa comunicar rapidez e clareza; o CTA final conduz para a sua oferta principal.'],
        ['Produto de entrada: o objetivo é a primeira compra', 'Entre R$ 27 e R$ 97, com mais profundidade e provas de resultado. Aqui a diagramação já precisa parecer premium — é o primeiro contato do cliente com a qualidade da sua entrega.'],
        ['Material de autoridade: o objetivo é a indicação', 'Guias densos, com método próprio, que viram referência e são compartilhados. Costumam ser distribuídos para clientes e parceiros, e sustentam palestras e propostas comerciais.'],
        ['O erro comum', 'Tentar fazer um único arquivo servir para tudo. Um material que vende e um material que capta leads têm tamanhos, provas e chamadas diferentes — e o leitor percebe a diferença na primeira página.']
      ]
    }
  ];

  const dialog = $('#post-dialog');
  if (dialog && typeof dialog.showModal === 'function') {
    const titleEl = $('#post-title');
    const metaEl = $('#post-meta');
    const bodyEl = $('#post-body');

    const renderBody = (blocks) => {
      bodyEl.innerHTML = '';
      blocks.forEach((block) => {
        if (Array.isArray(block)) {
          const h = document.createElement('h3');
          h.textContent = block[0];
          const p = document.createElement('p');
          p.textContent = block[1];
          bodyEl.append(h, p);
        } else {
          const p = document.createElement('p');
          p.textContent = block;
          bodyEl.append(p);
        }
      });
    };

    $$('.post').forEach((card) => {
      card.addEventListener('click', () => {
        const post = posts[Number(card.dataset.post)] || posts[0];
        titleEl.textContent = post.title;
        metaEl.textContent = post.meta;
        renderBody(post.body);
        dialog.showModal();
        dialog.scrollTop = 0;
      });
    });

    $$('[data-close]', dialog).forEach((btn) => btn.addEventListener('click', () => dialog.close()));
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) dialog.close();
    });
  }
})();
