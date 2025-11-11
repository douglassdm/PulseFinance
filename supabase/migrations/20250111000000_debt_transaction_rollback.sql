-- ============================================================================
-- Migration: Reverter pagamento de dívida ao deletar transação
-- ============================================================================
-- Instruções:
-- 1. Acesse o Supabase Dashboard (https://app.supabase.com)
-- 2. Vá em SQL Editor
-- 3. Cole e execute este script
-- ============================================================================

-- Função para reverter o pagamento de dívida quando uma transação é deletada
CREATE OR REPLACE FUNCTION revert_debt_payment()
RETURNS TRIGGER AS $$
BEGIN
  -- Verifica se a transação deletada está associada a uma dívida
  IF OLD.debt_id IS NOT NULL AND OLD.type = 'despesa' THEN
    -- Adiciona o valor de volta ao current_amount da dívida
    UPDATE debts
    SET current_amount = current_amount + OLD.value
    WHERE id = OLD.debt_id;
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Cria o trigger que executa a função antes de deletar uma transação
DROP TRIGGER IF EXISTS revert_debt_payment_trigger ON transactions;
CREATE TRIGGER revert_debt_payment_trigger
BEFORE DELETE ON transactions
FOR EACH ROW
EXECUTE FUNCTION revert_debt_payment();
