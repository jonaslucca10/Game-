# E-books Studio

Site institucional + estúdio de criação de e-books da **E-books Studio**.
O usuário pode criar um e-book **manualmente**, **com IA** ou no **modo híbrido**, ajustar o
design (tema, cor de destaque, tipografia, layout e formato) e exportar em PDF, HTML ou JSON.

## No ar

**https://ebooks-studio.vercel.app** — deploy automático a cada `git push` no repositório
[`jonaslucca10/Game-`](https://github.com/jonaslucca10/Game-), projeto Vercel `ebooks-studio`.
Páginas: `/` (landing), `/estudio.html` (estúdio) e 404 personalizada.

## Como rodar

O projeto é 100% estático — não precisa de build. Basta servir a pasta:

```bash
python3 -m http.server 8000
# abra http://localhost:8000
```

Ou use qualquer hospedagem estática (Vercel, Netlify, GitHub Pages, S3…).

## Páginas

| Arquivo | Descrição |
| --- | --- |
| `index.html` | Landing page: hero, modos de criação, modelos, planos, depoimentos, blog, FAQ e contato. |
| `estudio.html` | Estúdio de criação (editor de e-books) com autosave local. |

Atalhos úteis para abrir o estúdio já configurado:

- `estudio.html?modo=manual` · `?modo=ia` · `?modo=hibrido`
- `estudio.html?template=guia|copy|autoridade|financas|ia|metodo`

## Estrutura

```
.
├── index.html
├── estudio.html
├── assets/
│   ├── css/
│   │   ├── base.css        # tokens de design, reset e componentes compartilhados
│   │   ├── landing.css     # estilos da landing page
│   │   └── estudio.css     # estilos do editor (inclui CSS de impressão/PDF)
│   ├── js/
│   │   ├── main.js         # interações da landing (menu, reveal, planos, blog, FAQ)
│   │   ├── ai.js           # motor de escrita: geração local e integração opcional em nuvem
│   │   └── estudio.js      # estado, edição, templates, autosave e exportação
│   ├── img/                # logo, ícones, capa e foto do hero
│   └── site.webmanifest
└── README.md
```

## Como funciona o estúdio

- **Editor por páginas**: capa, sumário e capítulos. Todo texto é editável direto na página
  (`contenteditable`), com blocos de parágrafo, subtítulo, lista, citação e destaque.
- **Design em tempo real**: 6 temas, 6 cores de destaque, 3 tipografias, 3 layouts, 3 formatos
  (A4, A5 e quadrado) e 3 artes de capa.
- **Autosave**: cada projeto é salvo no `localStorage`. O menu "Meus projetos" permite abrir,
  criar e excluir projetos.
- **IA**: por padrão usa o assistente local (`assets/js/ai.js`), que monta sumário e capítulos a
  partir do briefing — sem chave e sem enviar dados para fora. Opcionalmente é possível informar
  uma chave da OpenAI em *IA → Conectar uma IA em nuvem*; a chamada é feita direto do navegador.
- **Exportação**: PDF (via impressão do navegador, com tamanho de página correto), HTML
  autocontido, JSON do projeto e cópia do texto.

## Personalização

- Cores e fontes: `assets/css/base.css` (variáveis no `:root`).
- Logotipo: substitua `assets/img/logo.png` (versão clara, para fundos escuros) e
  `assets/img/logo-icon.png` (símbolo).
- Conteúdo da landing: textos em `index.html`.
- Modelos de e-book: array `TEMPLATES` em `assets/js/estudio.js`.
