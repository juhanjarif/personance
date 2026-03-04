import { FC } from "react";

interface MonthlySummaryProps {
  income: number;
  expenses: number;
}

const MonthlySummary: FC<MonthlySummaryProps> = ({ income, expenses }) => {
  const total = income + expenses;
  const incomePercentage = total > 0 ? (income / total) * 100 : 50;
  const expensePercentage = total > 0 ? (expenses / total) * 100 : 50;

  return (
    <div className="p-8 rounded-3xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-xl shadow-gray-200/50 dark:shadow-none">
      <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-6">
        Monthly Summary
      </h3>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-[10px] font-black uppercase text-emerald-500 mb-1">
              Total Income
            </p>
            <p className="text-2xl font-black text-gray-900 dark:text-white">
              Tk. {income.toLocaleString()}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black uppercase text-red-500 mb-1">
              Total Expenses
            </p>
            <p className="text-2xl font-black text-gray-900 dark:text-white">
              Tk. {expenses.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="h-4 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden flex">
          <div
            className="h-full bg-emerald-500 transition-all duration-1000 ease-out"
            style={{ width: `${incomePercentage}%` }}
          ></div>
          <div
            className="h-full bg-red-500 transition-all duration-1000 ease-out"
            style={{ width: `${expensePercentage}%` }}
          ></div>
        </div>

        <div className="flex justify-between text-[10px] font-black uppercase tracking-tighter">
          <span className="text-emerald-500">
            {Math.round(incomePercentage)}% Income
          </span>
          <span className="text-red-500">
            {Math.round(expensePercentage)}% Expenses
          </span>
        </div>
      </div>
    </div>
  );
};

export default MonthlySummary;
