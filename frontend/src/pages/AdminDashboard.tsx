import { useState, useEffect } from "react";
import api from "../api";

interface DailyTally {
  transaction_date: string;
  total_transactions: string;
  total_income: string;
  total_expense: string;
}

interface MonthlyTally {
  transaction_month: string;
  total_transactions: string;
  total_income: string;
  total_expense: string;
}

const AdminDashboard = () => {
  const [dailyTallies, setDailyTallies] = useState<DailyTally[]>([]);
  const [monthlyTallies, setMonthlyTallies] = useState<MonthlyTally[]>([]);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
      root.style.colorScheme = "dark";
    } else {
      root.classList.remove("dark");
      root.style.colorScheme = "light";
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const [dailyRes, monthlyRes] = await Promise.all([
          api.get<DailyTally[]>("/admin/tallies/daily"),
          api.get<MonthlyTally[]>("/admin/tallies/monthly"),
        ]);
        setDailyTallies(dailyRes.data);
        setMonthlyTallies(monthlyRes.data);
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
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const maxDailyIncome = Math.max(
    ...dailyTallies.map((t) => parseFloat(t.total_income)),
    1,
  );
  const maxMonthlyIncome = Math.max(
    ...monthlyTallies.map((t) => parseFloat(t.total_income)),
    1,
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="text-2xl font-black bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Personance Audit
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleTheme}
                className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 hover:ring-2 hover:ring-blue-500 transition-all text-xs font-bold text-gray-700 dark:text-gray-200"
              >
                {theme === "light" ? "Dark Mode" : "Light Mode"}
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-7xl">
        <header className="mb-12">
          <div className="inline-block px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest rounded-full mb-4">
            Statistics
          </div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">
            Admin Dashboard
          </h1>
        </header>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="bg-white dark:bg-gray-800 p-10 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-2xl shadow-gray-200/50 dark:shadow-none flex flex-col">
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">
                Monthly Income Statistics
              </h3>
            </div>
            <div className="space-y-8 flex-1 flex flex-col justify-center">
              {monthlyTallies.slice(0, 6).map((tally) => (
                <div key={tally.transaction_month} className="group">
                  <div className="flex justify-between items-end mb-3">
                    <span className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-tighter">
                      {new Date(
                        tally.transaction_month + "-01",
                      ).toLocaleDateString("en-US", {
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                    <span className="text-sm font-black text-gray-900 dark:text-white tabular-nums">
                      Tk. {Number(tally.total_income).toLocaleString()}
                    </span>
                  </div>
                  <div className="h-5 w-full bg-gray-50 dark:bg-gray-700/50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-linear-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-1000 ease-out"
                      style={{
                        width: `${(parseFloat(tally.total_income) / maxMonthlyIncome) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-10 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-2xl shadow-gray-200/50 dark:shadow-none">
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">
                Recent Daily Trends
              </h3>
              <span className="text-[10px] font-bold text-gray-400 uppercase">
                Last 10 Days
              </span>
            </div>
            <div className="flex items-end justify-between h-64 gap-3 pt-4">
              {dailyTallies
                .slice(0, 10)
                .reverse()
                .map((tally) => (
                  <div
                    key={tally.transaction_date}
                    className="flex-1 flex flex-col items-center gap-4 h-full group"
                  >
                    <div className="flex-1 w-full bg-gray-50 dark:bg-gray-700/50 rounded-2xl relative overflow-hidden flex flex-col justify-end">
                      <div
                        className="w-full bg-linear-to-t from-emerald-500 to-teal-400 transition-all duration-700 ease-out absolute bottom-0 rounded-b-2xl"
                        style={{
                          height: `${(parseFloat(tally.total_income) / maxDailyIncome) * 100}%`,
                        }}
                      >
                        <div className="opacity-0 group-hover:opacity-100 absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-[10px] py-1.5 px-3 rounded-lg whitespace-nowrap transition-all font-black shadow-xl">
                          Tk.{" "}
                          {Math.round(
                            parseFloat(tally.total_income),
                          ).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter transform -rotate-45 sm:rotate-0">
                      {new Date(tally.transaction_date).toLocaleDateString(
                        "en-US",
                        { day: "2-digit", month: "short" },
                      )}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default AdminDashboard;
