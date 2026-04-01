# 📡 SSRX Event Radar — Saint Seiya Rebirth / EX

O **SSRX Radar** avisa automaticamente quando os eventos do jogo estão prestes a abrir.

Você não precisa mais olhar planilhas, prints ou horários.

O radar avisa você. 🔔

---

## ✅ O que o Radar faz

- Mostra os eventos organizados por horário
- Indica o que está ativo agora
- Indica o que vai abrir em breve
- Envia **notificação automática 15 minutos antes**
- Funciona mesmo com navegador fechado
- Funciona como **aplicativo instalado (PWA)**

---

# 🖥️ SE VOCÊ ESTÁ NO PC / NOTEBOOK (Windows, Mac, Linux)

## 1) Acesse o Radar

Abra no Chrome ou Edge:

👉 https://ssrx-radar.netlify.app

---

## 2) Instale como aplicativo (PASSO MAIS IMPORTANTE)

Você precisa transformar o site em um **app**.

O botão pode aparecer em lugares diferentes:

### Opção A — Ícone na barra de endereço
Clique no ícone de **monitor com +** → **Instalar**

### Opção B — Menu tradicional
Menu ⋮ → **Instalar SSRX Event Radar**

### Opção C — Chrome novo
Menu ⋮ → **Transmitir, salvar e compartilhar** → **Instalar página como app**

Depois disso, o Radar vira um aplicativo igual WhatsApp/Discord no seu computador.

Ele vai aparecer na barra do Windows / Dock do Mac.

---

## 3) Ative as notificações

Abra o app instalado e clique em:

🔔 **Ativar alertas**

Permita as notificações quando o navegador pedir.

---

## ✅ Pronto (PC)

Agora você pode:

- Fechar o app
- Fechar o navegador
- Usar o PC normalmente

Quando faltar 15 minutos para um evento…

🔔 O sistema operacional vai avisar você automaticamente.

---

# 📱 SE VOCÊ ESTÁ NO CELULAR (Android ou iPhone)

## 1) Abra o link no navegador do celular

👉 https://ssrx-radar.netlify.app

Use **Chrome (Android)** ou **Safari (iPhone)**.

---

## 2) Adicione à tela inicial

### Android (Chrome)
Menu ⋮ → **Adicionar à tela inicial**

### iPhone (Safari)
Botão de compartilhar → **Adicionar à Tela de Início**

Isso transforma o Radar em um aplicativo no seu celular.

---

## 3) Abra o app instalado e ative os alertas

Toque em:

🔔 **Ativar alertas**

Permita as notificações.

---

## ✅ Pronto (Celular)

Pode fechar tudo.

Quando faltar 15 minutos para um evento…

🔔 Seu celular vai avisar automaticamente.

---

## ❗ Importante

Se você:

- Limpar dados do navegador
- Desinstalar o app
- Trocar de celular / computador

Será necessário repetir os passos.

---

## 💡 Por que isso existe?

A agenda do jogo é difícil de acompanhar durante os eventos.

O SSRX Radar transforma os horários do jogo em notificações automáticas.

---

## ❤️ Projeto comunitário

Projeto open-source feito para ajudar a comunidade do SSRX.

Agradecimento especial ao ❤️ Digs ❤️ por fortalecer a comunidade.

---

## ❓ Dúvidas comuns

Antes de pedir ajuda, veja:
👉 https://ssrx-radar.netlify.app/faq.html

---

## 🛠️ Painel local de manutenção de eventos

Para facilitar cadastro, edição e exclusão de eventos no `events.json`, existe um painel desktop:

- Arquivo Python: `eventos_admin_gui.py`
- Atalho Windows: `abrir_painel_eventos.bat`

### Como usar

1. Dê dois cliques em `abrir_painel_eventos.bat`
2. Preencha os campos e clique em:
   - `Adicionar` para novo evento
   - `Salvar edicao` para atualizar evento selecionado
   - `Excluir selecionado` para remover evento
3. O script atualiza o `events.json` automaticamente e cria backup:
   - `events_backup_YYYYMMDD-HHMMSS.json`

### Requisitos

- Python 3 instalado no Windows (ou em outro sistema operacional)
- Não precisa de dependências externas

### Publicacao no GitHub pelo proprio painel

Depois de ajustar os eventos no painel, clique no botao `Publicar no GitHub`.

O painel executa automaticamente:
- `git add events.json`
- commit com mensagem padrao e timestamp
- `git push`

Assim, toda a manutencao e publicacao ficam centralizadas no `eventos_admin_gui.py`.
