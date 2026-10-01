/* =========================================================
   multipage.js — camada mínima para o site em várias páginas
   Carregado por último em todas as páginas (depois de db.js, app.js e pages.js).
   Não altera a lógica original; apenas:
   1) faz cada função de renderização agir só quando o seu contêiner existe na página
      (o <body> de cada página traz data-page="...");
   2) leva o setor escolhido em Estádio até a página de Ingressos;
   3) mantém o tema claro/escuro ao trocar de página;
   4) rola até a âncora (#seção) depois que o conteúdo dinâmico foi desenhado.
   ========================================================= */
(function () {
  var PAGE = document.body.getAttribute('data-page') || '';

  /* 1) contêiner de cada renderização */
  var CONTAINER = {
    initCountdown: 'cdDays',
    renderNews: 'mainFeaturedNews',
    renderStandings: 'standingsBody',
    renderResults: 'resultsList',
    renderSquad: 'squadContainer',
    initSeats: 'ticketSectorsGrid',
    renderTicketSectors: 'ticketSectorsGrid',
    updateTicketSummary: 'totalTicketPrice',
    renderStore: 'storeContainer',
    renderHistoryAndTrophies: 'timelineList',
    renderBoardAndStaff: 'boardList',
    renderGates: 'gatesList',
    renderStatsPanels: 'statsTopScorers',
    renderBroadcast: 'broadcastHero',
    renderRegulation: 'regulationList',
    renderGuideStatic: 'guideServiceGrid',
    renderVouAoJogo: 'vajSummary',
    renderSocialProjects: 'socialCampaignsList',
    renderSponsors: 'sponsorsList',
    showSectorInfo: 'sectorNameTitle'
  };
  Object.keys(CONTAINER).forEach(function (name) {
    var orig = window[name];
    if (typeof orig !== 'function') return;
    window[name] = function () {
      if (!document.getElementById(CONTAINER[name])) return;
      return orig.apply(this, arguments);
    };
  });

  /* 2) "Comprar ingresso para este setor": guarda o setor e aplica ao abrir Ingressos */
  var origSelect = window.selectTicketSector;
  if (typeof origSelect === 'function') {
    window.selectTicketSector = function (key) {
      if (!document.getElementById('ticketSectorsGrid')) {
        try { sessionStorage.setItem('scec_pending_sector', key); } catch (e) {}
        return;
      }
      return origSelect.apply(this, arguments);
    };
  }
  document.addEventListener('DOMContentLoaded', function () {
    if (!document.getElementById('ticketSectorsGrid')) return;
    var k = null;
    try { k = sessionStorage.getItem('scec_pending_sector'); sessionStorage.removeItem('scec_pending_sector'); } catch (e) {}
    if (k && typeof SECTOR_DATA !== 'undefined' && SECTOR_DATA[k]) window.selectTicketSector(k);
  });

  /* 3) tema escolhido no botão "Tema" vale para todas as páginas */
  try {
    var th = localStorage.getItem('scec_theme');
    if (th === 'light' || th === 'dark') document.documentElement.setAttribute('data-theme', th);
  } catch (e) {}
  document.addEventListener('DOMContentLoaded', function () {
    var b = document.getElementById('themeToggleBtn');
    if (b) b.addEventListener('click', function () {
      try { localStorage.setItem('scec_theme', document.documentElement.getAttribute('data-theme')); } catch (e) {}
    });
  });

  /* 4) âncora ao chegar de outra página (ex.: estadio.html#guia-acesso) */
  window.addEventListener('load', function () {
    var h = decodeURIComponent(location.hash.replace(/^#/, ''));
    if (!h || h === 'admin') return;
    var el = document.getElementById(h);
    if (el) el.scrollIntoView();
  });
})();
