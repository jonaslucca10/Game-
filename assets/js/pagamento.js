/* ==========================================================================
   E-books Studio — pagamento.js
   Configuração do checkout (Hotmart ou Kiwify).

   Passo a passo para ativar a cobrança:
   1. Crie um produto na Hotmart (ou Kiwify) para cada plano/período.
   2. Copie o link de checkout de cada produto.
   3. Cole os links abaixo entre as aspas.
   4. Salve e publique. O botão do checkout passa a abrir o pagamento.

   Enquanto um link estiver vazio, o botão fica desativado e avisa que o
   pagamento ainda não está configurado — nunca libera o plano de graça.
   ========================================================================== */
window.EBOOKS_PAGAMENTO = {
  provedor: 'hotmart', // 'hotmart' ou 'kiwify' (só muda o texto exibido)

  // chave: plano + período
  links: {
    'profissional-mensal': '',
    'profissional-anual': '',
    'studio-mensal': '',
    'studio-anual': ''
  },

  // Pagamento manual (opcional): usado como alternativa quando não há link
  pix: {
    chave: '',            // chave Pix (e-mail, telefone, aleatória ou CNPJ)
    titular: '',          // nome de quem recebe
    whatsapp: ''          // WhatsApp com DDD, ex.: 11999998888
  },

  suporte: {
    email: 'contato@ebooksstudio.com.br',
    whatsapp: ''          // WhatsApp com DDD
  },

  garantiaDias: 7
};
