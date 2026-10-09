// ============================================================
// CONFIGURAÇÃO DO DISPARO — ajuste só aqui.
// ============================================================
module.exports = {
  // Planilha com os contatos (colunas obrigatórias: nome e telefone)
  arquivoContatos: 'contatos.csv',

  // Mensagem usada quando a coluna "modelo" da planilha estiver vazia.
  // Corresponde a um arquivo da pasta "mensagens" (cliente → mensagens/cliente.txt)
  modeloPadrao: 'cliente',

  // Imagem opcional enviada junto (a mensagem vira a legenda). Ex.: '../site/img/preview-cliente-v2.jpg'
  imagem: null,

  // ---- Segurança contra bloqueio do número ----
  // Espera sorteada entre uma mensagem e outra (segundos)
  intervaloMinimo: 60,
  intervaloMaximo: 180,

  // A cada X mensagens, faz uma pausa maior (minutos, sorteada entre min e max)
  pausaACada: 10,
  pausaMinima: 10,
  pausaMaxima: 20,

  // Máximo de mensagens por dia. Chegou no limite, continua sozinho no dia seguinte.
  // Número novo ou pouco usado: comece com 20–30 e aumente aos poucos.
  limitePorDia: 40,

  // Só envia neste horário (9 = 9h, 20 = até 19h59) e nestes dias (0 = domingo … 6 = sábado)
  horarioInicio: 9,
  horarioFim: 20,
  diasSemana: [1, 2, 3, 4, 5, 6],

  // ---- Descadastro ----
  // Se a pessoa responder uma destas palavras, nunca mais recebe disparo
  palavrasDeSaida: ['sair', 'parar', 'pare', 'stop', 'remover', 'nao quero', 'descadastrar'],
  respostaDeSaida: 'Tudo bem, {{nome}}! Não vou mais te enviar mensagens. Obrigado! 🙏',
};
