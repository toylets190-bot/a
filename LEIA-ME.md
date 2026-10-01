# Santa Clara EC — site em várias páginas (GitHub Pages)

Separação do `index__34_.html` original. CSS idêntico, dados e lógica JS preservados.

## Como publicar
1. Crie um repositório no GitHub e envie **o conteúdo desta pasta** (index.html na raiz).
2. Settings → Pages → Branch `main` / pasta `/ (root)`.
3. Endereço: `https://USUARIO.github.io/NOME-DO-REPOSITORIO/`

## Páginas e onde ficou cada parte do HTML original
| Página | Conteúdo (ids originais) |
|---|---|
| index.html | hero da próxima partida + faixa de status + manifesto |
| noticias.html | #noticias |
| tabela.html | #tabela (classificação + #jogos "Últimos Resultados", lado a lado como no original) + #regulamento |
| jogos.html | #escalacao, #palpite, #simulador, #calendario, #transmissao |
| elenco.html | #elenco, #estatisticas, #comparador |
| estadio.html | #estadio, #guia-acesso |
| vou-ao-jogo.html | #vou-ao-jogo |
| ingressos.html | #ingressos |
| socio.html | #socio |
| loja.html | #loja |
| historia.html | #memorial (linha do tempo e troféus) |
| clube.html | #diretoria, #comunidade, #patrocinadores |
| torcida.html | #matilha, #arena, #galeria, #mural, #cartao, #missoes, #hino, #duvidas |

Em **todas** as páginas (repetidos): ícones SVG, topbar, header, menu mobile, avisos, rodapé e todos os modais
(busca, carrinho, Meu Clube, sócio, login, área do sócio, admin, guia, lightbox).

## Arquivos
- `css/style.css` — CSS original, sem alteração (linhas 16–1254).
- `data/db.js` — objeto `DB` (notícias, tabela, resultados, elenco, produtos, etc.), sem alteração.
- `js/app.js` — 1º script original (renderizações, modais, busca, menu, admin, Vou ao Jogo).
- `js/pages.js` — 2º script original (login/sócio, loja, comunidade, Matilha/nx).
- `js/multipage.js` — NOVO, pequeno: faz cada render só agir na página que tem o contêiner (`data-page`),
  leva o setor do Estádio para Ingressos, guarda o tema entre páginas e rola até `#âncora`.
- `assets/` — vazio (todas as imagens do original são links externos ou data-URI).

## Alterações no código original (só estas)
- `app.js`: `goSection()` agora abre a página certa quando a seção não está na página atual (+ mapa `SECTION_PAGE`);
  um `scrollIntoView` direto virou `goSection('guia-acesso')`.
- `pages.js`: link `#socio` → `socio.html#socio`; início da Matilha só desenha painéis presentes na página.
- HTML: links `#seção` do menu/rodapé apontam para `pagina.html`; botões com `scrollIntoView` usam `goSection`.
