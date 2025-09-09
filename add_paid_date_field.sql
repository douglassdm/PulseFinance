-- Script para adicionar campo de controle de pagamento às transações
-- Execute este comando no SQL Editor do Supabase Dashboard

ALTER TABLE transactions 
ADD COLUMN paid_date DATE;

-- Adicionar comentário para documentar o campo
COMMENT ON COLUMN transactions.paid_date IS 'Data em que a transação foi efetivamente paga/recebida. NULL = pendente de pagamento';

-- Opcional: Criar um índice para melhorar performance das consultas por status de pagamento
CREATE INDEX idx_transactions_paid_date ON transactions(paid_date);

-- Opcional: Criar uma view para facilitar consultas de transações pendentes
CREATE OR REPLACE VIEW transactions_pending AS
SELECT * FROM transactions WHERE paid_date IS NULL;

-- Opcional: Criar uma view para facilitar consultas de transações pagas
CREATE OR REPLACE VIEW transactions_paid AS
SELECT * FROM transactions WHERE paid_date IS NOT NULL;