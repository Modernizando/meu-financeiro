# Meu Financeiro

Sistema pessoal de controle financeiro (React + Vite + Tailwind), responsivo, com modo escuro, gráficos e instalável como PWA no celular.

Todos os dados ficam salvos **apenas no seu navegador** (localStorage) — nada é enviado para nenhum servidor.

---

## 1. Como executar o projeto no computador

Pré-requisito: ter o [Node.js](https://nodejs.org) instalado (versão 18 ou superior).

```bash
# 1. Entre na pasta do projeto
cd meu-financeiro

# 2. Instale as dependências (só precisa fazer isso uma vez)
npm install

# 3. Rode o projeto em modo de desenvolvimento
npm run dev
```

Isso vai abrir um endereço tipo `http://localhost:5173` — acesse pelo navegador do computador.

Para testar no celular **na mesma rede Wi-Fi**: rode `npm run dev -- --host`, e acesse pelo celular usando o IP do computador que aparecer no terminal (ex: `http://192.168.0.10:5173`).

---

## 2. Como instalar no celular (PWA)

Isso só funciona depois que o site estiver publicado com um link `https://` (veja o passo 5). Depois de publicado:

**Android (Chrome):**
1. Abra o link do site.
2. Toque no menu (⋮) no canto superior direito.
3. Toque em "Adicionar à tela inicial" ou "Instalar aplicativo".

**iPhone (Safari):**
1. Abra o link do site.
2. Toque no botão de compartilhar (ícone de quadrado com seta para cima).
3. Toque em "Adicionar à Tela de Início".

O app vai abrir em tela cheia, com ícone próprio, como um aplicativo nativo.

---

## 3. Como fazer backup dos seus dados

1. Abra o app → **Configurações** → **Backup**.
2. Toque em **Exportar backup**.
3. Um arquivo `.json` será baixado com todos os seus dados (receitas, despesas, dívidas, cartões, metas etc.). Guarde esse arquivo em local seguro (Google Drive, e-mail para você mesmo, etc.).

Recomendação: exporte o backup periodicamente, principalmente antes de trocar de celular ou limpar o navegador.

---

## 4. Como restaurar um backup

1. Abra o app → **Configurações** → **Backup**.
2. Toque em **Importar backup**.
3. Selecione o arquivo `.json` que você exportou antes.
4. Confirme a importação (isso substitui todos os dados atuais pelo do arquivo).

---

## 5. Como publicar online (para ter um link público e instalar de verdade)

A forma mais simples é usar a **Vercel** (gratuita):

1. Crie uma conta em [vercel.com](https://vercel.com) (pode entrar com GitHub, Google, etc.).
2. Suba esta pasta do projeto para um repositório no [GitHub](https://github.com) (pode usar o site do GitHub para criar o repositório e arrastar os arquivos, ou usar `git`).
3. Na Vercel, clique em **Add New → Project**, selecione o repositório.
4. A Vercel detecta automaticamente que é um projeto Vite. Clique em **Deploy**.
5. Em cerca de 1 minuto, você recebe um link tipo `https://meu-financeiro-seunome.vercel.app`.

Alternativa igualmente simples: **Netlify** (netlify.com) — o processo é praticamente idêntico, ou até mais simples: você pode arrastar a pasta `dist` (gerada com `npm run build`) direto na página de deploy do Netlify, sem precisar de GitHub.

Depois de publicado, abra o link pelo celular e siga o passo 2 (instalar como PWA).

---

## 6. Onde alterar configurações

Dentro do app: menu **Configurações** (ícone de engrenagem, dentro de "Mais" no celular, ou na barra lateral no computador). Lá você pode mudar:

- Nome do usuário
- Dia de início do ciclo financeiro
- Tema (claro / escuro / automático)
- Categorias personalizadas
- Backup e restauração
- Limpar todos os dados

Ajustes visuais (cores, fontes) ficam no início do arquivo `src/App.jsx`, no objeto `theme` dentro do componente `App`.

---

## 7. Como adicionar novas funcionalidades

O projeto é organizado assim:

```
src/
  App.jsx      → tudo: telas, cálculos, formulários e componentes de UI
  main.jsx     → ponto de entrada do React
  index.css    → estilos globais e Tailwind
public/
  icons/       → ícones do PWA
```

Dentro de `App.jsx`:

- **Cálculos financeiros**: funções `getEffectiveIncomes`, `getEffectiveExpenses`, `getCardInstallmentsForMonth`, `useMonthSummary` — é ali que fica toda a lógica de totais, parcelas e saldo. Qualquer novo cálculo deve entrar nessas funções para manter tudo centralizado.
- **Telas**: cada seção é um componente (`Dashboard`, `Lancamentos`, `Dividas`, `Cartoes`, `Orcamentos`, `Metas`, `CalendarioView`, `ReservaEmergencia`, `Relatorios`, `ConfiguracoesView`).
- **Formulários/modais**: `IncomeModal`, `ExpenseModal`, `DebtModal`, `CardModal`, `CardTransactionModal`, `GoalModal`.
- **Dados**: tudo fica no estado `data` (objeto com `incomes`, `expenses`, `debts`, `cards`, `cardTransactions`, `budgets`, `goals`, `categories`) e é salvo automaticamente no `localStorage`.

Para adicionar uma nova funcionalidade (ex: uma nova tela), o caminho geral é:
1. Adicionar o novo tipo de dado no objeto `emptyData()`.
2. Criar as funções de cálculo, se precisar.
3. Criar o componente da tela.
4. Adicionar a tela na lista `navItems`/`moreItems` dentro de `App()` e no bloco de renderização condicional (`{view === "..." && <MinhaTelaNova .../>}`).

---

## Roadmap sugerido (não implementado ainda)

- Login e sincronização entre dispositivos (ex: usando Supabase como backend).
- Exportação de relatórios em PDF.
- Notificações push reais (hoje os alertas aparecem só dentro do app).
