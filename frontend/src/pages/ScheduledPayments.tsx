import { useState, useEffect, FC } from "react";
import api from "../api";
import { checkBudget } from "../utils/budgetCheck";
import ConfirmModal from "../components/ConfirmModal";

interface Category {
  category_id: number;
  category_name: string;
  is_income_category: boolean;
}

interface Account {
  account_id: number;
  account_name: string;
}

interface ScheduledPayment {
  scheduled_payment_id: number;
  category_id: number | null;
  category_name: string | null;
  account_id: number;
  account_name: string;
  to_account_id: number | null;
  to_account_name: string | null;
  transaction_type_id: number;
  transaction_type: string;
  amount: string;
  frequency: string;
  next_due_date: string;
  status: string;
  created_at: string;
}

const ScheduledPayments: FC = () => {
  const [payments, setPayments] = useState<ScheduledPayment[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    transaction_type_id: "2",
    account_id: "",
    to_account_id: "",
    category_id: "",
    amount: "",
    frequency: "monthly",
    next_due_date: new Date().toISOString().split("T")[0],
  });
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [paymentsRes, categoriesRes, accountsRes] = await Promise.all([
        api.get<ScheduledPayment[]>("/scheduled-payments"),
        api.get<Category[]>("/finance/categories"),
        api.get<Account[]>("/accounts"),
      ]);
      setPayments(paymentsRes.data);
      setCategories(categoriesRes.data);
      setAccounts(accountsRes.data);
    } catch (err) {
      console.error("Error fetching scheduled payments:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const isExpense = form.transaction_type_id === "2";
    const amount = parseFloat(form.amount);
    const todayStr = new Date().toISOString().split("T")[0];
    const isToday = form.next_due_date === todayStr;

    if (isExpense && isToday) {
      const proceed = await checkBudget(amount);
      if (!proceed) return;
    }

    setIsConfirmModalOpen(true);
  };

  const handleConfirmSubmit = async () => {
    const amount = parseFloat(form.amount);
    const todayStr = new Date().toISOString().split("T")[0];
    const isToday = form.next_due_date === todayStr;

    try {
      const scheduledPayload = {
        ...form,
        category_id: form.category_id || null,
        account_id: parseInt(form.account_id),
        to_account_id: form.to_account_id ? parseInt(form.to_account_id) : null,
        amount,
        transaction_type_id: parseInt(form.transaction_type_id),
      };

      await api.post("/scheduled-payments", scheduledPayload);

      // Trigger immediately if due today
      if (isToday) {
        const typeMap: Record<string, string> = {
          "1": "income",
          "2": "expense",
          "3": "transfer",
        };
        const txPayload = {
          accountId: form.account_id,
          categoryId: form.category_id || null,
          amount: amount,
          type: typeMap[form.transaction_type_id],
          typeId: parseInt(form.transaction_type_id),
          description: "Auto-triggered Scheduled Payment",
          toAccountId: form.to_account_id || null,
        };
        try {
          await api.post("/transactions", txPayload);
        } catch (txErr) {
          console.error("Failed to execute immediate transaction:", txErr);
        }
      }

      setShowForm(false);
      setForm({
        transaction_type_id: "2",
        account_id: "",
        to_account_id: "",
        category_id: "",
        amount: "",
        frequency: "monthly",
        next_due_date: new Date().toISOString().split("T")[0],
      });
      fetchData();
    } catch (err) {
      console.error("Error creating scheduled payment:", err);
    } finally {
      setIsConfirmModalOpen(false);
    }
  };

  const toggleStatus = async (payment: ScheduledPayment) => {
    const newStatus = payment.status === "active" ? "paused" : "active";
    try {
      await api.put(`/scheduled-payments/${payment.scheduled_payment_id}`, {
        status: newStatus,
      });
      fetchData();
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  const deletePayment = async (id: number) => {
    if (
      window.confirm("Are you sure you want to delete this scheduled payment?")
    ) {
      try {
        await api.delete(`/scheduled-payments/${id}`);
        fetchData();
      } catch (err) {
        console.error("Error deleting payment:", err);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-10 fade-in">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
          Recurring Payments
        </h2>
        <button
          className="btn btn-primary"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? "Cancel" : "Schedule New"}
        </button>
      </div>

      {showForm && (
        <div className="card max-w-2xl mx-auto">
          <h3 className="text-lg font-semibold mb-6 text-gray-800 dark:text-white">
            Schedule Payment
          </h3>
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <div className="md:col-span-2 flex p-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <button
                type="button"
                onClick={() => setForm({ ...form, transaction_type_id: "2" })}
                className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${form.transaction_type_id === "2" ? "bg-white dark:bg-gray-600 text-red-500 shadow-sm" : "text-gray-500 dark:text-gray-400"}`}
              >
                Expense
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, transaction_type_id: "1" })}
                className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${form.transaction_type_id === "1" ? "bg-white dark:bg-gray-600 text-emerald-500 shadow-sm" : "text-gray-500 dark:text-gray-400"}`}
              >
                Income
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, transaction_type_id: "3" })}
                className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${form.transaction_type_id === "3" ? "bg-white dark:bg-gray-600 text-blue-500 shadow-sm" : "text-gray-500 dark:text-gray-400"}`}
              >
                Transfer
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Account
              </label>
              <select
                className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                value={form.account_id}
                onChange={(e) =>
                  setForm({ ...form, account_id: e.target.value })
                }
                required
              >
                <option value="">Select Account</option>
                {accounts.map((a) => (
                  <option key={a.account_id} value={a.account_id}>
                    {a.account_name}
                  </option>
                ))}
              </select>
            </div>

            {form.transaction_type_id === "3" ? (
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  To Account
                </label>
                <select
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.to_account_id}
                  onChange={(e) =>
                    setForm({ ...form, to_account_id: e.target.value })
                  }
                  required
                >
                  <option value="">Select Account</option>
                  {accounts
                    .filter((a) => String(a.account_id) !== form.account_id)
                    .map((a) => (
                      <option key={a.account_id} value={a.account_id}>
                        {a.account_name}
                      </option>
                    ))}
                </select>
              </div>
            ) : (
              <div className="hidden md:block"></div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Category
              </label>
              <select
                className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                value={form.category_id}
                onChange={(e) =>
                  setForm({ ...form, category_id: e.target.value })
                }
                required={form.transaction_type_id !== "3"}
              >
                <option value="">Select Category</option>
                {categories
                  .filter((c) => {
                    if (form.transaction_type_id === "1")
                      return c.is_income_category;
                    if (form.transaction_type_id === "2")
                      return (
                        !c.is_income_category && c.category_name !== "Transfer"
                      );
                    if (form.transaction_type_id === "3")
                      return c.category_name === "Transfer";
                    return true;
                  })
                  .map((c) => (
                    <option key={c.category_id} value={c.category_id}>
                      {c.category_name}
                    </option>
                  ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Amount (Tk.)
              </label>
              <input
                type="number"
                step="0.01"
                className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Frequency
              </label>
              <select
                className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                value={form.frequency}
                onChange={(e) =>
                  setForm({ ...form, frequency: e.target.value })
                }
                required
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                First Due Date
              </label>
              <input
                type="date"
                min={new Date().toISOString().split("T")[0]}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                value={form.next_due_date}
                onChange={(e) =>
                  setForm({ ...form, next_due_date: e.target.value })
                }
                required
              />
            </div>

            <button
              type="submit"
              className="md:col-span-2 btn btn-primary py-3 text-base"
            >
              Schedule Now
            </button>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {payments.map((payment) => (
          <div
            key={payment.scheduled_payment_id}
            className="p-8 rounded-[2rem] bg-gray-800 border border-gray-700 shadow-sm relative group overflow-hidden"
          >
            <div
              className={`absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 rounded-full blur-3xl opacity-10 transition-all ${payment.transaction_type === "income" ? "bg-emerald-500" : payment.transaction_type === "expense" ? "bg-red-500" : "bg-blue-500"}`}
            ></div>

            <div className="flex justify-between items-start mb-6 relative z-10">
              <span
                className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                  payment.transaction_type === "income"
                    ? "bg-emerald-900/20 text-emerald-400"
                    : payment.transaction_type === "expense"
                      ? "bg-red-900/20 text-red-400"
                      : "bg-blue-900/20 text-blue-400"
                }`}
              >
                {payment.transaction_type}
              </span>
              <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => toggleStatus(payment)}
                  className="p-2 rounded-xl bg-gray-900/50 text-gray-400 hover:text-white transition-colors"
                  title={payment.status === "active" ? "Pause" : "Resume"}
                >
                  {payment.status === "active" ? (
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                    </svg>
                  ) : (
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  )}
                </button>
                <button
                  onClick={() => deletePayment(payment.scheduled_payment_id)}
                  className="p-2 rounded-xl bg-gray-900/50 text-red-400 hover:text-red-300 transition-colors"
                >
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="space-y-1 mb-6 relative z-10 pointer-events-none">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                {payment.transaction_type === "transfer"
                  ? `${payment.account_name} ➔ ${payment.to_account_name || "Unknown"}`
                  : payment.category_name || "Uncategorized"}
              </p>
              <h3 className="text-3xl font-black text-white tabular-nums">
                Tk. {Number(payment.amount).toLocaleString()}
              </h3>
              {payment.transaction_type !== "transfer" && (
                <p className="text-xs font-medium text-gray-400 mt-1">
                  Account:{" "}
                  <span className="text-gray-300">{payment.account_name}</span>
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 pt-6 border-t border-gray-700">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">
                  Frequency
                </p>
                <p className="text-sm font-bold text-gray-200 capitalize">
                  {payment.frequency}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">
                  Status
                </p>
                <p
                  className={`text-sm font-bold capitalize ${payment.status === "active" ? "text-emerald-400" : "text-amber-400"}`}
                >
                  {payment.status}
                </p>
              </div>
            </div>

            <div className="mt-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">
                Next Payment Due
              </p>
              <p className="text-sm font-bold text-blue-400">
                {new Date(payment.next_due_date).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
        ))}

        {payments.length === 0 && (
          <div className="col-span-full py-20 bg-gray-800/50 border-2 border-dashed border-gray-700 rounded-[2.5rem] text-center">
            <p className="text-gray-500 font-medium italic">
              No scheduled payments yet.
            </p>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={isConfirmModalOpen}
        title="Confirm Scheduled Payment"
        message={
          <div className="space-y-3">
            <p>
              <span className="font-semibold text-gray-500 mr-2">Type:</span>
              <span className="capitalize">
                {form.transaction_type_id === "1"
                  ? "Income"
                  : form.transaction_type_id === "2"
                    ? "Expense"
                    : "Transfer"}
              </span>
            </p>
            <p>
              <span className="font-semibold text-gray-500 mr-2">Amount:</span>
              <span className="font-bold tabular-nums">Tk. {form.amount}</span>
            </p>
            <p>
              <span className="font-semibold text-gray-500 mr-2">Account:</span>
              <span>
                {
                  accounts.find(
                    (a) => a.account_id === parseInt(form.account_id),
                  )?.account_name
                }
              </span>
            </p>
            {form.transaction_type_id === "3" && form.to_account_id && (
              <p>
                <span className="font-semibold text-gray-500 mr-2">
                  To Account:
                </span>
                <span>
                  {
                    accounts.find(
                      (a) => a.account_id === parseInt(form.to_account_id),
                    )?.account_name
                  }
                </span>
              </p>
            )}
            {form.transaction_type_id !== "3" && (
              <p>
                <span className="font-semibold text-gray-500 mr-2">
                  Category:
                </span>
                <span>
                  {categories.find(
                    (c) => c.category_id === parseInt(form.category_id),
                  )?.category_name || "Uncategorized"}
                </span>
              </p>
            )}
            <p>
              <span className="font-semibold text-gray-500 mr-2">
                Frequency:
              </span>
              <span className="capitalize">{form.frequency}</span>
            </p>
            <p>
              <span className="font-semibold text-gray-500 mr-2">
                First Due Date:
              </span>
              <span>
                {new Date(form.next_due_date).toLocaleDateString("en-GB")}
              </span>
            </p>
          </div>
        }
        onConfirm={handleConfirmSubmit}
        onCancel={() => setIsConfirmModalOpen(false)}
        confirmText="Confirm Schedule"
        cancelText="Cancel"
      />
    </div>
  );
};

export default ScheduledPayments;
