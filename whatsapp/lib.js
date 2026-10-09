// ============================================================
// Funções de apoio: leitura da planilha, telefones e montagem das mensagens.
// ============================================================

// Lê CSV salvo pelo Excel/Google Planilhas (separador ; ou ,), com ou sem aspas.
function lerCSV(texto) {
  texto = texto.replace(/^﻿/, '');
  const primeiraLinha = texto.split(/\r?\n/)[0] || '';
  const sep = (primeiraLinha.match(/;/g) || []).length >= (primeiraLinha.match(/,/g) || []).length ? ';' : ',';

  const linhas = [];
  let campo = '', linha = [], aspas = false;
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (aspas) {
      if (c === '"' && texto[i + 1] === '"') { campo += '"'; i++; }
      else if (c === '"') aspas = false;
      else campo += c;
    } else if (c === '"') aspas = true;
    else if (c === sep) { linha.push(campo); campo = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && texto[i + 1] === '\n') i++;
      linha.push(campo); linhas.push(linha); linha = []; campo = '';
    } else campo += c;
  }
  if (campo !== '' || linha.length) { linha.push(campo); linhas.push(linha); }

  const naoVazias = linhas.filter(l => l.some(v => v.trim() !== ''));
  if (!naoVazias.length) return [];
  const cabecalho = naoVazias[0].map(chave);
  return naoVazias.slice(1).map(l => {
    const obj = {};
    cabecalho.forEach((col, i) => { obj[col] = (l[i] || '').trim(); });
    return obj;
  });
}

// "Nome Completo" -> "nome_completo", "Município" -> "municipio"
function chave(s) {
  return String(s).trim().toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

// Deixa só os dígitos e coloca o 55 do Brasil quando faltar.
// Retorna null quando o número não parece válido.
function normalizarTelefone(bruto) {
  const texto = String(bruto || '').trim();
  const internacional = texto.startsWith('+') || texto.startsWith('00');
  let d = texto.replace(/\D/g, '').replace(/^0+/, ''); // tira "00" / "0" de DDD ou operadora
  if (internacional) {
    if (d.startsWith('55')) return (d.length === 12 || d.length === 13) ? d : null;
    return (d.length >= 8 && d.length <= 15) ? d : null; // número de outro país
  }
  if (d.length === 10 || d.length === 11) return '55' + d;
  if ((d.length === 12 || d.length === 13) && d.startsWith('55')) return d;
  return null;
}

const MINUSCULAS = new Set(['da', 'de', 'do', 'das', 'dos', 'e']);

function capitalizar(nome) {
  return String(nome || '').trim().toLowerCase().split(/\s+/).filter(Boolean)
    .map((p, i) => (i > 0 && MINUSCULAS.has(p)) ? p : p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ');
}

function primeiroNome(nome) {
  return capitalizar(nome).split(' ')[0] || '';
}

function saudacao(data = new Date()) {
  const h = data.getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

// Escolhe uma opção aleatória em cada {opção 1|opção 2|opção 3}.
// Assim cada pessoa recebe um texto levemente diferente.
function variar(texto, aleatorio = Math.random) {
  let anterior;
  do {
    anterior = texto;
    texto = texto.replace(/\{([^{}]*\|[^{}]*)\}/g, (_, opcoes) => {
      const lista = opcoes.split('|');
      return lista[Math.floor(aleatorio() * lista.length)];
    });
  } while (texto !== anterior);
  return texto;
}

// Troca {{nome}}, {{cidade}} etc. pelos dados do contato e sorteia as variações.
// Devolve { texto, faltando: [campos sem valor] }.
function montarMensagem(modelo, contato, { agora = new Date(), aleatorio = Math.random } = {}) {
  const valores = {
    ...contato,
    nome: primeiroNome(contato.nome),
    nome_completo: capitalizar(contato.nome),
    saudacao: saudacao(agora),
  };
  const faltando = [];
  let texto = modelo.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_, campo) => {
    const v = valores[chave(campo)];
    if (v === undefined || String(v).trim() === '') { faltando.push(campo); return ''; }
    return String(v).trim();
  });
  texto = variar(texto, aleatorio).replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  return { texto, faltando };
}

function ehPedidoDeSaida(texto, palavras) {
  const t = chave(texto).replace(/_/g, ' ').trim();
  return palavras.some(p => t === chave(p).replace(/_/g, ' '));
}

function dataLocal(d = new Date()) {
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

// Próximo momento permitido para enviar (dentro do horário e dos dias da semana).
// Retorna a própria data se já estiver dentro da janela.
function proximaJanela(agora, { horarioInicio, horarioFim, diasSemana }) {
  const d = new Date(agora);
  for (let i = 0; i < 8; i++) {
    const dentroDoDia = diasSemana.includes(d.getDay());
    if (dentroDoDia && i === 0 && d.getHours() >= horarioInicio && d.getHours() < horarioFim) return d;
    if (dentroDoDia && (i > 0 || d.getHours() < horarioInicio)) {
      d.setHours(horarioInicio, 0, 0, 0);
      return d;
    }
    d.setDate(d.getDate() + 1);
    d.setHours(0, 0, 0, 0);
  }
  throw new Error('Nenhum dia da semana liberado em config.js (diasSemana).');
}

function sortear(min, max, aleatorio = Math.random) {
  return min + aleatorio() * (max - min);
}

module.exports = {
  lerCSV, chave, normalizarTelefone, capitalizar, primeiroNome, saudacao,
  variar, montarMensagem, ehPedidoDeSaida, dataLocal, proximaJanela, sortear,
};
