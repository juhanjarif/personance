import { useState, useEffect } from "react";
import api from "../api";
import { useNavigate } from "react-router-dom";

interface MonthlyTally {
  transaction_month: string;
  total_transactions: string;
  total_income: string;
  total_expense: string;
}

interface GlobalTransaction {
  transaction_id: number;
  user_name: string;
  user_email: string;
  account_name: string;
  category_name: string;
  amount: string;
  transaction_date: string;
  transaction_type: string;
  description: string;
  created_at: string;
}

interface AuditLog {
  audit_log_id: number;
  user_name: string | null;
  user_email: string | null;
  action_type: string;
  details: string;
  created_at: string;
}

const AdminDashboard = () => {
  const [monthlyTallies, setMonthlyTallies] = useState<MonthlyTally[]>([]);
  const [allTransactions, setAllTransactions] = useState<GlobalTransaction[]>(
    [],
  );
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "activity" | "audit">(
    "overview",
  );
  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("isAdminAuthenticated");
    navigate("/admin/login");
  };

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const [monthlyRes, txRes, auditRes] = await Promise.all([
          api.get<MonthlyTally[]>("/admin/tallies/monthly"),
          api.get<GlobalTransaction[]>("/admin/transactions"),
          api.get<AuditLog[]>("/admin/audit-logs"),
        ]);
        setMonthlyTallies(monthlyRes.data);
        setAllTransactions(txRes.data);
        setAuditLogs(auditRes.data);
      } catch (err) {
        console.error("Error fetching admin data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 transition-colors duration-300">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const maxMonthlyIncome = Math.max(
    ...monthlyTallies.map((t) => parseFloat(t.total_income)),
    1,
  );

  return (
    <div className="min-h-screen bg-gray-900 transition-colors duration-300 font-sans text-gray-100">
      <nav className="sticky top-0 z-50 bg-gray-800/80 backdrop-blur-md border-b border-gray-700">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <div className="text-xl font-black bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Audit
              </div>
              <div className="h-4 w-px bg-gray-200 dark:bg-gray-700 mx-2"></div>
              <div className="flex bg-gray-100 dark:bg-gray-900/50 p-1 rounded-xl">
                <button
                  onClick={() => setActiveTab("overview")}
                  className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase transition-all ${activeTab === "overview" ? "bg-white dark:bg-gray-800 text-blue-600 shadow-sm" : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"}`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab("activity")}
                  className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase transition-all ${activeTab === "activity" ? "bg-white dark:bg-gray-800 text-blue-600 shadow-sm" : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"}`}
                >
                  Activity
                </button>
                <button
                  onClick={() => setActiveTab("audit")}
                  className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase transition-all ${activeTab === "audit" ? "bg-white dark:bg-gray-800 text-blue-600 shadow-sm" : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"}`}
                >
                  Audit Logs
                </button>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-black uppercase tracking-widest hover:bg-red-100 transition-colors"
              >
                Exit
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 max-w-7xl">
        {activeTab === "overview" ? (
          <div className="space-y-10 fade-in">
            <header>
              <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                System Overview
              </h1>
              <p className="text-gray-400 text-sm font-medium mt-1 uppercase tracking-widest">
                Aggregate Financial Performance
              </p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-8 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-8">
                  Monthly Income
                </h3>
                <div className="space-y-6">
                  {monthlyTallies.slice(0, 5).map((tally) => (
                    <div key={tally.transaction_month} className="group">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">
                          {new Date(
                            tally.transaction_month + "-01",
                          ).toLocaleDateString("en-US", {
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                        <span className="text-xs font-bold text-gray-900 dark:text-white">
                          Tk. {Number(tally.total_income).toLocaleString()}
                        </span>
                      </div>
                      <div className="h-2 w-full bg-gray-50 dark:bg-gray-900/50 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-linear-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-1000 ease-out opacity-80 group-hover:opacity-100"
                          style={{
                            width: `${(parseFloat(tally.total_income) / maxMonthlyIncome) * 100}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-6">
                  {monthlyTallies.slice(0, 5).map((tally) => (
                    <div key={tally.transaction_month} className="group">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">
                          {new Date(
                            tally.transaction_month + "-01",
                          ).toLocaleDateString("en-US", {
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                        <span className="text-xs font-bold text-gray-900 dark:text-white">
                          Tk. {Number(tally.total_expense).toLocaleString()}
                        </span>
                      </div>
                      <div className="h-2 w-full bg-gray-50 dark:bg-gray-900/50 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-linear-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-1000 ease-out opacity-80 group-hover:opacity-100"
                          style={{
                            width: `${(parseFloat(tally.total_income) / maxMonthlyIncome) * 100}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-8 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-8">
                  Quick Stats
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  <div className="p-6 rounded-2xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100/30">
                    <p className="text-[10px] font-black text-blue-400 uppercase mb-1">
                      Total Transactions
                    </p>
                    <p className="text-2xl font-black text-blue-600">
                      {monthlyTallies.reduce(
                        (sum, t) => sum + parseInt(t.total_transactions),
                        0,
                      )}
                    </p>
                  </div>
                  <div className="p-6 rounded-2xl bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100/30">
                    <p className="text-[10px] font-black text-emerald-400 uppercase mb-1">
                      Total Income
                    </p>
                    <p className="text-2xl font-black text-emerald-600">
                      Tk.{" "}
                      {Math.round(
                        monthlyTallies.reduce(
                          (sum, t) => sum + parseFloat(t.total_income),
                          0,
                        ),
                      ).toLocaleString()}
                    </p>
                  </div>
                  <div className="p-6 rounded-2xl bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100/30">
                    <p className="text-[10px] font-black text-emerald-400 uppercase mb-1">
                      Total Expense
                    </p>
                    <p className="text-2xl font-black text-emerald-600">
                      Tk.{" "}
                      {Math.round(
                        monthlyTallies.reduce(
                          (sum, t) => sum + parseFloat(t.total_expense),
                          0,
                        ),
                      ).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === "activity" ? (
          <div className="space-y-6 fade-in">
            <header className="flex justify-between items-end">
              <div>
                <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                  Global Activity
                </h1>
                <p className="text-gray-400 text-sm font-medium mt-1 uppercase tracking-widest">
                  Real-time Transaction Stream
                </p>
              </div>
              <div className="text-[10px] font-black text-gray-300 uppercase">
                Showing Last {allTransactions.length} items
              </div>
            </header>

            <div className="bg-white dark:bg-gray-800 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                      <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-gray-400 tracking-widest">
                        User
                      </th>
                      <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-gray-400 tracking-widest">
                        Account / Category
                      </th>
                      <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-gray-400 tracking-widest">
                        Amount
                      </th>
                      <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-gray-400 tracking-widest">
                        Date
                      </th>
                      <th className="px-6 py-4 text-right text-[10px] font-black uppercase text-gray-400 tracking-widest">
                        Type
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-900/50">
                    {allTransactions.map((tx) => (
                      <tr
                        key={tx.transaction_id}
                        className="hover:bg-gray-50/50 dark:hover:bg-gray-900/30 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <p className="text-sm font-bold text-gray-900 dark:text-white">
                            {tx.user_name}
                          </p>
                          <p className="text-[10px] text-gray-400 lowercase">
                            {tx.user_email}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-xs font-bold text-gray-700 dark:text-gray-300">
                            {tx.account_name}
                          </p>
                          <p className="text-[10px] text-gray-400 uppercase">
                            {tx.category_name || "Uncategorized"}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-black text-gray-900 dark:text-white tabular-nums">
                            Tk. {Number(tx.amount).toLocaleString()}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-xs font-semibold text-gray-500">
                            {new Date(tx.transaction_date).toLocaleDateString(
                              "en-GB",
                            )}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span
                            className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                              tx.transaction_type === "income"
                                ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400"
                                : tx.transaction_type === "expense"
                                  ? "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400"
                                  : "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                            }`}
                          >
                            {tx.transaction_type}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : activeTab === "audit" ? (
          <div className="space-y-6 fade-in">
            <header className="flex justify-between items-end">
              <div>
                <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                  System Audit Logs
                </h1>
                <p className="text-gray-400 text-sm font-medium mt-1 uppercase tracking-widest">
                  Track Important System Actions
                </p>
              </div>
              <div className="text-[10px] font-black text-gray-300 uppercase">
                Showing Last {auditLogs.length} items
              </div>
            </header>

            <div className="bg-white dark:bg-gray-800 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                      <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-gray-400 tracking-widest">
                        Timestamp
                      </th>
                      <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-gray-400 tracking-widest">
                        User
                      </th>
                      <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-gray-400 tracking-widest">
                        Action Type
                      </th>
                      <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-gray-400 tracking-widest">
                        Details
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-900/50">
                    {auditLogs.map((log) => (
                      <tr
                        key={log.audit_log_id}
                        className="hover:bg-gray-50/50 dark:hover:bg-gray-900/30 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <p className="text-xs font-semibold text-gray-500">
                            {new Date(log.created_at).toLocaleString("en-GB")}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-bold text-gray-900 dark:text-white">
                            {log.user_name || "System"}
                          </p>
                          {log.user_email && (
                            <p className="text-[10px] text-gray-400 lowercase">
                              {log.user_email}
                            </p>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                              log.action_type === "INSERT"
                                ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400"
                                : log.action_type === "DELETE"
                                  ? "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400"
                                  : "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                            }`}
                          >
                            {log.action_type}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                            {log.details}
                          </p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
};

export default AdminDashboard;
