import { useState, useEffect } from 'react';
import api from '../api';
import { Link } from 'react-router-dom';

interface Transaction {
    transaction_id: number;
    description: string;
    amount: string;
    transaction_type: 'income' | 'expense' | 'transfer';
    created_at: string;
    transaction_date: string;
}

interface Account {
    account_id: number;
    current_balance: string;
}

interface Budget {
    budget_id: number;
    category_id: number | null;
    amount_limit: string;
    start_date: string;
    end_date: string;
    created_at: string;
}

interface Goal {
    financial_goal_id: number;
    goal_name: string;
    target_amount: string;
    current_amount: string;
    created_at: string;
    deadline?: string;
}

interface Loan {
    loan_id: number;
    purpose: string;
    principal_amount: string;
    paid_amount?: string;
    status: 'active' | 'closed';
    total_repayment_amount?: string;
    return_frequency?: string;
    grace_period_months?: number;
    start_date?: string;
    created_at?: string;
    due_date?: string;
}

const Dashboard = () => {
    const [balance, setBalance] = useState(0);
    const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
    const [budget, setBudget] = useState<Budget | null>(null);
    const [spentThisMonth, setSpentThisMonth] = useState(0);
    const [goals, setGoals] = useState<Goal[]>([]);
    const [loans, setLoans] = useState<Loan[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentGoalIndex, setCurrentGoalIndex] = useState(0);
    const [currentLoanIndex, setCurrentLoanIndex] = useState(0);


    useEffect(() => {
        const fetchData = async () => {
            try {
                const [accRes, txRes, budgetRes, goalsRes, loansRes] = await Promise.all([
                    api.get<Account[]>('/accounts'),
                    api.get<Transaction[]>('/transactions'),
                    api.get<Budget[]>('/finance/budgets'),
                    api.get<Goal[]>('/finance/goals'),
                    api.get<Loan[]>('/loans')
                ]);

                const totalBalance = accRes.data.reduce((sum, acc) => sum + parseFloat(acc.current_balance), 0);
                setBalance(totalBalance);
                setRecentTransactions(txRes.data.slice(0, 5));
                setGoals(goalsRes.data);
                setLoans(loansRes.data.filter(l => l.status === 'active').slice(0, 3));

                const totalBudget = budgetRes.data.find(b => b.category_id === null);
                setBudget(totalBudget || null);

                if (totalBudget) {
                    const bStart = new Date(totalBudget.start_date);
                    const bEnd = new Date(totalBudget.end_date);
                    const bCreated = new Date(totalBudget.created_at);

                    const relevantTxs = txRes.data.filter(t => {
                        const tDate = new Date(t.transaction_date || t.created_at);
                        const tCreated = new Date(t.created_at);
                        return t.transaction_type === 'expense' &&
                            tDate >= bStart &&
                            tDate <= bEnd &&
                            tCreated >= bCreated;
                    });
                    setSpentThisMonth(relevantTxs.reduce((sum, t) => sum + parseFloat(t.amount), 0));
                }

            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const nextGoal = () => {
        setCurrentGoalIndex(prev => (prev + 1) % goals.length);
    };

    const prevGoal = () => {
        setCurrentGoalIndex(prev => (prev - 1 + goals.length) % goals.length);
    };

    const nextLoan = () => {
        setCurrentLoanIndex(prev => (prev + 1) % loans.length);
    };

    const prevLoan = () => {
        setCurrentLoanIndex(prev => (prev - 1 + loans.length) % loans.length);
    };

    if (loading) return <div className="text-center py-10 text-gray-500">Loading...</div>;

    const currentGoal = goals[currentGoalIndex];
    const currentLoan = loans[currentLoanIndex];

    const goalProgressBalance = currentGoal ? parseFloat(currentGoal.current_amount || '0') : 0;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-8">
                <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Link to="/accounts" className="block group">
                        <div className="p-8 rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-2xl shadow-blue-500/20 transform group-hover:-translate-y-1 transition-all duration-300">
                            <p className="text-blue-100 text-sm font-bold uppercase tracking-widest mb-2">Total Balance</p>
                            <h1 className="text-4xl font-black mb-1 flex items-baseline">
                                <span className="text-xl mr-2 text-blue-200">Tk.</span>
                                {balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </h1>
                            <p className="text-blue-200 text-xs font-medium">View accounts &rarr;</p>
                        </div>
                    </Link>

                    <div className="grid grid-cols-1 gap-3">
                        <Link to="/transactions?new=expense" className="py-3 px-6 rounded-2xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-bold border border-gray-100 dark:border-gray-700 hover:border-blue-500 transition-all flex justify-between items-center group shadow-sm">
                            <span className="text-sm">Add Expense</span>
                            <span className="text-gray-300 group-hover:text-blue-500">&rarr;</span>
                        </Link>
                        <Link to="/transactions?new=income" className="py-3 px-6 rounded-2xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-bold border border-gray-100 dark:border-gray-700 hover:border-emerald-500 transition-all flex justify-between items-center group shadow-sm">
                            <span className="text-sm">Add Income</span>
                            <span className="text-gray-300 group-hover:text-emerald-500">&rarr;</span>
                        </Link>
                        <Link to="/transactions?new=transfer" className="py-3 px-6 rounded-2xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-bold border border-gray-100 dark:border-gray-700 hover:border-amber-500 transition-all flex justify-between items-center group shadow-sm">
                            <span className="text-sm">Transfer</span>
                            <span className="text-gray-300 group-hover:text-amber-500">&rarr;</span>
                        </Link>
                    </div>
                </section>

                <section className="bg-white dark:bg-gray-800 rounded-3xl overflow-hidden border border-gray-100 dark:border-gray-700 shadow-xl shadow-gray-200/50 dark:shadow-none">
                    <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                        <h2 className="text-xl font-black text-gray-900 dark:text-white">Recent Transactions</h2>
                        <Link to="/transactions" className="text-xs font-black uppercase tracking-widest text-blue-600 hover:text-blue-700">Show More &rarr;</Link>
                    </div>
                    {recentTransactions.length === 0 ? (
                        <div className="p-12 text-center text-gray-500 italic font-medium">No transactions recorded yet.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50/50 dark:bg-gray-700/30">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-gray-400">Date</th>
                                        <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-gray-400">Description</th>
                                        <th className="px-6 py-4 text-right text-[10px] font-black uppercase text-gray-400">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                                    {recentTransactions.map(t => (
                                        <tr key={t.transaction_id} className="hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors">
                                            <td className="px-6 py-4 text-sm text-gray-500 tabular-nums">
                                                {new Date(t.created_at).toLocaleDateString('en-GB')}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-bold text-gray-900 dark:text-white truncate max-w-xs capitalize">
                                                {t.description || t.transaction_type}
                                            </td>
                                            <td className="px-6 py-4 text-right whitespace-nowrap">
                                                <span className={`text-sm font-black ${t.transaction_type === 'income' ? 'text-emerald-500' : 'text-red-500'}`}>
                                                    {t.transaction_type === 'income' ? '+' : '-'} Tk. {Number(t.amount).toLocaleString()}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </div>

            <div className="lg:col-span-4 space-y-6">
                <div className="p-8 rounded-3xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-xl shadow-gray-200/50 dark:shadow-none">
                    <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-6">Active Budget</h3>
                    {budget ? (
                        <div className="space-y-4">
                            <div className="flex justify-between items-end">
                                <p className="text-3xl font-black text-gray-900 dark:text-white">Tk. {spentThisMonth.toLocaleString()}</p>
                                <span className={`text-xs font-black uppercase ${spentThisMonth > parseFloat(budget.amount_limit) ? 'text-red-500' : 'text-blue-500'}`}>
                                    {Math.round((spentThisMonth / parseFloat(budget.amount_limit)) * 100)}%
                                </span>
                            </div>
                            <div className="h-3 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div
                                    className={`h-full transition-all duration-1000 ${spentThisMonth > parseFloat(budget.amount_limit) ? 'bg-red-500' : 'bg-blue-600'}`}
                                    style={{ width: `${Math.min(100, (spentThisMonth / parseFloat(budget.amount_limit)) * 100)}%` }}
                                ></div>
                            </div>
                            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Spent of Tk. {Number(budget.amount_limit).toLocaleString()}</p>
                        </div>
                    ) : (
                        <div className="text-center py-6">
                            <p className="text-gray-400 text-sm italic font-medium mb-4">No budgets set</p>
                            <Link to="/planning?tab=budget" className="inline-block px-6 py-2 rounded-xl bg-blue-50 text-blue-600 font-bold text-xs">Add Budget &rarr;</Link>
                        </div>
                    )}
                </div>

                <div className="p-8 rounded-3xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-700/50 shadow-sm relative overflow-hidden min-h-[250px] flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-start mb-6">
                            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">Financial Goals</h3>
                            {goals.length > 1 && (
                                <div className="flex space-x-2">
                                    <button onClick={prevGoal} className="p-1 px-2.5 rounded-lg bg-emerald-100 dark:bg-emerald-800 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-200 transition-all font-bold text-sm shadow-sm hover:scale-105 active:scale-95">&larr;</button>
                                    <button onClick={nextGoal} className="p-1 px-2.5 rounded-lg bg-emerald-100 dark:bg-emerald-800 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-200 transition-all font-bold text-sm shadow-sm hover:scale-105 active:scale-95">&rarr;</button>
                                </div>
                            )}
                        </div>

                        {goals.length > 0 ? (
                            <Link key={currentGoal?.financial_goal_id} to="/planning?tab=goal" className="fade-in block group">
                                <div className="space-y-4">
                                    <p className="text-emerald-600 dark:text-emerald-400 text-xs font-black uppercase tracking-widest">{currentGoal.goal_name}</p>

                                    <div className="p-5 rounded-2xl border border-emerald-100/10 shadow-sm bg-white/5 backdrop-blur-sm flex flex-col h-28">
                                        <div className="mb-2 flex flex-col h-full">
                                            <p className="text-2xl font-black text-white mb-1 flex flex-wrap items-baseline gap-2">
                                                <span className="text-sm font-bold text-emerald-100 uppercase tracking-widest">Saved</span>
                                                <span>Tk. {Number(currentGoal.current_amount || 0).toLocaleString()}</span>
                                                <span className="text-sm font-bold text-emerald-100">
                                                    of Tk. {Number(currentGoal.target_amount).toLocaleString()}
                                                </span>
                                            </p>

                                            {currentGoal.deadline && (
                                                <p className="text-xs font-medium uppercase text-emerald-100/90 tracking-wide mt-auto">
                                                    Monthly Target: Tk. {Math.round(Math.max(0, (parseFloat(currentGoal.target_amount) - parseFloat(currentGoal.current_amount || '0')) / Math.max(1, (new Date(currentGoal.deadline).getFullYear() - new Date().getFullYear()) * 12 + (new Date(currentGoal.deadline).getMonth() - new Date().getMonth())))).toLocaleString()}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mt-4">
                                        <div className="flex justify-between items-center text-[10px] font-bold text-emerald-600/70 mb-1.5 px-0.5">
                                            <span className="uppercase tracking-widest">Progress</span>
                                            <span>{Math.round(Math.max(0, (goalProgressBalance / parseFloat(currentGoal.target_amount)) * 100))}%</span>
                                        </div>
                                        <div className="h-2.5 w-full bg-emerald-100 dark:bg-emerald-800 rounded-full overflow-hidden shadow-inner">
                                            <div
                                                className="h-full bg-emerald-500 shadow-lg shadow-emerald-500/50 transition-all duration-1000 ease-out"
                                                style={{ width: `${Math.min(100, Math.max(0, (goalProgressBalance / parseFloat(currentGoal.target_amount)) * 100))}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ) : (
                            <div className="text-center py-10">
                                <p className="text-emerald-400 text-sm italic font-medium mb-4">No goals active</p>
                                <Link to="/planning?tab=goal" className="inline-block px-6 py-2 rounded-xl bg-emerald-100/50 text-emerald-700 font-bold text-xs">Add Goal &rarr;</Link>
                            </div>
                        )}
                    </div>

                    {goals.length > 0 && (
                        <div className="mt-6 flex justify-center space-x-1.5">
                            {goals.map((_, i) => (
                                <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === currentGoalIndex ? 'w-6 bg-emerald-500' : 'w-1.5 bg-emerald-200'}`}></div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-8 rounded-3xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-700/50 shadow-sm relative overflow-hidden min-h-[250px] flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-start mb-6">
                            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400">Active Loans</h3>
                            {loans.length > 1 && (
                                <div className="flex space-x-2">
                                    <button onClick={prevLoan} className="p-1 px-2.5 rounded-lg bg-amber-100 dark:bg-amber-800 text-amber-600 dark:text-amber-400 hover:bg-amber-200 transition-all font-bold text-sm shadow-sm hover:scale-105 active:scale-95">&larr;</button>
                                    <button onClick={nextLoan} className="p-1 px-2.5 rounded-lg bg-amber-100 dark:bg-amber-800 text-amber-600 dark:text-amber-400 hover:bg-amber-200 transition-all font-bold text-sm shadow-sm hover:scale-105 active:scale-95">&rarr;</button>
                                </div>
                            )}
                        </div>

                        {loans.length === 0 ? (
                            <div className="text-center py-6">
                                <p className="text-amber-400 text-sm italic font-medium mb-4">No active loans</p>
                                <Link to="/loans" className="inline-block px-6 py-2 rounded-xl bg-amber-100/50 text-amber-900 dark:text-amber-300 font-bold text-xs hover:bg-amber-100 transition-colors">Add Loan &rarr;</Link>
                            </div>
                        ) : (
                            <Link key={currentLoan?.loan_id} to="/loans" className="fade-in block group">
                                <div className="space-y-4">
                                    <p className="text-amber-600 dark:text-amber-400 text-xs font-black uppercase tracking-widest">{currentLoan.purpose}</p>

                                    <div className="bg-white dark:bg-amber-900/20 p-5 rounded-2xl border border-amber-100 dark:border-amber-800/30 shadow-sm space-y-3">
                                        <div className="flex items-baseline flex-wrap">
                                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mr-2">Due</span>
                                            <span className="text-xl font-black text-gray-900 dark:text-white mr-2">
                                                Tk. {Math.max(0, parseFloat(currentLoan.total_repayment_amount || currentLoan.principal_amount) - parseFloat(currentLoan.paid_amount || '0')).toLocaleString()}
                                            </span>
                                            <span className="text-[10px] font-bold text-gray-400">
                                                of Tk. {Number(currentLoan.total_repayment_amount || currentLoan.principal_amount).toLocaleString()}
                                            </span>
                                        </div>

                                        <div className="p-3 rounded-xl bg-amber-50/50 dark:bg-amber-900/30 border border-amber-100/30">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-[10px] font-black uppercase text-gray-400">Next Installment</span>
                                                <span className="text-sm font-black text-amber-600 dark:text-amber-400">
                                                    Tk. {(() => {
                                                        const start = new Date(currentLoan.created_at || currentLoan.start_date || new Date());
                                                        const due = new Date(currentLoan.due_date || (new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000)));
                                                        const today = new Date();
                                                        const monthsLeft = Math.max(1, Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30.44)));

                                                        const remaining = Math.max(0, parseFloat(currentLoan.total_repayment_amount || currentLoan.principal_amount) - parseFloat(currentLoan.paid_amount || '0'));

                                                        let freq = 1;
                                                        const rf = (currentLoan.return_frequency || 'MONTHLY').toUpperCase();
                                                        if (rf === 'QUARTERLY') freq = 3;
                                                        else if (rf === 'HALF-YEARLY') freq = 6;
                                                        else if (rf === 'YEARLY') freq = 12;

                                                        const remainingInstallments = Math.max(1, monthsLeft / freq);
                                                        return Math.ceil(remaining / remainingInstallments).toLocaleString();
                                                    })()}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center text-[10px] font-bold text-gray-500">
                                                <span className="uppercase tracking-tight">Due Date</span>
                                                <span>
                                                    {(() => {
                                                        const start = new Date(currentLoan.created_at || currentLoan.start_date || new Date());
                                                        const graceDays = (currentLoan.grace_period_months || 0) * 30;
                                                        let freqDays = 30;
                                                        const rf = (currentLoan.return_frequency || 'MONTHLY').toUpperCase();
                                                        if (rf === 'QUARTERLY') freqDays = 90;
                                                        else if (rf === 'HALF-YEARLY') freqDays = 180;
                                                        else if (rf === 'YEARLY') freqDays = 365;

                                                        const total = parseFloat(currentLoan.total_repayment_amount || currentLoan.principal_amount);
                                                        const paid = parseFloat(currentLoan.paid_amount || '0');

                                                        const instSize = (() => {
                                                            const s = new Date(currentLoan.created_at || currentLoan.start_date || new Date());
                                                            const d = new Date(currentLoan.due_date || (new Date(s.getTime() + 30 * 24 * 60 * 60 * 1000)));
                                                            const tm = Math.max(1, Math.ceil((d.getTime() - s.getTime()) / (1000 * 60 * 60 * 24 * 30.44)));
                                                            const em = Math.max(1, tm - (currentLoan.grace_period_months || 0));
                                                            let f = 1;
                                                            if (rf === 'QUARTERLY') f = 3;
                                                            else if (rf === 'HALF-YEARLY') f = 6;
                                                            else if (rf === 'YEARLY') f = 12;
                                                            const ti = Math.max(1, em / f);
                                                            return total / ti;
                                                        })();

                                                        const installmentsPaid = Math.floor(paid / (instSize || 1));
                                                        const nextDate = new Date(start);
                                                        nextDate.setDate(nextDate.getDate() + graceDays + ((installmentsPaid + 1) * freqDays));

                                                        const finalDue = new Date(currentLoan.due_date || nextDate);
                                                        return (nextDate > finalDue ? finalDue : nextDate).toLocaleDateString();
                                                    })()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-4">
                                        <div className="flex justify-between items-center text-[10px] font-bold text-amber-600/70 mb-1.5 px-0.5">
                                            <span className="uppercase tracking-widest">Progress</span>
                                            <span>{Math.round(Math.min(100, Math.max(0, (parseFloat(currentLoan.paid_amount || '0') / parseFloat(currentLoan.total_repayment_amount || currentLoan.principal_amount)) * 100)))}%</span>
                                        </div>
                                        <div className="h-2.5 w-full bg-amber-100 dark:bg-amber-800 rounded-full overflow-hidden shadow-inner">
                                            <div
                                                className="h-full bg-amber-500 shadow-lg shadow-amber-500/50 transition-all duration-1000 ease-out"
                                                style={{ width: `${Math.min(100, Math.max(0, (parseFloat(currentLoan.paid_amount || '0') / parseFloat(currentLoan.total_repayment_amount || currentLoan.principal_amount)) * 100))}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        )}
                    </div>

                    {loans.length > 0 && (
                        <div className="mt-6 flex justify-center space-x-1.5">
                            {loans.map((_, i) => (
                                <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === currentLoanIndex ? 'w-6 bg-amber-500' : 'w-1.5 bg-amber-200'}`}></div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
