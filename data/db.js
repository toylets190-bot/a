    /* =========================================================
       1. BANCO DE DADOS EM MEMÓRIA
       ========================================================= */
    const DB = {
      news: [
        {
          id: 1, category: 'FUTEBOL', date: '26 SET 2026',
          title: 'Santa Clara aprimora bloco defensivo e transição rápida antes do Clássico do Vale',
          excerpt: 'Com foco total no confronto diante do Atlético de Araçuaí, comissão técnica intensificou trabalho de contra-ataque e recuperação de posse.',
          image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=800&auto=format&fit=crop',
          content: 'O elenco do Santa Clara Esporte Clube realizou na manhã deste sábado a última sessão antes do Clássico do Vale. O técnico destacou a necessidade de manutenção do bloco baixo e velocidade nas transições — marca registrada do Lobo.'
        },
        {
          id: 2, category: 'CLUBE', date: '24 SET 2026',
          title: 'Santa Clara EC oficializa renovação do patrocínio master com o Banco ValeMais',
          excerpt: 'Acordo vigente até 2028 garante investimentos no futebol de base e na modernização do Estádio Vale de Santa Clara.',
          image: 'https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?q=80&w=600&auto=format&fit=crop',
          content: 'O Banco ValeMais renova o vínculo como patrocinador master do Santa Clara até 2028, consolidando uma parceria que financia projetos na base e obras no estádio.'
        },
        {
          id: 3, category: 'TORCIDA', date: '22 SET 2026',
          title: 'Terror do Vale prepara mosaico e Túnel do Lobo decorado para o clássico',
          excerpt: 'A Matilha promete recepção histórica com bandeirões azuis e marrons e iluminação especial no acesso subterrâneo.',
          image: 'https://images.unsplash.com/photo-1471295253337-3ceaaedca402?q=80&w=600&auto=format&fit=crop',
          content: 'A torcida organizada Terror do Vale confirmou a montagem de um mosaico especial para o Clássico do Vale, além de decoração no Túnel do Lobo com as cores do clube.'
        },
        {
          id: 4, category: 'BASE', date: '20 SET 2026',
          title: 'Sub-20 goleia Araçuaí por 3 a 0 na Copa do Vale do Jequitinhonha',
          excerpt: 'Garotos da base mostram a força da identidade regional e avançam à semifinal da competição.',
          image: 'https://images.unsplash.com/photo-1517927033932-b3d18e61fb3a?q=80&w=600&auto=format&fit=crop',
          content: 'Com três gols de atletas formados nas escolinhas do clube, o Sub-20 do Santa Clara venceu o Atlético de Araçuaí e avançou à semifinal da Copa do Vale do Jequitinhonha.'
        },
        {
          id: 5, category: 'FUTEBOL', date: '29 SET 2026',
          title: 'Rafael Veloz chega a 22 gols na temporada e segue isolado na artilharia',
          excerpt: 'O camisa 9, o Lobo da Área, é o grande nome do ataque do Santa Clara e entra em campo domingo em busca do 23º gol.',
          image: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=600&auto=format&fit=crop',
          content: 'Camisa 9 do Santa Clara, Rafael Veloz soma 22 gols na temporada, bem à frente do segundo colocado no elenco, Eder Cunha, com 12. O Lobo da Área chega ao Clássico do Vale como principal referência ofensiva do time, e a torcida já pode votar no craque do jogo aqui no site.'
        },
        {
          id: 6, category: 'CLUBE', date: '30 SET 2026',
          title: 'Portões abrem às 13h30 no Clássico do Vale; veja como chegar à Toca do Lobo',
          excerpt: 'A orientação é chegar cedo para evitar fila. O ingresso é geral por setor: o torcedor senta onde quiser dentro do setor escolhido.',
          image: 'https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?q=80&w=600&auto=format&fit=crop',
          content: 'Para o Clássico do Vale, os portões do Estádio Vale de Santa Clara abrem às 13h30. O ingresso é geral por setor, sem assento marcado, e quem compra o Camarote ganha uma vaga no estacionamento exclusivo. A seção Vou ao Jogo reúne o passo a passo do dia da partida.'
        },
        {
          id: 7, category: 'TORCIDA', date: '28 SET 2026',
          title: 'Bateria da Matilha ensaia cânticos e promete esquentar a Toca do Lobo',
          excerpt: 'A Terror do Vale prepara repertório novo para o Clássico do Vale, sem abrir mão do hino e dos gritos de sempre.',
          image: 'https://images.unsplash.com/photo-1471295253337-3ceaaedca402?q=80&w=600&auto=format&fit=crop',
          content: 'A bateria da Matilha ensaia durante a semana para o Clássico do Vale. Quem quiser entrar no clima pode tocar a bateria na Arena da Matilha e cantar o hino na seção Hino e Cânticos, aqui no site.'
        },
        {
          id: 8, category: 'BASE', date: '27 SET 2026',
          title: 'Escolinhas do Vale abrem inscrições para novas turmas de base',
          excerpt: 'O trabalho com a base é um dos pilares do clube e já formou atletas que hoje vestem a camisa do Santa Clara.',
          image: 'https://images.unsplash.com/photo-1517927033932-b3d18e61fb3a?q=80&w=600&auto=format&fit=crop',
          content: 'As escolinhas do Santa Clara abrem inscrições para novas turmas. A base é um dos pilares do projeto do clube, e atletas formados nas escolinhas já aparecem no Sub-20 e na Copa do Vale do Jequitinhonha.'
        }
      ],

      // Para usar escudos reais: preencha "logo" com a URL da imagem do time
      // (ex: logo: 'https://exemplo.com/democrata-gv.png'). Enquanto vazio,
      // o site mostra um brasão provisório com as iniciais do clube.
      standings: [
        { pos: 1, name: 'Santa Clara EC',     logo: '', form: ['V', 'V', 'V', 'E', 'V'], j: 7, v: 6, sg: 11, pts: 19 },
        { pos: 2, name: 'Democrata GV',      logo: '', form: ['V', 'V', 'E', 'V', 'D'], j: 7, v: 5, sg: 12, pts: 16 },
        { pos: 3, name: 'Atl. Araçuaí',      logo: '', form: ['D', 'V', 'E', 'V', 'V'], j: 7, v: 4, sg:  6, pts: 13 },
        { pos: 4, name: 'Uberlândia EC',      logo: '', form: ['E', 'V', 'D', 'V', 'E'], j: 7, v: 4, sg:  4, pts: 13 },
        { pos: 5, name: 'Ipatinga FC',        logo: '', form: ['D', 'E', 'V', 'D', 'V'], j: 7, v: 3, sg:  2, pts: 10 },
        { pos: 6, name: 'EC Montes Claros',   logo: '', form: ['V', 'D', 'D', 'E', 'D'], j: 7, v: 3, sg: -1, pts:  9 },
        { pos: 7, name: 'Pouso Alegre FC',    logo: '', form: ['D', 'D', 'E', 'D', 'V'], j: 7, v: 2, sg: -5, pts:  7 },
        { pos: 8, name: 'Diamantina EC',      logo: '', form: ['E', 'D', 'D', 'V', 'D'], j: 7, v: 2, sg: -7, pts:  7 },
        { pos: 9, name: 'Muriaé Sport',       logo: '', form: ['D', 'D', 'D', 'E', 'D'], j: 7, v: 1, sg:-11, pts:  4 },
        { pos:10, name: 'Teófilo Otoni FC',   logo: '', form: ['D', 'D', 'D', 'D', 'D'], j: 7, v: 0, sg:-11, pts:  0 }
      ],

      results: [
        { scec: 2, opp: 0, oppName: 'Diamantina EC',    oppLogo: '', round: '7ª Rodada',  comp: 'Mineiro Módulo II' },
        { scec: 3, opp: 1, oppName: 'Teófilo Otoni FC', oppLogo: '', round: '6ª Rodada',  comp: 'Mineiro Módulo II' },
        { scec: 1, opp: 1, oppName: 'Democrata GV',     oppLogo: '', round: '5ª Rodada',  comp: 'Mineiro Módulo II' },
        { scec: 2, opp: 0, oppName: 'Muriaé Sport',     oppLogo: '', round: '4ª Rodada',  comp: 'Mineiro Módulo II' },
        { scec: 4, opp: 0, oppName: 'Ipatinga FC',      oppLogo: '', round: '3ª Rodada',  comp: 'Mineiro Módulo II' }
      ],

      // Para usar fotos reais dos jogadores: preencha "img" com a URL da foto
      // de cada atleta (ou use o Painel de Personalização no site). Vazio = foto padrão.
      players: [
        { id: 1,  name: 'Diego Firmeza',     nick: 'O Muralha do Vale',  num: 1,  pos: 'GOLEIRO',       age: 30, games: 38, goals: 0,  img: '', bio: 'Reflexos rápidos e liderança no gol. Insuperável na Toca do Lobo há 3 temporadas.' },
        { id: 2,  name: 'Marcelo Pedra',     nick: 'Pedreira',           num: 3,  pos: 'DEFENSOR',      age: 28, games: 34, goals: 2,  img: '', bio: 'Zagueiro de cabeça e carrinho certeiro. Âncora defensiva do clube.' },
        { id: 3,  name: 'Thiago Cerrado',    nick: 'Espinheiro',         num: 4,  pos: 'DEFENSOR',      age: 26, games: 32, goals: 1,  img: '', bio: 'Posicionamento exemplar e saída de bola limpa.' },
        { id: 4,  name: 'Bruno Arêdes',      nick: 'Corredeira',         num: 6,  pos: 'DEFENSOR',      age: 22, games: 29, goals: 3,  img: '', bio: 'Lateral esquerdo com arrancadas explosivas pelo flanco.' },
        { id: 5,  name: 'Kleber Vale',       nick: 'O Médico do Vale',   num: 5,  pos: 'MEIO-CAMPISTA', age: 29, games: 40, goals: 6,  img: '', bio: 'Volante inteligente, recupera bolas e inicia transições.' },
        { id: 6,  name: 'Jonas Travessão',   nick: 'Parede',             num: 8,  pos: 'MEIO-CAMPISTA', age: 25, games: 36, goals: 9,  img: '', bio: 'Meia de ligação com passe em profundidade e chutes rasteiros.' },
        { id: 7,  name: 'Rafael Veloz',      nick: 'Lobo da Área',       num: 9,  pos: 'ATACANTE',      age: 24, games: 40, goals: 22, img: '', bio: 'Centroavante de velocidade e frieza nas finalizações. Ídolo da Matilha.' },
        { id: 8,  name: 'Eder Cunha',        nick: 'Corta-Vento',        num: 11, pos: 'ATACANTE',      age: 21, games: 30, goals: 12, img: '', bio: 'Ponta direita de drible rápido e cruzamentos na medida.' },
        { id: 9,  name: 'Paulo Ribeiro',     nick: 'Farol',              num: 12, pos: 'GOLEIRO',        age: 23, games: 10, goals: 0,  img: '', bio: 'Goleiro reserva com reflexos impressionantes.' },
        { id: 10, name: 'Leandro Caatinga',  nick: 'Espinho',            num: 14, pos: 'DEFENSOR',      age: 20, games: 16, goals: 0,  img: '', bio: 'Lateral direito ágil, revelação da base do clube.' },
        { id: 11, name: 'Henrique Afluente', nick: 'Correnteza',         num: 15, pos: 'MEIO-CAMPISTA', age: 27, games: 28, goals: 4,  img: '', bio: 'Meio-campista de box-to-box incansável nos 90 minutos.' },
        { id: 12, name: 'Fábio Carrasco',    nick: 'Rapel',              num: 17, pos: 'MEIO-CAMPISTA', age: 24, games: 22, goals: 3,  img: '', bio: 'Especialista em bola parada e cobranças de falta.' },
        { id: 13, name: 'Matheus Jequi',     nick: 'Canhão',             num: 19, pos: 'ATACANTE',      age: 19, games: 14, goals: 7,  img: '', bio: 'Joia da base. Atacante jovem com finalização potente.' },
        { id: 14, name: 'André Muranga',     nick: 'Bloco',              num: 22, pos: 'DEFENSOR',      age: 30, games: 20, goals: 1,  img: '', bio: 'Zagueiro experiente e veterano do elenco. Calmo e preciso.' },
        { id: 15, name: 'Davi Minas',        nick: 'Barravento',         num: 25, pos: 'DEFENSOR',      age: 21, games: 12, goals: 0,  img: '', bio: 'Zagueiro jovem versátil, cobre as duas laterais.' },
        { id: 16, name: 'Rodrigo Lobo',      nick: 'Uivante',            num: 27, pos: 'MEIO-CAMPISTA', age: 26, games: 24, goals: 5,  img: '', bio: 'Segundo volante de presença física e coragem no duelo.' },
        { id: 17, name: 'César Marrom',      nick: 'Terra',              num: 30, pos: 'MEIO-CAMPISTA', age: 28, games: 30, goals: 2,  img: '', bio: 'Primeiro volante destruidor. Referência na marcação.' },
        { id: 18, name: 'Felipe Raiz',       nick: 'Asa',                num: 33, pos: 'ATACANTE',      age: 20, games: 17, goals: 6,  img: '', bio: 'Atacante de ponta com velocidade e saída rápida.' },
        { id: 19, name: 'Samuel Vão',        nick: 'Rocha',              num: 35, pos: 'ATACANTE',      age: 27, games: 18, goals: 5,  img: '', bio: 'Centroavante de referência física e duelo no ar.' },
        { id: 20, name: 'Leo Guarani',       nick: 'Filhote',            num: 99, pos: 'GOLEIRO',       age: 18, games: 5,  goals: 0,  img: '', bio: 'Terceiro goleiro e capitão do Sub-20. Promessa do Vale.' }
      ],

      products: [
        { id: 1,  cat: 'Mantos',     badge: 'Mais vendido', sizes: ['P','M','G','GG'], name: 'Manto Titular 2026 — Azul-Escuro',   price: 279.90, img: 'https://images.unsplash.com/photo-1580087433295-ab2600c1030e?q=80&w=400&auto=format&fit=crop' },
        { id: 2,  cat: 'Mantos',     sizes: ['P','M','G','GG'], name: 'Manto Reserva 2026 — Branco',        price: 279.90, img: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=400&auto=format&fit=crop' },
        { id: 3,  cat: 'Mantos',     badge: 'Novo', sizes: ['P','M','G','GG'], name: 'Terceiro Uniforme — Marrom do Vale',  price: 299.90, img: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=400&auto=format&fit=crop' },
        { id: 7,  cat: 'Mantos',     sizes: ['P','M','G','GG'], emoji: '👕', name: 'Camisa de Treino 2026 — Cinza', price: 179.90, imgur: '66xL9HP', img: 'https://i.imgur.com/66xL9HP.jpg' },
        { id: 11, cat: 'Mantos',     sizes: ['P','M','G','GG'], emoji: '🧥', name: 'Agasalho de Viagem Matilha', price: 349.90, imgur: 'XtGCK3r', img: 'https://i.imgur.com/XtGCK3r.jpg' },
        { id: 4,  cat: 'Torcida',    name: 'Boné Aba Curva SCEC Azul',           price: 89.90,  img: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?q=80&w=400&auto=format&fit=crop' },
        { id: 5,  cat: 'Torcida',    name: 'Cachecol Oficial Toca do Lobo',      price: 69.90,  img: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=400&auto=format&fit=crop' },
        { id: 8,  cat: 'Torcida',    emoji: '🚩', name: 'Bandeira Oficial 1,5 m — Matilha', price: 79.90, imgur: 'PVIh9Ut', img: 'https://i.imgur.com/PVIh9Ut.jpg' },
        { id: 12, cat: 'Torcida',    badge: 'Combo', emoji: '🎁', name: 'Combo Boné + Cachecol', price: 139.90, imgur: '5QHJBV3', img: 'https://i.imgur.com/5QHJBV3.jpg' },
        { id: 6,  cat: 'Acessórios', name: 'Caneca Térmica Lobo-Guará',          price: 64.90,  img: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=400&auto=format&fit=crop' },
        { id: 9,  cat: 'Acessórios', emoji: '🎒', name: 'Mochila Toca do Lobo', price: 149.90, imgur: 'j3bpnqg', img: 'https://i.imgur.com/j3bpnqg.jpg' },
        { id: 10, cat: 'Acessórios', emoji: '🔑', name: 'Chaveiro Lobo-Guará', price: 24.90, imgur: '2fTFt2G', img: 'https://i.imgur.com/2fTFt2G.jpg' }
      ],

      timeline: [
        { year: 2000, title: 'Fundação do Santa Clara EC',    desc: 'Nasce no Vale do Jequitinhonha o Santa Clara Esporte Clube, com a missão de representar sua gente.' },
        { year: 2003, title: 'Primeira Participação Estadual', desc: 'Estreia histórica no Campeonato Mineiro. O clube começa a construir sua identidade regional.' },
        { year: 2007, title: 'Inauguração da Toca do Lobo',   desc: 'O Estádio Vale de Santa Clara é inaugurado com 25 mil lugares. A Toca do Lobo entra no imaginário do Vale.' },
        { year: 2015, title: 'Título da Copa do Vale',        desc: 'Primeira conquista da Copa do Vale do Jequitinhonha. A Matilha festeja o primeiro grande título regional.' },
        { year: 2024, title: 'Era SAF — Nova Fase',           desc: 'Estruturação como SAF. Novo projeto profissional, elenco renovado e ambições no Módulo II mineiro.' }
      ],

      trophies: [
        { name: 'Copa do Vale do Jequitinhonha', year: '2015, 2019, 2022', count: '3x',  icon: '🏆', img: '' },
        { name: 'Campeonato Mineiro Módulo II',  year: '2018',             count: '1x',  icon: '🥇', img: '' },
        { name: 'Torneio Início — AMVJ',         year: '2012, 2016',       count: '2x',  icon: '🏅', img: '' },
        { name: 'Clássico do Vale',              year: '16 vitórias',      count: '16V', icon: '🐺', img: '' }
      ],

      // Diretoria, comissão técnica e nota sobre a SAF — pensados para transmitir
      // transparência a torcedores e investidores. Fotos: preencha "photo" com a URL.
      safInfo: 'O Santa Clara Esporte Clube opera sob o modelo de SAF (Sociedade Anônima do Futebol) desde 2024, com capital aberto a investidores e gestão profissionalizada separada da associação civil — garantindo transparência financeira e mais atratividade para novos aportes.',

      board: [
        { name: 'Marcos Aurélio Ferraz',     role: 'Presidente',                                  photo: '', bio: 'À frente do clube desde 2022, conduziu a estruturação da SAF e a reforma do estádio.' },
        { name: 'Helena Camargo Reis',        role: 'Vice-Presidente / Diretora Financeira',        photo: '', bio: 'Responsável pela gestão financeira e pela captação de patrocínios do clube.' },
        { name: 'Rogério "Rogerinho" Andrade', role: 'Diretor de Futebol',                          photo: '', bio: 'Ex-jogador do Santa Clara, hoje comanda o planejamento esportivo do elenco.' },
        { name: 'Cíntia Marques Tavares',      role: 'Diretora de Marketing e Relações com a Torcida', photo: '', bio: 'Cuida da comunicação, dos patrocínios e dos projetos sociais do clube.' }
      ],

      technicalStaff: [
        { name: 'Warley Nogueira',    role: 'Técnico Principal',      photo: '', bio: 'No comando desde 2024, implantou o bloco baixo defensivo que é marca registrada da equipe.' },
        { name: 'Adilson Praxedes',   role: 'Auxiliar Técnico',       photo: '', bio: 'Braço direito de Warley Nogueira, comanda os treinos de bola parada e a análise de vídeo dos adversários.' },
        { name: 'Vinícius Homem',     role: 'Preparador Físico',      photo: '', bio: 'Responsável pela periodização física do elenco e pela prevenção de lesões ao longo da temporada.' },
        { name: 'Camila Estanislau',  role: 'Fisioterapeuta',         photo: '', bio: 'Cuida da recuperação e reabilitação dos atletas no departamento médico da Toca do Lobo.' }
      ],

      // Portões de acesso ao estádio. Para usar fotos reais, preencha "img"
      // com a URL de cada portão (ou placa/entrada correspondente).
      gates: [
        { name: 'Portão B — Setor Verde',      sector: 'VERDE',      desc: 'Entrada final da torcida popular pelo Túnel do Lobo.', img: '' },
        { name: 'Portão A — Setor Roxo',       sector: 'ROXO',       desc: 'Acesso intermediário, arquibancada lateral.',         img: '' },
        { name: 'Portão D — Setor Azul',       sector: 'AZUL',       desc: 'Arquibancada principal, visão frontal do campo.',     img: '' },
        { name: 'Portão C — Visitante',        sector: 'VISITANTE', desc: 'Acesso separado e controlado da torcida visitante.',  img: '' },
        { name: 'Portão VIP — Camarotes',      sector: 'CAMAROTE',  desc: 'Entrada exclusiva para camarotes e área VIP.',        img: '' }
      ],

      // Ranking fictício de cartões da temporada.
      cardsRanking: [
        { name: 'César Marrom',   yellow: 9, red: 1 },
        { name: 'Marcelo Pedra',  yellow: 7, red: 0 },
        { name: 'Kleber Vale',    yellow: 6, red: 0 },
        { name: 'Bruno Arêdes',   yellow: 5, red: 1 },
        { name: 'Rodrigo Lobo',   yellow: 4, red: 0 }
      ],

      // Parceiros de transmissão. Para usar logos reais, preencha "logo".
      broadcast: [
        { name: 'SportiNet', tier: 'TV 1 • Transmissão principal', icon: '📺', logo: 'https://i.imgur.com/iNm5UJX.jpg', imgur: 'iNm5UJX',
          desc: 'A TV principal da partida do Santa Clara, com a transmissão completa do jogo.' },
        { name: 'SuperSports', tier: 'TV 2 • Segunda opção', icon: '📺', logo: 'https://i.imgur.com/oQe6kWN.jpg', imgur: 'oQe6kWN',
          desc: 'A segunda TV para acompanhar o jogo, uma alternativa ao canal principal.' },
        { name: 'Pop 96', tier: 'Rádio 1 • Alta qualidade', icon: '🎧', logo: '',
          desc: 'A melhor rádio para ouvir o jogo: áudio em alta qualidade e o resultado da partida no próprio site da rádio.' },
        { name: 'Rádio Oficial do Estádio', tier: 'Rádio 2 • Sinal oficial', icon: '📻', logo: '',
          desc: 'A emissora oficial da Toca do Lobo distribui o sinal para várias rádios e dá acesso a 3 emissoras, mas com qualidade de áudio mais baixa.' }
      ],

      // Explicação do formato de disputa do Módulo II.
      regulation: [
        { title: 'Fase de Grupos',   desc: 'As equipes são divididas em grupos e jogam entre si em turno único ou returno, somando pontos por vitória (3), empate (1) e derrota (0).' },
        { title: 'Fase Final',       desc: 'Os melhores colocados de cada grupo avançam a uma fase de mata-mata (quartas, semifinal e final) para decidir o campeão do Módulo II.' },
        { title: 'Acesso ao Módulo I', desc: 'O campeão — e, em alguns formatos, o vice — garante o acesso à elite do Campeonato Mineiro na temporada seguinte.' },
        { title: 'Critérios de Desempate', desc: 'Em caso de igualdade em pontos, valem nesta ordem: número de vitórias, saldo de gols, gols marcados e confronto direto.' }
      ],

      notifications: [
        { text: '🎟 Novo lote de ingressos para o Clássico do Vale disponível!', time: 'Há 15 min' },
        { text: '🐺 Seus 200 pontos de fidelidade foram creditados.',             time: 'Há 3 horas' },
        { text: '👕 Terceiro Uniforme Marrom disponível com frete grátis.',       time: 'Ontem'      }
      ],

      // Para usar logos reais dos patrocinadores: preencha "logo" com a URL
      // da imagem. Enquanto vazio, o site mostra um ícone provisório.
      sponsors: [
        { tier: 'Patrocinador Master', name: 'Banco ValeMais', logo: '', icon: '🏦',
          desc: 'Financia obras de reforma do Estádio Vale de Santa Clara e mantém o vínculo como patrocinador master até 2028.',
          url: 'https://www.bancovalemais.com.br' },
        { tier: 'Patrocinador Oficial', name: 'Laticínios Serra do Vale', logo: '', icon: '🥛',
          desc: 'Fornece o kit lanche dos atletas da base e apoia o projeto social "Futebol nas Vilas do Vale".',
          url: 'https://www.laticiniosserradovale.com.br' },
        { tier: 'Apoio Institucional', name: 'Mineração Jequitinhonha', logo: '', icon: '⛏️',
          desc: 'Custeia o transporte da delegação nas partidas fora de casa pelo Vale do Jequitinhonha.',
          url: 'https://www.mineracaojequitinhonha.com.br' },
        { tier: 'Fornecedor Oficial', name: 'Auto Peças Lobo Forte', logo: '', icon: '🔧',
          desc: 'Parceiro na manutenção da frota de ônibus do clube e fornecedor oficial de autopeças.',
          url: 'https://www.autopecaslobo.com.br' }
      ]
    };
