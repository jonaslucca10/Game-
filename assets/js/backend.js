/* ==========================================================================
   E-books Studio — backend.js
   Configuração do Supabase (autenticação + créditos).

   A chave abaixo é a "publishable/anon": ela é pública por natureza e só
   permite o que as políticas de RLS autorizam. NUNCA coloque a service_role
   aqui — essa, sim, é secreta.
   ========================================================================== */
(function () {
  'use strict';

  const CONFIG = {
    url: 'https://rzgiqnvwaovqtiggxdxe.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6Z2lxbnZ3YW92cXRpZ2d4ZHhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM1NDQ5ODgsImV4cCI6MjEwOTEyMDk4OH0.9e8vidBfKO9rY-Kx2DHyeu6THk9RFIkNreA3xcKq_24',
    sdk: [
      'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js',
      'https://unpkg.com/@supabase/supabase-js@2/dist/umd/supabase.js'
    ]
  };

  let cliente = null;
  let carregando = null;

  function carregarScript(src) {
    return new Promise((resolve, reject) => {
      const el = document.createElement('script');
      el.src = src;
      el.async = true;
      el.onload = () => resolve(src);
      el.onerror = () => reject(new Error('Falha ao carregar ' + src));
      document.head.append(el);
    });
  }

  async function clientePronto() {
    if (cliente) return cliente;
    if (carregando) return carregando;

    carregando = (async () => {
      if (!window.supabase || !window.supabase.createClient) {
        for (const src of CONFIG.sdk) {
          try {
            await carregarScript(src);
            if (window.supabase && window.supabase.createClient) break;
          } catch (e) {
            console.warn('E-books Studio: não foi possível carregar', src);
          }
        }
      }
      if (!window.supabase || !window.supabase.createClient) {
        throw new Error('SDK_INDISPONIVEL');
      }

      cliente = window.supabase.createClient(CONFIG.url, CONFIG.anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storageKey: 'ebs_auth_v1'
        }
      });
      return cliente;
    })();

    return carregando;
  }

  window.EbooksBackend = { CONFIG, clientePronto };
})();
