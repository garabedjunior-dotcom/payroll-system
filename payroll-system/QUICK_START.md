# 🚀 Quick Start Guide

Guia completo para rodar o sistema de payroll em **15 minutos**.

---

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter:

✅ Node.js 18+ instalado ([Download](https://nodejs.org/))  
✅ Git instalado  
✅ Uma conta Supabase (gratuita) ([Criar conta](https://supabase.com))  
✅ Editor de código (VS Code recomendado)

---

## 🎯 Passo 1: Clone e Instale (2 minutos)

```bash
# Clone o repositório
git clone https://github.com/your-org/payroll-system.git
cd payroll-system

# Instale as dependências
npm install
# ou se preferir pnpm: pnpm install
```

---

## 🗄️ Passo 2: Configure o Supabase (5 minutos)

### 2.1 Crie um Projeto Supabase

1. Acesse [supabase.com/dashboard](https://supabase.com/dashboard)
2. Clique em **"New Project"**
3. Preencha:
   - **Name**: `payroll-system` (ou nome de sua preferência)
   - **Database Password**: Escolha uma senha forte (salve-a!)
   - **Region**: Escolha a região mais próxima
4. Clique em **"Create new project"**
5. Aguarde ~2 minutos para o projeto ser criado

### 2.2 Copie as Credenciais

1. No dashboard do Supabase, vá em **Settings** → **API**
2. Copie os seguintes valores:
   - **Project URL** (ex: `https://abc123.supabase.co`)
   - **anon public** key
   - **service_role** key (clique em "Reveal" para ver)

### 2.3 Configure o .env.local

```bash
# Copie o arquivo de exemplo
cp .env.example .env.local
```

Edite `.env.local` e preencha:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key-aqui
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key-aqui
```

---

## 🛠️ Passo 3: Configure o Banco de Dados (5 minutos)

### 3.1 Instale o Supabase CLI

```bash
npm install -g supabase
```

### 3.2 Conecte ao Projeto

```bash
# Faça login
supabase login

# Conecte ao seu projeto
supabase link --project-ref seu-project-ref
```

**Como encontrar seu project-ref:**
- No dashboard do Supabase, vá em **Settings** → **General**
- Copie o **Reference ID** (ex: `abc123def456`)

### 3.3 Execute as Migrations

```bash
# Aplique o schema do banco de dados
supabase db push

# Carregue os dados de exemplo
supabase db seed
```

✅ **Resultado esperado:**
```
Seeding complete!
Users: 3
Workers: 6
Pay Items: 10
Time Entries: 15
Production Entries: 19
```

---

## 🏃 Passo 4: Rode o Projeto (1 minuto)

```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no navegador.

---

## 🔑 Passo 5: Faça Login (1 minuto)

Use uma das contas de demonstração:

### 👑 Owner (Acesso Completo)
```
Email: owner@undergroundcorp.com
Senha: Password123!
```

### 👨‍💼 Manager (Aprovações)
```
Email: manager@undergroundcorp.com
Senha: Password123!
```

### 👷 Supervisor (Entrada de Dados)
```
Email: supervisor@undergroundcorp.com
Senha: Password123!
```

---

## ✅ Passo 6: Teste as Funcionalidades (5 minutos)

### 6.1 Veja o Dashboard (Manager/Owner)
1. Faça login como **Manager**
2. Vá em **Dashboard**
3. Veja os KPIs: Total Payroll, Hours, Production, etc.

### 6.2 Aprove Entradas (Manager)
1. Vá em **Approvals** → **Time Entries**
2. Veja entradas pendentes
3. Clique em **Approve** ou **Reject**

### 6.3 Calcule Payroll (Owner)
1. Faça login como **Owner**
2. Vá em **Payroll** → **Calculate**
3. Selecione período: `2026-01-27` a `2026-01-31`
4. Clique em **Calculate Payroll**
5. Veja os resultados detalhados

### 6.4 Exporte para QuickBooks (Owner)
1. Após calcular payroll, clique em **Export**
2. Escolha formato:
   - **IIF** (QuickBooks Desktop)
   - **CSV** (QuickBooks Online)
3. Clique em **Download**
4. Abra o arquivo e verifique o conteúdo

---

## 🎉 Sucesso!

Você agora tem um sistema de payroll completo rodando localmente!

---

## 📚 Próximos Passos

### Personalize o Sistema

1. **Adicione seus próprios trabalhadores**
   - Vá em **Workers** → **Add Worker**

2. **Configure pay items customizados**
   - Vá em **Settings** → **Pay Items**

3. **Ajuste rates**
   - Vá em **Settings** → **Rate Table**

### Deploy para Produção

Quando estiver pronto para deploy:

1. **Push para GitHub**
```bash
git add .
git commit -m "Initial setup"
git push origin main
```

2. **Deploy no Vercel**
   - Acesse [vercel.com](https://vercel.com)
   - Clique em **"Import Project"**
   - Conecte seu repositório GitHub
   - Adicione as variáveis de ambiente (mesmo do `.env.local`)
   - Clique em **"Deploy"**

3. **Configure domínio customizado** (opcional)
   - No Vercel, vá em **Settings** → **Domains**
   - Adicione seu domínio (ex: `payroll.suaempresa.com`)

---

## 🐛 Problemas Comuns

### Erro: "Supabase project not found"
**Solução:** Verifique se você copiou corretamente o Project URL e as keys.

### Erro: "Database migration failed"
**Solução:** 
```bash
# Resete o banco e tente novamente
supabase db reset
supabase db push
```

### Erro: "Port 3000 already in use"
**Solução:**
```bash
# Use outra porta
npm run dev -- -p 3001
```

### Não consigo fazer login
**Solução:** Verifique se você executou `supabase db seed`. As contas de demo são criadas neste passo.

---

## 📞 Precisa de Ajuda?

- 📖 **Documentação completa**: [README.md](README.md)
- 🐛 **Report bugs**: [GitHub Issues](https://github.com/your-org/payroll-system/issues)
- 💬 **Dúvidas**: support@undergroundcorp.com

---

## 🎓 Aprenda Mais

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/docs)

---

**🚀 Bom trabalho! Seu sistema de payroll está pronto para uso!**
