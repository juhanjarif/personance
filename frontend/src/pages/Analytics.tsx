import { useState, useEffect, FC } from "react";
import api from "../api";
import MonthlySummary from "../components/MonthlySummary";

interface Category {
  category_id: number;
  category_name: string;
  parent_category_id: number | null;
  is_income_category: boolean;
}

interface MonthlySummaryData {
  total_income: string | number;
  total_expense: string | number;
}

const Analytics: FC = () => {
  const [monthlySummary, setMonthlySummary] = useState<MonthlySummaryData>({
    total_income: 0,
    total_expense: 0,
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryTotals, setCategoryTotals] = useState<Record<number, number>>(
    {},
  );
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [summaryRes, categoriesRes] = await Promise.all([
          api.get<MonthlySummaryData>("/transactions/summary/monthly"),
          api.get<Category[]>("/finance/categories"),
        ]);

        setMonthlySummary(summaryRes.data);
        setCategories(categoriesRes.data);

        const topLevel = categoriesRes.data.filter(
          (c) => !c.parent_category_id,
        );
        const totalsRow: Record<number, number> = {};
        await Promise.all(
          topLevel.map(async (cat) => {
            try {
              const res = await api.get<{ total: number }>(
                `/finance/categories/${cat.category_id}/total`,
              );
              totalsRow[cat.category_id] = res.data.total;
            } catch (e) {
              console.error(e);
            }
          }),
        );
        setCategoryTotals(totalsRow);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading)
    return (
      <div className="text-center py-10 text-gray-500">
        Loading Analytics...
      </div>
    );

  const sortedCategories = categories
    .filter((c) => !c.parent_category_id && !c.is_income_category)
    .sort((a, b) => {
      const totalA = categoryTotals[a.category_id] || 0;
      const totalB = categoryTotals[b.category_id] || 0;
      return sortOrder === "desc" ? totalB - totalA : totalA - totalB;
    });

  return (
    <div className="space-y-10">
      <header className="flex flex-col md:flex-row justify-between items-baseline border-b border-gray-100 dark:border-gray-700 pb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">
            Analytics
          </h1>
          <p className="text-gray-400 text-xs font-semibold uppercase tracking-widest mt-1">
            Overview of spending patterns
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex gap-2">
          <div className="px-4 py-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm text-xs font-bold">
            <span className="text-gray-400 uppercase mr-2">Income:</span>
            <span className="text-emerald-500">
              Tk. {Number(monthlySummary.total_income).toLocaleString()}
            </span>
          </div>
          <div className="px-4 py-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm text-xs font-bold">
            <span className="text-gray-400 uppercase mr-2">Expense:</span>
            <span className="text-red-500">
              Tk. {Number(monthlySummary.total_expense).toLocaleString()}
            </span>
          </div>
        </div>
      </header>

      <section>
        <MonthlySummary
          income={Number(monthlySummary.total_income)}
          expenses={Number(monthlySummary.total_expense)}
        />
      </section>

      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">
            Category Breakdown
          </h2>
          <div className="flex items-center space-x-3 bg-white dark:bg-gray-800 p-1.5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <span className="text-[10px] font-black uppercase text-gray-400 ml-2">
              Sort:
            </span>
            <button
              onClick={() => setSortOrder("desc")}
              className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all ${sortOrder === "desc" ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" : "text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700"}`}
            >
              Most Spent
            </button>
            <button
              onClick={() => setSortOrder("asc")}
              className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all ${sortOrder === "asc" ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" : "text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700"}`}
            >
              Least Spent
            </button>
          </div>
        </div>

        <div className="relative">
          <div className="flex overflow-x-auto pb-6 gap-6 snap-x no-scrollbar">
            {sortedCategories.map((cat) => (
              <div
                key={cat.category_id}
                className="min-w-[300px] snap-start bg-white dark:bg-gray-800 p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-xl shadow-gray-200/50 dark:shadow-none hover:border-blue-500 transition-all group"
              >
                <div className="flex justify-between items-center mb-6">
                  <h4 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 group-hover:text-blue-500 transition-colors">
                    {cat.category_name}
                  </h4>
                  <div className="text-[10px] font-black text-blue-500 px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    {Math.round(
                      ((categoryTotals[cat.category_id] || 0) /
                        (Number(monthlySummary.total_expense) || 1)) *
                        100,
                    )}
                    %
                  </div>
                </div>

                <div className="mt-auto">
                  <p className="text-3xl font-black text-gray-900 dark:text-white tabular-nums tracking-tighter">
                    <span className="text-sm text-gray-300 mr-2">Tk.</span>
                    {Number(
                      categoryTotals[cat.category_id] || 0,
                    ).toLocaleString()}
                  </p>
                </div>

                <div className="mt-8 flex flex-wrap gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                  {categories
                    .filter((c) => c.parent_category_id === cat.category_id)
                    .slice(0, 3)
                    .map((sub) => (
                      <span
                        key={sub.category_id}
                        className="text-[9px] font-black uppercase text-gray-400"
                      >
                        • {sub.category_name}
                      </span>
                    ))}
                  {categories.filter(
                    (c) => c.parent_category_id === cat.category_id,
                  ).length > 3 && (
                    <span className="text-[9px] font-black uppercase text-gray-300">
                      +{" "}
                      {categories.filter(
                        (c) => c.parent_category_id === cat.category_id,
                      ).length - 3}{" "}
                      more
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
          {/* Subtle scroll indicators if needed */}
          <div className="absolute right-0 top-0 bottom-6 w-20 bg-linear-to-l from-gray-50 dark:from-gray-900 to-transparent pointer-events-none opacity-50"></div>
        </div>
      </section>
    </div>
  );
};

export default Analytics;
