/* ==========================================================================
   E-books Studio — estudio.js
   Editor de e-books: estado, renderização, edição, IA e exportação.
   ========================================================================== */
(function () {
  'use strict';

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const uid = () => 'pg_' + Math.random().toString(36).slice(2, 9);
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  const STORE_KEY = 'ebs_projects_v2';
  const ACTIVE_KEY = 'ebs_active_v2';
  const AI_KEY = 'ebs_ai_v2';

  /* ------------------------------------------------------------- constantes */
  const THEMES = [
    { id: 'nebulosa', name: 'Nebulosa', bg: 'radial-gradient(ellipse at 75% 0%, #3a1e6e, #140c25 55%, #08060f)', fg: '#f3eefe', accent: '#b98cff', dark: true },
    { id: 'aurora', name: 'Aurora', bg: 'linear-gradient(160deg, #ffffff, #f4ecff)', fg: '#1a1428', accent: '#7c3aed', dark: false },
    { id: 'editorial', name: 'Editorial', bg: 'linear-gradient(180deg, #f8f2e7, #f1e8d8)', fg: '#241d2f', accent: '#7c3aed', dark: false },
    { id: 'minimal', name: 'Minimal', bg: '#ffffff', fg: '#14111d', accent: '#7c3aed', dark: false },
    { id: 'meianoite', name: 'Meia-noite', bg: 'linear-gradient(180deg, #12213a, #0a1424)', fg: '#eaf1fb', accent: '#7dd3fc', dark: true },
    { id: 'solar', name: 'Solar', bg: 'linear-gradient(160deg, #fff8ee, #ffe6d3)', fg: '#2b1a12', accent: '#c2410c', dark: false }
  ];

  const ACCENTS = ['#8b5cf6', '#a855f7', '#d946ef', '#0ea5e9', '#10b981', '#f59e0b'];
  const ART = [
    { id: 'none', name: 'Sem arte' },
    { id: 'ribbon', name: 'Fita', img: 'assets/img/cover-1.webp' },
    { id: 'orb', name: 'Círculo', img: 'assets/img/cover-2.webp' },
    { id: 'neon', name: 'Neon', img: 'assets/img/cover-3.webp' }
  ];
  const SIZES = {
    a4: { label: 'A4', mm: '210mm 297mm', base: 720, hint: 'A4 · 210 × 297 mm — ideal para leitura em tela e impressão.' },
    a5: { label: 'A5', mm: '148mm 210mm', base: 560, hint: 'A5 · 148 × 210 mm — formato de bolso, ótimo para leitores digitais.' },
    quadrado: { label: 'Quadrado', mm: '200mm 200mm', base: 640, hint: 'Quadrado · 200 × 200 mm — perfeito para redes sociais e carrosséis.' }
  };

  const TEMPLATES = [
    { id: 'guia', name: 'Do zero ao primeiro e-book', desc: 'Guia completo · 6 capítulos', icon: 'book',
      cfg: { title: 'Do zero ao seu primeiro e-book', subtitle: 'O caminho completo para escrever, diagramar e publicar com qualidade', topic: 'Como criar e publicar seu primeiro e-book profissional', audience: 'autores iniciantes', tone: 'didatico', chapters: 6, theme: 'nebulosa', accent: '#a879ff', font: 'sans', layout: 'moderno', size: 'a4', art: 'ribbon' } },
    { id: 'copy', name: 'Copywriting que converte', desc: 'Marketing · 6 capítulos', icon: 'pen',
      cfg: { title: 'Copywriting que converte', subtitle: 'Como escrever textos que vendem sem parecer que estão vendendo', topic: 'Copywriting aplicado a páginas de vendas e e-mails', audience: 'empreendedores digitais', tone: 'pratico', chapters: 6, theme: 'editorial', accent: '#d946ef', font: 'serif', layout: 'classico', size: 'a4', art: 'orb' } },
    { id: 'autoridade', name: 'Autoridade em 30 dias', desc: 'Marca pessoal · 5 capítulos', icon: 'star',
      cfg: { title: 'Autoridade em 30 dias', subtitle: 'Um plano para ser reconhecido pelo que você sabe', topic: 'Construção de autoridade profissional em 30 dias', audience: 'profissionais liberais', tone: 'inspirador', chapters: 5, theme: 'meianoite', accent: '#0ea5e9', font: 'display', layout: 'moderno', size: 'a4', art: 'neon' } },
    { id: 'financas', name: 'Finanças sem drama', desc: 'Finanças · 5 capítulos', icon: 'chart',
      cfg: { title: 'Finanças sem drama', subtitle: 'O básico que funciona para organizar a vida financeira', topic: 'Organização financeira pessoal para quem nunca fez um orçamento', audience: 'pessoas que estão começando a organizar as finanças', tone: 'didatico', chapters: 5, theme: 'aurora', accent: '#10b981', font: 'serif', layout: 'revista', size: 'a5', art: 'none' } },
    { id: 'ia', name: 'IA para negócios', desc: 'Tecnologia · 7 capítulos', icon: 'chip',
      cfg: { title: 'IA para negócios', subtitle: 'Do hype ao resultado: onde a inteligência artificial realmente ajuda', topic: 'Aplicações práticas de inteligência artificial em pequenos negócios', audience: 'gestores de pequenas empresas', tone: 'profissional', chapters: 7, theme: 'nebulosa', accent: '#8b5cf6', font: 'sans', layout: 'moderno', size: 'a4', art: 'neon' } },
    { id: 'metodo', name: 'Método produtivo', desc: 'Produtividade · 5 capítulos', icon: 'grid',
      cfg: { title: 'Método produtivo', subtitle: 'Rotinas simples que sustentam resultados de verdade', topic: 'Produtividade sustentável para rotinas sobrecarregadas', audience: 'profissionais com agenda cheia', tone: 'pratico', chapters: 5, theme: 'minimal', accent: '#f59e0b', font: 'sans', layout: 'classico', size: 'a4', art: 'none' } }
  ];

  /* ---------------------------------------------------------------- estado */
  const state = {
    project: null,
    selectedId: null,
    zoom: 1,
    manualZoom: false,
    ai: { key: '', model: 'gpt-4o-mini' },
    busy: false,
    saveTimer: null,
    metaTimer: null
  };

  /* ------------------------------------------------------------- utilidades */
  function h(tag, attrs, ...children) {
    const node = document.createElement(tag);
    if (attrs) {
      Object.entries(attrs).forEach(([k, v]) => {
        if (v === null || v === undefined || v === false) return;
        if (k === 'class') node.className = v;
        else if (k === 'text') node.textContent = v;
        else if (k === 'html') node.innerHTML = v;
        else if (k === 'style') node.style.cssText = v;
        else if (k.startsWith('data-') || k.startsWith('aria-') || k === 'role' || k === 'title' || k === 'contenteditable' || k === 'spellcheck') node.setAttribute(k, v);
        else node[k] = v;
      });
    }
    children.flat().forEach((child) => {
      if (child === null || child === undefined) return;
      node.append(child.nodeType ? child : document.createTextNode(String(child)));
    });
    return node;
  }

  function toast(message) {
    const el = $('#toast');
    $('#toast-text').textContent = message;
    el.classList.add('is-visible');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.remove('is-visible'), 2600);
  }

  function download(filename, content, type) {
    const blob = new Blob([content], { type: type || 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  const slug = (s) => (s || 'ebook')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50) || 'ebook';

  /* --------------------------------------------------------------- projeto */
  function coverPage() { return { id: uid(), type: 'cover', blocks: [] }; }
  function tocPage() { return { id: uid(), type: 'toc', title: 'Sumário', blocks: [] }; }
  function chapterPage(title, blocks) {
    return { id: uid(), type: 'chapter', title: title || 'Novo capítulo', blocks: blocks && blocks.length ? blocks : [{ type: 'p', text: '' }] };
  }

  function projectFromTemplate(tpl) {
    const cfg = tpl.cfg;
    const book = window.EbooksAI.buildBook({
      topic: cfg.topic,
      audience: cfg.audience,
      tone: cfg.tone,
      chapters: cfg.chapters,
      author: 'Seu nome'
    });
    return {
      id: uid(),
      name: cfg.title,
      title: cfg.title,
      subtitle: cfg.subtitle,
      author: 'Seu nome',
      mode: 'hibrido',
      theme: cfg.theme,
      accent: cfg.accent,
      font: cfg.font,
      layout: cfg.layout,
      size: cfg.size,
      art: cfg.art,
      pages: [coverPage(), tocPage(), ...book.pages.map((p) => chapterPage(p.title, p.blocks))],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
  }

  function blankProject() {
    return {
      id: uid(),
      name: 'Meu novo e-book',
      title: 'Meu novo e-book',
      subtitle: 'Uma chamada curta que explica o valor do seu material',
      author: 'Seu nome',
      mode: 'manual',
      theme: 'aurora',
      accent: '#8b5cf6',
      font: 'sans',
      layout: 'classico',
      size: 'a4',
      art: 'none',
      pages: [
        coverPage(),
        tocPage(),
        chapterPage('Introdução', [
          { type: 'p', text: 'Comece escrevendo aqui. Clique neste texto e substitua pelo conteúdo do seu primeiro capítulo.' },
          { type: 'p', text: 'Você pode escrever manualmente, pedir um rascunho para a IA ou misturar as duas coisas — o resultado continua sendo seu.' }
        ])
      ],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
  }

  /* --------------------------------------------------------------- storage */
  function readProjects() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  function writeProjects(list) {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(list));
    } catch (e) {
      console.warn('Não foi possível salvar os projetos.', e);
    }
  }

  function persist(showState) {
    if (!state.project) return;
    const status = $('#save-status');
    if (status && showState !== false) {
      status.classList.add('is-saving');
      status.querySelector('span').textContent = 'Salvando…';
    }
    clearTimeout(state.saveTimer);
    state.saveTimer = setTimeout(() => {
      state.project.updatedAt = Date.now();
      const list = readProjects();
      const idx = list.findIndex((p) => p.id === state.project.id);
      if (idx >= 0) list[idx] = state.project;
      else list.unshift(state.project);
      writeProjects(list);
      try { localStorage.setItem(ACTIVE_KEY, state.project.id); } catch (e) { /* ignore */ }
      if (status) {
        status.classList.remove('is-saving');
        status.querySelector('span').textContent = 'Salvo';
      }
    }, 450);
  }

  function setProject(project) {
    state.project = project;
    state.selectedId = (project.pages[0] && project.pages[0].id) || null;
    $('#project-name').value = project.name || project.title;
    persist(false);
    renderAll();
  }

  /* -------------------------------------------------------------- render UI */
  function chapters() {
    return state.project.pages.filter((p) => p.type === 'chapter');
  }

  function pageNumber(page) {
    return state.project.pages.indexOf(page) + 1;
  }

  function renderAll() {
    renderPages();
    renderSidebar();
    syncInspectorFields();
    syncDesignControls();
    applyPageSizeHint();
    updateFocusLabel();
  }

  function pageWrap(page, label) {
    const wrap = h('div', {
      class: 'page-wrap' + (page.id === state.selectedId ? ' is-active' : ''),
      'data-page': page.id
    });
    wrap.append(h('div', { class: 'page-label', html: '<i></i>' + label }));
    wrap.append(buildPage(page));
    wrap.addEventListener('click', () => selectPage(page.id));
    return wrap;
  }

  function pageNode(page, extraClass) {
    const p = h('div', {
      class: 'page ' + (extraClass || ''),
      'data-size': state.project.size,
      'data-theme': state.project.theme,
      'data-font': state.project.font,
      'data-layout': state.project.layout,
      style: '--pg-accent:' + state.project.accent + ';--pg-soft:' + state.project.accent + '1f;--pr:' + (state.project.size === 'quadrado' ? '1 / 1' : state.project.size === 'a5' ? '148 / 210' : '210 / 297')
    });
    return p;
  }

  function buildPage(page) {
    const project = state.project;
    const num = pageNumber(page);
    const total = project.pages.length;

    if (page.type === 'cover') {
      const node = pageNode(page, 'page--cover');
      node.dataset.art = project.art || 'none';
      const art = ART.find((a) => a.id === project.art);
      if (art && art.img) {
        node.append(h('div', { class: 'cover-art', style: 'background-image:url("' + art.img + '")' }));
      }
      const inner = h('div', { class: 'page__inner' });
      inner.append(
        h('div', { class: 'cover-top' },
          h('span', { class: 'cover-mark' }, h('img', { src: 'assets/img/logo-icon.png', alt: '' }), 'E-books Studio'),
          h('span', { text: String(new Date().getFullYear()) })
        ),
        h('div', { class: 'cover-main' },
          h('p', { class: 'cover-kicker', text: 'E-book' }),
          h('h1', { class: 'cover-title', contenteditable: 'plaintext-only', spellcheck: 'false', 'data-field': 'title', text: project.title }),
          h('p', { class: 'cover-sub', contenteditable: 'plaintext-only', spellcheck: 'false', 'data-field': 'subtitle', text: project.subtitle })
        ),
        h('div', { class: 'cover-foot' },
          h('div', {}, h('span', { text: 'por' }), h('strong', { contenteditable: 'plaintext-only', spellcheck: 'false', 'data-field': 'author', text: project.author })),
          h('span', { class: 'cover-year', text: String(new Date().getFullYear()) })
        )
      );
      node.append(inner);
      return node;
    }

    if (page.type === 'toc') {
      const node = pageNode(page, 'page--toc');
      const inner = h('div', { class: 'page__inner' });
      inner.append(
        h('div', { class: 'page__runhead' }, h('span', { text: project.title }), h('b', { text: 'Sumário' })),
        h('p', { class: 'toc-kicker', text: 'Índice' }),
        h('h2', { class: 'toc-title', text: 'Conteúdo' })
      );
      const list = h('div', { class: 'toc-list' });
      chapters().forEach((ch) => {
        const row = h('div', { class: 'toc-row', 'data-toc-for': ch.id },
          h('span', { class: 'toc-row__num', text: String(chapters().indexOf(ch) + 1).padStart(2, '0') }),
          h('span', { class: 'toc-row__title', text: ch.title }),
          h('span', { class: 'toc-row__dots' }),
          h('span', { class: 'toc-row__page', text: String(pageNumber(ch)) })
        );
        list.append(row);
      });
      inner.append(list);
      inner.append(h('div', { class: 'page__foot' }, h('span', { text: project.author }), h('span', { text: String(num) + ' / ' + String(total) })));
      node.append(inner);
      return node;
    }

    /* capítulo */
    const node = pageNode(page, 'page--chapter');
    const index = chapters().indexOf(page);
    const inner = h('div', { class: 'page__inner' });
    inner.append(
      h('div', { class: 'page__runhead' }, h('span', { text: project.title }), h('b', { text: 'E-books Studio' })),
      h('p', { class: 'chapter-num', text: 'Capítulo ' + (index + 1) }),
      h('h2', { class: 'chapter-title', contenteditable: 'plaintext-only', spellcheck: 'false', 'data-page-title': '1', text: page.title })
    );

    const body = h('div', { class: 'chapter-body' });
    (page.blocks || []).forEach((block, i) => {
      body.append(buildBlock(block, i));
    });
    inner.append(body);
    inner.append(h('div', { class: 'page__foot' }, h('span', { text: project.author }), h('span', { text: String(num) + ' / ' + String(total) })));
    node.append(inner);
    return node;
  }

  function buildBlock(block, index) {
    const row = h('div', { class: 'block-row', 'data-block-index': String(index) });
    let content;

    if (block.type === 'h3') {
      content = h('h3', { contenteditable: 'plaintext-only', spellcheck: 'false', 'data-block-text': '1', text: block.text });
    } else if (block.type === 'quote') {
      content = h('blockquote', { contenteditable: 'plaintext-only', spellcheck: 'false', 'data-block-text': '1', text: block.text });
    } else if (block.type === 'list') {
      content = h('ul', {});
      String(block.text || '').split('\n').filter((l) => l.trim()).forEach((line, li) => {
        content.append(h('li', { contenteditable: 'plaintext-only', spellcheck: 'false', 'data-block-text': '1', 'data-item': String(li), text: line }));
      });
      if (!content.children.length) {
        content.append(h('li', { contenteditable: 'plaintext-only', spellcheck: 'false', 'data-block-text': '1', 'data-item': '0', text: 'Novo item' }));
      }
    } else if (block.type === 'callout') {
      const parts = String(block.text || '').split('\n');
      const label = parts[0] || 'Na prática';
      const text = parts.slice(1).join('\n');
      content = h('div', { class: 'callout' },
        h('strong', { text: label }),
        h('span', { contenteditable: 'plaintext-only', spellcheck: 'false', 'data-block-text': '1', text: text })
      );
    } else {
      content = h('p', { contenteditable: 'plaintext-only', spellcheck: 'false', 'data-block-text': '1', text: block.text });
    }

    row.append(content);
    row.append(h('div', { class: 'block-tools no-print' },
      h('button', { type: 'button', 'data-block-act': 'up', 'aria-label': 'Mover bloco para cima', html: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m6 14 6-6 6 6"/></svg>' }),
      h('button', { type: 'button', 'data-block-act': 'down', 'aria-label': 'Mover bloco para baixo', html: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m6 10 6 6 6-6"/></svg>' }),
      h('button', { type: 'button', 'data-block-act': 'del', 'aria-label': 'Excluir bloco', html: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>' })
    ));
    return row;
  }

  function renderPages() {
    const host = $('#pages');
    const canvas = $('#canvas');
    const keepScroll = canvas ? canvas.scrollTop : 0;
    host.innerHTML = '';
    const chapterList = chapters();
    state.project.pages.forEach((page) => {
      let label = 'Página';
      if (page.type === 'cover') label = 'Capa';
      else if (page.type === 'toc') label = 'Sumário';
      else label = 'Capítulo ' + (chapterList.indexOf(page) + 1);
      host.append(pageWrap(page, label));
    });
    applyZoom();
    if (canvas) canvas.scrollTop = keepScroll;
    requestAnimationFrame(fitPages);
  }

  /* Ajusta o corpo do texto para caber na página (sem cortar conteúdo) */
  const FONT_BASE = { a4: 46, a5: 40, quadrado: 42 };

  function fitPages() {
    const base = FONT_BASE[state.project.size] || 46;
    $$('.page').forEach((page) => {
      if (page.classList.contains('page--cover')) return;
      const inner = page.querySelector('.page__inner');
      if (!inner) return;
      let factor = 1;
      const apply = (f) => {
        page.style.fontSize = 'calc(var(--pw) / ' + base + ' * ' + f.toFixed(3) + ')';
      };
      apply(1);
      let guard = 0;
      while (inner.scrollHeight > inner.clientHeight + 2 && factor > 0.66 && guard < 16) {
        factor -= 0.035;
        apply(factor);
        guard++;
      }
    });
  }

  function renderSidebar() {
    const list = $('#page-list');
    list.innerHTML = '';
    const chapterList = chapters();
    state.project.pages.forEach((page) => {
      const isChapter = page.type === 'chapter';
      const label = page.type === 'cover' ? 'Capa do e-book' : page.type === 'toc' ? 'Sumário' : page.title || 'Capítulo sem título';
      const typeLabel = page.type === 'cover' ? 'Capa' : page.type === 'toc' ? 'Índice' : 'Capítulo ' + (chapterList.indexOf(page) + 1);

      const item = h('div', {
        class: 'page-item' + (page.id === state.selectedId ? ' is-active' : ''),
        'data-page-item': page.id,
        role: 'button',
        tabindex: '0'
      },
        h('span', { class: 'page-item__num', text: page.type === 'cover' ? 'C' : page.type === 'toc' ? 'S' : String(chapterList.indexOf(page) + 1) }),
        h('span', { class: 'page-item__body' },
          h('span', { class: 'page-item__label', text: label }),
          h('span', { class: 'page-item__type', text: typeLabel })
        ),
        h('span', { class: 'page-item__acts' },
          h('button', { type: 'button', 'data-act': 'up', 'aria-label': 'Mover para cima', html: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m6 14 6-6 6 6"/></svg>' }),
          h('button', { type: 'button', 'data-act': 'down', 'aria-label': 'Mover para baixo', html: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m6 10 6 6 6-6"/></svg>' }),
          h('button', { type: 'button', 'data-act': 'del', 'aria-label': 'Excluir página', html: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>' })
        )
      );

      item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectPage(page.id, true); }
      });
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        const act = e.target.closest('[data-act]');
        if (act) {
          e.preventDefault();
          handlePageAction(page.id, act.dataset.act);
          return;
        }
        selectPage(page.id, true);
      });

      list.append(item);
    });
    $('#page-count').textContent = String(state.project.pages.length);
  }

  function selectPage(id, scroll) {
    if (state.selectedId === id && !scroll) return;
    state.selectedId = id;
    $$('.page-wrap').forEach((w) => w.classList.toggle('is-active', w.dataset.page === id));
    $$('.page-item').forEach((w) => w.classList.toggle('is-active', w.dataset.pageItem === id));
    syncInspectorFields();
    updateFocusLabel();
    if (scroll) {
      const wrap = $('.page-wrap[data-page="' + id + '"]');
      if (wrap) wrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function updateFocusLabel() {
    const page = state.project.pages.find((p) => p.id === state.selectedId);
    if (!page) return;
    const idx = state.project.pages.indexOf(page) + 1;
    const chapterList = chapters();
    const name = page.type === 'cover' ? 'Capa' : page.type === 'toc' ? 'Sumário' : 'Capítulo ' + (chapterList.indexOf(page) + 1);
    $('#focus-label').textContent = name + ' · ' + idx + '/' + state.project.pages.length;
  }

  /* --------------------------------------------------------------- zoom */
  function applyZoom() {
    const host = $('#pages');
    host.style.zoom = String(state.zoom);
    $('#zoom-label').textContent = Math.round(state.zoom * 100) + '%';
  }

  function fitZoom() {
    if (state.manualZoom) return;
    const canvas = $('#canvas');
    const base = SIZES[state.project.size].base;
    const available = Math.max(320, canvas.clientWidth - 72);
    state.zoom = clamp(available / base, 0.42, 1);
    applyZoom();
  }

  /* ---------------------------------------------------- sincronização DOM */
  function scheduleMetaSync() {
    clearTimeout(state.metaTimer);
    state.metaTimer = setTimeout(() => {
      renderSidebar();
      refreshToc();
      refreshChapterTitles();
    }, 320);
  }

  function refreshToc() {
    const chapterList = chapters();
    $$('[data-toc-for]').forEach((row) => {
      const page = state.project.pages.find((p) => p.id === row.dataset.tocFor);
      if (!page) return;
      row.querySelector('.toc-row__title').textContent = page.title;
      row.querySelector('.toc-row__page').textContent = String(pageNumber(page));
      row.querySelector('.toc-row__num').textContent = String(chapterList.indexOf(page) + 1).padStart(2, '0');
    });
  }

  function refreshChapterTitles() {
    $$('.page-wrap').forEach((wrap) => {
      const page = state.project.pages.find((p) => p.id === wrap.dataset.page);
      if (!page || page.type !== 'chapter') return;
      const titleEl = wrap.querySelector('[data-page-title]');
      if (titleEl && titleEl.textContent !== page.title) titleEl.textContent = page.title;
    });
  }

  function syncInspectorFields() {
    const page = state.project.pages.find((p) => p.id === state.selectedId);
    const p = state.project;
    if ($('#f-title') !== document.activeElement) $('#f-title').value = p.title;
    if ($('#f-subtitle') !== document.activeElement) $('#f-subtitle').value = p.subtitle || '';
    if ($('#f-author') !== document.activeElement) $('#f-author').value = p.author || '';

    const titleInput = $('#f-page-title');
    const blocksGroup = $('#blocks-group');
    if (page) {
      if (blocksGroup) blocksGroup.style.display = page.type === 'chapter' ? '' : 'none';
      $('#sel-page-label').textContent = page.type === 'cover' ? 'Capa' : page.type === 'toc' ? 'Sumário' : 'Capítulo';
      if (document.activeElement !== titleInput) {
        titleInput.value = page.type === 'cover' ? p.title : (page.title || '');
      }
      titleInput.disabled = page.type === 'toc';
    }
    if (!page && blocksGroup) blocksGroup.style.display = 'none';
  }

  function syncDesignControls() {
    const p = state.project;
    $$('#theme-swatches .swatch').forEach((el) => el.classList.toggle('is-active', el.dataset.theme === p.theme));
    $$('#accent-row .accent-dot').forEach((el) => el.classList.toggle('is-active', el.dataset.accent === p.accent));
    $$('#font-seg button').forEach((el) => el.classList.toggle('is-active', el.dataset.font === p.font));
    $$('#layout-seg button').forEach((el) => el.classList.toggle('is-active', el.dataset.layout === p.layout));
    $$('#size-seg button').forEach((el) => el.classList.toggle('is-active', el.dataset.size === p.size));
    $$('#art-options .art-option').forEach((el) => el.classList.toggle('is-active', el.dataset.art === p.art));
    $$('#mode-seg button').forEach((el) => el.classList.toggle('is-active', el.dataset.mode === p.mode));
    const hints = {
      manual: 'Você escreve. A IA continua disponível, mas nada é gerado sem você pedir.',
      ia: 'A IA escreve o rascunho e você revisa antes de exportar.',
      hibrido: 'Gere uma base e reescreva como quiser — o melhor dos dois modos.'
    };
    $('#mode-hint').textContent = hints[p.mode] || hints.hibrido;
    applyPageSizeHint();
    syncAiSource();
  }

  function applyPageSizeHint() {
    $('#size-hint').textContent = SIZES[state.project.size].hint;
  }

  function syncAiSource() {
    const key = state.ai.key;
    $('#ai-source').textContent = key ? 'Nuvem · ' + (state.ai.model || 'modelo') : 'Assistente local · sem chave';
  }

  /* --------------------------------------------------------- construir IA UI */
  function buildInspectorOptions() {
    const themes = $('#theme-swatches');
    THEMES.forEach((t) => {
      const btn = h('button', { type: 'button', class: 'swatch', 'data-theme': t.id, title: t.name },
        h('span', { class: 'swatch__preview', style: 'background:' + t.bg + ';color:' + t.fg + ';border:1px solid rgba(128,128,128,.25)', text: 'Aa' }),
        h('span', { class: 'swatch__name', text: t.name })
      );
      themes.append(btn);
    });

    const accents = $('#accent-row');
    ACCENTS.forEach((c) => {
      accents.append(h('button', { type: 'button', class: 'accent-dot', 'data-accent': c, style: 'background:' + c, 'aria-label': 'Cor ' + c }));
    });

    const arts = $('#art-options');
    ART.forEach((a) => {
      const style = a.img ? 'background-image:url("' + a.img + '")' : '';
      arts.append(h('button', {
        type: 'button',
        class: 'art-option',
        'data-art': a.id,
        style: style,
        title: a.name,
        text: a.img ? '' : 'Sem arte'
      }));
    });

    const list = $('#template-list');
    const icons = {
      book: '<path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 0 4 21z"/><path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H13v16h5.5A1.5 1.5 0 0 1 20 21z"/>',
      pen: '<path d="M4 20l4.5-1 10-10a2.5 2.5 0 0 0-3.5-3.5l-10 10z"/><path d="m14 6 4 4"/>',
      star: '<path d="M12 3l2.6 5.6 6.1.8-4.5 4.2 1.2 6-5.4-3-5.4 3 1.2-6L3.3 9.4l6.1-.8z"/>',
      chart: '<path d="M4 19V5M4 19h16"/><path d="M8 15v-4M12 15V8M16 15v-6"/>',
      chip: '<rect x="7" y="7" width="10" height="10" rx="2"/><path d="M10 3v2M14 3v2M10 19v2M14 19v2M3 10h2M3 14h2M19 10h2M19 14h2"/>',
      grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>'
    };
    TEMPLATES.forEach((tpl) => {
      const card = h('button', { type: 'button', class: 'modal-card', 'data-template': tpl.id },
        h('span', { class: 'modal-card__icon', html: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">' + icons[tpl.icon] + '</svg>' }),
        h('span', {}, h('strong', { text: tpl.name }), h('span', { text: tpl.desc }))
      );
      card.addEventListener('click', () => {
        if (!pode('modelos') && PREMIUM.modelos.indexOf(tpl.id) >= 0) {
          closeModals();
          upsell('modelos');
          return;
        }
        if (!projetosIlimitados() && projetosExtras().length > 0) {
          if (!window.confirm('No plano Essencial você mantém 1 projeto ativo. Aplicar este modelo substitui os outros projetos salvos. Continuar?')) return;
          writeProjects([]);
        }
        closeModals();
        setProject(projectFromTemplate(tpl));
        toast('Modelo aplicado: ' + tpl.name);
        setTimeout(fitZoom, 60);
      });
      list.append(card);
    });
  }

  /* ------------------------------------------------------------- ações */
  function handlePageAction(id, act) {
    const pages = state.project.pages;
    const idx = pages.findIndex((p) => p.id === id);
    if (idx < 0) return;
    if (act === 'up' && idx > 0) {
      [pages[idx - 1], pages[idx]] = [pages[idx], pages[idx - 1]];
    } else if (act === 'down' && idx < pages.length - 1) {
      [pages[idx + 1], pages[idx]] = [pages[idx], pages[idx + 1]];
    } else if (act === 'del') {
      deletePage(id);
      return;
    }
    persist();
    renderPages();
    renderSidebar();
    updateFocusLabel();
    refreshToc();
  }

  function deletePage(id) {
    const page = state.project.pages.find((p) => p.id === id);
    if (!page) return;
    if (state.project.pages.length <= 1) {
      toast('O e-book precisa de pelo menos uma página.');
      return;
    }
    const ok = window.confirm(page.type === 'cover'
      ? 'Excluir a capa do e-book?'
      : 'Excluir "' + (page.title || 'esta página') + '"?');
    if (!ok) return;
    state.project.pages = state.project.pages.filter((p) => p.id !== id);
    if (state.selectedId === id) state.selectedId = (state.project.pages[0] || {}).id;
    persist();
    renderAll();
    toast('Página excluída');
  }

  function addChapter() {
    const page = chapterPage('Novo capítulo', [{ type: 'p', text: '' }]);
    const pages = state.project.pages;
    const lastChapterIdx = pages.map((p) => p.type).lastIndexOf('chapter');
    if (lastChapterIdx >= 0) pages.splice(lastChapterIdx + 1, 0, page);
    else pages.push(page);
    state.selectedId = page.id;
    persist();
    renderAll();
    refreshToc();
    toast('Capítulo adicionado');
    setTimeout(() => {
      const wrap = $('.page-wrap[data-page="' + page.id + '"]');
      if (wrap) wrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
      const title = wrap && wrap.querySelector('[data-page-title]');
      if (title) { title.focus(); document.getSelection().selectAllChildren(title); }
    }, 80);
  }

  function addToc() {
    if (state.project.pages.some((p) => p.type === 'toc')) {
      toast('Seu e-book já tem um sumário.');
      return;
    }
    const coverIdx = state.project.pages.findIndex((p) => p.type === 'cover');
    state.project.pages.splice(coverIdx >= 0 ? coverIdx + 1 : 0, 0, tocPage());
    persist();
    renderAll();
    toast('Sumário inserido');
  }

  function addBlock(type) {
    const page = state.project.pages.find((p) => p.id === state.selectedId);
    if (!page || page.type !== 'chapter') {
      toast('Selecione um capítulo para adicionar blocos.');
      return;
    }
    const defaults = {
      p: 'Escreva seu parágrafo aqui.',
      h3: 'Novo subtítulo',
      list: 'Primeiro item\nSegundo item\nTerceiro item',
      quote: 'Uma frase que merece destaque.',
      callout: 'Na prática\nDescreva a ação recomendada.'
    };
    page.blocks.push({ type, text: defaults[type] || '' });
    persist();
    renderPages();
    selectPage(page.id);
    setTimeout(() => {
      const wrap = $('.page-wrap[data-page="' + page.id + '"]');
      if (wrap) {
        const rows = wrap.querySelectorAll('.block-row');
        const last = rows[rows.length - 1];
        if (last) {
          const editableEl = last.querySelector('[data-block-text]');
          if (editableEl) { editableEl.focus(); document.getSelection().selectAllChildren(editableEl); }
          last.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }, 60);
  }

  /* ------------------------------------------------------------- IA */
  function aiLog(text) {
    const log = $('#ai-log');
    log.innerHTML = '';
    log.append(h('span', { text }));
  }

  function setAiBusy(busy) {
    state.busy = busy;
    ['#ai-generate', '#ai-outline', '#ai-page'].forEach((sel) => {
      const btn = $(sel);
      if (btn) btn.disabled = busy;
    });
    $('#ai-progress-bar').style.width = busy ? '12%' : '0%';
  }

  function aiOptions() {
    return {
      topic: $('#ai-topic').value.trim(),
      audience: $('#ai-audience').value.trim(),
      tone: $('#ai-tone').value,
      chapters: Number($('#ai-chapters').value) || 5,
      author: state.project.author,
      apiKey: state.ai.key,
      model: state.ai.model
    };
  }

  function replaceChapters(chapterData) {
    const toc = state.project.pages.find((p) => p.type === 'toc') || tocPage();
    const cover = state.project.pages.find((p) => p.type === 'cover') || coverPage();
    state.project.pages = [cover, toc, ...chapterData.map((p) => chapterPage(p.title, p.blocks))];
    state.selectedId = state.project.pages[2] ? state.project.pages[2].id : cover.id;
  }

  async function generate(kind) {
    if (state.busy) return;
    const opts = aiOptions();
    if (!opts.topic) {
      aiLog('Descreva o tema do e-book para começar.');
      toast('Informe o tema do e-book');
      $('#ai-topic').focus();
      return;
    }
    if (!opts.audience) opts.audience = 'leitores que querem aplicar o tema na prática';

    const cobranca = await cobrarCreditos(kind);
    if (!cobranca.ok) return;

    setAiBusy(true);
    const bar = $('#ai-progress-bar');
    const setProgress = (p) => { bar.style.width = Math.round(p * 100) + '%'; };

    try {
      if (kind === 'outline') {
        aiLog('Montando o sumário…');
        setProgress(0.4);
        const outline = window.EbooksAI.buildOutline(opts);
        await sleep(320);
        replaceChapters(outline.map((item) => ({ title: item.title, blocks: [{ type: 'p', text: '' }] })));
        state.project.mode = 'hibrido';
        persist();
        renderAll();
        setProgress(1);
        aiLog('Sumário criado com ' + outline.length + ' páginas. Agora escreva os capítulos ou use "Reescrever página atual".');
        toast('Sumário gerado');
        return;
      }

      if (kind === 'page') {
        const page = state.project.pages.find((p) => p.id === state.selectedId);
        if (!page || page.type !== 'chapter') {
          aiLog('Selecione um capítulo na lista de páginas.');
          toast('Selecione um capítulo');
          return;
        }
        aiLog('Reescrevendo "' + page.title + '"…');
        setProgress(0.5);
        const total = chapters().length;
        const blocks = window.EbooksAI.buildChapter(opts, page.title, chapters().indexOf(page), total);
        await sleep(420);
        page.blocks = blocks;
        persist();
        renderPages();
        selectPage(page.id);
        setProgress(1);
        aiLog('Capítulo reescrito. Revise e ajuste com a sua voz.');
        toast('Capítulo reescrito');
        return;
      }

      /* e-book completo */
      let book;
      if (opts.apiKey) {
        aiLog('Conectando à IA em nuvem (' + (opts.model || 'modelo') + ')…');
        setProgress(0.25);
        try {
          book = await window.EbooksAI.buildWithCloud(opts);
          setProgress(0.9);
        } catch (err) {
          aiLog('Não foi possível usar a nuvem (' + err.message + '). Gerando com o assistente local…');
          await sleep(600);
          book = window.EbooksAI.buildBook(opts);
        }
      } else {
        aiLog('Analisando o briefing e montando o sumário…');
        setProgress(0.15);
        await sleep(340);
        const outline = window.EbooksAI.buildOutline(opts);
        const built = [];
        for (let i = 0; i < outline.length; i++) {
          aiLog('Escrevendo capítulo ' + (i + 1) + ' de ' + outline.length + ': “' + outline[i].title + '”');
          built.push({ title: outline[i].title, blocks: window.EbooksAI.buildChapter(opts, outline[i].title, i, outline.length) });
          setProgress(0.2 + (i + 1) / outline.length * 0.72);
          await sleep(190);
        }
        book = {
          title: opts.topic.charAt(0).toUpperCase() + opts.topic.slice(1),
          subtitle: 'Um guia prático para ' + opts.audience,
          author: state.project.author,
          pages: built
        };
      }

      state.project.title = book.title;
      state.project.subtitle = book.subtitle;
      if (book.author) state.project.author = book.author;
      state.project.name = book.title;
      $('#project-name').value = book.title;
      replaceChapters(book.pages);
      state.project.mode = $('#mode-seg .is-active')?.dataset.mode || 'hibrido';
      persist();
      renderAll();
      setProgress(1);
      aiLog('Pronto! ' + book.pages.length + ' capítulos escritos. Revise os textos, ajuste o design e exporte em PDF.');
      toast('E-book gerado com sucesso');
      syncInspectorFields();
    } catch (err) {
      aiLog('Algo deu errado: ' + err.message);
      toast('Não foi possível gerar agora');
    } finally {
      setAiBusy(false);
      setTimeout(() => { bar.style.width = '0%'; }, 900);
    }
  }

  /* ------------------------------------------------------------- export */
  function injectPrintStyle() {
    let style = $('#print-style');
    if (!style) {
      style = document.createElement('style');
      style.id = 'print-style';
      document.head.append(style);
    }
    style.textContent = '@media print{ @page{ size:' + SIZES[state.project.size].mm + '; margin:0 } #pages{ zoom:1 !important } }';
  }

  function exportPDF() {
    closeModals();
    injectPrintStyle();
    setTimeout(() => window.print(), 200);
  }

  function cleanClone() {
    const clone = $('#pages').cloneNode(true);
    clone.removeAttribute('style');
    clone.querySelectorAll('.block-tools, .page-label').forEach((el) => el.remove());
    clone.querySelectorAll('[contenteditable]').forEach((el) => el.removeAttribute('contenteditable'));
    clone.querySelectorAll('.page-wrap').forEach((w) => w.classList.remove('is-active'));
    return clone;
  }

  const dataCache = new Map();
  async function toDataURL(src) {
    if (dataCache.has(src)) return dataCache.get(src);
    try {
      const res = await fetch(src);
      const blob = await res.blob();
      const data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      dataCache.set(src, data);
      return data;
    } catch (e) {
      return src;
    }
  }

  async function inlineAssets(root) {
    const imgs = Array.from(root.querySelectorAll('img[src^="assets/"]'));
    for (const img of imgs) {
      img.setAttribute('src', await toDataURL(img.getAttribute('src')));
    }
    const bgNodes = Array.from(root.querySelectorAll('[style*="assets/img"]'));
    for (const node of bgNodes) {
      const match = node.getAttribute('style').match(/url\(["']?(assets\/img\/[^"')]+)["']?\)/);
      if (match) {
        const data = await toDataURL(match[1]);
        node.setAttribute('style', node.getAttribute('style').split(match[1]).join(data));
      }
    }
    return root;
  }

  async function buildStandaloneHTML() {
    const styles = Array.from(document.styleSheets)
      .map((sheet) => {
        try {
          return Array.from(sheet.cssRules).map((r) => r.cssText).join('\n');
        } catch (e) {
          return sheet.href ? '@import url("' + sheet.href + '");' : '';
        }
      })
      .join('\n');

    const clone = await inlineAssets(cleanClone());
    return '<!DOCTYPE html>\n<html lang="pt-BR">\n<head>\n<meta charset="utf-8">\n' +
      '<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
      '<title>' + escapeHtml(state.project.title) + '</title>\n' +
      '<link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=Inter:wght@400;500;600&family=Lora:ital,wght@0,400;0,600;1,400&display=swap" rel="stylesheet">\n' +
      '<style>\n' + styles + '\n' +
      'body{background:#f4f2f8;margin:0;padding:32px 16px;overflow:auto;height:auto}\n' +
      '.pages{padding:0;gap:26px}\n' +
      '@media(max-width:820px){.page{--pw:100%!important}}\n' +
      '@media print{body{background:#fff;padding:0}.page{border-radius:0;box-shadow:none}}\n' +
      '</style>\n</head>\n<body class="export-body">\n<div class="pages">' + clone.innerHTML + '</div>\n</body>\n</html>';
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function plainText() {
    const lines = [state.project.title, state.project.subtitle || '', 'por ' + state.project.author, ''];
    chapters().forEach((page, i) => {
      lines.push('CAPÍTULO ' + (i + 1), page.title, '');
      (page.blocks || []).forEach((b) => {
        if (b.type === 'list') {
          String(b.text || '').split('\n').filter(Boolean).forEach((li) => lines.push('• ' + li));
        } else if (b.type === 'callout') {
          lines.push('[' + String(b.text || '').replace(/\n/g, ': ') + ']');
        } else {
          lines.push(String(b.text || ''));
        }
      });
      lines.push('');
    });
    return lines.join('\n');
  }

  async function exportFile(kind) {
    if (kind === 'pdf') { exportPDF(); return; }
    if (kind === 'html') {
      if (!pode('html')) { closeModals(); upsell('html'); return; }
      toast('Preparando arquivo…');
      const html = await buildStandaloneHTML();
      download(slug(state.project.title) + '.html', html, 'text/html;charset=utf-8');
      closeModals();
      toast('HTML exportado');
      return;
    }
    if (kind === 'json') {
      download(slug(state.project.title) + '.json', JSON.stringify(state.project, null, 2), 'application/json');
      closeModals();
      toast('Projeto exportado');
      return;
    }
    if (kind === 'copy') {
      try {
        await navigator.clipboard.writeText(plainText());
        toast('Texto copiado');
      } catch (e) {
        const ta = document.createElement('textarea');
        ta.value = plainText();
        document.body.append(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
        toast('Texto copiado');
      }
      closeModals();
    }
  }

  /* -------------------------------------------------------------- modais */
  function openModal(id) {
    const dlg = document.getElementById(id);
    if (!dlg) return;
    if (id === 'modal-projects') renderProjectsModal();
    if (typeof dlg.showModal === 'function') dlg.showModal();
    else dlg.setAttribute('open', '');
  }

  function closeModals() {
    $$('dialog[open]').forEach((d) => d.close());
  }

  function renderProjectsModal() {
    const host = $('#project-list');
    host.innerHTML = '';
    const list = readProjects().sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    if (!list.length) {
      host.append(h('p', { class: 'panel__hint', text: 'Nenhum projeto salvo ainda. Comece pelo seu projeto atual.' }));
    }
    list.forEach((proj) => {
      const row = h('div', { class: 'project-row' },
        h('div', { class: 'project-row__main' },
          h('strong', { text: proj.name || proj.title }),
          h('span', { text: (proj.pages ? proj.pages.length : 0) + ' páginas · atualizado em ' + new Date(proj.updatedAt || Date.now()).toLocaleDateString('pt-BR') + (proj.id === state.project.id ? ' · atual' : '') })
        ),
        h('button', { type: 'button', class: 'btn btn--ghost btn--sm', text: 'Abrir' }),
        h('button', { type: 'button', class: 'project-row__del', 'aria-label': 'Excluir projeto', html: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13"/></svg>' })
      );
      row.querySelectorAll('button')[0].addEventListener('click', () => {
        setProject(JSON.parse(JSON.stringify(proj)));
        closeModals();
        toast('Projeto aberto');
        setTimeout(fitZoom, 60);
      });
      row.querySelectorAll('button')[1].addEventListener('click', () => {
        if (!window.confirm('Excluir "' + (proj.name || proj.title) + '"?')) return;
        writeProjects(readProjects().filter((p) => p.id !== proj.id));
        renderProjectsModal();
        if (proj.id === state.project.id) toast('Projeto excluído. Crie um novo para continuar.');
        else toast('Projeto excluído');
      });
      host.append(row);
    });
  }

  /* ---------------------------------------------------------------- planos */
  // O que é exclusivo dos planos pagos.
  const PREMIUM = {
    temas: ['editorial', 'meianoite', 'solar'],
    capas: ['orb', 'neon'],
    modelos: ['metodo']
  };

  const MOTIVOS = {
    ia: 'A criação com IA faz parte do plano Profissional: ela monta o sumário e escreve o rascunho dos capítulos a partir do seu briefing.',
    modelos: 'Este modelo é premium — ele faz parte dos modelos liberados no plano Profissional.',
    temas: 'Este tema é premium. No plano Profissional você usa todos os temas, fontes e capas.',
    capas: 'Esta capa é premium. No plano Profissional você usa todas as capas e combina com qualquer tema.',
    html: 'Exportar em HTML e gerar PDF sem marca d’água fazem parte do plano Profissional.',
    projetos: 'O plano Essencial permite 1 projeto ativo por vez. No Profissional você cria quantos quiser.',
    codigo: 'Cole abaixo o código que você recebeu por e-mail depois da compra. Hífens e espaços são ignorados.',
    padrao: 'Compare o que está liberado no seu acesso atual.'
  };

  const Lic = () => window.EbooksLicenca || null;

  function planoLimites() {
    const api = Lic();
    return api ? api.limites() : { nome: 'Essencial', projetos: 1, ia: false, exportHTML: false, temasPremium: false, capasPremium: false, modelosPremium: false };
  }

  function pode(recurso) {
    const api = Lic();
    return api ? api.pode(recurso) : false;
  }

  function dataBR(iso) {
    return new Date(String(iso) + 'T12:00:00').toLocaleDateString('pt-BR');
  }

  function limiteProjetos() {
    const lim = planoLimites();
    return isFinite(lim.projetos) ? lim.projetos : Infinity;
  }

  function projetosIlimitados() {
    return !isFinite(limiteProjetos());
  }

  // Já existe mais de um projeto salvo além do atual?
  function projetosExtras() {
    return readProjects().filter((p) => !state.project || p.id !== state.project.id);
  }

  function podeCriarProjetoAgora() {
    if (projetosIlimitados()) return true;
    return projetosExtras().length === 0;
  }

  /* ------------------------------------------------------------- créditos */
  function saldoCreditos() {
    return window.EbooksCreditos ? window.EbooksCreditos.saldoAtual() : null;
  }

  function semCreditos() {
    const saldo = saldoCreditos();
    return saldo !== null && saldo <= 0;
  }

  function atualizarCadeadoIA() {
    const painel = $('.panel[data-panel="ai"]');
    const bloqueado = semCreditos();
    if (painel) painel.classList.toggle('is-ai-locked', bloqueado);
    const cadeado = $('#ai-lock');
    if (cadeado) cadeado.hidden = !bloqueado;
  }

  function upsellCreditos() {
    const alvo = $('#plano-motivo');
    if (alvo) alvo.textContent = 'Seus créditos de IA acabaram. Dá para continuar escrevendo manualmente ou ver os planos e falar com o time para recarregar.';
    openModal('modal-plano');
  }

  // Desconta no servidor antes de gerar: sem saldo, a geração não acontece.
  async function cobrarCreditos(kind) {
    if (!window.EbooksCreditos) return { ok: true };
    const custo = window.EbooksCreditos.custoDe(kind);
    if (!custo) return { ok: true };

    const resultado = await window.EbooksCreditos.cobrar(kind);

    if (resultado.ok) {
      toast(custo + ' créditos usados');
      return resultado;
    }
    if (resultado.erro === 'creditos') {
      atualizarCadeadoIA();
      aiLog('Créditos insuficientes. O modo manual continua liberado — assine um plano ou fale com o time para recarregar.');
      toast('Créditos insuficientes');
      upsellCreditos();
      return resultado;
    }
    if (resultado.erro === 'sessao') {
      toast('Sessão expirada');
      setTimeout(() => {
        window.location.replace('login.html?next=' + encodeURIComponent('estudio.html'));
      }, 1200);
      return resultado;
    }
    toast('Não foi possível descontar os créditos');
    return resultado;
  }

  function upsell(motivo) {
    const alvo = $('#plano-motivo');
    if (alvo) alvo.textContent = MOTIVOS[motivo] || MOTIVOS.padrao;
    openModal('modal-plano');
    if (motivo === 'codigo') {
      setTimeout(() => { const campo = $('#licenca-codigo'); if (campo) campo.focus(); }, 140);
    }
  }

  function renderPlanoAtual() {
    const host = $('#plano-atual');
    if (!host) return;
    const api = Lic();
    const ativa = api ? api.getAtiva() : null;
    const lim = planoLimites();
    host.innerHTML = '';
    host.append(h('span', { class: 'plano-atual__badge', text: lim.nome || 'Essencial' }));

    if (ativa) {
      const texto = h('span', { class: 'plano-atual__texto' });
      texto.innerHTML = 'Plano ativo' +
        (ativa.expira ? ' até <strong>' + dataBR(ativa.expira) + '</strong>' : ' <strong>sem prazo de validade</strong>') +
        ' · código <strong>' + (ativa.codigo || '—') + '</strong>';
      host.append(texto);
    } else {
      const texto = h('span', { class: 'plano-atual__texto' });
      texto.innerHTML = 'Plano gratuito: <strong>1 projeto</strong>, <strong>5 modelos</strong>, PDF com marca d’água e sem criação com IA.';
      host.append(texto);
    }
  }

  function refreshPlanoUI() {
    const api = Lic();
    const lim = planoLimites();
    const plano = api ? api.planoAtual() : 'essencial';
    document.documentElement.dataset.plano = plano;

    const nome = $('#plan-pill-nome');
    if (nome) nome.textContent = lim.nome || 'Essencial';

    const assinar = $('#btn-assinar-plano');
    if (assinar && plano !== 'essencial') {
      assinar.querySelector('span').textContent = 'Trocar de plano';
    }

    $$('#theme-swatches .swatch').forEach((el) => {
      el.classList.toggle('is-locked', !pode('temas') && PREMIUM.temas.indexOf(el.dataset.theme) >= 0);
    });

    $$('#art-options .art-option').forEach((el) => {
      el.classList.toggle('is-locked', !pode('capas') && PREMIUM.capas.indexOf(el.dataset.art) >= 0);
    });

    $$('#template-list .modal-card').forEach((el) => {
      const travado = !pode('modelos') && PREMIUM.modelos.indexOf(el.dataset.template) >= 0;
      el.classList.toggle('is-locked', travado);
      const marca = el.querySelector('.modal-card__lock');
      if (travado && !marca) el.append(h('span', { class: 'modal-card__lock', text: 'Profissional' }));
      else if (!travado && marca) marca.remove();
    });

    atualizarCadeadoIA();

    const exportarHtml = $('[data-export="html"]');
    if (exportarHtml) exportarHtml.classList.toggle('is-locked', !pode('html'));

    renderPlanoAtual();
  }

  function bindPlano() {
    const form = $('#form-licenca');
    const campo = $('#licenca-codigo');
    const msg = $('#licenca-msg');

    if (campo) {
      campo.addEventListener('input', () => {
        const api = Lic();
        if (!api) return;
        const pos = campo.selectionStart;
        const formatado = api.formatarCodigo(campo.value).slice(0, 30);
        if (formatado !== campo.value) {
          campo.value = formatado;
          campo.setSelectionRange(Math.min(pos, formatado.length), Math.min(pos, formatado.length));
        }
      });
    }

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const api = Lic();
        if (!api) return;
        const resultado = api.ativar(campo.value);
        if (!resultado.ok) {
          msg.className = 'plano-msg is-erro';
          msg.textContent = resultado.erro;
          campo.focus();
          return;
        }
        msg.className = 'plano-msg is-ok';
        msg.textContent = 'Plano ' + resultado.nome + ' liberado' + (resultado.expira ? ' até ' + dataBR(resultado.expira) : '') + '. Bom trabalho!';
        campo.value = '';
        refreshPlanoUI();
        renderPages();
        toast('Plano ' + resultado.nome + ' ativado');
      });
    }

    $$('[data-upsell]').forEach((btn) => {
      btn.addEventListener('click', () => upsell(btn.dataset.upsell));
    });

    const pill = $('#btn-plano');
    if (pill) {
      pill.addEventListener('click', () => {
        const alvo = $('#plano-motivo');
        if (alvo && !alvo.dataset.fixo) alvo.textContent = MOTIVOS.padrao;
        renderPlanoAtual();
      });
    }

    document.addEventListener('ebs:licenca', () => {
      refreshPlanoUI();
      if (state.project) renderPages();
    });
  }

  /* --------------------------------------------------------------- eventos */
  function bindEvents() {
    /* nome do projeto */
    $('#project-name').addEventListener('input', (e) => {
      state.project.name = e.target.value;
      persist();
    });

    /* toolbar */
    $('#add-chapter').addEventListener('click', () => {
      addChapter();
      closeDrawers();
    });
    $('#add-toc').addEventListener('click', addToc);
    $('#focus-page').addEventListener('click', () => {
      const wrap = $('.page-wrap[data-page="' + state.selectedId + '"]');
      if (wrap) wrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    $$('[data-zoom]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.manualZoom = true;
        state.zoom = clamp(state.zoom + Number(btn.dataset.zoom) * 0.1, 0.35, 1.6);
        applyZoom();
      });
    });

    /* tabs */
    $$('.inspector__tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        $$('.inspector__tab').forEach((t) => {
          const active = t === tab;
          t.classList.toggle('is-active', active);
          t.setAttribute('aria-selected', String(active));
        });
        $$('.panel').forEach((p) => p.classList.toggle('is-active', p.dataset.panel === tab.dataset.tab));
      });
    });

    /* design controls */
    $('#theme-swatches').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-theme]');
      if (!btn) return;
      if (!pode('temas') && PREMIUM.temas.indexOf(btn.dataset.theme) >= 0) { upsell('temas'); return; }
      state.project.theme = btn.dataset.theme;
      persist();
      renderPages();
      selectPage(state.selectedId);
      syncDesignControls();
    });

    $('#accent-row').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-accent]');
      if (!btn) return;
      state.project.accent = btn.dataset.accent;
      persist();
      renderPages();
      selectPage(state.selectedId);
      syncDesignControls();
    });

    $('#font-seg').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-font]');
      if (!btn) return;
      state.project.font = btn.dataset.font;
      persist();
      renderPages();
      selectPage(state.selectedId);
      syncDesignControls();
    });

    $('#layout-seg').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-layout]');
      if (!btn) return;
      state.project.layout = btn.dataset.layout;
      persist();
      renderPages();
      selectPage(state.selectedId);
      syncDesignControls();
    });

    $('#size-seg').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-size]');
      if (!btn) return;
      state.project.size = btn.dataset.size;
      persist();
      renderPages();
      selectPage(state.selectedId);
      syncDesignControls();
      setTimeout(fitZoom, 50);
    });

    $('#art-options').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-art]');
      if (!btn) return;
      if (!pode('capas') && PREMIUM.capas.indexOf(btn.dataset.art) >= 0) { upsell('capas'); return; }
      state.project.art = btn.dataset.art;
      persist();
      renderPages();
      selectPage(state.selectedId);
      syncDesignControls();
    });

    $('#mode-seg').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-mode]');
      if (!btn) return;
      state.project.mode = btn.dataset.mode;
      persist();
      syncDesignControls();
      if (btn.dataset.mode !== 'manual') {
        $$('.inspector__tab').find((t) => t.dataset.tab === 'ai').click();
      }
    });

    /* conteúdo */
    [['#f-title', 'title'], ['#f-subtitle', 'subtitle'], ['#f-author', 'author']].forEach(([sel, key]) => {
      $(sel).addEventListener('input', (e) => {
        if (key === 'title' && state.project.name === state.project.title) {
          state.project.name = e.target.value;
          $('#project-name').value = e.target.value;
        }
        state.project[key] = e.target.value;
        persist();
        const page = state.project.pages.find((p) => p.id === state.selectedId);
        if (key === 'title' && page && page.type === 'cover') {
          const el = $('.page-wrap.is-active [data-field="title"]');
          if (el) el.textContent = e.target.value;
          const nameInput = $('#project-name');
          if (!nameInput.value.trim()) nameInput.value = e.target.value;
          scheduleMetaSync();
        }
        if (key === 'subtitle') {
          const el = $('.page-wrap.is-active [data-field="subtitle"]');
          if (el) el.textContent = e.target.value;
        }
        if (key === 'author') {
          const el = $('.page-wrap.is-active [data-field="author"]');
          if (el) el.textContent = e.target.value;
        }
      });
    });

    $('#f-page-title').addEventListener('input', (e) => {
      const page = state.project.pages.find((p) => p.id === state.selectedId);
      if (!page || page.type === 'toc') return;
      if (page.type === 'cover') {
        state.project.title = e.target.value;
        $('#f-title').value = e.target.value;
        const el = $('.page-wrap.is-active [data-field="title"]');
        if (el) el.textContent = e.target.value;
      } else {
        page.title = e.target.value;
        const el = $('.page-wrap.is-active [data-page-title]');
        if (el) el.textContent = e.target.value;
      }
      persist();
      scheduleMetaSync();
    });

    /* blocos */
    $$('[data-add-block]').forEach((btn) => {
      btn.addEventListener('click', () => addBlock(btn.dataset.addBlock));
    });
    $('#delete-page').addEventListener('click', () => deletePage(state.selectedId));

    /* edição inline */
    const pages = $('#pages');
    pages.addEventListener('input', (e) => {
      const target = e.target;
      if (!target.closest || !target.closest('[contenteditable]')) return;
      const wrap = target.closest('.page-wrap');
      if (!wrap) return;
      const page = state.project.pages.find((p) => p.id === wrap.dataset.page);
      if (!page) return;

      if (target.dataset.field === 'title') {
        if (state.project.name === state.project.title) {
          state.project.name = target.textContent;
          $('#project-name').value = target.textContent;
        }
        state.project.title = target.textContent;
        $('#f-title').value = target.textContent;
      }
      else if (target.dataset.field === 'subtitle') { state.project.subtitle = target.textContent; $('#f-subtitle').value = target.textContent; }
      else if (target.dataset.field === 'author') { state.project.author = target.textContent; $('#f-author').value = target.textContent; }
      else if (target.hasAttribute('data-page-title')) {
        page.title = target.textContent;
        if (document.activeElement !== $('#f-page-title')) $('#f-page-title').value = page.title;
        scheduleMetaSync();
      } else if (target.hasAttribute('data-block-text')) {
        const row = target.closest('[data-block-index]');
        const idx = Number(row.dataset.blockIndex);
        const block = page.blocks[idx];
        if (!block) return;
        if (block.type === 'list') {
          const items = Array.from(row.querySelectorAll('[data-block-text]')).map((li) => li.textContent);
          block.text = items.join('\n');
        } else if (block.type === 'callout') {
          const label = row.querySelector('.callout strong').textContent;
          const body = row.querySelector('.callout [data-block-text]').textContent;
          block.text = label + '\n' + body;
        } else {
          block.text = target.textContent;
        }
      }
      persist();
      if (page.type === 'cover' || target.hasAttribute('data-page-title')) scheduleMetaSync();
    });

    /* colar sem formatação */
    pages.addEventListener('paste', (e) => {
      if (!e.target.closest || !e.target.closest('[contenteditable]')) return;
      e.preventDefault();
      const text = (e.clipboardData || window.clipboardData).getData('text/plain');
      document.execCommand('insertText', false, text.replace(/\r/g, ''));
    });

    /* ferramentas de bloco */
    pages.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-block-act]');
      if (!btn) return;
      e.stopPropagation();
      const row = btn.closest('[data-block-index]');
      const wrap = btn.closest('.page-wrap');
      const page = state.project.pages.find((p) => p.id === wrap.dataset.page);
      if (!page) return;
      const idx = Number(row.dataset.blockIndex);
      const act = btn.dataset.blockAct;
      if (act === 'del') page.blocks.splice(idx, 1);
      if (act === 'up' && idx > 0) [page.blocks[idx - 1], page.blocks[idx]] = [page.blocks[idx], page.blocks[idx - 1]];
      if (act === 'down' && idx < page.blocks.length - 1) [page.blocks[idx + 1], page.blocks[idx]] = [page.blocks[idx], page.blocks[idx + 1]];
      persist();
      renderPages();
      selectPage(page.id);
    });

    /* IA */
    $('#ai-generate').addEventListener('click', () => generate('book'));
    $('#ai-outline').addEventListener('click', () => generate('outline'));
    $('#ai-page').addEventListener('click', () => generate('page'));

    $('#ai-key').addEventListener('input', (e) => {
      state.ai.key = e.target.value.trim();
      localStorage.setItem(AI_KEY, JSON.stringify(state.ai));
      syncAiSource();
    });
    $('#ai-model').addEventListener('input', (e) => {
      state.ai.model = e.target.value.trim() || 'gpt-4o-mini';
      localStorage.setItem(AI_KEY, JSON.stringify(state.ai));
      syncAiSource();
    });

    /* modais */
    $$('[data-open]').forEach((btn) => btn.addEventListener('click', () => openModal(btn.dataset.open)));
    $$('[data-close]').forEach((btn) => btn.addEventListener('click', closeModals));
    $$('dialog.simple-modal').forEach((dlg) => {
      dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
    });
    $$('[data-export]').forEach((btn) => btn.addEventListener('click', () => exportFile(btn.dataset.export)));
    $('#new-project').addEventListener('click', () => {
      closeModals();
      if (!podeCriarProjetoAgora()) { upsell('projetos'); return; }
      if (!window.confirm('Criar um novo projeto em branco? O projeto atual continua salvo em "Meus projetos".')) return;
      setProject(blankProject());
      toast('Novo projeto criado');
      setTimeout(fitZoom, 60);
    });

    /* drawers mobile */
    $$('[data-drawer]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const el = document.getElementById(btn.dataset.drawer);
        const open = !el.classList.contains('is-open');
        closeDrawers();
        if (open) {
          el.classList.add('is-open');
          $('#scrim').hidden = false;
          requestAnimationFrame(() => $('#scrim').classList.add('is-open'));
        }
      });
    });
    $('#scrim').addEventListener('click', closeDrawers);

    /* atalhos */
    document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        persist();
        toast('Projeto salvo');
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        exportPDF();
      }
      if (e.key === 'Escape') closeDrawers();
    });

    /* redimensionamento */
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (window.innerWidth > 760) fitZoom();
      }, 200);
    });

    /* atualiza dica de página ao rolar */
    $('#canvas').addEventListener('scroll', () => {
      const canvasTop = $('#canvas').getBoundingClientRect().top;
      let best = null;
      let bestDist = Infinity;
      $$('.page-wrap').forEach((wrap) => {
        const rect = wrap.getBoundingClientRect();
        const dist = Math.abs(rect.top - canvasTop - 40);
        if (dist < bestDist) { bestDist = dist; best = wrap; }
      });
      if (best) {
        const id = best.dataset.page;
        if (id !== state.selectedId) {
          state.selectedId = id;
          $$('.page-wrap').forEach((w) => w.classList.toggle('is-active', w.dataset.page === id));
          $$('.page-item').forEach((w) => w.classList.toggle('is-active', w.dataset.pageItem === id));
          syncInspectorFields();
          updateFocusLabel();
        }
      }
    }, { passive: true });
  }

  function closeDrawers() {
    $('#sidebar').classList.remove('is-open');
    $('#inspector').classList.remove('is-open');
    const scrim = $('#scrim');
    scrim.classList.remove('is-open');
    setTimeout(() => { scrim.hidden = true; }, 250);
  }

  /* ----------------------------------------------------------------- boot */
  function init() {
    if (state.booted) return;

    // O estúdio só abre com conta logada: espera o veredito do estudio-gate.js
    if (window.EBOOKS_AUTORIZADO !== true) {
      document.addEventListener('ebs:autorizado', () => init(), { once: true });
      return;
    }

    state.booted = true;
    buildInspectorOptions();
    bindEvents();
    bindPlano();
    refreshPlanoUI();
    if (window.EbooksCreditos) window.EbooksCreditos.decorarBotoes();
    document.addEventListener('ebs:creditos', () => atualizarCadeadoIA());

    const params = new URLSearchParams(window.location.search);
    const tplParam = params.get('template');
    const modo = params.get('modo');
    const activeId = localStorage.getItem(ACTIVE_KEY);
    const saved = readProjects();
    let project = null;

    if (tplParam && TEMPLATES.some((t) => t.id === tplParam)) {
      project = projectFromTemplate(TEMPLATES.find((t) => t.id === tplParam));
    } else if (activeId) {
      project = saved.find((p) => p.id === activeId) || null;
    }
    if (!project) project = saved[0] || projectFromTemplate(TEMPLATES[0]);
    if (modo && ['manual', 'ia', 'hibrido'].includes(modo)) project.mode = modo;
    if (!project.art) project.art = 'none';

    try {
      const aiStored = JSON.parse(localStorage.getItem(AI_KEY) || '{}');
      state.ai.key = aiStored.key || '';
      state.ai.model = aiStored.model || 'gpt-4o-mini';
    } catch (e) { /* ignore */ }

    $('#ai-key').value = state.ai.key;
    $('#ai-model').value = state.ai.model;

    setProject(project);
    setTimeout(() => {
      fitZoom();
      if (tplParam) toast('Modelo carregado — comece editando os textos.');
      if (modo === 'ia') {
        $$('.inspector__tab').find((t) => t.dataset.tab === 'ai').click();
        if (!state.project.pages.some((p) => p.type === 'chapter')) $('#ai-topic').focus();
      }
    }, 120);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
