// ============================================================
// Disparo automático e personalizado de WhatsApp.
//   npm run previa  → mostra as mensagens que seriam enviadas (não conecta no WhatsApp)
//   npm run teste   → envia a 1ª mensagem da fila para o SEU próprio número
//   npm start       → dispara para a planilha inteira
// ============================================================
const fs = require('fs');
const path = require('path');
const config = require('./config');
const {
  lerCSV, normalizarTelefone, montarMensagem, ehPedidoDeSaida,
  dataLocal, proximaJanela, sortear, capitalizar,
} = require('./lib');

const PASTA = __dirname;
const PASTA_DADOS = path.join(PASTA, 'dados');
const ARQ_ENVIADOS = path.join(PASTA_DADOS, 'enviados.csv');
const ARQ_SAIDA = path.join(PASTA_DADOS, 'descadastrados.txt');

const modo = process.argv.includes('--previa') ? 'previa'
  : process.argv.includes('--teste') ? 'teste' : 'enviar';

const esperar = ms => new Promise(r => setTimeout(r, ms));
const hora = () => new Date().toLocaleTimeString('pt-BR');
const log = msg => console.log(`[${hora()}] ${msg}`);

// ---------- Arquivos de controle ----------
fs.mkdirSync(PASTA_DADOS, { recursive: true });

function registrar(telefone, nome, modelo, status, detalhe = '') {
  if (!fs.existsSync(ARQ_ENVIADOS)) fs.writeFileSync(ARQ_ENVIADOS, '﻿data_hora;telefone;nome;modelo;status;detalhe\n');
  const limpo = v => String(v).replace(/[;\r\n]+/g, ' ');
  const agora = new Date();
  const linha = [`${dataLocal(agora)} ${agora.toLocaleTimeString('pt-BR')}`, telefone, nome, modelo, status, detalhe].map(limpo).join(';');
  fs.appendFileSync(ARQ_ENVIADOS, linha + '\n');
}

function lerHistorico() {
  const jaFeitos = new Set();
  let enviadosHoje = 0;
  if (fs.existsSync(ARQ_ENVIADOS)) {
    const hoje = dataLocal();
    for (const r of lerCSV(fs.readFileSync(ARQ_ENVIADOS, 'utf8'))) {
      if (r.status === 'enviado' || r.status === 'sem_whatsapp') jaFeitos.add(r.telefone);
      if (r.status === 'enviado' && r.data_hora.startsWith(hoje)) enviadosHoje++;
    }
  }
  return { jaFeitos, enviadosHoje };
}

function lerDescadastrados() {
  if (!fs.existsSync(ARQ_SAIDA)) return new Set();
  return new Set(fs.readFileSync(ARQ_SAIDA, 'utf8').split(/\r?\n/).map(s => s.trim()).filter(Boolean));
}

// ---------- Mensagens ----------
const modelos = {};
function modelo(nome) {
  if (!(nome in modelos)) {
    const arq = path.join(PASTA, 'mensagens', `${nome}.txt`);
    modelos[nome] = fs.existsSync(arq) ? fs.readFileSync(arq, 'utf8').replace(/^﻿/, '') : null;
  }
  return modelos[nome];
}

// ---------- Monta a fila ----------
function montarFila() {
  let arquivo = path.join(PASTA, config.arquivoContatos);
  if (!fs.existsSync(arquivo)) {
    if (modo !== 'previa') {
      console.error(`\n❌ Não encontrei a planilha "${config.arquivoContatos}".`);
      console.error('   Copie o arquivo contatos-exemplo.csv, renomeie para contatos.csv e coloque seus contatos.\n');
      process.exit(1);
    }
    arquivo = path.join(PASTA, 'contatos-exemplo.csv');
    console.log('(Prévia usando contatos-exemplo.csv — crie o contatos.csv com seus contatos.)\n');
  }

  const contatos = lerCSV(fs.readFileSync(arquivo, 'utf8'));
  if (contatos.length && (!('nome' in contatos[0]) || !('telefone' in contatos[0]))) {
    console.error('\n❌ A planilha precisa ter as colunas "nome" e "telefone" na primeira linha.\n');
    process.exit(1);
  }

  const { jaFeitos, enviadosHoje } = lerHistorico();
  const descadastrados = lerDescadastrados();
  const vistos = new Set();
  const fila = [], problemas = [];
  let pulados = 0;

  contatos.forEach((c, i) => {
    const linha = i + 2;
    const tel = normalizarTelefone(c.telefone);
    if (!c.nome) return problemas.push(`Linha ${linha}: sem nome`);
    if (!tel) return problemas.push(`Linha ${linha} (${c.nome}): telefone inválido "${c.telefone}"`);
    if (vistos.has(tel)) return problemas.push(`Linha ${linha} (${c.nome}): telefone repetido na planilha`);
    vistos.add(tel);
    if (jaFeitos.has(tel) || descadastrados.has(tel)) { pulados++; return; }

    const nomeModelo = (c.modelo || config.modeloPadrao).trim().toLowerCase();
    const texto = modelo(nomeModelo);
    if (texto === null) return problemas.push(`Linha ${linha} (${c.nome}): não existe mensagens/${nomeModelo}.txt`);
    const { faltando } = montarMensagem(texto, c);
    if (faltando.length) return problemas.push(`Linha ${linha} (${c.nome}): falta preencher ${faltando.join(', ')}`);

    fila.push({ contato: c, telefone: tel, nomeModelo });
  });

  return { fila, problemas, pulados, enviadosHoje, descadastrados };
}

function resumo({ fila, problemas, pulados, enviadosHoje }) {
  console.log(`📋 Na fila: ${fila.length} | Já enviados/descadastrados (pulados): ${pulados} | Enviados hoje: ${enviadosHoje}/${config.limitePorDia}`);
  if (problemas.length) {
    console.log(`\n⚠️  ${problemas.length} contato(s) com problema (não serão enviados):`);
    problemas.forEach(p => console.log('   - ' + p));
  }
  const dias = Math.ceil(fila.length / config.limitePorDia);
  if (fila.length) console.log(`\n⏱️  No ritmo atual (até ${config.limitePorDia}/dia), a fila leva cerca de ${dias} dia(s) de envio.`);
}

// ---------- Prévia ----------
const estado = montarFila();
if (modo === 'previa') {
  resumo(estado);
  estado.fila.forEach(({ contato, telefone, nomeModelo }, i) => {
    console.log(`\n──────── ${i + 1}. ${capitalizar(contato.nome)} (+${telefone}) — modelo "${nomeModelo}" ────────`);
    console.log(montarMensagem(modelo(nomeModelo), contato).texto);
  });
  console.log('\nNada foi enviado. Para testar no seu próprio WhatsApp: npm run teste');
  process.exit(0);
}

// ---------- WhatsApp ----------
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const client = new Client({
  authStrategy: new LocalAuth({ dataPath: path.join(PASTA, '.wwebjs_auth') }),
  puppeteer: { headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] },
});

const nomesPorTelefone = new Map(estado.fila.map(f => [f.telefone, f.contato.nome]));
const descadastrados = estado.descadastrados;
let encerrando = false;

client.on('qr', qr => {
  console.log('\n📱 No celular: WhatsApp → Configurações → Aparelhos conectados → Conectar aparelho. Leia o QR code:\n');
  qrcode.generate(qr, { small: true });
});
client.on('authenticated', () => log('✅ WhatsApp conectado.'));
client.on('auth_failure', m => { console.error('❌ Falha ao conectar:', m); process.exit(1); });
client.on('disconnected', motivo => { if (!encerrando) { console.error('⚠️  WhatsApp desconectado:', motivo); process.exit(1); } });

// Quem responder SAIR / PARAR entra na lista de descadastrados
client.on('message', async msg => {
  try {
    if (msg.fromMe || msg.isGroupMsg || !ehPedidoDeSaida(msg.body || '', config.palavrasDeSaida)) return;
    const contato = await msg.getContact();
    const numero = contato.number || msg.from.split('@')[0];
    if (descadastrados.has(numero)) return;
    descadastrados.add(numero);
    fs.appendFileSync(ARQ_SAIDA, numero + '\n');
    const nome = nomesPorTelefone.get(numero) || contato.pushname || '';
    await msg.reply(montarMensagem(config.respostaDeSaida, { nome }).texto);
    log(`🚫 ${nome || numero} pediu para sair e foi descadastrado.`);
  } catch (e) {
    log('Erro ao tratar resposta: ' + e.message);
  }
});

async function enviarPara(destino, texto) {
  try {
    const chat = await client.getChatById(destino);
    await chat.sendStateTyping(); // aparece "digitando…" como uma pessoa
  } catch { /* conversa nova: segue sem o "digitando…" */ }
  await esperar(Math.min(8000, 1500 + texto.length * 25));
  if (config.imagem) {
    const media = MessageMedia.fromFilePath(path.resolve(PASTA, config.imagem));
    await client.sendMessage(destino, media, { caption: texto, sendSeen: false });
  } else {
    await client.sendMessage(destino, texto, { sendSeen: false });
  }
}

async function aguardarHorario(enviadosHoje) {
  let agora = new Date();
  if (enviadosHoje >= config.limitePorDia) {
    log(`🛑 Limite de ${config.limitePorDia} mensagens hoje atingido.`);
    agora = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() + 1);
  }
  const quando = proximaJanela(agora, config);
  const ms = quando - Date.now();
  if (ms > 0) {
    log(`😴 Fora do horário de envio. Continuo sozinho em ${quando.toLocaleString('pt-BR')} (deixe esta janela aberta).`);
    await esperar(ms);
    return true; // virou o dia/horário
  }
  return false;
}

client.on('ready', async () => {
  const meuNumero = client.info.wid._serialized;

  if (modo === 'teste') {
    const item = estado.fila[0];
    if (!item) { log('Não há ninguém na fila para usar como teste.'); return encerrar(); }
    const texto = montarMensagem(modelo(item.nomeModelo), item.contato).texto;
    await enviarPara(meuNumero, texto);
    log(`🧪 Teste enviado para o SEU número com a mensagem de ${capitalizar(item.contato.nome)}. Confira no celular.`);
    return encerrar();
  }

  resumo(estado);
  let { enviadosHoje } = estado;
  let diaAtual = dataLocal();
  let seguidos = 0, errosSeguidos = 0, total = 0;

  for (const item of estado.fila) {
    if (await aguardarHorario(enviadosHoje) || dataLocal() !== diaAtual) {
      diaAtual = dataLocal();
      enviadosHoje = lerHistorico().enviadosHoje;
    }
    const { contato, telefone, nomeModelo } = item;
    const nome = capitalizar(contato.nome);
    if (descadastrados.has(telefone)) continue;

    try {
      const id = await client.getNumberId(telefone); // confere se o número tem WhatsApp (e acerta o 9º dígito)
      if (!id) {
        registrar(telefone, nome, nomeModelo, 'sem_whatsapp');
        log(`➖ ${nome} (+${telefone}) não tem WhatsApp. Pulando.`);
        continue;
      }
      if (descadastrados.has(id.user)) continue;

      const texto = montarMensagem(modelo(nomeModelo), contato).texto;
      await enviarPara(id._serialized, texto);
      registrar(telefone, nome, nomeModelo, 'enviado');
      enviadosHoje++; total++; seguidos++; errosSeguidos = 0;
      log(`✅ ${total}/${estado.fila.length} — enviado para ${nome} (hoje: ${enviadosHoje}/${config.limitePorDia})`);
    } catch (e) {
      registrar(telefone, nome, nomeModelo, 'erro', e.message);
      log(`❌ Erro ao enviar para ${nome}: ${e.message}`);
      if (++errosSeguidos >= 3) { log('Muitos erros seguidos. Parando por segurança — confira a conexão e rode de novo.'); break; }
    }

    if (seguidos >= config.pausaACada) {
      const min = sortear(config.pausaMinima, config.pausaMaxima);
      log(`☕ Pausa de ${Math.round(min)} min para parecer natural...`);
      await esperar(min * 60000);
      seguidos = 0;
    } else {
      await esperar(sortear(config.intervaloMinimo, config.intervaloMaximo) * 1000);
    }
  }

  log(`🎉 Fim da fila: ${total} mensagem(ns) enviada(s). Relatório em dados/enviados.csv`);
  log('Continuo ouvindo respostas "SAIR". Pode fechar a janela (ou Ctrl+C) quando quiser.');
});

async function encerrar() {
  encerrando = true;
  try { await client.destroy(); } catch { /* já fechado */ }
  process.exit(0);
}
process.on('SIGINT', encerrar);

log('Abrindo o WhatsApp Web... (na primeira vez pode demorar 1–2 minutos)');
client.initialize();
