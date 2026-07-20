// Carregador único. Versão vem de window.APP_VERSION (definida no index.html).
// Bump APP_VERSION lá → recarrega TODOS os js de uma vez (fura cache).
// async=false garante execução na ordem: core → páginas → infra(boot por último).
(function(){
  var V = window.APP_VERSION || '0';
  var files = [
    'core',
    'page-login',
    'page-home',
    'page-dashboard',
    'page-palpites',
    'page-apostas',
    'page-ranking',
    'page-palpites2',   // sobrescreve page-palpites (chave "palpites" duplicada)
    'page-admin',
    'page-chaveamento',
    'page-hall',
    'page-resultados',
    'page-perfil',
    'page-config',
    'page-regras',
    'page-apostas_dia',
    'infra'             // esc, RPCs Supabase, Sess, init + boot — sempre por último
  ];
  files.forEach(function(name){
    var s = document.createElement('script');
    s.src = 'js/' + name + '.js?v=' + V;
    s.async = false; // preserva ordem
    document.head.appendChild(s);
  });
})();
