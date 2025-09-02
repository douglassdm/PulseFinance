import { useState, useEffect } from "react";
import {
  Plus,
  Edit,
  Trash2,
  TrendingUp,
  PiggyBank,
  History,
  ArrowUpDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";

interface Investment {
  id: string;
  name: string;
  symbol: string | null;
  type: "acao" | "fundo" | "criptomoeda" | "renda_fixa" | "outros";
  quantity: number;
  initial_amount: number;
  current_amount: number;
  purchase_date: string;
  brokerage: string | null;
  currency: string;
  description: string | null;
  average_purchase_price?: number;
  current_market_price?: number;
  last_price_update?: string;
  created_at: string;
  updated_at: string;
}

interface InvestmentTransaction {
  id: string;
  investment_id: string;
  transaction_type:
    | "BUY"
    | "SELL"
    | "DIVIDEND"
    | "DEPOSIT"
    | "WITHDRAWAL"
    | "FEE"
    | "SPLIT"
    | "BONUS"
    | "OTHER";
  transaction_date: string;
  quantity?: number;
  price_per_unit?: number;
  total_amount: number;
  fees: number;
  taxes: number;
  description: string | null;
  created_at: string;
  updated_at: string;
}

const investmentTypeLabels = {
  acao: "Ações",
  fundo: "Fundos",
  criptomoeda: "Criptomoedas",
  renda_fixa: "Renda Fixa",
  outros: "Outros",
};

const transactionTypeLabels = {
  BUY: "Compra",
  SELL: "Venda",
  DIVIDEND: "Dividendo",
  DEPOSIT: "Depósito",
  WITHDRAWAL: "Retirada",
  FEE: "Taxa",
  SPLIT: "Desdobramento",
  BONUS: "Bonificação",
  OTHER: "Outros",
};

const Investments = () => {
  const { user } = useAuth();
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [transactions, setTransactions] = useState<InvestmentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [transactionModalOpen, setTransactionModalOpen] = useState(false);
  const [transactionsViewOpen, setTransactionsViewOpen] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState<Investment | null>(
    null
  );
  const [selectedInvestment, setSelectedInvestment] =
    useState<Investment | null>(null);
  const [bankAccounts, setBankAccounts] = useState<
    { id: string; name: string }[]
  >([]);
  const [formData, setFormData] = useState({
    name: "",
    symbol: "",
    type: "acao" as "acao" | "fundo" | "criptomoeda" | "renda_fixa" | "outros",
    quantity: "",
    initial_amount: "",
    current_amount: "",
    purchase_date: new Date().toISOString().split("T")[0],
    brokerage: "",
    currency: "BRL",
    description: "",
  });

  const [transactionFormData, setTransactionFormData] = useState({
    transaction_type: "BUY" as
      | "BUY"
      | "SELL"
      | "DIVIDEND"
      | "DEPOSIT"
      | "WITHDRAWAL"
      | "FEE"
      | "SPLIT"
      | "BONUS"
      | "OTHER",
    transaction_date: new Date().toISOString().split("T")[0],
    quantity: "",
    price_per_unit: "",
    total_amount: "",
    fees: "0",
    taxes: "0",
    description: "",
    bank_account_id: "",
  });

  useEffect(() => {
    if (user) {
      loadInvestments();
      loadTransactions();
      loadBankAccounts();
    }
  }, [user]);

  const loadInvestments = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("investments")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setInvestments(data || []);
    } catch (error) {
      console.error("Erro ao carregar investimentos:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadTransactions = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("investment_transactions")
        .select(
          `
          *,
          investments!inner(
            name,
            user_id
          )
        `
        )
        .eq("investments.user_id", user.id)
        .order("transaction_date", { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error("Erro ao carregar transações:", error);
    }
  };

  const loadBankAccounts = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("bank_accounts")
        .select("*")
        .eq("user_id", user.id)
        .order("name");

      if (error) throw error;
      setBankAccounts(data || []);
    } catch (error) {
      console.error("Erro ao carregar contas bancárias:", error);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  const calculateReturn = (initial: number, current: number) => {
    const returnValue = current - initial;
    const returnPercentage = initial > 0 ? (returnValue / initial) * 100 : 0;
    return { returnValue, returnPercentage };
  };

  const calculateCurrentValue = (investment: Investment) => {
    if (investment.current_market_price && investment.quantity) {
      return investment.current_market_price * investment.quantity;
    }
    return investment.current_amount;
  };

  const getAveragePurchasePrice = (investment: Investment) => {
    if (investment.average_purchase_price) {
      return investment.average_purchase_price;
    }
    if (investment.quantity > 0) {
      return investment.initial_amount / investment.quantity;
    }
    return 0;
  };

  const calculateTotalValue = (quantity: number, price: number) => {
    return quantity * price;
  };

  const formatQuantity = (quantity: number) => {
    return quantity.toLocaleString("pt-BR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 8,
    });
  };

  const resetForm = () => {
    setFormData({
      name: "",
      symbol: "",
      type: "acao",
      quantity: "",
      initial_amount: "",
      current_amount: "",
      purchase_date: new Date().toISOString().split("T")[0],
      brokerage: "",
      currency: "BRL",
      description: "",
    });
  };

  const handleCreate = async () => {
    if (
      !user ||
      !formData.name.trim() ||
      !formData.quantity.trim() ||
      !formData.initial_amount.trim()
    )
      return;

    try {
      const quantity = parseFloat(formData.quantity);
      const initialAmount = parseFloat(formData.initial_amount);
      const currentAmount = formData.current_amount
        ? parseFloat(formData.current_amount)
        : initialAmount;
      const pricePerUnit = quantity > 0 ? initialAmount / quantity : 0;

      // Primeiro, criar o investimento
      const { data: investmentData, error: investmentError } = await supabase
        .from("investments")
        .insert([
          {
            user_id: user.id,
            name: formData.name.trim(),
            symbol: formData.symbol.trim() || null,
            type: formData.type,
            quantity: quantity,
            initial_amount: initialAmount,
            current_amount: currentAmount,
            purchase_date: formData.purchase_date,
            brokerage: formData.brokerage.trim() || null,
            currency: formData.currency,
            description: formData.description.trim() || null,
            average_purchase_price: pricePerUnit,
          },
        ])
        .select()
        .single();

      if (investmentError) throw investmentError;

      // Depois, criar a transação inicial de compra
      const { error: transactionError } = await supabase
        .from("investment_transactions")
        .insert([
          {
            investment_id: investmentData.id,
            transaction_type: "BUY",
            transaction_date: formData.purchase_date,
            quantity: quantity,
            price_per_unit: pricePerUnit,
            total_amount: initialAmount,
            fees: 0,
            taxes: 0,
            description: "Compra inicial do investimento",
          },
        ]);

      if (transactionError) throw transactionError;

      // Atualizar listas
      setInvestments((prev) => [investmentData, ...prev]);
      loadTransactions(); // Recarregar transações para incluir a nova

      setCreateModalOpen(false);
      resetForm();
    } catch (error) {
      console.error("Erro ao criar investimento:", error);
    }
  };

  const handleEdit = async () => {
    if (
      !user ||
      !editingInvestment ||
      !formData.name.trim() ||
      !formData.quantity.trim() ||
      !formData.initial_amount.trim()
    )
      return;

    try {
      const quantity = parseFloat(formData.quantity);
      const initialAmount = parseFloat(formData.initial_amount);
      const currentAmount = formData.current_amount
        ? parseFloat(formData.current_amount)
        : initialAmount;

      const { data, error } = await supabase
        .from("investments")
        .update({
          name: formData.name.trim(),
          symbol: formData.symbol.trim() || null,
          type: formData.type,
          quantity: quantity,
          initial_amount: initialAmount,
          current_amount: currentAmount,
          purchase_date: formData.purchase_date,
          brokerage: formData.brokerage.trim() || null,
          currency: formData.currency,
          description: formData.description.trim() || null,
        })
        .eq("id", editingInvestment.id)
        .select()
        .single();

      if (error) throw error;

      setInvestments((prev) =>
        prev.map((inv) => (inv.id === editingInvestment.id ? data : inv))
      );
      setEditModalOpen(false);
      setEditingInvestment(null);
      resetForm();
    } catch (error) {
      console.error("Erro ao editar investimento:", error);
    }
  };

  const handleDelete = async (investmentId: string) => {
    if (!user) return;

    try {
      console.log(`🗑️ Iniciando exclusão do investimento ${investmentId}`);

      // Primeiro, verificar quantas transações existem para este investimento
      const { data: transactionsToDelete, error: checkError } = await supabase
        .from("investment_transactions")
        .select("id, transaction_type, total_amount")
        .eq("investment_id", investmentId);

      if (checkError) throw checkError;

      console.log(
        `📊 Encontradas ${
          transactionsToDelete?.length || 0
        } transações para deletar`
      );

      // Deletar todas as transações relacionadas ao investimento
      if (transactionsToDelete && transactionsToDelete.length > 0) {
        const { error: transactionError } = await supabase
          .from("investment_transactions")
          .delete()
          .eq("investment_id", investmentId);

        if (transactionError) throw transactionError;
        console.log(
          `✅ ${transactionsToDelete.length} transações de investimento deletadas`
        );
      }

      // Deletar possíveis transações financeiras relacionadas (se existirem)
      const investmentName = investments.find(
        (inv) => inv.id === investmentId
      )?.name;
      if (investmentName) {
        const { error: financialTransactionError } = await supabase
          .from("transactions")
          .delete()
          .eq("user_id", user.id)
          .ilike("description", `%${investmentName}%`);

        // Não falhar se der erro aqui, pois pode não existir transações financeiras
        if (financialTransactionError) {
          console.log(
            `⚠️ Aviso ao deletar transações financeiras:`,
            financialTransactionError
          );
        } else {
          console.log(`💰 Transações financeiras relacionadas removidas`);
        }
      }

      // Por último, deletar o investimento
      const { error: investmentError } = await supabase
        .from("investments")
        .delete()
        .eq("id", investmentId)
        .eq("user_id", user.id); // Adicionar verificação de usuário por segurança

      if (investmentError) throw investmentError;
      console.log(`🎯 Investimento deletado com sucesso`);

      // Atualizar o estado local
      setInvestments((prev) => prev.filter((inv) => inv.id !== investmentId));
      setTransactions((prev) =>
        prev.filter((trans) => trans.investment_id !== investmentId)
      );

      console.log(`✨ Estados locais atualizados`);
    } catch (error) {
      console.error("❌ Erro ao deletar investimento:", error);
      alert(
        `Erro ao deletar investimento: ${error.message || "Erro desconhecido"}`
      );
    }
  };

  const openEditModal = (investment: Investment) => {
    setEditingInvestment(investment);
    setFormData({
      name: investment.name,
      symbol: investment.symbol || "",
      type: investment.type,
      quantity: investment.quantity?.toString() || "1",
      initial_amount: investment.initial_amount.toString(),
      current_amount: investment.current_amount.toString(),
      purchase_date: investment.purchase_date,
      brokerage: investment.brokerage || "",
      currency: investment.currency || "BRL",
      description: investment.description || "",
    });
    setEditModalOpen(true);
  };

  const openCreateModal = () => {
    resetForm();
    setCreateModalOpen(true);
  };

  const openTransactionModal = (investment: Investment) => {
    setSelectedInvestment(investment);
    setTransactionFormData({
      transaction_type: "BUY",
      transaction_date: new Date().toISOString().split("T")[0],
      quantity: "",
      price_per_unit: "",
      total_amount: "",
      fees: "0",
      taxes: "0",
      description: "",
      bank_account_id: bankAccounts.length > 0 ? bankAccounts[0].id : "",
    });
    setTransactionModalOpen(true);
  };

  const openTransactionsView = (investment: Investment) => {
    setSelectedInvestment(investment);
    setTransactionsViewOpen(true);
  };

  const resetTransactionForm = () => {
    setTransactionFormData({
      transaction_type: "BUY",
      transaction_date: new Date().toISOString().split("T")[0],
      quantity: "",
      price_per_unit: "",
      total_amount: "",
      fees: "0",
      taxes: "0",
      description: "",
      bank_account_id: bankAccounts.length > 0 ? bankAccounts[0].id : "",
    });
  };

  const handleCreateTransaction = async () => {
    if (
      !user ||
      !selectedInvestment ||
      !transactionFormData.total_amount.trim() ||
      !transactionFormData.bank_account_id
    )
      return;

    try {
      const quantity = transactionFormData.quantity
        ? parseFloat(transactionFormData.quantity)
        : null;
      const pricePerUnit = transactionFormData.price_per_unit
        ? parseFloat(transactionFormData.price_per_unit)
        : null;
      const totalAmount = parseFloat(transactionFormData.total_amount);
      const fees = parseFloat(transactionFormData.fees);
      const taxes = parseFloat(transactionFormData.taxes);

      const transactionData = {
        investment_id: selectedInvestment.id,
        transaction_type: transactionFormData.transaction_type,
        transaction_date: transactionFormData.transaction_date,
        quantity: quantity,
        price_per_unit: pricePerUnit,
        total_amount: totalAmount,
        fees: fees,
        taxes: taxes,
        description: transactionFormData.description.trim() || null,
      };

      // Criar a transação de investimento
      const { data: investmentTransaction, error: investmentError } =
        await supabase
          .from("investment_transactions")
          .insert([transactionData])
          .select()
          .single();

      if (investmentError) throw investmentError;

      // Criar a transação financeira correspondente
      await createFinancialTransaction(transactionData, selectedInvestment);

      // Atualizar o investimento baseado na transação
      await updateInvestmentFromTransaction(
        selectedInvestment,
        transactionData
      );

      // Atualizar listas
      loadTransactions();
      loadInvestments();

      setTransactionModalOpen(false);
      resetTransactionForm();
    } catch (error) {
      console.error("Erro ao criar transação:", error);
    }
  };

  const createFinancialTransaction = async (
    investmentTransaction: {
      transaction_type: string;
      total_amount: number;
      fees: number;
      taxes: number;
      transaction_date: string;
      description?: string;
    },
    investment: Investment
  ) => {
    if (!transactionFormData.bank_account_id) return;

    try {
      let transactionType: "receita" | "despesa";
      let transactionValue = investmentTransaction.total_amount;
      let transactionDescription = "";

      switch (investmentTransaction.transaction_type) {
        case "BUY":
          transactionType = "despesa";
          transactionDescription = `Compra de ${investment.name}`;
          // Incluir taxas no valor total da despesa
          transactionValue =
            transactionValue +
            investmentTransaction.fees +
            investmentTransaction.taxes;
          break;

        case "SELL":
          transactionType = "receita";
          transactionDescription = `Venda de ${investment.name}`;
          // Subtrair taxas do valor da receita
          transactionValue =
            transactionValue -
            investmentTransaction.fees -
            investmentTransaction.taxes;
          break;

        case "DIVIDEND":
          transactionType = "receita";
          transactionDescription = `Dividendos de ${investment.name}`;
          // Subtrair impostos do valor da receita
          transactionValue = transactionValue - investmentTransaction.taxes;
          break;

        case "DEPOSIT":
          transactionType = "despesa";
          transactionDescription = `Depósito para investimento em ${investment.name}`;
          break;

        case "WITHDRAWAL":
          transactionType = "receita";
          transactionDescription = `Retirada de investimento em ${investment.name}`;
          break;

        case "FEE":
          transactionType = "despesa";
          transactionDescription = `Taxa de ${investment.name}`;
          break;

        default:
          // Para SPLIT, BONUS, OTHER não criar transação financeira
          return;
      }

      // Adicionar descrição personalizada se fornecida
      if (investmentTransaction.description) {
        transactionDescription += ` - ${investmentTransaction.description}`;
      }

      const financialTransactionData = {
        user_id: user.id,
        type: transactionType,
        value: Math.abs(transactionValue),
        description: transactionDescription,
        bank_account_id: transactionFormData.bank_account_id,
        transaction_date: investmentTransaction.transaction_date,
        category_id: null, // Pode ser configurado para uma categoria específica de investimentos
      };

      const { error: financialError } = await supabase
        .from("transactions")
        .insert([financialTransactionData]);

      if (financialError) throw financialError;
    } catch (error) {
      console.error("Erro ao criar transação financeira:", error);
      throw error;
    }
  };

  const updateInvestmentFromTransaction = async (
    investment: Investment,
    transaction: {
      transaction_type: string;
      quantity?: number;
      price_per_unit?: number;
      total_amount: number;
    }
  ) => {
    try {
      let newQuantity = investment.quantity;
      let newCurrentAmount = investment.current_amount;
      let newAveragePrice =
        investment.average_purchase_price ||
        getAveragePurchasePrice(investment);

      switch (transaction.transaction_type) {
        case "BUY":
          if (transaction.quantity && transaction.price_per_unit) {
            // Atualizar quantidade
            const oldQuantity = newQuantity;
            newQuantity += transaction.quantity;

            // Calcular novo preço médio
            const oldTotalCost = oldQuantity * newAveragePrice;
            const newTotalCost = oldTotalCost + transaction.total_amount;
            newAveragePrice = newQuantity > 0 ? newTotalCost / newQuantity : 0;

            // Atualizar valor atual (assumindo mesmo preço de compra se não tiver preço de mercado)
            if (!investment.current_market_price) {
              newCurrentAmount = newQuantity * newAveragePrice;
            }
          }
          break;

        case "SELL":
          if (transaction.quantity) {
            newQuantity -= transaction.quantity;

            // Manter preço médio, apenas reduzir quantidade
            if (!investment.current_market_price && newQuantity > 0) {
              newCurrentAmount = newQuantity * newAveragePrice;
            } else if (newQuantity <= 0) {
              newCurrentAmount = 0;
              newQuantity = 0;
            }
          }
          break;

        case "DIVIDEND":
          // Dividendos não afetam quantidade ou preço médio, apenas registram o recebimento
          break;

        case "SPLIT":
          if (transaction.quantity) {
            // Desdobramento: aumenta quantidade, reduz preço proporcionalmente
            const splitRatio = transaction.quantity; // Assumindo que quantity representa a proporção
            newQuantity *= splitRatio;
            newAveragePrice /= splitRatio;

            if (!investment.current_market_price) {
              newCurrentAmount = newQuantity * newAveragePrice;
            }
          }
          break;

        default:
          // Para outros tipos (DEPOSIT, WITHDRAWAL, FEE, BONUS, OTHER), apenas registrar
          break;
      }

      // Atualizar o investimento no banco
      await supabase
        .from("investments")
        .update({
          quantity: Math.max(0, newQuantity),
          current_amount: Math.max(0, newCurrentAmount),
          average_purchase_price: newAveragePrice,
          updated_at: new Date().toISOString(),
        })
        .eq("id", investment.id);
    } catch (error) {
      console.error("Erro ao atualizar investimento:", error);
    }
  };

  const getInvestmentTransactions = (investmentId: string) => {
    return transactions.filter((t) => t.investment_id === investmentId);
  };

  const handleSpreadsheetImport = async (
    importedData: Record<string, unknown>[]
  ) => {
    if (!user) return;

    try {
      let importedCount = 0;
      let skippedCount = 0;

      // Função para normalizar nomes de ativos (considerando mudanças de nomenclatura da B3)
      const normalizeAssetName = (name: string): string => {
        if (!name || name === "-") return "";

        const originalName = String(name).trim();
        let normalized = originalName
          .toLowerCase()
          .trim()
          // Remover caracteres especiais, mantendo apenas letras, números, espaços e hífens
          .replace(/[^\w\s-]/g, " ")
          .replace(/\s+/g, " ")
          .trim();

        console.log(`🔄 Normalizando: "${originalName}" -> "${normalized}"`);

        // 1. Primeiro, tentar extrair códigos de ações (PETR4, VALE3, etc.)
        const stockCodeMatch = normalized.match(/\b([a-z]{3,4}\d{1,2})\b/);
        if (stockCodeMatch) {
          const stockCode = stockCodeMatch[1];
          console.log(`  📊 Código de ação identificado: ${stockCode}`);
          return stockCode;
        }

        // 2. Para FIIs (Fundos Imobiliários) - padrão XXXX11
        const fiiMatch = normalized.match(/\b([a-z]{4}11)\b/);
        if (fiiMatch) {
          const fiiCode = fiiMatch[1];
          console.log(`  🏢 FII identificado: ${fiiCode}`);
          return fiiCode;
        }

        // 3. Para BDRs (Brazilian Depositary Receipts) - padrão XXXX34, XXXX35
        const bdrMatch = normalized.match(/\b([a-z]{4}3[4-5])\b/);
        if (bdrMatch) {
          const bdrCode = bdrMatch[1];
          console.log(`  🌍 BDR identificado: ${bdrCode}`);
          return bdrCode;
        }

        // 4. Para fundos de investimento, tentar extrair um identificador único
        if (
          normalized.includes("fundo") ||
          normalized.includes("fii") ||
          normalized.includes("fund")
        ) {
          console.log(`  💰 Fundo de investimento detectado`);

          // Tentar encontrar siglas ou códigos únicos no nome do fundo
          const fundCodeMatch = normalized.match(
            /\b([a-z]{2,6})\s*(?:fundo|fii|fund|fi|inv)/
          );
          if (fundCodeMatch) {
            const fundCode = fundCodeMatch[1];
            console.log(`    Código do fundo extraído: ${fundCode}`);
            return `fund_${fundCode}`;
          }

          // Se não encontrar código, usar palavras-chave significativas
          let fundName = normalized
            .replace(
              /\b(fundo|fii|fund|investimento|inv|de|da|do|dos|das|e|&|ltda|sa)\b/g,
              ""
            )
            .replace(/\s+/g, " ")
            .trim();

          // Pegar as primeiras 2-3 palavras mais significativas
          const significantWords = fundName
            .split(" ")
            .filter((word) => word.length > 2)
            .slice(0, 3);
          if (significantWords.length > 0) {
            const fundKey = `fund_${significantWords.join("_")}`;
            console.log(`    Chave do fundo gerada: ${fundKey}`);
            return fundKey;
          }
        }

        // 5. Para títulos do Tesouro Direto
        if (
          normalized.includes("tesouro") ||
          normalized.includes("ltn") ||
          normalized.includes("ntn")
        ) {
          console.log(`  🏛️ Título do Tesouro detectado`);

          // Extrair tipo específico do título
          if (normalized.includes("ipca")) return "tesouro_ipca";
          if (normalized.includes("selic")) return "tesouro_selic";
          if (normalized.includes("prefixado")) return "tesouro_prefixado";
          if (normalized.includes("ltn")) return "tesouro_ltn";
          if (normalized.includes("ntn")) return "tesouro_ntn";

          return "tesouro_outros";
        }

        // 6. Para CDBs, LCIs, LCAs e outros produtos de renda fixa
        if (normalized.match(/\b(cdb|lci|lca|debenture|cri|cra)\b/)) {
          console.log(`  🏦 Produto de renda fixa detectado`);

          const productType =
            normalized.match(/\b(cdb|lci|lca|debenture|cri|cra)\b/)?.[1] ||
            "renda_fixa";

          // Tentar extrair nome do banco/emissor
          const bankMatch = normalized.match(
            /\b(banco|btg|itau|bradesco|santander|caixa|bb|nubank|inter)\b/
          );
          if (bankMatch) {
            const bankName = bankMatch[1];
            console.log(`    Banco/emissor identificado: ${bankName}`);
            return `${productType}_${bankName}`;
          }

          return `${productType}_generico`;
        }

        // 7. Para ações estrangeiras ou outros ativos especiais
        if (normalized.match(/\b(unit|receipt|bdr)\b/)) {
          console.log(`  🌐 Ativo especial detectado`);
        }

        // 8. Fallback: usar nome simplificado removendo palavras comuns
        normalized = normalized
          .replace(
            /\b(sa|ltda|participacoes|holding|cia|companhia|empresa|group|corp|inc|ltd)\b/g,
            ""
          )
          .replace(/\b(de|da|do|dos|das|e|&|em|para|com|por)\b/g, "")
          .replace(/\s+/g, " ")
          .trim();

        // Pegar as primeiras palavras mais significativas (pelo menos 3 caracteres)
        const words = normalized.split(" ").filter((word) => word.length >= 3);
        const finalKey =
          words.length > 0
            ? words.slice(0, 2).join("_")
            : originalName.toLowerCase().replace(/[^a-z0-9]/g, "_");

        console.log(`  ⚙️ Fallback aplicado: ${finalKey}`);
        return finalKey;
      };

      console.log(`\n🔍 === ANÁLISE DE NOMES DOS ATIVOS ===`);
      console.log(`Total de registros na planilha: ${importedData.length}`);

      // Mostrar todos os nomes originais e normalizados
      const uniqueAssetNames = [
        ...new Set(importedData.map((row) => row.asset_name)),
      ].filter((name) => name && name !== "-");
      console.log(`Ativos únicos encontrados: ${uniqueAssetNames.length}`);
      console.log(`\n📝 MAPEAMENTO DE NOMES:`);
      uniqueAssetNames.forEach((name) => {
        const normalized = normalizeAssetName(String(name));
        console.log(`  "${name}" -> "${normalized}"`);
      });

      // Agrupar dados por nome do ativo normalizado para analisar posição final
      const assetGroups = importedData.reduce((groups, rowData) => {
        if (!rowData.asset_name || rowData.asset_name === "-") return groups;

        const assetName = normalizeAssetName(String(rowData.asset_name));
        if (!assetName) return groups;

        if (!groups[assetName]) {
          groups[assetName] = [];
        }
        groups[assetName].push({
          ...rowData,
          original_asset_name: rowData.asset_name, // Manter nome original
        });
        return groups;
      }, {} as Record<string, Record<string, unknown>[]>);

      // Analisar cada ativo para determinar se deve ser criado
      const assetsToProcess = Object.entries(assetGroups).filter(
        ([assetName, transactions]) => {
          let totalQuantity = 0;
          let totalValue = 0;
          let hasValidTransactions = false;
          let transactionDetails: Array<{
            type: string;
            quantity: number;
            value: number;
            date: string;
          }> = [];

          console.log(`\n📋 === ANALISANDO ATIVO: ${assetName} ===`);
          console.log(`📊 Total de transações: ${transactions.length}`);

          // Mostrar quais nomes originais foram agrupados neste ativo normalizado
          const originalNames = [
            ...new Set(transactions.map((t) => t.original_asset_name)),
          ];
          console.log(
            `🏷️  Nomes originais agrupados: ${originalNames.join(", ")}`
          );

          for (const transaction of transactions) {
            // Log detalhado de cada transação
            console.log(
              `  📝 Transação ${transactions.indexOf(transaction) + 1}:`,
              {
                original_name: transaction.original_asset_name,
                type: transaction.transaction_type,
                quantity: transaction.quantity,
                price: transaction.price_per_unit,
                total: transaction.total_amount,
                date: transaction.transaction_date,
              }
            );

            // Pular transações inválidas
            if (
              !transaction.total_amount ||
              transaction.total_amount === "-" ||
              transaction.total_amount === 0
            ) {
              console.log(`  -> Pulando: valor total inválido`);
              continue;
            }

            // Pular registros onde tanto preço unitário quanto valor da operação são "-"
            if (
              (transaction.price_per_unit === "-" ||
                !transaction.price_per_unit) &&
              (transaction.total_amount === "-" || !transaction.total_amount)
            ) {
              console.log(`  -> Pulando: preço e valor inválidos`);
              continue;
            }

            hasValidTransactions = true;

            // Normalizar tipos de transação
            let transactionType = String(
              transaction.transaction_type || "OTHER"
            )
              .toUpperCase()
              .trim();

            // Mapear tipos em português para inglês (baseado nos tipos da B3)
            const typeMapping: Record<string, string> = {
              DIVIDENDO: "DIVIDEND",
              COMPRA: "BUY",
              VENDA: "SELL",
              DEPÓSITO: "DEPOSIT",
              RETIRADA: "WITHDRAWAL",
              SAQUE: "WITHDRAWAL",
              "RESGATE ANTECIPADO": "WITHDRAWAL",
              TAXA: "FEE",
              DESDOBRAMENTO: "SPLIT",
              BONIFICAÇÃO: "BONUS",
              RENDIMENTO: "DIVIDEND",
              JUROS: "DIVIDEND",
              // Tipos específicos da B3
              "TRANSFERÊNCIA - LIQUIDAÇÃO": "BUY",
              "TRANSFERENCIA - LIQUIDACAO": "BUY",
              ATUALIZAÇÃO: "OTHER",
              ATUALIZACAO: "OTHER",
              INCORPORAÇÃO: "OTHER",
              INCORPORACAO: "OTHER",
              "CESSÃO DE DIREITOS": "SELL",
              "CESSAO DE DIREITOS": "SELL",
              "DIREITO DE SUBSCRIÇÃO": "OTHER",
              "DIREITO DE SUBSCRICAO": "OTHER",
              EXERCÍCIO: "OTHER",
              EXERCICIO: "OTHER",
              GRUPAMENTO: "SPLIT",
              CISÃO: "SPLIT",
              CISAO: "SPLIT",
            };

            transactionType = typeMapping[transactionType] || transactionType;

            // Lógica inteligente: se não foi possível mapear, tentar inferir pela entrada/saída e dados
            if (transactionType === "OTHER") {
              const entryType = transaction.entry_type
                ? String(transaction.entry_type).toLowerCase()
                : "";
              const hasValidQuantity =
                transaction.quantity &&
                transaction.quantity !== "-" &&
                Number(transaction.quantity) > 0;
              const hasValidPrice =
                transaction.price_per_unit &&
                transaction.price_per_unit !== "-" &&
                Number(transaction.price_per_unit) > 0;

              console.log(`  🤖 Tentando inferir tipo para transação OTHER:`, {
                entry_type: entryType,
                hasValidQuantity,
                hasValidPrice,
                total_amount: transaction.total_amount,
              });

              // Se é débito (saída de dinheiro) com quantidade e preço válidos = COMPRA
              if (
                (entryType === "debit" || entryType === "debito") &&
                hasValidQuantity &&
                hasValidPrice
              ) {
                transactionType = "BUY";
                console.log(
                  `    -> Inferido como COMPRA (débito + quantidade + preço)`
                );
              }
              // Se é crédito (entrada de dinheiro) sem quantidade específica = DIVIDENDO
              else if (
                (entryType === "credit" || entryType === "credito") &&
                !hasValidQuantity
              ) {
                transactionType = "DIVIDEND";
                console.log(
                  `    -> Inferido como DIVIDENDO (crédito sem quantidade)`
                );
              }
              // Se é crédito com quantidade e preço válidos = VENDA
              else if (
                (entryType === "credit" || entryType === "credito") &&
                hasValidQuantity &&
                hasValidPrice
              ) {
                transactionType = "SELL";
                console.log(
                  `    -> Inferido como VENDA (crédito + quantidade + preço)`
                );
              } else {
                console.log(
                  `    -> Mantido como OTHER (não foi possível inferir)`
                );
              }
            }

            // Calcular quantidade e valor
            const quantity =
              transaction.quantity && transaction.quantity !== "-"
                ? Number(transaction.quantity)
                : 0;
            const totalAmount = Number(transaction.total_amount) || 0;

            transactionDetails.push({
              type: transactionType,
              quantity: quantity,
              value: totalAmount,
              date: String(transaction.transaction_date || ""),
            });

            console.log(
              `  -> Processando: ${transactionType}, quantidade: ${quantity}, valor: ${totalAmount}`
            );

            switch (transactionType) {
              case "BUY":
              case "COMPRA":
                totalQuantity += quantity;
                totalValue += totalAmount;
                console.log(
                  `  -> COMPRA: +${quantity} unidades, +R$${totalAmount}`
                );
                break;
              case "SELL":
              case "VENDA":
                totalQuantity -= quantity;
                totalValue -= totalAmount; // Venda reduz o valor investido
                console.log(
                  `  -> VENDA: -${quantity} unidades, -R$${totalAmount}`
                );
                break;
              case "WITHDRAWAL":
              case "RETIRADA":
              case "SAQUE":
                // Para resgates/saques, analisar se é resgate total
                if (quantity === 0 && totalAmount > 0) {
                  // Resgate por valor sem especificar quantidade - pode ser resgate total
                  console.log(
                    `  -> RESGATE POR VALOR: R$${totalAmount} (pode ser resgate total)`
                  );
                  totalValue -= totalAmount;
                } else if (quantity > 0) {
                  // Resgate com quantidade específica
                  totalQuantity -= quantity;
                  totalValue -= totalAmount;
                  console.log(
                    `  -> RESGATE: -${quantity} unidades, -R$${totalAmount}`
                  );
                }
                break;
              case "DIVIDEND":
              case "DIVIDENDO":
              case "RENDIMENTO":
              case "JUROS":
                // Dividendos não afetam quantidade, mas adicionam valor
                console.log(
                  `  -> DIVIDENDO: +R$${totalAmount} (não afeta quantidade)`
                );
                break;
              case "SPLIT":
              case "DESDOBRAMENTO":
                if (quantity > 1) {
                  // Desdobramento multiplica a quantidade
                  const multiplier = quantity;
                  totalQuantity *= multiplier;
                  console.log(
                    `  -> DESDOBRAMENTO: quantidade multiplicada por ${multiplier}`
                  );
                }
                break;
              case "BONUS":
              case "BONIFICAÇÃO":
                // Bonificação adiciona quantidade sem custo
                totalQuantity += quantity;
                console.log(
                  `  -> BONIFICAÇÃO: +${quantity} unidades gratuitas`
                );
                break;
              default:
                console.log(
                  `  -> OUTRO TIPO (${transactionType}): não afeta quantidade`
                );
            }
          }

          console.log(`\n📊 RESUMO DETALHADO DO ATIVO ${assetName}:`);
          console.log(`- Transações válidas: ${hasValidTransactions}`);
          console.log(`- Quantidade final: ${totalQuantity}`);
          console.log(`- Valor líquido: R$${totalValue}`);
          console.log(`- Detalhes das transações:`, transactionDetails);

          // Só processar ativos que tenham transações válidas
          if (!hasValidTransactions) {
            console.log(`❌ PULANDO ${assetName}: sem transações válidas`);
            return false;
          }

          // Verificar se ainda tem posição no ativo
          // Um ativo deve ser criado se:
          // 1. Tem quantidade > 0 (ações, fundos, etc.), OU
          // 2. Tem valor líquido > 0 (para casos de renda fixa sem quantidade específica), OU
          // 3. Teve transações válidas recentemente (últimos 30 dias)
          const recentTransactions = transactionDetails.filter((t) => {
            const transactionDate = new Date(t.date);
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            return transactionDate >= thirtyDaysAgo;
          });

          const shouldProcess =
            totalQuantity > 0 ||
            (totalQuantity === 0 && totalValue > 0) ||
            (recentTransactions.length > 0 && hasValidTransactions);

          console.log(`\n🔍 ANÁLISE DE CRITÉRIOS PARA ${assetName}:`);
          console.log(
            `- totalQuantity > 0: ${totalQuantity > 0} (${totalQuantity})`
          );
          console.log(
            `- totalValue > 0 e quantidade = 0: ${
              totalQuantity === 0 && totalValue > 0
            } (valor: R$${totalValue})`
          );
          console.log(
            `- transações recentes: ${
              recentTransactions.length > 0 && hasValidTransactions
            } (${recentTransactions.length} transações)`
          );
          console.log(`- shouldProcess: ${shouldProcess}`);

          if (!shouldProcess) {
            console.log(
              `❌ PULANDO ${assetName}: posição zerada (quantidade: ${totalQuantity}, valor: R$${totalValue})`
            );
            return false;
          }

          console.log(
            `✅ PROCESSANDO ${assetName}: posição válida (quantidade: ${totalQuantity}, valor: R$${totalValue})`
          );
          return true;
        }
      );

      // Processar apenas ativos que devem ser criados
      for (const [assetName, assetTransactions] of assetsToProcess) {
        for (const rowData of assetTransactions) {
          // Pular registros com campos essenciais como "-" ou vazios
          if (
            !rowData.asset_name ||
            rowData.asset_name === "-" ||
            !rowData.total_amount ||
            rowData.total_amount === "-" ||
            rowData.total_amount === 0
          ) {
            skippedCount++;
            continue;
          }

          // Pular registros onde tanto preço unitário quanto valor da operação são "-"
          // (ex: Direitos de Subscrição sem valor)
          if (
            (rowData.price_per_unit === "-" || !rowData.price_per_unit) &&
            (rowData.total_amount === "-" || !rowData.total_amount)
          ) {
            skippedCount++;
            continue;
          }

          // Verificar se o investimento já existe (tanto na lista local quanto no banco)
          let investment = investments.find(
            (inv) => inv.name.toLowerCase() === rowData.asset_name.toLowerCase()
          );

          // Se não existir na lista local, verificar no banco de dados
          if (!investment) {
            const { data: existingInvestment, error: checkInvestmentError } =
              await supabase
                .from("investments")
                .select("*")
                .eq("user_id", user.id)
                .ilike("name", rowData.asset_name)
                .maybeSingle();

            if (
              checkInvestmentError &&
              checkInvestmentError.code !== "PGRST116"
            ) {
              throw checkInvestmentError;
            }

            if (existingInvestment) {
              investment = existingInvestment;
              // Adicionar à lista local para evitar futuras consultas
              setInvestments((prev) => {
                const exists = prev.find(
                  (inv) => inv.id === existingInvestment.id
                );
                return exists ? prev : [existingInvestment, ...prev];
              });
            }
          }

          // Se ainda não existir, criar novo investimento
          if (!investment) {
            const { data: newInvestment, error: investmentError } =
              await supabase
                .from("investments")
                .insert([
                  {
                    user_id: user.id,
                    name: rowData.asset_name,
                    symbol: null,
                    type: "acao", // Padrão, pode ser ajustado
                    quantity:
                      rowData.quantity && rowData.quantity !== "-"
                        ? rowData.quantity
                        : 0,
                    initial_amount: rowData.total_amount || 0,
                    current_amount: rowData.total_amount || 0,
                    purchase_date:
                      rowData.transaction_date ||
                      new Date().toISOString().split("T")[0],
                    brokerage:
                      rowData.brokerage && rowData.brokerage !== "-"
                        ? rowData.brokerage
                        : null,
                    currency: "BRL",
                    description: `Importado via planilha`,
                    average_purchase_price:
                      rowData.price_per_unit && rowData.price_per_unit !== "-"
                        ? rowData.price_per_unit
                        : 0,
                  },
                ])
                .select()
                .single();

            if (investmentError) throw investmentError;
            investment = newInvestment;
            setInvestments((prev) => [newInvestment, ...prev]);
          }

          // Verificar se a transação já existe (evitar duplicação)
          const { data: existingTransaction, error: checkError } =
            await supabase
              .from("investment_transactions")
              .select("id")
              .eq("investment_id", investment.id)
              .eq("transaction_date", rowData.transaction_date)
              .eq("transaction_type", rowData.transaction_type || "OTHER")
              .eq("total_amount", rowData.total_amount)
              .maybeSingle();

          if (checkError && checkError.code !== "PGRST116") {
            throw checkError;
          }

          if (existingTransaction) {
            skippedCount++;
            continue; // Pular esta transação
          }

          // Criar transação de investimento
          const { error: transactionError } = await supabase
            .from("investment_transactions")
            .insert([
              {
                investment_id: investment.id,
                transaction_type: rowData.transaction_type || "OTHER",
                transaction_date: rowData.transaction_date,
                quantity:
                  rowData.quantity && rowData.quantity !== "-"
                    ? rowData.quantity
                    : null,
                price_per_unit:
                  rowData.price_per_unit && rowData.price_per_unit !== "-"
                    ? rowData.price_per_unit
                    : null,
                total_amount: rowData.total_amount,
                fees: 0, // Sempre 0 pois não vem na planilha
                taxes: 0, // Sempre 0 pois não vem na planilha
                description: null, // Sempre null pois não vem na planilha
              },
            ]);

          if (transactionError) throw transactionError;

          // Se houver conta bancária e tipo de entrada/saída, criar transação financeira
          if (bankAccounts.length > 0 && rowData.entry_type) {
            // Verificar se a transação financeira já existe
            const transactionType =
              rowData.entry_type === "credit" ? "receita" : "despesa";
            const transactionValue = rowData.total_amount;
            let transactionDescription = "";

            // Definir descrição baseada no tipo de transação
            switch (rowData.transaction_type) {
              case "DIVIDEND":
                transactionDescription = `Dividendos de ${investment.name}`;
                // Não subtrair taxas pois não vem na planilha
                break;
              case "BUY":
                transactionDescription = `Compra de ${investment.name}`;
                // Não adicionar taxas pois não vem na planilha
                break;
              case "SELL":
                transactionDescription = `Venda de ${investment.name}`;
                // Não subtrair taxas pois não vem na planilha
                break;
              default:
                transactionDescription = `${
                  rowData.transaction_type || "Movimentação"
                } de ${investment.name}`;
            }

            // Verificar se transação financeira já existe
            const {
              data: existingFinancialTransaction,
              error: financialCheckError,
            } = await supabase
              .from("transactions")
              .select("id")
              .eq("user_id", user.id)
              .eq("transaction_date", rowData.transaction_date)
              .eq("type", transactionType)
              .eq("value", Math.abs(transactionValue))
              .ilike("description", `%${investment.name}%`)
              .maybeSingle();

            if (
              financialCheckError &&
              financialCheckError.code !== "PGRST116"
            ) {
              throw financialCheckError;
            }

            if (!existingFinancialTransaction) {
              await supabase.from("transactions").insert([
                {
                  user_id: user.id,
                  type: transactionType,
                  value: Math.abs(transactionValue),
                  description: transactionDescription,
                  bank_account_id: bankAccounts[0].id, // Usar primeira conta como padrão
                  transaction_date: rowData.transaction_date,
                  category_id: null,
                },
              ]);
            }
          }

          importedCount++;
        }
      }

      // Contar ativos que foram pulados por estarem zerados
      const totalAssets = Object.keys(assetGroups).length;
      const processedAssets = assetsToProcess.length;
      const skippedAssets = totalAssets - processedAssets;

      console.log(`\n🎯 === RESUMO FINAL DA IMPORTAÇÃO ===`);
      console.log(`📊 Total de ativos únicos na planilha: ${totalAssets}`);
      console.log(
        `✅ Ativos processados (com posição válida): ${processedAssets}`
      );
      console.log(`❌ Ativos ignorados (posição zerada): ${skippedAssets}`);
      console.log(`📝 Transações importadas: ${importedCount}`);
      console.log(
        `🔄 Transações ignoradas (duplicadas ou inválidas): ${skippedCount}`
      );

      if (skippedAssets > 0) {
        console.log(`\n❌ ATIVOS IGNORADOS (posição zerada):`);
        Object.entries(assetGroups).forEach(([assetName, transactions]) => {
          if (!assetsToProcess.find(([name]) => name === assetName)) {
            const originalNames = [
              ...new Set(transactions.map((t) => t.original_asset_name)),
            ];
            console.log(
              `  - ${assetName} (nomes originais: ${originalNames.join(", ")})`
            );
          }
        });
      }

      if (processedAssets > 0) {
        console.log(`\n🎉 ATIVOS PROCESSADOS COM SUCESSO:`);
        assetsToProcess.forEach(([assetName, transactions]) => {
          const originalNames = [
            ...new Set(transactions.map((t) => t.original_asset_name)),
          ];
          console.log(
            `  - ${assetName} (nomes originais: ${originalNames.join(", ")})`
          );
        });
      }

      if (processedAssets < 5 && totalAssets >= 5) {
        console.log(
          `\n⚠️  ATENÇÃO: Esperava-se processar mais ativos. Verifique:`
        );
        console.log(
          `  1. Se os nomes dos ativos estão sendo normalizados corretamente`
        );
        console.log(
          `  2. Se as transações estão sendo calculadas adequadamente`
        );
        console.log(`  3. Se não há erros na lógica de agrupamento`);
        console.log(
          `  4. Execute novamente a importação para ver logs detalhados`
        );
      }

      // Recarregar dados
      loadInvestments();
      loadTransactions();
    } catch (error) {
      console.error("Erro ao importar dados:", error);
      throw error;
    }
  };

  const totalInvested = investments.reduce(
    (sum, inv) => sum + inv.initial_amount,
    0
  );
  const totalCurrent = investments.reduce(
    (sum, inv) => sum + calculateCurrentValue(inv),
    0
  );
  const totalReturn = calculateReturn(totalInvested, totalCurrent);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-28" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Investimentos</h2>
          <p className="text-muted-foreground text-sm sm:text-base">
            Acompanhe a performance dos seus investimentos
          </p>
        </div>
        <Button
          style={{ background: "var(--investment-gradient)" }}
          onClick={openCreateModal}
          className="w-full sm:w-auto"
        >
          <Plus className="h-4 w-4 mr-2" />
          <span className="sm:inline">Novo Investimento</span>
        </Button>
      </div>

      {/* Resumo dos Investimentos */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card
          style={{
            background: "var(--investment-gradient)",
            boxShadow: "var(--shadow-soft)",
          }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-white">
              Total Investido
            </CardTitle>
            <PiggyBank className="h-4 w-4 text-white" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold text-white">
              {formatCurrency(totalInvested)}
            </div>
          </CardContent>
        </Card>

        <Card
          style={{
            background: "var(--card-gradient)",
            boxShadow: "var(--shadow-soft)",
          }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Valor Atual</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">
              {formatCurrency(totalCurrent)}
            </div>
          </CardContent>
        </Card>

        <Card
          style={{
            background: "var(--card-gradient)",
            boxShadow: "var(--shadow-soft)",
          }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Rentabilidade</CardTitle>
            <TrendingUp
              className={`h-4 w-4 ${
                totalReturn.returnValue >= 0 ? "text-success" : "text-expense"
              }`}
            />
          </CardHeader>
          <CardContent>
            <div
              className={`text-lg sm:text-2xl font-bold ${
                totalReturn.returnValue >= 0 ? "text-success" : "text-expense"
              }`}
            >
              {totalReturn.returnValue >= 0 ? "+" : ""}
              {formatCurrency(totalReturn.returnValue)}
            </div>
            <p
              className={`text-xs ${
                totalReturn.returnValue >= 0 ? "text-success" : "text-expense"
              }`}
            >
              {totalReturn.returnPercentage >= 0 ? "+" : ""}
              {totalReturn.returnPercentage.toFixed(2)}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Investimentos */}
      {investments.length === 0 ? (
        <Card
          style={{
            background: "var(--card-gradient)",
            boxShadow: "var(--shadow-soft)",
          }}
        >
          <CardContent className="flex flex-col items-center justify-center py-16">
            <PiggyBank className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Nenhum investimento cadastrado
            </h3>
            <p className="text-muted-foreground text-center mb-6">
              Comece a registrar seus investimentos para acompanhar sua
              rentabilidade
            </p>
            <Button
              style={{ background: "var(--investment-gradient)" }}
              onClick={openCreateModal}
            >
              <Plus className="h-4 w-4 mr-2" />
              Primeiro Investimento
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
          {investments.map((investment) => {
            const returnData = calculateReturn(
              investment.initial_amount,
              calculateCurrentValue(investment)
            );
            return (
              <Card
                key={investment.id}
                style={{
                  background: "var(--card-gradient)",
                  boxShadow: "var(--shadow-soft)",
                }}
              >
                <CardHeader className="pb-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1 min-w-0 flex-1">
                      <CardTitle className="text-base sm:text-lg truncate">
                        {investment.name}
                        {investment.symbol && (
                          <span className="text-sm text-muted-foreground ml-2">
                            ({investment.symbol})
                          </span>
                        )}
                      </CardTitle>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-xs">
                          {investmentTypeLabels[investment.type]}
                        </Badge>
                        {investment.brokerage && (
                          <Badge variant="secondary" className="text-xs">
                            {investment.brokerage}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 sm:gap-2 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openTransactionsView(investment)}
                        title="Ver transações"
                        className="h-8 w-8 p-0"
                      >
                        <History className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openTransactionModal(investment)}
                        title="Nova transação"
                        className="h-8 w-8 p-0"
                      >
                        <ArrowUpDown className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditModal(investment)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive h-8 w-8 p-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="max-w-[90vw] sm:max-w-md">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta ação não pode ser desfeita. Isso irá deletar
                              permanentemente o investimento "{investment.name}".
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                            <AlertDialogCancel className="w-full sm:w-auto">Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(investment.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 w-full sm:w-auto"
                            >
                              Deletar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm">
                      <div>
                        <p className="text-muted-foreground">Quantidade</p>
                        <p className="font-semibold">
                          {formatQuantity(investment.quantity || 0)}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Preço Médio</p>
                        <p className="font-semibold">
                          {formatCurrency(getAveragePurchasePrice(investment))}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Preço Atual</p>
                        <p className="font-semibold">
                          {investment.current_market_price ? (
                            formatCurrency(investment.current_market_price)
                          ) : (
                            <span className="text-muted-foreground text-xs">
                              N/A
                            </span>
                          )}
                          {investment.currency !== "BRL" &&
                            investment.current_market_price && (
                              <span className="text-xs text-muted-foreground ml-1">
                                ({investment.currency})
                              </span>
                            )}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Valor Total</p>
                        <p className="font-semibold">
                          {formatCurrency(calculateCurrentValue(investment))}
                          {investment.currency !== "BRL" && (
                            <span className="text-xs text-muted-foreground ml-1">
                              ({investment.currency})
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-muted-foreground">
                          Rentabilidade
                        </span>
                        <span
                          className={`text-sm font-semibold ${
                            returnData.returnValue >= 0
                              ? "text-success"
                              : "text-expense"
                          }`}
                        >
                          {returnData.returnValue >= 0 ? "+" : ""}
                          {returnData.returnPercentage.toFixed(2)}%
                        </span>
                      </div>
                      <Progress
                        value={Math.abs(returnData.returnPercentage)}
                        className="h-2"
                      />
                      <p
                        className={`text-xs mt-1 ${
                          returnData.returnValue >= 0
                            ? "text-success"
                            : "text-expense"
                        }`}
                      >
                        {returnData.returnValue >= 0 ? "+" : ""}
                        {formatCurrency(returnData.returnValue)}
                      </p>
                    </div>

                    <div className="text-xs text-muted-foreground">
                      <p>Comprado em: {formatDate(investment.purchase_date)}</p>
                      {investment.description && (
                        <p className="mt-1">{investment.description}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal de Criação */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-[500px] max-h-[90vh] overflow-y-auto mx-2">
          <DialogHeader>
            <DialogTitle>Novo Investimento</DialogTitle>
            <DialogDescription>
              Registre um novo investimento para acompanhar sua performance
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2 sm:grid-cols-4 sm:items-center sm:gap-4">
              <Label htmlFor="name" className="sm:text-right">
                Nome *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                className="sm:col-span-3"
                placeholder="Ex: Tesouro Direto IPCA+"
              />
            </div>
            <div className="grid gap-2 sm:grid-cols-4 sm:items-center sm:gap-4">
              <Label htmlFor="symbol" className="sm:text-right">
                Símbolo
              </Label>
              <Input
                id="symbol"
                value={formData.symbol}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, symbol: e.target.value }))
                }
                className="sm:col-span-3"
                placeholder="Ex: PETR4, AAPL"
              />
            </div>
            <div className="grid gap-2 sm:grid-cols-4 sm:items-center sm:gap-4">
              <Label htmlFor="type" className="sm:text-right">
                Tipo *
              </Label>
              <Select
                value={formData.type}
                onValueChange={(
                  value:
                    | "acao"
                    | "fundo"
                    | "criptomoeda"
                    | "renda_fixa"
                    | "outros"
                ) => setFormData((prev) => ({ ...prev, type: value }))}
              >
                <SelectTrigger className="sm:col-span-3">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="acao">Ações</SelectItem>
                  <SelectItem value="fundo">Fundos</SelectItem>
                  <SelectItem value="criptomoeda">Criptomoedas</SelectItem>
                  <SelectItem value="renda_fixa">Renda Fixa</SelectItem>
                  <SelectItem value="outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2 sm:grid-cols-4 sm:items-center sm:gap-4">
              <Label htmlFor="quantity" className="sm:text-right">
                Quantidade *
              </Label>
              <Input
                id="quantity"
                type="number"
                step="0.00000001"
                value={formData.quantity}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, quantity: e.target.value }))
                }
                className="sm:col-span-3"
                placeholder="1.0"
              />
            </div>
            <div className="grid gap-2 sm:grid-cols-4 sm:items-center sm:gap-4">
              <Label htmlFor="initial_amount" className="sm:text-right">
                Valor Inicial *
              </Label>
              <Input
                id="initial_amount"
                type="number"
                step="0.01"
                value={formData.initial_amount}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    initial_amount: e.target.value,
                  }))
                }
                className="sm:col-span-3"
                placeholder="0.00"
              />
            </div>

            <div className="grid gap-2 sm:grid-cols-4 sm:items-center sm:gap-4">
              <Label htmlFor="purchase_date" className="sm:text-right">
                Data da Compra *
              </Label>
              <Input
                id="purchase_date"
                type="date"
                value={formData.purchase_date}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    purchase_date: e.target.value,
                  }))
                }
                className="sm:col-span-3"
              />
            </div>
            <div className="grid gap-2 sm:grid-cols-4 sm:items-center sm:gap-4">
              <Label htmlFor="brokerage" className="sm:text-right">
                Corretora
              </Label>
              <Input
                id="brokerage"
                value={formData.brokerage}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    brokerage: e.target.value,
                  }))
                }
                className="sm:col-span-3"
                placeholder="Ex: XP Investimentos, Clear"
              />
            </div>
            <div className="grid gap-2 sm:grid-cols-4 sm:items-center sm:gap-4">
              <Label htmlFor="currency" className="sm:text-right">
                Moeda
              </Label>
              <Select
                value={formData.currency}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, currency: value }))
                }
              >
                <SelectTrigger className="sm:col-span-3">
                  <SelectValue placeholder="Selecione a moeda" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BRL">Real (BRL)</SelectItem>
                  <SelectItem value="USD">Dólar (USD)</SelectItem>
                  <SelectItem value="EUR">Euro (EUR)</SelectItem>
                  <SelectItem value="BTC">Bitcoin (BTC)</SelectItem>
                  <SelectItem value="ETH">Ethereum (ETH)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2 sm:grid-cols-4 sm:items-center sm:gap-4">
              <Label htmlFor="description" className="sm:text-right">
                Descrição
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                className="sm:col-span-3"
                placeholder="Descrição opcional do investimento"
              />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setCreateModalOpen(false)} className="w-full sm:w-auto">
              Cancelar
            </Button>
            <Button
              onClick={handleCreate}
              disabled={
                !formData.name.trim() ||
                !formData.quantity.trim() ||
                !formData.initial_amount.trim()
              }
              className="w-full sm:w-auto"
            >
              Criar Investimento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Edição */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-[500px] max-h-[90vh] overflow-y-auto mx-2">
          <DialogHeader>
            <DialogTitle>Editar Investimento</DialogTitle>
            <DialogDescription>
              Altere os dados do investimento
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2 sm:grid-cols-4 sm:items-center sm:gap-4">
              <Label htmlFor="edit-name" className="sm:text-right">
                Nome *
              </Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                className="sm:col-span-3"
                placeholder="Ex: Tesouro Direto IPCA+"
              />
            </div>
            <div className="grid gap-2 sm:grid-cols-4 sm:items-center sm:gap-4">
              <Label htmlFor="edit-symbol" className="sm:text-right">
                Símbolo
              </Label>
              <Input
                id="edit-symbol"
                value={formData.symbol}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, symbol: e.target.value }))
                }
                className="sm:col-span-3"
                placeholder="Ex: PETR4, AAPL"
              />
            </div>
            <div className="grid gap-2 sm:grid-cols-4 sm:items-center sm:gap-4">
              <Label htmlFor="edit-type" className="sm:text-right">
                Tipo *
              </Label>
              <Select
                value={formData.type}
                onValueChange={(
                  value:
                    | "acao"
                    | "fundo"
                    | "criptomoeda"
                    | "renda_fixa"
                    | "outros"
                ) => setFormData((prev) => ({ ...prev, type: value }))}
              >
                <SelectTrigger className="sm:col-span-3">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="acao">Ações</SelectItem>
                  <SelectItem value="fundo">Fundos</SelectItem>
                  <SelectItem value="criptomoeda">Criptomoedas</SelectItem>
                  <SelectItem value="renda_fixa">Renda Fixa</SelectItem>
                  <SelectItem value="outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2 sm:grid-cols-4 sm:items-center sm:gap-4">
              <Label htmlFor="edit-quantity" className="sm:text-right">
                Quantidade *
              </Label>
              <Input
                id="edit-quantity"
                type="number"
                step="0.00000001"
                value={formData.quantity}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, quantity: e.target.value }))
                }
                className="sm:col-span-3"
                placeholder="1.0"
              />
            </div>
            <div className="grid gap-2 sm:grid-cols-4 sm:items-center sm:gap-4">
              <Label htmlFor="edit-initial_amount" className="sm:text-right">
                Valor Inicial *
              </Label>
              <Input
                id="edit-initial_amount"
                type="number"
                step="0.01"
                value={formData.initial_amount}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    initial_amount: e.target.value,
                  }))
                }
                className="sm:col-span-3"
                placeholder="0.00"
              />
            </div>

            <div className="grid gap-2 sm:grid-cols-4 sm:items-center sm:gap-4">
              <Label htmlFor="edit-purchase_date" className="sm:text-right">
                Data da Compra *
              </Label>
              <Input
                id="edit-purchase_date"
                type="date"
                value={formData.purchase_date}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    purchase_date: e.target.value,
                  }))
                }
                className="sm:col-span-3"
              />
            </div>
            <div className="grid gap-2 sm:grid-cols-4 sm:items-center sm:gap-4">
              <Label htmlFor="edit-brokerage" className="sm:text-right">
                Corretora
              </Label>
              <Input
                id="edit-brokerage"
                value={formData.brokerage}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    brokerage: e.target.value,
                  }))
                }
                className="sm:col-span-3"
                placeholder="Ex: XP Investimentos, Clear"
              />
            </div>
            <div className="grid gap-2 sm:grid-cols-4 sm:items-center sm:gap-4">
              <Label htmlFor="edit-currency" className="sm:text-right">
                Moeda
              </Label>
              <Select
                value={formData.currency}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, currency: value }))
                }
              >
                <SelectTrigger className="sm:col-span-3">
                  <SelectValue placeholder="Selecione a moeda" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BRL">Real (BRL)</SelectItem>
                  <SelectItem value="USD">Dólar (USD)</SelectItem>
                  <SelectItem value="EUR">Euro (EUR)</SelectItem>
                  <SelectItem value="BTC">Bitcoin (BTC)</SelectItem>
                  <SelectItem value="ETH">Ethereum (ETH)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2 sm:grid-cols-4 sm:items-center sm:gap-4">
              <Label htmlFor="edit-description" className="sm:text-right">
                Descrição
              </Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                className="sm:col-span-3"
                placeholder="Descrição opcional do investimento"
              />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setEditModalOpen(false)} className="w-full sm:w-auto">
              Cancelar
            </Button>
            <Button
              onClick={handleEdit}
              disabled={
                !formData.name.trim() ||
                !formData.quantity.trim() ||
                !formData.initial_amount.trim()
              }
              className="w-full sm:w-auto"
            >
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Nova Transação */}
      <Dialog
        open={transactionModalOpen}
        onOpenChange={setTransactionModalOpen}
      >
        <DialogContent className="max-w-[95vw] sm:max-w-[500px] max-h-[90vh] overflow-y-auto mx-2">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">
              Nova Transação - {selectedInvestment?.name}
            </DialogTitle>
            <DialogDescription>
              Registre uma nova transação para este investimento
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2 sm:grid-cols-4 sm:items-center sm:gap-4">
              <Label htmlFor="transaction_type" className="sm:text-right">
                Tipo *
              </Label>
              <Select
                value={transactionFormData.transaction_type}
                onValueChange={(
                  value:
                    | "BUY"
                    | "SELL"
                    | "DIVIDEND"
                    | "DEPOSIT"
                    | "WITHDRAWAL"
                    | "FEE"
                    | "SPLIT"
                    | "BONUS"
                    | "OTHER"
                ) => {
                  setTransactionFormData((prev) => ({
                    ...prev,
                    transaction_type: value,
                    // Reset campos quando mudar o tipo
                    quantity:
                      value === "BUY" || value === "SELL" ? prev.quantity : "",
                    price_per_unit:
                      value === "BUY" || value === "SELL"
                        ? prev.price_per_unit
                        : "",
                    total_amount: "",
                    // Manter conta bancária selecionada
                    bank_account_id: prev.bank_account_id,
                  }));
                }}
              >
                <SelectTrigger className="sm:col-span-3">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BUY">Compra</SelectItem>
                  <SelectItem value="SELL">Venda</SelectItem>
                  <SelectItem value="DIVIDEND">Dividendo</SelectItem>
                  <SelectItem value="DEPOSIT">Depósito</SelectItem>
                  <SelectItem value="WITHDRAWAL">Retirada</SelectItem>
                  <SelectItem value="FEE">Taxa</SelectItem>
                  <SelectItem value="SPLIT">Desdobramento</SelectItem>
                  <SelectItem value="BONUS">Bonificação</SelectItem>
                  <SelectItem value="OTHER">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2 sm:grid-cols-4 sm:items-center sm:gap-4">
              <Label htmlFor="transaction_date" className="sm:text-right">
                Data *
              </Label>
              <Input
                id="transaction_date"
                type="date"
                value={transactionFormData.transaction_date}
                onChange={(e) =>
                  setTransactionFormData((prev) => ({
                    ...prev,
                    transaction_date: e.target.value,
                  }))
                }
                className="sm:col-span-3"
              />
            </div>
            <div className="grid gap-2 sm:grid-cols-4 sm:items-center sm:gap-4">
              <Label htmlFor="bank_account_id" className="sm:text-right">
                Conta Bancária *
              </Label>
              <Select
                value={transactionFormData.bank_account_id}
                onValueChange={(value) =>
                  setTransactionFormData((prev) => ({
                    ...prev,
                    bank_account_id: value,
                  }))
                }
              >
                <SelectTrigger className="sm:col-span-3">
                  <SelectValue placeholder="Selecione a conta" />
                </SelectTrigger>
                <SelectContent>
                  {bankAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {(transactionFormData.transaction_type === "BUY" ||
              transactionFormData.transaction_type === "SELL") && (
              <>
                <div className="grid gap-2 sm:grid-cols-4 sm:items-center sm:gap-4">
                  <Label htmlFor="quantity" className="sm:text-right">
                    Quantidade
                  </Label>
                  <Input
                    id="quantity"
                    type="number"
                    step="0.00000001"
                    value={transactionFormData.quantity}
                    onChange={(e) => {
                      const newQuantity = e.target.value;
                      setTransactionFormData((prev) => {
                        const pricePerUnit =
                          parseFloat(prev.price_per_unit) || 0;
                        const quantity = parseFloat(newQuantity) || 0;
                        const totalAmount =
                          quantity > 0 && pricePerUnit > 0
                            ? (quantity * pricePerUnit).toFixed(2)
                            : prev.total_amount;

                        return {
                          ...prev,
                          quantity: newQuantity,
                          total_amount: totalAmount,
                        };
                      });
                    }}
                    className="sm:col-span-3"
                    placeholder="0.0"
                  />
                </div>
                <div className="grid gap-2 sm:grid-cols-4 sm:items-center sm:gap-4">
                  <Label htmlFor="price_per_unit" className="sm:text-right">
                    Preço por Unidade
                  </Label>
                  <Input
                    id="price_per_unit"
                    type="number"
                    step="0.01"
                    value={transactionFormData.price_per_unit}
                    onChange={(e) => {
                      const newPricePerUnit = e.target.value;
                      setTransactionFormData((prev) => {
                        const quantity = parseFloat(prev.quantity) || 0;
                        const pricePerUnit = parseFloat(newPricePerUnit) || 0;
                        const totalAmount =
                          quantity > 0 && pricePerUnit > 0
                            ? (quantity * pricePerUnit).toFixed(2)
                            : prev.total_amount;

                        return {
                          ...prev,
                          price_per_unit: newPricePerUnit,
                          total_amount: totalAmount,
                        };
                      });
                    }}
                    className="sm:col-span-3"
                    placeholder="0.00"
                  />
                </div>
              </>
            )}
            <div className="grid gap-2 sm:grid-cols-4 sm:items-center sm:gap-4">
              <Label htmlFor="total_amount" className="sm:text-right">
                Valor Total *
              </Label>
              <Input
                id="total_amount"
                type="number"
                step="0.01"
                value={transactionFormData.total_amount}
                onChange={(e) =>
                  setTransactionFormData((prev) => ({
                    ...prev,
                    total_amount: e.target.value,
                  }))
                }
                className="sm:col-span-3"
                placeholder="0.00"
              />
            </div>
            <div className="grid gap-2 sm:grid-cols-4 sm:items-center sm:gap-4">
              <Label htmlFor="fees" className="sm:text-right">
                Taxas
              </Label>
              <Input
                id="fees"
                type="number"
                step="0.01"
                value={transactionFormData.fees}
                onChange={(e) =>
                  setTransactionFormData((prev) => ({
                    ...prev,
                    fees: e.target.value,
                  }))
                }
                className="sm:col-span-3"
                placeholder="0.00"
              />
            </div>
            <div className="grid gap-2 sm:grid-cols-4 sm:items-center sm:gap-4">
              <Label htmlFor="taxes" className="sm:text-right">
                Impostos
              </Label>
              <Input
                id="taxes"
                type="number"
                step="0.01"
                value={transactionFormData.taxes}
                onChange={(e) =>
                  setTransactionFormData((prev) => ({
                    ...prev,
                    taxes: e.target.value,
                  }))
                }
                className="sm:col-span-3"
                placeholder="0.00"
              />
            </div>
            <div className="grid gap-2 sm:grid-cols-4 sm:items-center sm:gap-4">
              <Label htmlFor="transaction_description" className="sm:text-right">
                Descrição
              </Label>
              <Textarea
                id="transaction_description"
                value={transactionFormData.description}
                onChange={(e) =>
                  setTransactionFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                className="sm:col-span-3"
                placeholder="Descrição opcional da transação"
              />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setTransactionModalOpen(false)}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateTransaction}
              disabled={
                !transactionFormData.total_amount.trim() ||
                !transactionFormData.bank_account_id ||
                ((transactionFormData.transaction_type === "BUY" ||
                  transactionFormData.transaction_type === "SELL") &&
                  (!transactionFormData.quantity.trim() ||
                    !transactionFormData.price_per_unit.trim()))
              }
              className="w-full sm:w-auto"
            >
              Criar Transação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Visualizar Transações */}
      <Dialog
        open={transactionsViewOpen}
        onOpenChange={setTransactionsViewOpen}
      >
        <DialogContent className="max-w-[95vw] sm:max-w-[700px] max-h-[90vh] overflow-y-auto mx-2">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Transações - {selectedInvestment?.name}</DialogTitle>
            <DialogDescription>
              Histórico completo de transações deste investimento
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedInvestment &&
            getInvestmentTransactions(selectedInvestment.id).length === 0 ? (
              <div className="text-center py-8">
                <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Nenhuma transação registrada ainda
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedInvestment &&
                  getInvestmentTransactions(selectedInvestment.id).map(
                    (transaction) => (
                      <Card key={transaction.id} className="p-3 sm:p-4">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge
                                variant={
                                  transaction.transaction_type === "BUY"
                                    ? "default"
                                    : transaction.transaction_type === "SELL"
                                    ? "destructive"
                                    : "secondary"
                                }
                              >
                                {
                                  transactionTypeLabels[
                                    transaction.transaction_type
                                  ]
                                }
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                {formatDate(transaction.transaction_date)}
                              </span>
                            </div>
                            {transaction.quantity &&
                              transaction.price_per_unit && (
                                <p className="text-sm">
                                  {formatQuantity(transaction.quantity)} ×{" "}
                                  {formatCurrency(transaction.price_per_unit)}
                                </p>
                              )}
                            {transaction.description && (
                              <p className="text-sm text-muted-foreground">
                                {transaction.description}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p
                              className={`font-semibold ${
                                transaction.transaction_type === "SELL" ||
                                transaction.transaction_type === "DIVIDEND"
                                  ? "text-success"
                                  : ""
                              }`}
                            >
                              {transaction.transaction_type === "SELL" ||
                              transaction.transaction_type === "DIVIDEND"
                                ? "+"
                                : ""}
                              {formatCurrency(transaction.total_amount)}
                            </p>
                            {(transaction.fees > 0 ||
                              transaction.taxes > 0) && (
                              <p className="text-xs text-muted-foreground">
                                Taxas: {formatCurrency(transaction.fees)} |
                                Impostos: {formatCurrency(transaction.taxes)}
                              </p>
                            )}
                          </div>
                        </div>
                      </Card>
                    )
                  )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setTransactionsViewOpen(false)} className="w-full sm:w-auto">
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Investments;
