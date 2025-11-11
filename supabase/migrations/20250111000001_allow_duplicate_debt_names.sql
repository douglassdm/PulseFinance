-- Remove a constraint de nome único da tabela debts, se existir
DO $$
BEGIN
    -- Verifica se a constraint existe antes de tentar removê-la
    IF EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'debts_name_key'
        AND table_name = 'debts'
    ) THEN
        ALTER TABLE debts DROP CONSTRAINT debts_name_key;
    END IF;

    -- Remove índice único se existir
    IF EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE indexname = 'debts_name_idx'
        AND tablename = 'debts'
    ) THEN
        DROP INDEX debts_name_idx;
    END IF;
END $$;
