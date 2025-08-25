-- Script para atualização do sistema de investimentos
-- Baseado na estrutura atual do database.sql

-- Enum para tipos de transações de investimento
CREATE TYPE investment_transaction_type AS ENUM (
    'BUY',        -- Compra de um ativo
    'SELL',       -- Venda de um ativo
    'DIVIDEND',   -- Recebimento de dividendos
    'DEPOSIT',    -- Depósito de fundos na conta de investimento
    'WITHDRAWAL', -- Retirada de fundos da conta de investimento
    'FEE',        -- Cobrança de taxa
    'SPLIT',      -- Desdobramento de ações
    'BONUS',      -- Bonificação de ações
    'OTHER'       -- Outros tipos de transação de investimento
);

-- Modificações na tabela investments existente
-- Adicionar novos campos necessários
ALTER TABLE public.investments 
ADD COLUMN IF NOT EXISTS average_purchase_price NUMERIC DEFAULT 0.0000,
ADD COLUMN IF NOT EXISTS current_market_price NUMERIC,
ADD COLUMN IF NOT EXISTS last_price_update TIMESTAMP WITH TIME ZONE;

-- Renomear campo quantity para current_quantity se necessário
-- (Verificar se já existe o campo quantity na tabela atual)
-- ALTER TABLE public.investments RENAME COLUMN quantity TO current_quantity;

-- Tabela de transações de investimento (nova)
CREATE TABLE public.investment_transactions (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    investment_id UUID NOT NULL,
    transaction_type investment_transaction_type NOT NULL,
    transaction_date DATE NOT NULL,
    quantity NUMERIC(18, 8),
    price_per_unit NUMERIC(18, 4),
    total_amount NUMERIC(18, 2) NOT NULL,
    fees NUMERIC(18, 2) NOT NULL DEFAULT 0.00,
    taxes NUMERIC(18, 2) NOT NULL DEFAULT 0.00,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT investment_transactions_pkey PRIMARY KEY (id),
    CONSTRAINT investment_transactions_investment_id_fkey FOREIGN KEY (investment_id) REFERENCES public.investments(id) ON DELETE CASCADE
);

-- Índices para a tabela investment_transactions
CREATE INDEX idx_investment_transactions_investment_id ON public.investment_transactions(investment_id);
CREATE INDEX idx_investment_transactions_date ON public.investment_transactions(transaction_date);
CREATE INDEX idx_investment_transactions_investment_date ON public.investment_transactions(investment_id, transaction_date);

-- Função para atualizar o campo updated_at automaticamente (se não existir)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at automaticamente na nova tabela
CREATE TRIGGER update_investment_transactions_updated_at 
    BEFORE UPDATE ON public.investment_transactions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) para investment_transactions
ALTER TABLE public.investment_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own investment transactions" 
    ON public.investment_transactions FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.investments 
            WHERE investments.id = investment_transactions.investment_id 
            AND investments.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their own investment transactions" 
    ON public.investment_transactions FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.investments 
            WHERE investments.id = investment_transactions.investment_id 
            AND investments.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own investment transactions" 
    ON public.investment_transactions FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM public.investments 
            WHERE investments.id = investment_transactions.investment_id 
            AND investments.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their own investment transactions" 
    ON public.investment_transactions FOR DELETE 
    USING (
        EXISTS (
            SELECT 1 FROM public.investments 
            WHERE investments.id = investment_transactions.investment_id 
            AND investments.user_id = auth.uid()
        )
    );

-- Comentários na nova tabela
COMMENT ON TABLE public.investment_transactions IS 'Registra todas as transações detalhadas relacionadas aos investimentos dos usuários.';

-- Comentários nas colunas da tabela investment_transactions
COMMENT ON COLUMN public.investment_transactions.investment_id IS 'ID do investimento ao qual a transação se refere.';
COMMENT ON COLUMN public.investment_transactions.transaction_type IS 'Tipo da transação de investimento (compra, venda, dividendo, etc.).';
COMMENT ON COLUMN public.investment_transactions.transaction_date IS 'Data em que a transação de investimento ocorreu.';
COMMENT ON COLUMN public.investment_transactions.quantity IS 'Quantidade de unidades envolvidas na transação.';
COMMENT ON COLUMN public.investment_transactions.price_per_unit IS 'Preço por unidade no momento da transação.';
COMMENT ON COLUMN public.investment_transactions.total_amount IS 'Valor total da transação.';
COMMENT ON COLUMN public.investment_transactions.fees IS 'Taxas cobradas na transação.';
COMMENT ON COLUMN public.investment_transactions.taxes IS 'Impostos pagos na transação.';
COMMENT ON COLUMN public.investment_transactions.description IS 'Descrição detalhada da transação de investimento.';
COMMENT ON COLUMN public.investment_transactions.created_at IS 'Data e hora de registro da transação de investimento.';
COMMENT ON COLUMN public.investment_transactions.updated_at IS 'Data e hora da última atualização da transação de investimento.';

-- Comentários nos novos campos da tabela investments
COMMENT ON COLUMN public.investments.average_purchase_price IS 'Preço médio de compra por unidade do ativo.';
COMMENT ON COLUMN public.investments.current_market_price IS 'Último preço de mercado conhecido por unidade do ativo.';
COMMENT ON COLUMN public.investments.last_price_update IS 'Data e hora da última atualização do preço de mercado.';

-- Script para migrar dados existentes (opcional)
-- Este script calcula o preço médio baseado nos dados atuais
/*
UPDATE public.investments 
SET average_purchase_price = CASE 
    WHEN quantity > 0 THEN initial_amount / quantity 
    ELSE 0 
END,
current_market_price = CASE 
    WHEN quantity > 0 THEN current_amount / quantity 
    ELSE 0 
END
WHERE quantity > 0;
*/