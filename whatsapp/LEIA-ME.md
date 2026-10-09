# Disparo automático de WhatsApp — Hive

Envia uma mensagem **personalizada com o nome de cada contato**, de forma automática, pelo seu próprio WhatsApp.
Roda no seu **computador** (Windows, Mac ou Linux) e conecta pelo WhatsApp Web (QR code), como se você estivesse digitando.

## O que ele faz
- Chama cada pessoa pelo **primeiro nome**, já corrigido (`MARIA DA SILVA` → "Maria").
- Usa **qualquer coluna da planilha** na mensagem: `{{cidade}}`, `{{empresa}}`, `{{valor_conta}}`…
- **Varia o texto** sozinho (`{Oi|Olá|Oii}`), para ninguém receber a mesma mensagem idêntica.
- Escolhe a mensagem por contato: coluna `modelo` = `cliente` ou `licenciado` (ou crie outras).
- Mostra "digitando…", espera de 1 a 3 minutos entre envios, faz pausas longas, respeita horário e limite por dia — e **continua sozinho no dia seguinte**.
- Nunca manda duas vezes para a mesma pessoa (pode fechar e abrir de novo, ele continua de onde parou).
- Pula números sem WhatsApp e corrige o 9º dígito automaticamente.
- Quem responder **SAIR** recebe uma confirmação educada e nunca mais entra no disparo.
- Gera o relatório `dados/enviados.csv` (abre no Excel).

## Passo a passo (primeira vez)
1. Instale o **Node.js** (versão LTS) em https://nodejs.org
2. Baixe este repositório no computador (no GitHub: botão verde **Code → Download ZIP**) e abra a pasta `whatsapp`.
3. **Monte a planilha:** copie `contatos-exemplo.csv`, renomeie para `contatos.csv` e coloque seus contatos.
   - No Excel/Google Planilhas: colunas `nome`, `telefone` e (opcional) `modelo`, `cidade` etc. → **Salvar como CSV**.
   - Telefone pode ser em qualquer formato: `(12) 98888-7777`, `12988887777`, `+55 12 9…`.
   - Exportar contatos do celular: Google Contatos → Exportar → CSV, e deixe só as colunas de nome e telefone.
4. **Windows:** dê dois cliques em `INICIAR-WINDOWS.bat` e use o menu.
   **Mac/Linux:** abra o Terminal na pasta e rode `npm install` (só na primeira vez) e depois os comandos abaixo.

| O que fazer | Comando | Menu do .bat |
|---|---|---|
| Ver todas as mensagens antes, sem enviar nada | `npm run previa` | 1 |
| Mandar a 1ª mensagem para **você mesmo** | `npm run teste` | 2 |
| Disparar para todos | `npm start` | 3 |

5. Na primeira conexão aparece um **QR code**: no celular, WhatsApp → Configurações → **Aparelhos conectados** → Conectar aparelho. Depois ele lembra o login.
6. Deixe a janela aberta enquanto envia. O computador não pode hibernar.

## Editar as mensagens
Os textos ficam em `mensagens/cliente.txt` e `mensagens/licenciado.txt` (abra no Bloco de Notas).
- `{{nome}}` → primeiro nome · `{{nome_completo}}` · `{{saudacao}}` → Bom dia / Boa tarde / Boa noite
- `{{qualquer_coluna}}` → valor da coluna da planilha (se faltar em algum contato, ele não é enviado e aparece no aviso da prévia)
- `{opção 1|opção 2|opção 3}` → sorteia uma das opções para cada pessoa
- `*negrito*`, `_itálico_` funcionam como no WhatsApp
- Para um novo tipo de mensagem, crie `mensagens/NOME.txt` e coloque `NOME` na coluna `modelo`.

Ajustes de horário, intervalos, limite por dia e imagem anexa: `config.js`.

## ⚠️ Para não ter o número bloqueado
O WhatsApp **bane números** que mandam muitas mensagens para quem não os conhece ou que recebem muitas denúncias. Esta ferramenta usa o WhatsApp Web de forma não oficial, então:
- Envie **só para quem te conhece** (seus contatos, indicações, clientes). Nada de listas compradas.
- Comece com **20–30 por dia** em número novo; os padrões de `config.js` já são conservadores — não diminua os intervalos.
- Mensagem curta, pessoal, que convide a responder. Quem responde é sinal positivo para o WhatsApp.
- Mantenha a linha "responda SAIR" e respeite quem pedir para sair (a ferramenta faz isso sozinha).
- Se possível, use um **segundo número/chip** para o disparo e mantenha o principal seguro.
- Para volumes grandes (centenas por dia) o caminho seguro é a **API oficial do WhatsApp Business** (Meta), que exige modelos de mensagem aprovados e é paga por conversa.

## Privacidade
`contatos.csv` e a pasta `dados/` **não sobem para o GitHub** (o repositório é público). Guarde-os só no seu computador.
