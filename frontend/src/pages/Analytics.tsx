import { useState, useEffect, FC } from "react";
import api from "../api";
import MonthlySummary from "../components/MonthlySummary";

interface Category {
  category_id: number;
  category_name: string;
  parent_category_id: number | null;
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
    .filter((c) => !c.parent_category_id)
    .sort((a, b) => {
      const totalA = categoryTotals[a.category_id] || 0;
      const totalB = categoryTotals[b.category_id] || 0;
      return sortOrder === "desc" ? totalB - totalA : totalA - totalB;
    });

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-3xl font-black text-gray-900 dark:text-white">
          Financial Analytics
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">
          Deep dive into your spending and income patterns.
        </p>
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
                <div className="flex justify-between items-start mb-6">
                  <h4 className="text-sm font-black uppercase tracking-widest text-gray-400 group-hover:text-blue-500 transition-colors">
                    {cat.category_name}
                  </h4>
                  <div className="h-8 w-8 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                      />
                    </svg>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-tight">
                    Total Spent
                  </p>
                  <p className="text-3xl font-black text-gray-900 dark:text-white tabular-nums">
                    Tk.{" "}
                    {Number(
                      categoryTotals[cat.category_id] || 0,
                    ).toLocaleString()}
                  </p>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-50 dark:border-gray-700">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">
                    Sub-categories
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {categories.filter(
                      (c) => c.parent_category_id === cat.category_id,
                    ).length > 0 ? (
                      categories
                        .filter((c) => c.parent_category_id === cat.category_id)
                        .map((sub) => (
                          <span
                            key={sub.category_id}
                            className="px-3 py-1.5 rounded-xl bg-gray-50 dark:bg-gray-900/50 text-[10px] font-black text-gray-500 border border-transparent hover:border-gray-200 dark:hover:border-gray-700 transition-colors"
                          >
                            {sub.category_name}
                          </span>
                        ))
                    ) : (
                      <span className="text-[10px] italic text-gray-300 font-medium">
                        No sub-categories defined
                      </span>
                    )}
                  </div>
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
