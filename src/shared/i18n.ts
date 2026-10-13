import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const pt = {
  common: {
    menu: 'Menu',
    back: 'Voltar',
    continue: 'Continuar',
    start: 'Comecar',
    room: 'Sala',
    sword: 'Espada',
    arrows: 'flechas',
    noArrows: '(sem flechas)',
    weapons: 'Armas',
    health: 'Vida',
    shield: 'Escudo',
    pause: 'Pausar',
    crouch: 'Agachar',
    attack: 'Atacar',
    dash: 'Saltar',
    joystick: 'Joystick',
    close: 'Fechar',
  },
  home: {
    record: (best: number) => `Recorde: sala ${best}`,
    play: 'Play',
    character: 'Loja de skins',
    rubies: (count: number) => `Moedas vermelhas: ${count}`,
    multiplayer: 'Multiplayer',
    settings: 'Configurações',
    settingsDescription: 'Preferências visuais do jogo.',
    bloodColor: 'Cor do sangue',
    graphics: 'Gráficos',
    graphicsQuality: { high: 'Alto', medium: 'Médio', low: 'Baixo' },
    graphicsHint: 'Mais baixo: menos nitidez, jogo mais leve.',
    blur: 'Desfoque de movimento',
    blurHint: 'Borrão no salto, no golpe e na perseguição.',
    crows: 'Corvos',
    graphicsNote: 'Vale a partir da próxima partida.',
    language: 'Idioma',
    languageName: 'Português',
    changeLanguage: 'Trocar para inglês',
    instructions:
      'WASD ou setas para andar. Chegue por tras para eliminar. Fique fora do cone de visao.',
    credit: 'Desenvolvido por',
    install: 'Instalar app',
    iosInstall:
      'Para instalar o app: toque em Compartilhar e depois em "Adicionar a Tela de Inicio".',
  },
  character: {
    title: 'Personagem',
    preview: 'Preview do personagem',
    drag: 'Arraste para girar',
    cloth: 'Roupa',
    accent: 'Faixa',
    skin: 'Pele',
    head: 'Cabeca',
    legs: 'Pernas',
    hands: 'Maos',
    feet: 'Pes',
    weapon: 'Arma',
    reset: 'Restaurar padrao',
    weaponPreview: 'Arma no preview',
    weaponNote: 'So para ver como fica. Na run, a arma vem do mercador.',
    outfit: 'Skins',
    outfits: {
      rogueHooded: 'Ladino encapuzado',
      rogue: 'Ladina',
      skeletonMinion: 'Esqueleto lacaio',
      mage: 'Maga',
      ranger: 'Arqueiro',
      skeletonRogue: 'Esqueleto ladino',
      skeletonMage: 'Esqueleto mago',
      barbarian: 'Barbaro',
      knight: 'Cavaleiro',
      skeletonWarrior: 'Esqueleto guerreiro',
    },
    bladesTitle: 'Armas na mao',
    blades: {
      sword: 'Espada',
      dagger: 'Adaga',
      axe: 'Machado',
      wand: 'Varinha',
      skeletonBlade: 'Lamina de osso',
      staff: 'Cajado',
      skeletonAxe: 'Machado de osso',
      greatsword: 'Montante',
      greataxe: 'Machado de guerra',
      skeletonStaff: 'Cajado de caveira',
    },
    bladesNote:
      'So muda a aparencia: o golpe, o alcance e o dano sao os da espada.',
    balance: (count: number) => `Moedas vermelhas: ${count}`,
    price: (count: number) => `${count} moedas vermelhas`,
    free: 'De graca',
    buy: 'Comprar',
    use: 'Usar',
    inUse: 'Em uso',
    missing: (count: number) => `Faltam ${count}`,
    shopNote:
      'Moedas vermelhas aparecem em caixas, no bau dourado e com o chefe. O preco de cada skin e fixo.',
  },
  lobby: {
    yourName: 'Seu nome',
    connecting: 'Conectando...',
    enter: 'Entrar',
    createSession: 'Criar sessao',
    public: 'Publica',
    private: 'Privada',
    joinCode: 'Entrar com codigo',
    publicSessions: 'Sessoes publicas',
    noSessions: 'Nenhuma sessao aberta agora. Crie a sua.',
    joinHost: (name: string) => `Entrar na sessao de ${name}`,
    sessionType: (isPublic: boolean): string =>
      isPublic ? 'Sessao publica' : 'Sessao privada',
    inviteCode: 'Codigo de convite',
    players: 'Jogadores',
    you: ' (voce)',
    playerCount: (count: number, max: number) => `${count}/${max} jogadores.`,
    hostHint: 'Comece quando todos entrarem.',
    guestHint: 'Esperando o host comecar.',
    leave: 'Sair',
    host: 'Host',
    connectionError: 'Nao foi possivel conectar ao servidor de salas.',
    closedError: 'O host saiu: a sessao acabou.',
    errors: {
      name: 'Escreva seu nome.',
      alreadyInSession: 'Voce ja esta em uma sessao.',
      missingSession: 'Sessao nao encontrada.',
      alreadyStarted: 'A partida ja comecou.',
      full: 'Sessao cheia.',
      notInSession: 'Voce nao esta em uma sessao.',
      onlyHost: 'So o host comeca a partida.',
    },
  },
  game: {
    contract: (number: number) => `Caçada ${number}`,
    contractRoom: (room: number, total: number) =>
      `Sala ${room} de ${total} da caçada`,
    dashes: (count: number, max: number) => `Saltos: ${count} de ${max}`,
    arrows: (count: number, max: number) => `Flechas: ${count} de ${max}`,
    revives: (count: number) => `Fichas de revive: ${count}`,
    loading: 'Abrindo a masmorra...',
    boss: 'Chefe',
    bossWarning: 'O chefe despertou!',
    // de olho no player, ainda sem certeza (marca amarela)
    suspectLines: ['Quem está aí?', 'Tem alguém?', 'Vi algo...'],
    // comentario de quem repara num objeto quebrado
    brokenLines: ['Isso não estava assim', 'Quebrado?', 'Sujeira é essa?'],
    // gritos de quem esta perseguindo o player (balao sobre o inimigo)
    chaseLines: [
      'Ali!',
      'Peguem!',
      'Intruso!',
      'Nao foge!',
      'Cerquem!',
      'Atras dele!',
      'Guardas!',
      'Parado!',
    ],
    invisible: 'Invisibilidade',
    invincible: 'Invencibilidade',
    room: (number: number) => `Sala ${number}`,
    paused: 'Pausado',
    howToPlay: 'Como jogar',
    you: 'Voce',
    died: 'morreu!',
    gameOver: (room: number, kills: number, best: number) =>
      `Sala ${room}, ${kills} eliminados. Recorde: sala ${best}.`,
    restart: 'Jogar de novo',
    analysis: 'Ver análise do jogo',
    analysisTitle: 'Análise do jogo',
    analysisDescription: 'Resumo e registro da partida encerrada.',
    time: 'Tempo',
    kills: 'Eliminações',
    attackStrength: 'Força do ataque',
    damageDealt: 'Dano causado',
    stabs: 'Golpes de adaga',
    hits: 'Acertos',
    misses: 'Erros',
    projectiles: 'Projéteis',
    shotHits: 'Flechas no alvo',
    shotMisses: 'Flechas perdidas',
    healthRecovered: 'Vida recuperada',
    damageTaken: 'Dano sofrido',
    damageBlocked: 'Dano bloqueado',
    moneyCollected: 'Dinheiro coletado',
    shopsVisited: 'Mercadores visitados',
    insights: 'Insights',
    log: 'Registro da partida',
    missedStabs: (count: number) =>
      `${count} golpe${count > 1 ? 's' : ''} de adaga errado${count > 1 ? 's' : ''} alertaram os alvos.`,
    allStabsHit: 'Todos os golpes de adaga acertaram.',
    noStabs: 'Nenhum golpe de adaga nesta partida.',
    recovered: (count: number) =>
      `${count} pontos de vida recuperados durante a partida.`,
    noRecovery: 'Nenhuma vida recuperada durante a partida.',
    miss: 'Errou!',
    impenetrable: 'Impenetrável uau',
    headshot: 'NA MOSCA',
    overkill: 'OVERKILL',
    critical: 'CRITICO',
  },
  shop: {
    title: 'Escolha o equipamento',
    summary: (money: number, inflation: number) =>
      `Vale so para a run atual. Voce tem $ ${money}. Inflacao: +${inflation}%.`,
    bonusHealth: (count: number) => `+${count} de vida`,
    shots: (shots: number, pellets: number) =>
      `${shots} tiros${pellets > 1 ? `, ${pellets} virotes` : ''}`,
    refill: (count: number) => `Recarga: +${count} flechas`,
    fullAmmo: 'Municao cheia',
    dashRefill: (count: number) => `+${count} saltos`,
    fullDashes: 'Saltos cheios',
    owned: 'voce ja tem',
    items: {
      bow: 'Arco',
      metalBow: 'Arco de metal',
      crossbow: 'Besta',
      armor: 'Colete',
      dash: 'Saltos',
    },
  },
  share: {
    generating: 'Gerando...',
    button: 'Compartilhar recorde',
    myRecord: 'MEU RECORDE',
    room: (best: number) => `SALA ${best}`,
    run: (room: number, kills: number) =>
      `Nesta partida: sala ${room}, ${kills} eliminado${kills === 1 ? '' : 's'}`,
    challenge: 'Consegue passar?',
    message: (best: number) => `Cheguei na sala ${best} no Blade & Bounty!`,
  },
  events: {
    contractStarted: 'Caçada iniciada.',
    attackVariance: (min: number, max: number) =>
      `Variação de ataque: ${min}% a ${max}% do dano base.`,
    idleEnemies: 'Inatividade: inimigos enviados.',
    reviveUsed: (remaining: number) =>
      `Ficha de revive usada: restam ${remaining}.`,
    contractEnded: (room: number) => `Caçada encerrada na sala ${room}.`,
    roomReached: (room: number) => `Sala ${room} alcancada.`,
    enemyKilled: (kind: 'knight' | 'archer' | 'brute' | 'boss') =>
      `${{ knight: 'Cavaleiro', archer: 'Arqueiro', brute: 'Bárbaro da besta', boss: 'Chefe' }[kind]} eliminado.`,
    bossAwake: 'O chefe despertou. A arena esta trancada.',
    ruby: 'Achou uma moeda vermelha.',
    damageTaken: (lost: number, blocked: number) =>
      lost
        ? `Sofreu ${lost} de dano${blocked ? ` (${blocked} bloqueado pelo escudo)` : ''}.`
        : `Escudo bloqueou ${blocked} de dano.`,
    overkill: (damage: number) =>
      `Overkill: execução agachado pelas costas, ${damage} de dano.`,
    execution: (damage: number) => `Execução furtiva: ${damage} de dano.`,
    hit: (source: string, damage: number) =>
      `${source} acertou: ${damage} de dano.`,
    missChance: (chance: number, peak: boolean) =>
      `Chance de erro: ${chance}%${peak ? ' (pico)' : ''}.`,
    stabMissed: 'Golpe de adaga errou.',
    shot: (item: string) => `Disparou ${item}.`,
    money: (amount: number) => `Coletou ${amount} de ouro.`,
    reviveCollected: (count: number, max: number) =>
      `Ficha de revive: ${count} de ${max}.`,
    aim: (chance: number) => `Mira melhorada: na mosca em ${chance}%.`,
    ammo: (item: string, amount: number) =>
      `Coletou municao de ${item}: +${amount}.`,
    invisible: (seconds: number) =>
      `Invisível por ${seconds}s: inimigos não veem nem ouvem.`,
    invincible: (seconds: number) =>
      `Invencível por ${seconds}s: nenhum dano entra.`,
    recoveredHealth: 'Recuperou vida',
    collectedShield: 'Coletou escudo',
    recoveredDashes: 'Recuperou saltos',
    collected: (item: string, amount: number) => `${item}: +${amount}.`,
    bought: (owned: boolean, item: string, price: number) =>
      `${owned ? 'Recarregou' : 'Comprou'} ${item} por ${price} de ouro.`,
    shopVisited: (number: number) => `Mercador ${number} visitado.`,
    source: {
      stab: 'Golpe de adaga',
      critical: 'Golpe crítico',
      shot: 'Flecha',
      headshot: 'Na mosca',
      execution: 'Execução',
      overkill: 'Overkill',
    },
  },
  legend: {
    subtitle: 'Atravesse as salas sem ser visto.',
    home: 'Inicio',
    fullscreen: 'Tela cheia',
    restart: 'Reiniciar',
    keyboardControls: {
      title: 'Controles',
      entries: [
        ['WASD / setas', 'mover'],
        [
          'Espaco',
          'salto de esquiva. Livre na sala inicial; depois gasta 1 dos 6',
        ],
        ['C / Ctrl', 'agachar: mais lento, inimigos ouvem menos'],
        [
          'F',
          'quebrar a caixa ao alcance; com arco ou besta, golpe de adaga no inimigo ao lado',
        ],
        ['B', 'abrir e fechar o bau do mercador, no fim da caçada'],
        ['Q', 'trocar entre espada e armas (ou clique na arma, no topo)'],
        ['P', 'pausar e ver esta legenda'],
      ],
    },
    touchControls: {
      title: 'Controles',
      entries: [
        ['Joystick', 'arraste na parte inferior da tela para andar'],
        [
          'Setas',
          'toque no botão à direita para saltar; depois da sala inicial gasta 1 dos 6 saltos',
        ],
        [
          'Agachar',
          'toque no botão à direita para andar devagar e fazer menos barulho; toque de novo para levantar',
        ],
        [
          'Mão',
          'toque no ícone sobre caixas, baús ou inimigos próximos para interagir',
        ],
        ['Armas', 'toque na arma no topo da tela para trocar'],
        ['Pausa', 'toque no botão no topo para ver esta legenda'],
      ],
    },
    sections: [
      {
        title: 'Furtividade',
        entries: [
          ['Cone branco', 'patrulha. Amarelo: suspeito. Vermelho: alerta'],
          [
            'Orelha',
            'ele esta te ouvindo. Branca: notou algo. Amarela: vem investigar',
          ],
          ['Barulho', 'parado pouco, andando mais, salto e disparo muito mais'],
          [
            'Agachado',
            'ele nota e investiga, mas nao entra em alerta pelo som',
          ],
          ['De perto', 'colado nele, ele te percebe mesmo de costas'],
          [
            'Arco de metal',
            'dispara em silencio; arco comum e besta chamam todo inimigo por perto',
          ],
          ['Parede', 'bloqueia visao e flecha, mas nao o som'],
        ],
      },
      {
        title: 'Combate',
        entries: [
          [
            'Espada',
            'por tras elimina na hora; inimigo em alerta leva 30 a 45 de dano',
          ],
          [
            'Critico',
            'no corpo a corpo, aperte a interação que aparece sobre o inimigo a cada golpe: a chance de dano dobrado sobe de 10% para 60%. Agachado ou saltando o golpe nunca erra e o critico e certo; pelas costas, mata na hora. Salto em quem nao te viu e overkill',
          ],
          [
            'Com arma',
            'atira sozinho de longe; colado no inimigo, use a interação para o golpe de adaga',
          ],
          ['Flecha', 'perde forca com a distancia; besta so resolve de perto'],
          [
            'Na mosca',
            'chance de a flecha dar dano dobrado; a mira das caixas aumenta',
          ],
          [
            'Numeros',
            '+ e o dano que voce causou; - vermelho e o que ele te deu',
          ],
          ['Adrenalina', 'cada eliminacao acelera voce por um instante'],
        ],
      },
      {
        title: 'Inimigos e cenario',
        entries: [
          [
            'Arqueiro',
            'atira de longe, aguenta 2 flechas. Desvie das flechas de ponta vermelha',
          ],
          ['Cavaleiro', 'corre e golpeia de perto, aguenta 2 golpes'],
          [
            'Chefe',
            'a cada 2 caçadas, na ultima sala antes do mercador. A arena tranca ate ele cair; golpe furtivo fere muito, mas nao mata. Solta ouro e o premio do bau dourado',
          ],
          [
            'Bárbaro',
            'raro, lento e sempre em dupla; besta de perto, aguenta o dobro. Guarda o bau do mercador e o bau dourado',
          ],
          [
            'Caixa',
            'cobre de flecha e quebra com flecha ou briga; pode soltar vida ou escudo',
          ],
          [
            'Bau dourado',
            'raro, mais comum a cada sala e caçada. Solta invisibilidade com vida cheia, escudo cheio, vida e escudo cheios, ou invencibilidade. As barras no topo mostram o tempo que falta',
          ],
          ['Coracao', 'recupera vida. Escudo: absorve dano antes da vida'],
          [
            'Moeda vermelha',
            'rara: caixas, bau dourado e chefe. Compra skins na loja da tela inicial. So no jogo solo',
          ],
          [
            'Cruz',
            'ficha de revive: ao morrer, voce volta na entrada da sala. Guarda 3',
          ],
        ],
      },
    ],
  },
  tutorial: {
    title: 'Tutorial',
    button: 'Tutorial',
    skip: 'Pular tutorial',
    steps: {
      welcome: {
        title: 'Bem-vindo à masmorra',
        keyboard:
          'Um guia rápido antes da caçada: siga os passos na tela. Dá para pular a qualquer momento.',
        touch:
          'Um guia rápido antes da caçada: siga os passos na tela. Dá para pular a qualquer momento.',
      },
      move: {
        title: 'Ande',
        keyboard: 'Use WASD ou as setas para se mover pela sala.',
        touch: 'Arraste o joystick na parte inferior da tela para andar.',
      },
      crouch: {
        title: 'Agache',
        keyboard:
          'Segure C ou Ctrl: você anda devagar e os inimigos ouvem menos.',
        touch:
          'Toque no botão de agachar à direita: você anda devagar e os inimigos ouvem menos.',
      },
      dash: {
        title: 'Salte',
        keyboard:
          'Aperte Espaço para um salto de esquiva. Aqui é de graça; depois gasta 1 dos 6.',
        touch:
          'Toque no botão de setas à direita para saltar. Aqui é de graça; depois gasta 1 dos 6.',
      },
      door: {
        title: 'Atravesse a porta',
        keyboard: 'Siga em frente até a porta no fundo da sala.',
        touch: 'Siga em frente até a porta no fundo da sala.',
      },
      kill: {
        title: 'Elimine por trás',
        keyboard:
          'Fique fora do cone de visão, chegue pelas costas e aperte F. Agachado é certeiro.',
        touch:
          'Fique fora do cone de visão, chegue pelas costas e toque na mão sobre ele. Agachado é certeiro.',
      },
      loot: {
        title: 'Pegue o ouro',
        keyboard: 'Passe por cima das moedas que ele soltou.',
        touch: 'Passe por cima das moedas que ele soltou.',
      },
      arena: {
        title: 'Entre na arena',
        keyboard:
          'A próxima sala é a do chefe. A porta tranca atrás de você até ele cair.',
        touch:
          'A próxima sala é a do chefe. A porta tranca atrás de você até ele cair.',
      },
      boss: {
        title: 'Derrube o chefe',
        keyboard:
          'Golpe pelas costas fere muito, mas não mata: use os pilares, saia da frente dele e repita. Aqui você não morre.',
        touch:
          'Golpe pelas costas fere muito, mas não mata: use os pilares, saia da frente dele e repita. Aqui você não morre.',
      },
      done: {
        title: 'Pronto para a caçada',
        keyboard:
          'Você já sabe o essencial. Na caçada de verdade a morte vale, e P mostra a legenda completa.',
        touch:
          'Você já sabe o essencial. Na caçada de verdade a morte vale, e o botão de pausa mostra a legenda completa.',
      },
    },
  },
  match: {
    title: 'Partida',
    resume: 'Continuar',
    end: 'Encerrar partida',
    endNote: 'Encerra para todos e mostra o resultado.',
    leave: 'Sair da partida',
    scoreboard: 'Placar',
    showScoreboard: 'Ver placar',
    player: 'Jogador',
    kills: 'Kills',
    deaths: 'Mortes',
    ping: 'Ping',
    you: '(voce)',
    dead: 'morto',
    ended: 'O host encerrou a partida.',
    waitingHost: 'Esperando o host comecar outra partida.',
    reviveTitle: 'Quem volta?',
    reviveNote: (count: number) =>
      count === 1
        ? 'O bau levanta 1 jogador. Escolha quem.'
        : `O bau levanta ${count} jogadores. Escolha quem.`,
  },
};

const en: typeof pt = {
  common: {
    menu: 'Menu',
    back: 'Back',
    continue: 'Continue',
    start: 'Start',
    room: 'Room',
    sword: 'Sword',
    arrows: 'arrows',
    noArrows: '(out of arrows)',
    weapons: 'Weapons',
    health: 'Health',
    shield: 'Shield',
    pause: 'Pause',
    crouch: 'Crouch',
    attack: 'Attack',
    dash: 'Dash',
    joystick: 'Joystick',
    close: 'Close',
  },
  home: {
    record: (best) => `Best: room ${best}`,
    play: 'Play',
    character: 'Skin shop',
    rubies: (count) => `Red coins: ${count}`,
    multiplayer: 'Multiplayer',
    settings: 'Settings',
    settingsDescription: 'Game display preferences.',
    bloodColor: 'Blood color',
    graphics: 'Graphics',
    graphicsQuality: { high: 'High', medium: 'Medium', low: 'Low' },
    graphicsHint: 'Lower: less sharp, lighter to run.',
    blur: 'Motion blur',
    blurHint: 'Blur on dash, hits and chases.',
    crows: 'Crows',
    graphicsNote: 'Applies from the next match.',
    language: 'Language',
    languageName: 'English',
    changeLanguage: 'Switch to Portuguese',
    instructions:
      'Move with WASD or arrow keys. Approach from behind to eliminate enemies. Stay out of their sight.',
    credit: 'Developed by',
    install: 'Install app',
    iosInstall: 'To install the app, tap Share and then "Add to Home Screen".',
  },
  character: {
    title: 'Character',
    preview: 'Character preview',
    drag: 'Drag to rotate',
    cloth: 'Clothes',
    accent: 'Band',
    skin: 'Skin',
    head: 'Head',
    legs: 'Legs',
    hands: 'Hands',
    feet: 'Feet',
    weapon: 'Weapon',
    reset: 'Reset to default',
    weaponPreview: 'Weapon preview',
    weaponNote: 'Preview only. Get weapons from the merchant during a run.',
    outfit: 'Skins',
    outfits: {
      rogueHooded: 'Hooded rogue',
      rogue: 'Rogue',
      skeletonMinion: 'Skeleton minion',
      mage: 'Mage',
      ranger: 'Ranger',
      skeletonRogue: 'Skeleton rogue',
      skeletonMage: 'Skeleton mage',
      barbarian: 'Barbarian',
      knight: 'Knight',
      skeletonWarrior: 'Skeleton warrior',
    },
    bladesTitle: 'Weapons in hand',
    blades: {
      sword: 'Sword',
      dagger: 'Dagger',
      axe: 'Axe',
      wand: 'Wand',
      skeletonBlade: 'Bone blade',
      staff: 'Staff',
      skeletonAxe: 'Bone axe',
      greatsword: 'Greatsword',
      greataxe: 'War axe',
      skeletonStaff: 'Skull staff',
    },
    bladesNote:
      'Looks only: swing, reach and damage stay the same as the sword.',
    balance: (count) => `Red coins: ${count}`,
    price: (count) => `${count} red coins`,
    free: 'Free',
    buy: 'Buy',
    use: 'Use',
    inUse: 'In use',
    missing: (count) => `${count} short`,
    shopNote:
      'Red coins turn up in crates, in the golden chest and with the boss. Each skin has a fixed price.',
  },
  lobby: {
    yourName: 'Your name',
    connecting: 'Connecting...',
    enter: 'Enter',
    createSession: 'Create session',
    public: 'Public',
    private: 'Private',
    joinCode: 'Join with code',
    publicSessions: 'Public sessions',
    noSessions: 'No open sessions right now. Create one.',
    joinHost: (name) => `Join ${name}'s session`,
    sessionType: (isPublic) =>
      isPublic ? 'Public session' : 'Private session',
    inviteCode: 'Invite code',
    players: 'Players',
    you: ' (you)',
    playerCount: (count, max) => `${count}/${max} players.`,
    hostHint: 'Start when everyone has joined.',
    guestHint: 'Waiting for the host to start.',
    leave: 'Leave',
    host: 'Host',
    connectionError: 'Could not connect to the session server.',
    closedError: 'The host left: the session has ended.',
    errors: {
      name: 'Enter your name.',
      alreadyInSession: 'You are already in a session.',
      missingSession: 'Session not found.',
      alreadyStarted: 'The game has already started.',
      full: 'Session is full.',
      notInSession: 'You are not in a session.',
      onlyHost: 'Only the host can start the game.',
    },
  },
  game: {
    contract: (number) => `Bounty ${number}`,
    contractRoom: (room, total) => `Room ${room} of ${total} in this bounty`,
    dashes: (count, max) => `Dashes: ${count} of ${max}`,
    arrows: (count, max) => `Arrows: ${count} of ${max}`,
    revives: (count) => `Revive tokens: ${count}`,
    loading: 'Opening the dungeon...',
    boss: 'Boss',
    bossWarning: 'The boss has awakened!',
    suspectLines: ["Who's there?", 'Anyone there?', 'Saw something...'],
    brokenLines: ["This wasn't like this", 'Broken?', "What's this mess?"],
    chaseLines: [
      'There!',
      'Get him!',
      'Intruder!',
      'No escape!',
      'Surround!',
      'After him!',
      'Guards!',
      'Halt!',
    ],
    invisible: 'Invisibility',
    invincible: 'Invincibility',
    room: (number) => `Room ${number}`,
    paused: 'Paused',
    howToPlay: 'How to play',
    you: 'You',
    died: 'died!',
    gameOver: (room, kills, best) =>
      `Room ${room}, ${kills} eliminated. Best: room ${best}.`,
    restart: 'Play again',
    analysis: 'View game analysis',
    analysisTitle: 'Game analysis',
    analysisDescription: 'Summary and log of your finished run.',
    time: 'Time',
    kills: 'Eliminations',
    attackStrength: 'Attack strength',
    damageDealt: 'Damage dealt',
    stabs: 'Dagger strikes',
    hits: 'Hits',
    misses: 'Misses',
    projectiles: 'Projectiles',
    shotHits: 'Arrows on target',
    shotMisses: 'Arrows missed',
    healthRecovered: 'Health restored',
    damageTaken: 'Damage taken',
    damageBlocked: 'Damage blocked',
    moneyCollected: 'Money collected',
    shopsVisited: 'Merchants visited',
    insights: 'Insights',
    log: 'Run log',
    missedStabs: (count) =>
      `${count} missed dagger strike${count === 1 ? '' : 's'} alerted targets.`,
    allStabsHit: 'Every dagger strike hit.',
    noStabs: 'No dagger strikes this run.',
    recovered: (count) => `${count} health restored during this run.`,
    noRecovery: 'No health restored during this run.',
    miss: 'Miss!',
    impenetrable: 'Impenetrable wow',
    headshot: 'BULLSEYE',
    overkill: 'OVERKILL',
    critical: 'CRITICAL',
  },
  shop: {
    title: 'Choose your equipment',
    summary: (money, inflation) =>
      `Only for this run. You have $ ${money}. Inflation: +${inflation}%.`,
    bonusHealth: (count) => `+${count} health`,
    shots: (shots, pellets) =>
      `${shots} shots${pellets > 1 ? `, ${pellets} bolts` : ''}`,
    refill: (count) => `Restock: +${count} arrows`,
    fullAmmo: 'Ammo full',
    dashRefill: (count) => `+${count} dashes`,
    fullDashes: 'Dashes full',
    owned: 'already owned',
    items: {
      bow: 'Bow',
      metalBow: 'Metal bow',
      crossbow: 'Crossbow',
      armor: 'Armor',
      dash: 'Dashes',
    },
  },
  share: {
    generating: 'Generating...',
    button: 'Share record',
    myRecord: 'MY RECORD',
    room: (best) => `ROOM ${best}`,
    run: (room, kills) => `This run: room ${room}, ${kills} eliminated`,
    challenge: 'Can you beat it?',
    message: (best) => `I reached room ${best} in Blade & Bounty!`,
  },
  events: {
    contractStarted: 'Bounty started.',
    attackVariance: (min, max) =>
      `Attack variation: ${min}% to ${max}% of base damage.`,
    idleEnemies: 'Idle warning: enemies sent.',
    reviveUsed: (remaining) => `Revive token used: ${remaining} left.`,
    contractEnded: (room) => `Bounty ended in room ${room}.`,
    roomReached: (room) => `Reached room ${room}.`,
    enemyKilled: (kind) =>
      `${{ knight: 'Knight', archer: 'Archer', brute: 'Crossbow barbarian', boss: 'Boss' }[kind]} eliminated.`,
    bossAwake: 'The boss has awakened. The arena is sealed.',
    ruby: 'Found a red coin.',
    damageTaken: (lost, blocked) =>
      lost
        ? `Took ${lost} damage${blocked ? ` (${blocked} blocked by shield)` : ''}.`
        : `Shield blocked ${blocked} damage.`,
    overkill: (damage) =>
      `Overkill: crouching execution from behind, ${damage} damage.`,
    execution: (damage) => `Stealth execution: ${damage} damage.`,
    hit: (source, damage) => `${source} hit: ${damage} damage.`,
    missChance: (chance, peak) =>
      `Miss chance: ${chance}%${peak ? ' (peak)' : ''}.`,
    stabMissed: 'Dagger strike missed.',
    shot: (item) => `Fired ${item}.`,
    money: (amount) => `Collected ${amount} gold.`,
    reviveCollected: (count, max) => `Revive tokens: ${count} of ${max}.`,
    aim: (chance) => `Aim improved: bullseye chance ${chance}%.`,
    ammo: (item, amount) => `Collected ${item} ammo: +${amount}.`,
    invisible: (seconds) =>
      `Invisible for ${seconds}s: enemies cannot see or hear you.`,
    invincible: (seconds) => `Invincible for ${seconds}s: no damage gets in.`,
    recoveredHealth: 'Restored health',
    collectedShield: 'Collected shield',
    recoveredDashes: 'Restored dashes',
    collected: (item, amount) => `${item}: +${amount}.`,
    bought: (owned, item, price) =>
      `${owned ? 'Restocked' : 'Bought'} ${item} for ${price} gold.`,
    shopVisited: (number) => `Visited merchant ${number}.`,
    source: {
      stab: 'Dagger strike',
      critical: 'Critical hit',
      shot: 'Arrow',
      headshot: 'Bullseye',
      execution: 'Execution',
      overkill: 'Overkill',
    },
  },
  legend: {
    subtitle: 'Cross the rooms without being seen.',
    home: 'Home',
    fullscreen: 'Fullscreen',
    restart: 'Restart',
    keyboardControls: {
      title: 'Controls',
      entries: [
        ['WASD / arrows', 'move'],
        ['Space', 'dodge dash. Free in the starting room; then uses 1 of 6'],
        ['C / Ctrl', 'crouch: slower and quieter'],
        [
          'F',
          'break a nearby crate; with a bow or crossbow, dagger an adjacent enemy',
        ],
        ['B', "open or close the merchant's chest at the end of a bounty"],
        ['Q', 'switch between sword and guns (or click a weapon above)'],
        ['P', 'pause and view this guide'],
      ],
    },
    touchControls: {
      title: 'Controls',
      entries: [
        ['Joystick', 'drag at the bottom of the screen to move'],
        [
          'Arrows',
          'tap the button on the right to dash; after the starting room it uses 1 of 6 dashes',
        ],
        [
          'Crouch',
          'tap the button on the right to move slowly and quietly; tap again to stand',
        ],
        [
          'Hand',
          'tap the icon over crates, chests or nearby enemies to interact',
        ],
        ['Weapons', 'tap a weapon at the top of the screen to switch'],
        ['Pause', 'tap the button at the top to view this guide'],
      ],
    },
    sections: [
      {
        title: 'Stealth',
        entries: [
          ['White cone', 'patrolling. Yellow: suspicious. Red: alert'],
          [
            'Ear',
            'an enemy hears you. White: noticed something. Yellow: investigating',
          ],
          [
            'Noise',
            'little while still, more when walking, lots when dashing or shooting',
          ],
          ['Crouching', 'enemies investigate sound but do not go on alert'],
          ['Up close', 'an enemy notices you even from behind'],
          [
            'Metal bow',
            'shoots silently; the common bow and the crossbow attract nearby enemies',
          ],
          ['Wall', 'blocks sight and arrows, but not sound'],
        ],
      },
      {
        title: 'Combat',
        entries: [
          ['Sword', 'kills from behind; alerted enemies take 30 to 45 damage'],
          [
            'Critical',
            'in melee, press the action shown over the enemy on every swing: the chance of double damage goes from 10% to 60%. Crouched or dashing, the swing never misses and the critical is guaranteed; from behind, it kills outright. Dashing into an unaware enemy is an overkill',
          ],
          [
            'With a gun',
            'shoots automatically at range; use the attack action for a dagger strike up close',
          ],
          ['Arrow', 'weakens with distance; crossbow works best up close'],
          [
            'Bullseye',
            'chance to deal double damage; improve aim with crate loot',
          ],
          ['Numbers', '+ is damage you dealt; red - is damage you took'],
          ['Adrenaline', 'each kill speeds you up briefly'],
        ],
      },
      {
        title: 'Enemies and scenery',
        entries: [
          [
            'Archer',
            'shoots from afar, survives 2 arrows. Dodge red-tipped arrows',
          ],
          ['Knight', 'runs and strikes up close, survives 2 hits'],
          [
            'Boss',
            'every 2 bounties, in the last room before the merchant. The arena stays sealed until it falls; a stealth strike hurts a lot but does not kill. Drops gold and the golden chest prize',
          ],
          [
            'Barbarian',
            "rare, slow and always in pairs; close-range crossbow, twice as tough. Guards the merchant's chest and the golden chest",
          ],
          ['Crate', 'blocks arrows and breaks; may drop health or shield'],
          [
            'Golden chest',
            'rare, more common each room and bounty. Drops invisibility with full health, full shield, full health and shield, or invincibility. Bars at the top show the time left',
          ],
          ['Heart', 'restores health. Shield absorbs damage first'],
          [
            'Red coin',
            'rare: crates, the golden chest and the boss. Buys skins in the shop on the home screen. Solo only',
          ],
          ['Cross', 'revive token: respawn at the room entrance. Hold up to 3'],
        ],
      },
    ],
  },
  tutorial: {
    title: 'Tutorial',
    button: 'Tutorial',
    skip: 'Skip tutorial',
    steps: {
      welcome: {
        title: 'Welcome to the dungeon',
        keyboard:
          'A quick guide before the bounty: follow the steps on screen. You can skip at any time.',
        touch:
          'A quick guide before the bounty: follow the steps on screen. You can skip at any time.',
      },
      move: {
        title: 'Move',
        keyboard: 'Use WASD or the arrow keys to move around the room.',
        touch: 'Drag the joystick at the bottom of the screen to move.',
      },
      crouch: {
        title: 'Crouch',
        keyboard: 'Hold C or Ctrl: you move slowly and enemies hear less.',
        touch:
          'Tap the crouch button on the right: you move slowly and enemies hear less.',
      },
      dash: {
        title: 'Dash',
        keyboard:
          'Press Space for a dodge dash. Free here; later it uses 1 of 6.',
        touch:
          'Tap the arrows button on the right to dash. Free here; later it uses 1 of 6.',
      },
      door: {
        title: 'Go through the door',
        keyboard: 'Head forward to the door at the back of the room.',
        touch: 'Head forward to the door at the back of the room.',
      },
      kill: {
        title: 'Strike from behind',
        keyboard:
          'Stay out of the view cone, approach from behind and press F. Crouched never misses.',
        touch:
          'Stay out of the view cone, approach from behind and tap the hand over the enemy. Crouched never misses.',
      },
      loot: {
        title: 'Grab the gold',
        keyboard: 'Walk over the coins they dropped.',
        touch: 'Walk over the coins they dropped.',
      },
      arena: {
        title: 'Enter the arena',
        keyboard:
          'The next room is the boss. The door locks behind you until it falls.',
        touch:
          'The next room is the boss. The door locks behind you until it falls.',
      },
      boss: {
        title: 'Bring down the boss',
        keyboard:
          'A strike from behind hurts a lot but does not kill: use the pillars, stay out of its way and repeat. You cannot die here.',
        touch:
          'A strike from behind hurts a lot but does not kill: use the pillars, stay out of its way and repeat. You cannot die here.',
      },
      done: {
        title: 'Ready for the bounty',
        keyboard:
          'You know the essentials. In a real bounty death counts, and P shows the full guide.',
        touch:
          'You know the essentials. In a real bounty death counts, and the pause button shows the full guide.',
      },
    },
  },
  match: {
    title: 'Match',
    resume: 'Resume',
    end: 'End match',
    endNote: 'Ends it for everyone and shows the result.',
    leave: 'Leave match',
    scoreboard: 'Scoreboard',
    showScoreboard: 'Show scoreboard',
    player: 'Player',
    kills: 'Kills',
    deaths: 'Deaths',
    ping: 'Ping',
    you: '(you)',
    dead: 'dead',
    ended: 'The host ended the match.',
    waitingHost: 'Waiting for the host to start another match.',
    reviveTitle: 'Who comes back?',
    reviveNote: (count) =>
      count === 1
        ? 'The chest revives 1 player. Choose who.'
        : `The chest revives ${count} players. Choose who.`,
  },
};

type Language = 'pt-BR' | 'en';
const texts = { 'pt-BR': pt, en };

export const useLanguage = create<{
  language: Language;
  setLanguage: (language: Language) => void;
}>()(
  persist(
    (set) => ({
      language: 'pt-BR',
      setLanguage: (language) => {
        document.documentElement.lang = language;
        set({ language });
      },
    }),
    {
      name: 'blade-and-bounty-language',
      merge: (saved, current) => ({
        ...current,
        language:
          (saved as { language?: unknown })?.language === 'en' ? 'en' : 'pt-BR',
      }),
    },
  ),
);

export const getTexts = () => texts[useLanguage.getState().language];
export const useTexts = () => texts[useLanguage((state) => state.language)];

export function eventText(format: (words: typeof pt) => string) {
  return { text: format(pt), en: format(en) };
}

export function translateSessionError(error: string): string {
  // shortcut: unknown server errors stay in their original language; add a protocol code with the next new error.
  const key = (
    Object.keys(pt.lobby.errors) as (keyof typeof pt.lobby.errors)[]
  ).find((candidate) => pt.lobby.errors[candidate] === error);
  return key ? getTexts().lobby.errors[key] : error;
}
