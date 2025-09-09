import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

const ApiDocs = () => {
  const baseUrl = "https://qfaoyuakvypkqlrjgcfj.supabase.co/rest/v1";

  const endpoints = [
    {
      category: "Authentication",
      items: [
        {
          method: "POST",
          path: "/auth/v1/signup",
          description: "Registrar novo usuário",
          params: "{ email: string, password: string }",
          response: "{ user: User, session: Session }",
          example: `curl -X POST "${baseUrl}/auth/v1/signup" \\
  -H "apikey: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"email": "user@example.com", "password": "password123"}'`,
        },
        {
          method: "POST",
          path: "/auth/v1/token",
          description: "Login de usuário",
          params: "{ email: string, password: string, grant_type: 'password' }",
          response:
            "{ access_token: string, refresh_token: string, user: User }",
          example: `curl -X POST "${baseUrl}/auth/v1/token" \\
  -H "apikey: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"email": "user@example.com", "password": "password123", "grant_type": "password"}'`,
        },
      ],
    },
    {
      category: "Profiles",
      items: [
        {
          method: "GET",
          path: "/profiles",
          description: "Listar perfis do usuário",
          params: "select=*, user_id=eq.{user_id}",
          response:
            "[{ id, user_id, name, created_at, updated_at }]",
          example: `curl -X GET "${baseUrl}/profiles?select=*&user_id=eq.USER_ID" \\
  -H "apikey: YOUR_API_KEY" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"`,
        },
        {
          method: "POST",
          path: "/profiles",
          description: "Criar novo perfil",
          params: "{ name: string }",
          response: "{ id, user_id, name, created_at, updated_at }",
          example: `curl -X POST "${baseUrl}/profiles" \\
  -H "apikey: YOUR_API_KEY" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"name": "João Silva"}'`,
        },
        {
          method: "PATCH",
          path: "/profiles?user_id=eq.{user_id}",
          description: "Atualizar perfil",
          params: "{ name?: string }",
          response: "{ id, user_id, name, created_at, updated_at }",
          example: `curl -X PATCH "${baseUrl}/profiles?user_id=eq.USER_ID" \\
  -H "apikey: YOUR_API_KEY" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"name": "João Silva Santos"}'`,
        },
      ],
    },
    {
      category: "Bank Accounts",
      items: [
        {
          method: "GET",
          path: "/bank_accounts",
          description: "Listar todas as contas bancárias do usuário",
          params: "select=*, user_id=eq.{user_id}",
          response:
            "[{ id, name, description, initial_balance, created_at, updated_at, user_id }]",
          example: `curl -X GET "${baseUrl}/bank_accounts?select=*&user_id=eq.USER_ID" \\
  -H "apikey: YOUR_API_KEY" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"`,
        },
        {
          method: "POST",
          path: "/bank_accounts",
          description: "Criar nova conta bancária",
          params:
            "{ name: string, description?: string, initial_balance: number }",
          response:
            "{ id, name, description, initial_balance, created_at, updated_at, user_id }",
          example: `curl -X POST "${baseUrl}/bank_accounts" \\
  -H "apikey: YOUR_API_KEY" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"name": "Conta Corrente", "description": "Conta principal", "initial_balance": 1000}'`,
        },
        {
          method: "PATCH",
          path: "/bank_accounts?id=eq.{id}",
          description: "Atualizar conta bancária",
          params:
            "{ name?: string, description?: string, initial_balance?: number }",
          response:
            "{ id, name, description, initial_balance, created_at, updated_at, user_id }",
          example: `curl -X PATCH "${baseUrl}/bank_accounts?id=eq.ACCOUNT_ID" \\
  -H "apikey: YOUR_API_KEY" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"name": "Nova Conta Corrente"}'`,
        },
        {
          method: "DELETE",
          path: "/bank_accounts?id=eq.{id}",
          description: "Excluir conta bancária",
          params: "id (via URL)",
          response: "204 No Content",
          example: `curl -X DELETE "${baseUrl}/bank_accounts?id=eq.ACCOUNT_ID" \\
  -H "apikey: YOUR_API_KEY" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"`,
        },
      ],
    },
    {
      category: "Transactions",
      items: [
        {
          method: "GET",
          path: "/transactions",
          description: "Listar todas as transações do usuário",
          params:
            "select=*,categories(*),bank_accounts(*), user_id=eq.{user_id}",
          response:
            "[{ id, value, description, transaction_date, type, bank_account_id, category_id, created_at, updated_at, user_id }]",
          example: `curl -X GET "${baseUrl}/transactions?select=*,categories(*),bank_accounts(*)&user_id=eq.USER_ID" \\
  -H "apikey: YOUR_API_KEY" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"`,
        },
        {
          method: "POST",
          path: "/transactions",
          description: "Criar nova transação",
          params:
            "{ value: number, description?: string, transaction_date: string, type: 'receita'|'despesa', bank_account_id: string, category_id?: string, paid_date?: string }",
          response:
            "{ id, value, description, transaction_date, type, bank_account_id, category_id, paid_date, created_at, updated_at, user_id }",
          example: `curl -X POST "${baseUrl}/transactions" \\
  -H "apikey: YOUR_API_KEY" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"value": 500, "description": "Salário", "transaction_date": "2024-01-15", "type": "receita", "bank_account_id": "account-id", "paid_date": "2024-01-16"}'`,
        },
        {
          method: "PATCH",
          path: "/transactions?id=eq.{id}",
          description: "Atualizar transação",
          params:
            "{ value?: number, description?: string, transaction_date?: string, type?: string, bank_account_id?: string, category_id?: string, paid_date?: string }",
          response:
            "{ id, value, description, transaction_date, type, bank_account_id, category_id, paid_date, created_at, updated_at, user_id }",
          example: `curl -X PATCH "${baseUrl}/transactions?id=eq.TRANSACTION_ID" \\
  -H "apikey: YOUR_API_KEY" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"value": 600, "description": "Salário atualizado", "paid_date": "2024-01-16"}'`,
        },
        {
          method: "DELETE",
          path: "/transactions?id=eq.{id}",
          description: "Excluir transação",
          params: "id (via URL)",
          response: "204 No Content",
          example: `curl -X DELETE "${baseUrl}/transactions?id=eq.TRANSACTION_ID" \\
  -H "apikey: YOUR_API_KEY" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"`,
        },
      ],
    },
    {
      category: "Categories",
      items: [
        {
          method: "GET",
          path: "/categories",
          description: "Listar todas as categorias do usuário",
          params: "select=*, user_id=eq.{user_id}",
          response: "[{ id, name, type, created_at, updated_at, user_id }]",
          example: `curl -X GET "${baseUrl}/categories?select=*&user_id=eq.USER_ID" \\
  -H "apikey: YOUR_API_KEY" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"`,
        },
        {
          method: "POST",
          path: "/categories",
          description: "Criar nova categoria",
          params: "{ name: string, type: 'receita'|'despesa' }",
          response: "{ id, name, type, created_at, updated_at, user_id }",
          example: `curl -X POST "${baseUrl}/categories" \\
  -H "apikey: YOUR_API_KEY" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"name": "Alimentação", "type": "despesa"}'`,
        },
      ],
    },
    {
      category: "Investments",
      items: [
        {
          method: "GET",
          path: "/investments",
          description: "Listar todos os investimentos do usuário",
          params: "select=*, user_id=eq.{user_id}",
          response:
            "[{ id, name, description, type, initial_amount, current_amount, purchase_date, created_at, updated_at, user_id }]",
          example: `curl -X GET "${baseUrl}/investments?select=*&user_id=eq.USER_ID" \\
  -H "apikey: YOUR_API_KEY" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"`,
        },
        {
          method: "POST",
          path: "/investments",
          description: "Criar novo investimento",
          params:
            "{ name: string, description?: string, type: 'acao'|'fundo'|'criptomoeda'|'renda_fixa'|'outros', initial_amount: number, current_amount?: number, purchase_date: string, symbol?: string, quantity?: number, brokerage?: string, currency?: string, average_purchase_price?: number, current_market_price?: number }",
          response:
            "{ id, name, description, type, initial_amount, current_amount, purchase_date, symbol, quantity, brokerage, currency, average_purchase_price, current_market_price, last_price_update, created_at, updated_at, user_id }",
          example: `curl -X POST "${baseUrl}/investments" \\
  -H "apikey: YOUR_API_KEY" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"name": "PETR4", "type": "acao", "initial_amount": 1000, "current_amount": 1200, "purchase_date": "2024-01-15", "symbol": "PETR4", "quantity": 100, "brokerage": "XP"}'`,
        },
        {
          method: "PATCH",
          path: "/investments?id=eq.{id}",
          description: "Atualizar investimento",
          params:
            "{ name?: string, description?: string, current_amount?: number, symbol?: string, quantity?: number, brokerage?: string, current_market_price?: number }",
          response:
            "{ id, name, description, type, initial_amount, current_amount, purchase_date, symbol, quantity, brokerage, currency, average_purchase_price, current_market_price, last_price_update, created_at, updated_at, user_id }",
          example: `curl -X PATCH "${baseUrl}/investments?id=eq.INVESTMENT_ID" \\
  -H "apikey: YOUR_API_KEY" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"current_amount": 1350, "current_market_price": 13.50}'`,
        },
        {
          method: "DELETE",
          path: "/investments?id=eq.{id}",
          description: "Excluir investimento",
          params: "id (via URL)",
          response: "204 No Content",
          example: `curl -X DELETE "${baseUrl}/investments?id=eq.INVESTMENT_ID" \\
  -H "apikey: YOUR_API_KEY" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"`,
        },
      ],
    },
    {
      category: "Investment Transactions",
      items: [
        {
          method: "GET",
          path: "/investment_transactions",
          description: "Listar todas as transações de investimento",
          params: "select=*,investments(*), investment_id=eq.{investment_id}",
          response:
            "[{ id, investment_id, transaction_type, transaction_date, quantity, price_per_unit, total_amount, fees, taxes, description, created_at, updated_at }]",
          example: `curl -X GET "${baseUrl}/investment_transactions?select=*,investments(*)&investment_id=eq.INVESTMENT_ID" \\
  -H "apikey: YOUR_API_KEY" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"`,
        },
        {
          method: "POST",
          path: "/investment_transactions",
          description: "Criar nova transação de investimento",
          params:
            "{ investment_id: string, transaction_type: 'compra'|'venda'|'dividendo'|'juros', transaction_date: string, quantity?: number, price_per_unit?: number, total_amount: number, fees?: number, taxes?: number, description?: string }",
          response:
            "{ id, investment_id, transaction_type, transaction_date, quantity, price_per_unit, total_amount, fees, taxes, description, created_at, updated_at }",
          example: `curl -X POST "${baseUrl}/investment_transactions" \\
  -H "apikey: YOUR_API_KEY" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"investment_id": "investment-id", "transaction_type": "compra", "transaction_date": "2024-01-15", "quantity": 10, "price_per_unit": 100, "total_amount": 1000, "fees": 5}'`,
        },
        {
          method: "PATCH",
          path: "/investment_transactions?id=eq.{id}",
          description: "Atualizar transação de investimento",
          params:
            "{ quantity?: number, price_per_unit?: number, total_amount?: number, fees?: number, taxes?: number, description?: string }",
          response:
            "{ id, investment_id, transaction_type, transaction_date, quantity, price_per_unit, total_amount, fees, taxes, description, created_at, updated_at }",
          example: `curl -X PATCH "${baseUrl}/investment_transactions?id=eq.TRANSACTION_ID" \\
  -H "apikey: YOUR_API_KEY" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"fees": 10, "taxes": 15}'`,
        },
        {
          method: "DELETE",
          path: "/investment_transactions?id=eq.{id}",
          description: "Excluir transação de investimento",
          params: "id (via URL)",
          response: "204 No Content",
          example: `curl -X DELETE "${baseUrl}/investment_transactions?id=eq.TRANSACTION_ID" \\
  -H "apikey: YOUR_API_KEY" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"`,
        },
      ],
    },
    {
      category: "Debts",
      items: [
        {
          method: "GET",
          path: "/debts",
          description: "Listar todas as dívidas do usuário",
          params: "select=*, user_id=eq.{user_id}",
          response:
            "[{ id, name, description, creditor, original_amount, current_amount, interest_rate, due_date, created_at, updated_at, user_id }]",
          example: `curl -X GET "${baseUrl}/debts?select=*&user_id=eq.USER_ID" \\
  -H "apikey: YOUR_API_KEY" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"`,
        },
        {
          method: "POST",
          path: "/debts",
          description: "Criar nova dívida",
          params:
            "{ name: string, description?: string, creditor?: string, original_amount: number, current_amount: number, interest_rate?: number, monthly_interest_rate?: number, due_date?: string, last_payment_date?: string }",
          response:
            "{ id, name, description, creditor, original_amount, current_amount, interest_rate, monthly_interest_rate, due_date, last_payment_date, created_at, updated_at, user_id }",
          example: `curl -X POST "${baseUrl}/debts" \\
  -H "apikey: YOUR_API_KEY" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"name": "Financiamento Carro", "creditor": "Banco XYZ", "original_amount": 50000, "current_amount": 35000, "interest_rate": 1.5, "monthly_interest_rate": 0.125, "due_date": "2025-12-31"}'`,
        },
        {
          method: "PATCH",
          path: "/debts?id=eq.{id}",
          description: "Atualizar dívida",
          params:
            "{ name?: string, description?: string, current_amount?: number, interest_rate?: number, monthly_interest_rate?: number, last_payment_date?: string }",
          response:
            "{ id, name, description, creditor, original_amount, current_amount, interest_rate, monthly_interest_rate, due_date, last_payment_date, created_at, updated_at, user_id }",
          example: `curl -X PATCH "${baseUrl}/debts?id=eq.DEBT_ID" \\
  -H "apikey: YOUR_API_KEY" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"current_amount": 30000, "last_payment_date": "2024-01-15"}'`,
        },
        {
          method: "DELETE",
          path: "/debts?id=eq.{id}",
          description: "Excluir dívida",
          params: "id (via URL)",
          response: "204 No Content",
          example: `curl -X DELETE "${baseUrl}/debts?id=eq.DEBT_ID" \\
  -H "apikey: YOUR_API_KEY" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"`,
        },
      ],
    },
    {
      category: "Goals",
      items: [
        {
          method: "GET",
          path: "/financial_goals",
          description: "Listar todas as metas financeiras do usuário",
          params: "select=*,categories(*), user_id=eq.{user_id}",
          response:
            "[{ id, type, target_value, start_period, end_period, category_id, created_at, updated_at, user_id }]",
          example: `curl -X GET "${baseUrl}/financial_goals?select=*,categories(*)&user_id=eq.USER_ID" \\
  -H "apikey: YOUR_API_KEY" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"`,
        },
        {
          method: "POST",
          path: "/financial_goals",
          description: "Criar nova meta financeira",
          params:
            "{ type: 'receita'|'despesa', target_value: number, start_period: string, end_period: string, category_id?: string, current_value?: number }",
          response:
            "{ id, type, target_value, start_period, end_period, category_id, current_value, created_at, updated_at, user_id }",
          example: `curl -X POST "${baseUrl}/financial_goals" \\
  -H "apikey: YOUR_API_KEY" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"type": "receita", "target_value": 10000, "start_period": "2024-01-01", "end_period": "2024-12-31", "current_value": 0}'`,
        },
        {
          method: "PATCH",
          path: "/financial_goals?id=eq.{id}",
          description: "Atualizar meta financeira",
          params:
            "{ target_value?: number, start_period?: string, end_period?: string, current_value?: number }",
          response:
            "{ id, type, target_value, start_period, end_period, category_id, current_value, created_at, updated_at, user_id }",
          example: `curl -X PATCH "${baseUrl}/financial_goals?id=eq.GOAL_ID" \\
  -H "apikey: YOUR_API_KEY" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"current_value": 2500}'`,
        },
        {
          method: "DELETE",
          path: "/financial_goals?id=eq.{id}",
          description: "Excluir meta financeira",
          params: "id (via URL)",
          response: "204 No Content",
          example: `curl -X DELETE "${baseUrl}/financial_goals?id=eq.GOAL_ID" \\
  -H "apikey: YOUR_API_KEY" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"`,
        },
      ],
    },
    {
      category: "Goal Progress",
      items: [
        {
          method: "GET",
          path: "/goal_progress",
          description: "Listar progresso das metas financeiras",
          params: "select=*,financial_goals(*), user_id=eq.{user_id}",
          response:
            "[{ id, user_id, goal_id, value, description, progress_date, created_at, updated_at }]",
          example: `curl -X GET "${baseUrl}/goal_progress?select=*,financial_goals(*)&user_id=eq.USER_ID" \\
  -H "apikey: YOUR_API_KEY" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"`,
        },
        {
          method: "POST",
          path: "/goal_progress",
          description: "Registrar progresso de meta",
          params:
            "{ goal_id: string, value: number, description?: string, progress_date: string }",
          response:
            "{ id, user_id, goal_id, value, description, progress_date, created_at, updated_at }",
          example: `curl -X POST "${baseUrl}/goal_progress" \\
  -H "apikey: YOUR_API_KEY" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"goal_id": "goal-id", "value": 500, "description": "Salário do mês", "progress_date": "2024-01-15"}'`,
        },
        {
          method: "DELETE",
          path: "/goal_progress?id=eq.{id}",
          description: "Excluir progresso de meta",
          params: "id (via URL)",
          response: "204 No Content",
          example: `curl -X DELETE "${baseUrl}/goal_progress?id=eq.PROGRESS_ID" \\
  -H "apikey: YOUR_API_KEY" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"`,
        },
      ],
    },
    {
      category: "Tags",
      items: [
        {
          method: "GET",
          path: "/tags",
          description: "Listar todas as tags do usuário",
          params: "select=*, user_id=eq.{user_id}",
          response: "[{ id, name, created_at, updated_at, user_id }]",
          example: `curl -X GET "${baseUrl}/tags?select=*&user_id=eq.USER_ID" \\
  -H "apikey: YOUR_API_KEY" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"`,
        },
        {
          method: "POST",
          path: "/tags",
          description: "Criar nova tag",
          params: "{ name: string }",
          response: "{ id, name, created_at, updated_at, user_id }",
          example: `curl -X POST "${baseUrl}/tags" \\
  -H "apikey: YOUR_API_KEY" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"name": "Essencial"}'`,
        },
      ],
    },
    {
      category: "Transaction Tags",
      items: [
        {
          method: "GET",
          path: "/transaction_tags",
          description: "Listar tags de transações",
          params: "select=*,transactions(*),tags(*)",
          response:
            "[{ transaction_id, tag_id, created_at }]",
          example: `curl -X GET "${baseUrl}/transaction_tags?select=*,transactions(*),tags(*)" \\
  -H "apikey: YOUR_API_KEY" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"`,
        },
        {
          method: "POST",
          path: "/transaction_tags",
          description: "Associar tag à transação",
          params: "{ transaction_id: string, tag_id: string }",
          response: "{ transaction_id, tag_id, created_at }",
          example: `curl -X POST "${baseUrl}/transaction_tags" \\
  -H "apikey: YOUR_API_KEY" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"transaction_id": "transaction-id", "tag_id": "tag-id"}'`,
        },
        {
          method: "DELETE",
          path: "/transaction_tags?transaction_id=eq.{transaction_id}&tag_id=eq.{tag_id}",
          description: "Remover tag da transação",
          params: "transaction_id, tag_id (via URL)",
          response: "204 No Content",
          example: `curl -X DELETE "${baseUrl}/transaction_tags?transaction_id=eq.TRANSACTION_ID&tag_id=eq.TAG_ID" \\
  -H "apikey: YOUR_API_KEY" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"`,
        },
      ],
    },
    {
      category: "Account Balances History",
      items: [
        {
          method: "GET",
          path: "/account_balances_history",
          description: "Listar histórico de saldos das contas",
          params: "select=*,bank_accounts(*), user_id=eq.{user_id}",
          response:
            "[{ id, user_id, bank_account_id, balance_date, balance_value, created_at }]",
          example: `curl -X GET "${baseUrl}/account_balances_history?select=*,bank_accounts(*)&user_id=eq.USER_ID" \\
  -H "apikey: YOUR_API_KEY" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"`,
        },
        {
          method: "POST",
          path: "/account_balances_history",
          description: "Registrar saldo histórico",
          params:
            "{ bank_account_id: string, balance_date: string, balance_value: number }",
          response:
            "{ id, user_id, bank_account_id, balance_date, balance_value, created_at }",
          example: `curl -X POST "${baseUrl}/account_balances_history" \\
  -H "apikey: YOUR_API_KEY" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"bank_account_id": "account-id", "balance_date": "2024-01-15", "balance_value": 5000}'`,
        },
        {
          method: "DELETE",
          path: "/account_balances_history?id=eq.{id}",
          description: "Excluir registro de saldo",
          params: "id (via URL)",
          response: "204 No Content",
          example: `curl -X DELETE "${baseUrl}/account_balances_history?id=eq.BALANCE_ID" \\
  -H "apikey: YOUR_API_KEY" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"`,
        },
      ],
    },
    {
      category: "Recurring Transactions",
      items: [
        {
          method: "GET",
          path: "/recurring_transactions",
          description: "Listar todas as transações recorrentes do usuário",
          params:
            "select=*,categories(*),bank_accounts(*), user_id=eq.{user_id}",
          response:
            "[{ id, value, description, type, frequency, start_date, end_date, next_occurrence_date, bank_account_id, category_id, created_at, updated_at, user_id }]",
          example: `curl -X GET "${baseUrl}/recurring_transactions?select=*,categories(*),bank_accounts(*)&user_id=eq.USER_ID" \\
  -H "apikey: YOUR_API_KEY" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"`,
        },
        {
          method: "POST",
          path: "/recurring_transactions",
          description: "Criar nova transação recorrente",
          params:
            "{ value: number, description?: string, type: 'receita'|'despesa', frequency: string, start_date: string, end_date?: string, next_occurrence_date: string, bank_account_id: string, category_id?: string }",
          response:
            "{ id, value, description, type, frequency, start_date, end_date, next_occurrence_date, bank_account_id, category_id, created_at, updated_at, user_id }",
          example: `curl -X POST "${baseUrl}/recurring_transactions" \\
  -H "apikey: YOUR_API_KEY" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"value": 3000, "description": "Salário", "type": "receita", "frequency": "monthly", "start_date": "2024-01-01", "next_occurrence_date": "2024-02-01", "bank_account_id": "account-id"}'`,
        },
      ],
    },
  ];

  const getMethodColor = (method: string) => {
    switch (method) {
      case "GET":
        return "bg-green-500";
      case "POST":
        return "bg-blue-500";
      case "PATCH":
        return "bg-yellow-500";
      case "DELETE":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">
          API Documentation - PulseFinance
        </h1>
        <p className="text-muted-foreground mb-4">
          Documentação completa da API REST do PulseFinance. Esta API utiliza
          Supabase como backend.
        </p>
        <div className="bg-muted/50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Base URL</h2>
          <code className="text-sm bg-background px-2 py-1 rounded">
            {baseUrl}
          </code>
        </div>
      </div>

      <Tabs defaultValue="auth" className="w-full">
        <ScrollArea className="w-full whitespace-nowrap rounded-md border">
          <TabsList className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground w-max">
            <TabsTrigger value="auth">Authentication</TabsTrigger>
            <TabsTrigger value="profiles">Profiles</TabsTrigger>
            <TabsTrigger value="accounts">Bank Accounts</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="investments">Investments</TabsTrigger>
            <TabsTrigger value="investment_transactions">Invest. Trans.</TabsTrigger>
            <TabsTrigger value="debts">Debts</TabsTrigger>
            <TabsTrigger value="goals">Goals</TabsTrigger>
            <TabsTrigger value="goal_progress">Goal Progress</TabsTrigger>
            <TabsTrigger value="tags">Tags</TabsTrigger>
            <TabsTrigger value="transaction_tags">Trans. Tags</TabsTrigger>
            <TabsTrigger value="account_balances">Balance History</TabsTrigger>
            <TabsTrigger value="recurring">Recurring</TabsTrigger>
          </TabsList>
        </ScrollArea>

        {endpoints.map((category) => {
          const getTabValue = (categoryName: string) => {
            switch (categoryName) {
              case "Bank Accounts":
                return "accounts";
              case "Recurring Transactions":
                return "recurring";
              case "Investment Transactions":
                return "investment_transactions";
              case "Goal Progress":
                return "goal_progress";
              case "Transaction Tags":
                return "transaction_tags";
              case "Account Balances History":
                return "account_balances";
              default:
                return categoryName.toLowerCase();
            }
          };
          
          return (
          <TabsContent
            key={category.category.toLowerCase().replace(/\s+/g, "")}
            value={getTabValue(category.category)}
          >
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold">{category.category}</h2>
              {category.items.map((endpoint, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <Badge
                        className={`${getMethodColor(
                          endpoint.method
                        )} text-white`}
                      >
                        {endpoint.method}
                      </Badge>
                      <code className="text-base">{endpoint.path}</code>
                    </CardTitle>
                    <p className="text-muted-foreground">
                      {endpoint.description}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Parâmetros</h4>
                      <div className="bg-muted/50 p-3 rounded-lg">
                        <code className="text-sm">{endpoint.params}</code>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Resposta</h4>
                      <div className="bg-muted/50 p-3 rounded-lg">
                        <code className="text-sm">{endpoint.response}</code>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Exemplo cURL</h4>
                      <div className="bg-black text-green-400 p-4 rounded-lg overflow-x-auto">
                        <pre className="text-sm">{endpoint.example}</pre>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          );
        })}
      </Tabs>

      <Separator className="my-8" />

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Autenticação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>A API utiliza JWT tokens para autenticação. Você precisa:</p>
            <ol className="list-decimal list-inside space-y-2">
              <li>
                Fazer login via <code>/auth/v1/token</code> para obter o
                access_token
              </li>
              <li>
                Incluir o token no header:{" "}
                <code>Authorization: Bearer YOUR_JWT_TOKEN</code>
              </li>
              <li>
                Incluir sempre o header: <code>apikey: YOUR_API_KEY</code>
              </li>
            </ol>
            <div className="bg-muted/50 p-3 rounded-lg">
              <p className="text-sm font-medium mb-2">API Key (pública):</p>
              <code className="text-xs break-all">
                eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmYW95dWFrdnlwa3FscmpnY2ZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4MjYyMDQsImV4cCI6MjA3MTQwMjIwNH0.NfHVMIc4PadkSGoJ08xA5oOZtu0-qe-Frozg9PYuTEo
              </code>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Códigos de Status HTTP</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2 text-green-600">Sucesso</h4>
                <ul className="space-y-1 text-sm">
                  <li>
                    <code>200</code> - OK (GET, PATCH)
                  </li>
                  <li>
                    <code>201</code> - Created (POST)
                  </li>
                  <li>
                    <code>204</code> - No Content (DELETE)
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2 text-red-600">Erro</h4>
                <ul className="space-y-1 text-sm">
                  <li>
                    <code>400</code> - Bad Request
                  </li>
                  <li>
                    <code>401</code> - Unauthorized
                  </li>
                  <li>
                    <code>403</code> - Forbidden
                  </li>
                  <li>
                    <code>404</code> - Not Found
                  </li>
                  <li>
                    <code>500</code> - Internal Server Error
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Filtros e Consultas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>A API suporta filtros avançados via query parameters:</p>
            <div className="space-y-2">
              <div>
                <h4 className="font-semibold">Filtros de Igualdade</h4>
                <code className="text-sm">?column=eq.value</code>
              </div>
              <div>
                <h4 className="font-semibold">Filtros de Data</h4>
                <code className="text-sm">
                  ?created_at=gte.2024-01-01&created_at=lt.2024-12-31
                </code>
              </div>
              <div>
                <h4 className="font-semibold">Ordenação</h4>
                <code className="text-sm">?order=created_at.desc</code>
              </div>
              <div>
                <h4 className="font-semibold">Limite e Paginação</h4>
                <code className="text-sm">?limit=10&offset=20</code>
              </div>
              <div>
                <h4 className="font-semibold">Seleção de Campos</h4>
                <code className="text-sm">?select=id,name,created_at</code>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tipos de Dados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">Transaction Types</h4>
                <ul className="space-y-1 text-sm">
                  <li>
                    <code>receita</code> - Receita/Entrada
                  </li>
                  <li>
                    <code>despesa</code> - Despesa/Saída
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Investment Types</h4>
                <ul className="space-y-1 text-sm">
                  <li>
                    <code>acao</code> - Ações
                  </li>
                  <li>
                    <code>fundo</code> - Fundos
                  </li>
                  <li>
                    <code>criptomoeda</code> - Criptomoedas
                  </li>
                  <li>
                    <code>renda_fixa</code> - Renda Fixa
                  </li>
                  <li>
                    <code>outros</code> - Outros
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Investment Transaction Types</h4>
                <ul className="space-y-1 text-sm">
                  <li>
                    <code>compra</code> - Compra
                  </li>
                  <li>
                    <code>venda</code> - Venda
                  </li>
                  <li>
                    <code>dividendo</code> - Dividendo
                  </li>
                  <li>
                    <code>juros</code> - Juros
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Frequency Types</h4>
                <ul className="space-y-1 text-sm">
                  <li>
                    <code>daily</code> - Diário
                  </li>
                  <li>
                    <code>weekly</code> - Semanal
                  </li>
                  <li>
                    <code>monthly</code> - Mensal
                  </li>
                  <li>
                    <code>yearly</code> - Anual
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ApiDocs;
