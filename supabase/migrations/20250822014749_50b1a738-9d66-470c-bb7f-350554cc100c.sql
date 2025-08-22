-- Criar enums para tipos de transação e investimento
CREATE TYPE public.transaction_type AS ENUM ('receita', 'despesa');
CREATE TYPE public.investment_type AS ENUM ('acao', 'fundo', 'criptomoeda', 'renda_fixa', 'outros');

-- Criar função para atualizar timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Tabela de perfis dos usuários
CREATE TABLE public.profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  name varchar(255) NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Tabela de categorias
CREATE TABLE public.categories (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name varchar(255) NOT NULL,
  type transaction_type NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, name, type)
);

-- Tabela de contas bancárias
CREATE TABLE public.bank_accounts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name varchar(255) NOT NULL,
  initial_balance decimal(18, 2) NOT NULL DEFAULT 0.00,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, name)
);

-- Tabela de transações
CREATE TABLE public.transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type transaction_type NOT NULL,
  value decimal(18, 2) NOT NULL,
  description text,
  category_id uuid REFERENCES public.categories(id),
  bank_account_id uuid NOT NULL REFERENCES public.bank_accounts(id) ON DELETE CASCADE,
  transaction_date date NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Tabela de metas financeiras
CREATE TABLE public.financial_goals (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id uuid REFERENCES public.categories(id),
  type transaction_type NOT NULL,
  target_value decimal(18, 2) NOT NULL,
  start_period date NOT NULL,
  end_period date NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Tabela de investimentos
CREATE TABLE public.investments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name varchar(255) NOT NULL,
  type investment_type NOT NULL,
  initial_amount decimal(18, 2) NOT NULL,
  current_amount decimal(18, 2) NOT NULL DEFAULT 0.00,
  purchase_date date NOT NULL,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, name)
);

-- Tabela de tags
CREATE TABLE public.tags (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name varchar(255) NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, name)
);

-- Tabela de relacionamento transações-tags
CREATE TABLE public.transaction_tags (
  transaction_id uuid NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (transaction_id, tag_id)
);

-- Tabela de dívidas
CREATE TABLE public.debts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name varchar(255) NOT NULL,
  original_amount decimal(18, 2) NOT NULL,
  current_amount decimal(18, 2) NOT NULL,
  interest_rate decimal(5, 2),
  due_date date,
  creditor varchar(255),
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, name)
);

-- Tabela de transações recorrentes
CREATE TABLE public.recurring_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type transaction_type NOT NULL,
  value decimal(18, 2) NOT NULL,
  description text,
  category_id uuid REFERENCES public.categories(id),
  bank_account_id uuid NOT NULL REFERENCES public.bank_accounts(id) ON DELETE CASCADE,
  start_date date NOT NULL,
  end_date date,
  frequency varchar(50) NOT NULL,
  next_occurrence_date date NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Tabela de histórico de saldos
CREATE TABLE public.account_balances_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bank_account_id uuid NOT NULL REFERENCES public.bank_accounts(id) ON DELETE CASCADE,
  balance_date date NOT NULL,
  balance_value decimal(18, 2) NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(bank_account_id, balance_date)
);

-- Criar índices para performance
CREATE INDEX idx_categories_user_id ON public.categories(user_id);
CREATE INDEX idx_bank_accounts_user_id ON public.bank_accounts(user_id);
CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_transactions_date ON public.transactions(transaction_date);
CREATE INDEX idx_transactions_category_id ON public.transactions(category_id);
CREATE INDEX idx_transactions_bank_account_id ON public.transactions(bank_account_id);
CREATE INDEX idx_transactions_user_date ON public.transactions(user_id, transaction_date);
CREATE INDEX idx_transactions_user_type ON public.transactions(user_id, type);
CREATE INDEX idx_financial_goals_user_id ON public.financial_goals(user_id);
CREATE INDEX idx_investments_user_id ON public.investments(user_id);
CREATE INDEX idx_tags_user_id ON public.tags(user_id);
CREATE INDEX idx_debts_user_id ON public.debts(user_id);
CREATE INDEX idx_recurring_transactions_user_id ON public.recurring_transactions(user_id);
CREATE INDEX idx_account_balances_history_account_id ON public.account_balances_history(bank_account_id);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_balances_history ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Políticas RLS para categories
CREATE POLICY "Users can view their own categories" ON public.categories
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own categories" ON public.categories
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own categories" ON public.categories
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own categories" ON public.categories
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas RLS para bank_accounts
CREATE POLICY "Users can view their own bank accounts" ON public.bank_accounts
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own bank accounts" ON public.bank_accounts
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own bank accounts" ON public.bank_accounts
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own bank accounts" ON public.bank_accounts
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas RLS para transactions
CREATE POLICY "Users can view their own transactions" ON public.transactions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own transactions" ON public.transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own transactions" ON public.transactions
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own transactions" ON public.transactions
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas RLS para financial_goals
CREATE POLICY "Users can view their own financial goals" ON public.financial_goals
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own financial goals" ON public.financial_goals
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own financial goals" ON public.financial_goals
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own financial goals" ON public.financial_goals
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas RLS para investments
CREATE POLICY "Users can view their own investments" ON public.investments
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own investments" ON public.investments
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own investments" ON public.investments
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own investments" ON public.investments
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas RLS para tags
CREATE POLICY "Users can view their own tags" ON public.tags
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own tags" ON public.tags
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own tags" ON public.tags
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own tags" ON public.tags
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas RLS para transaction_tags (baseada na transação)
CREATE POLICY "Users can view their own transaction tags" ON public.transaction_tags
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.transactions 
      WHERE transactions.id = transaction_tags.transaction_id 
      AND transactions.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can create their own transaction tags" ON public.transaction_tags
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.transactions 
      WHERE transactions.id = transaction_tags.transaction_id 
      AND transactions.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can delete their own transaction tags" ON public.transaction_tags
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.transactions 
      WHERE transactions.id = transaction_tags.transaction_id 
      AND transactions.user_id = auth.uid()
    )
  );

-- Políticas RLS para debts
CREATE POLICY "Users can view their own debts" ON public.debts
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own debts" ON public.debts
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own debts" ON public.debts
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own debts" ON public.debts
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas RLS para recurring_transactions
CREATE POLICY "Users can view their own recurring transactions" ON public.recurring_transactions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own recurring transactions" ON public.recurring_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own recurring transactions" ON public.recurring_transactions
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own recurring transactions" ON public.recurring_transactions
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas RLS para account_balances_history
CREATE POLICY "Users can view their own account balances history" ON public.account_balances_history
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own account balances history" ON public.account_balances_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own account balances history" ON public.account_balances_history
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own account balances history" ON public.account_balances_history
  FOR DELETE USING (auth.uid() = user_id);

-- Triggers para atualizar updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bank_accounts_updated_at
  BEFORE UPDATE ON public.bank_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_financial_goals_updated_at
  BEFORE UPDATE ON public.financial_goals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_investments_updated_at
  BEFORE UPDATE ON public.investments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tags_updated_at
  BEFORE UPDATE ON public.tags
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_debts_updated_at
  BEFORE UPDATE ON public.debts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_recurring_transactions_updated_at
  BEFORE UPDATE ON public.recurring_transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Função para criar perfil automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'name', 'Usuário'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar perfil automaticamente
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();