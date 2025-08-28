# PulseFinance 💰

Sistema completo de gestão financeira pessoal desenvolvido com tecnologias modernas para ajudar você a controlar suas finanças de forma inteligente e eficiente.

## 🚀 Sobre o Projeto

O PulseFinance é uma aplicação web moderna para controle financeiro pessoal que oferece:

- **Dashboard Intuitivo**: Visualize suas finanças de forma clara com gráficos e estatísticas
- **Gestão de Transações**: Controle completo de receitas e despesas
- **Contas Bancárias**: Gerencie múltiplas contas e acompanhe saldos
- **Categorias Personalizadas**: Organize suas transações por categorias
- **Investimentos**: Acompanhe e gerencie seus investimentos
- **Metas Financeiras**: Defina e acompanhe objetivos financeiros
- **Controle de Dívidas**: Monitore e organize seus débitos
- **Relatórios Detalhados**: Análises completas de suas movimentações
- **Transações Recorrentes**: Automatize lançamentos periódicos
- **Tags e Etiquetas**: Sistema flexível de organização
- **Tema Escuro/Claro**: Interface adaptável às suas preferências

## 🛠️ Tecnologias Utilizadas

- **Frontend**: React 18 com TypeScript
- **Bundler**: Vite (desenvolvimento rápido)
- **Estilização**: Tailwind CSS + shadcn/ui
- **Roteamento**: React Router DOM
- **Estado**: React Query (TanStack Query)
- **Formulários**: React Hook Form com validação Zod
- **Database**: Supabase (PostgreSQL)
- **Autenticação**: Supabase Auth
- **Gráficos**: Recharts
- **Ícones**: Lucide React
- **Tema**: next-themes
- **Notificações**: Sonner

## 📋 Pré-requisitos

Antes de começar, você precisará ter instalado em sua máquina:

- [Node.js](https://nodejs.org/) (versão 18 ou superior)
- [npm](https://www.npmjs.com/) ou [yarn](https://yarnpkg.com/)
- [Git](https://git-scm.com/)

## 🔧 Instalação e Configuração

### 1. Clone o repositório
```bash
git clone <URL_DO_SEU_REPOSITORIO>
cd PulseFinance
```

### 2. Instale as dependências
```bash
npm i
```

### 3. Configure as variáveis de ambiente
Crie um arquivo `.env.local` na raiz do projeto com:
```
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
```

### 4. Inicie o servidor de desenvolvimento
```bash
npm run dev
```

A aplicação estará disponível em `http://localhost:5173`

## 📝 Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Gera build de produção
- `npm run build:dev` - Gera build de desenvolvimento
- `npm run preview` - Visualiza o build de produção
- `npm run lint` - Executa o linter ESLint

## 🏗️ Estrutura do Projeto

```
src/
├── components/          # Componentes reutilizáveis
│   ├── ui/             # Componentes da interface (shadcn/ui)
│   ├── AppSidebar.tsx  # Sidebar da aplicação
│   ├── AuthProvider.tsx # Provedor de autenticação
│   ├── Layout.tsx      # Layout principal
│   └── ProtectedRoute.tsx # Proteção de rotas
├── hooks/              # Hooks personalizados
├── integrations/       # Integrações externas (Supabase)
├── lib/               # Utilitários e configurações
├── pages/             # Páginas da aplicação
└── config/            # Configurações do sistema
```

## 🌟 Funcionalidades Principais

### Dashboard
- Visão geral das finanças
- Gráficos de receitas e despesas
- Estatísticas em tempo real
- Cards informativos

### Transações
- Registro de receitas e despesas
- Categorização automática
- Filtros avançados
- Exportação de dados

### Investimentos
- Acompanhamento de carteira
- Cálculo de rendimentos
- Histórico de movimentações
- Análise de performance

### Relatórios
- Relatórios mensais e anuais
- Gráficos comparativos
- Análise por categorias
- Exportação para Excel

## 🔐 Segurança e Autenticação

- Autenticação segura via Supabase
- Proteção de rotas privadas
- Isolamento de dados por usuário
- Criptografia de dados sensíveis

## 🎨 Interface e Experiência

- Design responsivo (mobile-first)
- Tema escuro e claro
- Interface intuitiva e moderna
- Componentes acessíveis

## 📱 Responsividade

A aplicação foi desenvolvida com foco em responsividade, funcionando perfeitamente em:
- 📱 Dispositivos móveis
- 📊 Tablets
- 🖥️ Desktops

## 🚀 Deploy

### Opção 1: Lovable Platform
1. Acesse [Lovable](https://lovable.dev/projects/d3365ff9-e301-4d87-a450-59183a846bac)
2. Clique em Share → Publish

### Opção 2: Build Manual
```bash
npm run build
```

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Add: MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👨‍💻 Desenvolvido com ❤️

Desenvolvido com as melhores práticas de desenvolvimento web moderno, focando em performance, segurança e experiência do usuário.

---

**PulseFinance** - Sua plataforma completa de gestão financeira! 🎯