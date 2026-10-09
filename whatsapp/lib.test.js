const test = require('node:test');
const assert = require('node:assert');
const L = require('./lib');

test('lê CSV do Excel com ; e aspas', () => {
  const r = L.lerCSV('﻿Nome;Telefone;Município\r\n"Silva; Maria";12 98888-7777;Taubaté\r\n\r\n');
  assert.deepStrictEqual(r, [{ nome: 'Silva; Maria', telefone: '12 98888-7777', municipio: 'Taubaté' }]);
});

test('normaliza telefones brasileiros', () => {
  assert.strictEqual(L.normalizarTelefone('(12) 98888-7777'), '5512988887777');
  assert.strictEqual(L.normalizarTelefone('012 98888 7777'), '5512988887777');
  assert.strictEqual(L.normalizarTelefone('+55 11 97777-2222'), '5511977772222');
  assert.strictEqual(L.normalizarTelefone('5512988887777'), '5512988887777');
  assert.strictEqual(L.normalizarTelefone('1234 5678'), null);
  assert.strictEqual(L.normalizarTelefone('+1 415 555 0100'), '14155550100');
});

test('primeiro nome com capitalização', () => {
  assert.strictEqual(L.primeiroNome('  JOÃO pereira'), 'João');
  assert.strictEqual(L.capitalizar('maria DA silva'), 'Maria da Silva');
});

test('monta mensagem com nome, colunas e variações', () => {
  const { texto, faltando } = L.montarMensagem('{Oi|Olá}, {{nome}} de {{Cidade}}! {{saudacao}}.',
    { nome: 'ana souza', cidade: 'Taubaté' }, { agora: new Date(2026, 0, 1, 15), aleatorio: () => 0.9 });
  assert.strictEqual(texto, 'Olá, Ana de Taubaté! Boa tarde.');
  assert.deepStrictEqual(faltando, []);
  assert.deepStrictEqual(L.montarMensagem('Oi {{bairro}}', { nome: 'x' }).faltando, ['bairro']);
});

test('reconhece pedido de saída', () => {
  const p = ['sair', 'nao quero'];
  assert.ok(L.ehPedidoDeSaida(' SAIR! ', p));
  assert.ok(L.ehPedidoDeSaida('Não quero', p));
  assert.ok(!L.ehPedidoDeSaida('quero saber mais', p));
});

test('próxima janela de envio', () => {
  const cfg = { horarioInicio: 9, horarioFim: 20, diasSemana: [1, 2, 3, 4, 5, 6] };
  const seg10h = new Date(2026, 9, 5, 10, 0); // segunda
  assert.strictEqual(L.proximaJanela(seg10h, cfg).getTime(), seg10h.getTime());
  assert.deepStrictEqual(L.proximaJanela(new Date(2026, 9, 5, 7), cfg), new Date(2026, 9, 5, 9));
  assert.deepStrictEqual(L.proximaJanela(new Date(2026, 9, 5, 21), cfg), new Date(2026, 9, 6, 9));
  assert.deepStrictEqual(L.proximaJanela(new Date(2026, 9, 10, 21), cfg), new Date(2026, 9, 12, 9)); // sábado → segunda
});
