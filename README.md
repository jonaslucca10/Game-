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
| `estudio.html` | Estúdio de criação (editor de e-books) com autosave local e planos por licença. |
| `checkout.html` | Assinatura: escolha de plano/período, resumo do pedido e envio ao checkout do provedor. |
| `acesso.html` | Ativação do código de acesso (licença) recebido após a compra. |
| `admin/licencas.html` | Painel interno (noindex): gera códigos de acesso e o bloco de hashes para publicar. |
| `404.html` | Página de erro personalizada. |

Atalhos úteis para abrir o estúdio já configurado:

- `estudio.html?modo=manual` · `?modo=ia` · `?modo=hibrido`
- `estudio.html?template=guia|copy|autoridade|financas|ia|metodo`

## Estrutura

```
.
├── index.html
├── estudio.html
├── checkout.html
├── acesso.html
├── 404.html
├── robots.txt
├── vercel.json
├── admin/
│   └── licencas.html       # gerador de códigos de acesso (interno)
├── assets/
│   ├── css/
│   │   ├── base.css        # tokens de design, reset e componentes compartilhados
│   │   ├── landing.css     # estilos da landing page
│   │   ├── estudio.css     # estilos do editor (inclui CSS de impressão/PDF e planos)
│   │   └── paginas.css     # estilos de checkout, ativação e painel de licenças
│   ├── js/
│   │   ├── main.js         # interações da landing (menu, reveal, planos, blog, FAQ)
│   │   ├── ai.js           # motor de escrita: geração local e integração opcional em nuvem
│   │   ├── estudio.js      # estado, edição, templates, autosave, exportação e limites de plano
│   │   ├── licenca.js      # planos, validação de código e armazenamento da licença
│   │   ├── licencas.js     # lista de hashes dos códigos emitidos (editável)
│   │   ├── pagamento.js    # links de checkout (Hotmart/Kiwify) e contato de suporte
│   │   ├── checkout.js     # lógica da página de assinatura
│   │   ├── acesso.js       # ativação/remoção da licença
│   │   └── admin-licencas.js # geração de códigos no painel interno
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

## Planos, pagamentos e licenças

O site é estático, então **não existe cobrança embutida**: o pagamento acontece no checkout
hospedado do provedor (Hotmart ou Kiwify) e a liberação do plano vem de um **código de acesso**.
Nada é liberado sem licença válida.

### 1. Configurar o checkout

Edite `assets/js/pagamento.js` e preencha os links de pagamento de cada plano/período:

```js
window.EBOOKS_PAGAMENTO = {
  provedor: 'hotmart',
  links: {
    'profissional-mensal': 'https://pay.hotmart.com/SEU_LINK',
    'profissional-anual': 'https://pay.hotmart.com/SEU_LINK_ANUAL',
    'studio-mensal': 'https://pay.hotmart.com/SEU_LINK_STUDIO',
    'studio-anual': ''
  },
  suporte: { email: 'contato@ebooksstudio.com.br', whatsapp: '' }
};
```

Enquanto um link estiver vazio, o botão de pagamento daquele plano fica **desativado** e a página
avisa que o checkout não está configurado — nunca libera o plano de graça.

### 2. Emitir o código depois da venda

Abra `/admin/licencas.html`, escolha plano, quantidade e validade, clique em **Gerar códigos** e:

1. envie o código ao cliente (e-mail ou WhatsApp) — o formato é `EBS-PRO-XXXX-XXXX-XXXX`;
2. copie o bloco gerado para dentro do array em `assets/js/licencas.js` e publique.

O site guarda apenas o **SHA-256** de cada código: sem o bloco publicado o código não é reconhecido,
e o código em si nunca aparece no repositório.

### 3. Como o cliente ativa

`acesso.html` (ou o botão de plano dentro do estúdio) → cola o código → o plano é gravado no
`localStorage` com a validade. O mesmo código pode ser ativado em outros navegadores.

### O que cada plano libera

| Recurso | Essencial (grátis) | Profissional | Studio |
| --- | --- | --- | --- |
| Projetos salvos | 1 | ilimitados | ilimitados |
| Modelos prontos | 5 (o modelo `metodo` é premium) | todos | todos |
| Temas e capas | básicos | todos | todos |
| Criação com IA | sim, paga com créditos | sim, paga com créditos | sim, paga com créditos |
| Exportação | PDF com marca d’água | PDF sem marca d’água + HTML | idem |
| Equipe | — | — | sim (selo no painel) |

### Limite conhecido

A licença é validada no navegador. Um código não pode ser **forjado**, mas pode ser compartilhado
por quem o recebeu, e não há controle de dispositivos nem assinatura recorrente. Para isso seria
necessário um backend (por exemplo, uma função no Vercel + banco de dados validando o código a cada
acesso).

## Personalização

- Cores e fontes: `assets/css/base.css` (variáveis no `:root`).
- Logotipo: substitua `assets/img/logo.png` (versão clara, para fundos escuros) e
  `assets/img/logo-icon.png` (símbolo).
- Conteúdo da landing: textos em `index.html`.
- Modelos de e-book: array `TEMPLATES` em `assets/js/estudio.js`.

## Contas e créditos (Supabase)

O estúdio **só abre com uma conta logada**. O login fica em `login.html` e aceita criar conta
com **nome de usuário + e-mail + senha**, entrar com e-mail e senha e (quando configurado)
entrar com o Google. A sessão é validada no servidor a cada visita por `assets/js/estudio-gate.js`,
então apagar o `localStorage` não libera o editor.

- Toda conta nova nasce com **100 créditos** (trigger `on_auth_user_created` no banco).
- As ações de IA descontam créditos de verdade no Supabase, pela função `gastar_creditos`
  (atômica, não dá para burlar pelo console): e-book completo = 10, sumário = 2, página = 2.
- A tabela de preços fica em `assets/js/creditos.js` (`CUSTOS`) e o saldo aparece no chip do
  estúdio e em `conta.html` (extrato incluído).
- Chaves: `assets/js/backend.js` guarda apenas a URL do projeto e a **anon key** (pública).
  A `service_role` nunca deve ir para o frontend.

### Login com Google (pendente)

Falta criar um cliente OAuth no Google Cloud e colar o *client id*/*secret* em
**Supabase → Authentication → Providers → Google**, adicionando
`https://rzgiqnvwaovqtiggxdxe.supabase.co/auth/v1/callback` como redirect URI.
Enquanto isso o botão do Google aparece desabilitado com aviso.

### Configuração aplicada no Supabase

- Site URL: `https://ebooks-studio.vercel.app`; redirects liberados para o domínio de produção e
  `http://localhost:3000/**`.
- Confirmação de e-mail **desligada** (o SMTP padrão do Supabase não entrega); senha mínima de 6
  caracteres. Ao configurar um SMTP próprio, reative a confirmação.
