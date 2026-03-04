import api from "../api";

interface Budget {
  budget_id: number;
  category_id: number | null;
  amount_limit: string;
  start_date: string;
  end_date: string;
  created_at: string;
}

interface Transaction {
  transaction_id: number;
  created_at: string;
  amount: string;
  transaction_type: "income" | "expense" | "transfer";
}

export const checkBudget = async (expenseAmount: number): Promise<boolean> => {
  try {
    const budgetsRes = await api.get<Budget[]>("/finance/budgets");
    const totalBudget = budgetsRes.data.find((b) => b.category_id === null);

    if (!totalBudget) return true;

    const bCreated = new Date(totalBudget.created_at);
    const bStart = new Date(totalBudget.start_date);
    const bEnd = new Date(totalBudget.end_date);
    const today = new Date();

    if (today >= bStart && today <= bEnd) {
      const txRes = await api.get<Transaction[]>("/transactions");
      const spentSoFar = txRes.data
        .filter((t) => {
          const tDate = new Date(t.created_at);
          const tCreated = new Date(t.created_at);
          return (
            t.transaction_type === "expense" &&
            tDate >= bStart &&
            tDate <= bEnd &&
            tCreated >= bCreated
          );
        })
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

      if (spentSoFar + expenseAmount > parseFloat(totalBudget.amount_limit)) {
        const proceed = window.confirm(
          `This expense exceeds your budget (Tk. ${totalBudget.amount_limit}). Proceed anyway?`,
        );
        if (!proceed) {
          return false;
        }

        const removeBudget = window.confirm(
          "Would you like to remove your budget limit? (Click OK to remove, Cancel to keep it)",
        );
        if (removeBudget) {
          try {
            await api.delete(`/finance/budgets/${totalBudget.budget_id}`);
            alert("Budget removed successfully.");
          } catch (delErr) {
            console.error("Failed to remove budget", delErr);
          }
        }
      }
    }
    return true;
  } catch (err) {
    console.error("Budget check failed", err);
    return true;
  }
};
