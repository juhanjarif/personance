import { useState, useEffect } from 'react';
import api from '../api';
import { Link } from 'react-router-dom';

interface Transaction {
  transaction_id: number;
  created_at: string;
  description: string;
  amount: string;
  transaction_type: 'income' | 'expense' | 'transfer';
}

interface Account {
  account_id: number;
  current_balance: string;
}

const Dashboard = () => {
  const [balance, setBalance] = useState(0);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const accRes = await api.get<Account[]>('/accounts');
        const totalBalance = accRes.data.reduce((sum, acc) => sum + parseFloat(acc.current_balance), 0);
        setBalance(totalBalance);

        const txRes = await api.get<Transaction[]>('/transactions');
        setRecentTransactions(txRes.data.slice(0, 10));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="text-center py-10 text-gray-500">Loading...</div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-4 space-y-6">
        <Link to="/accounts" className="block group">
           <div className="p-8 rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-2xl shadow-blue-500/20 transform group-hover:-translate-y-1 transition-all duration-300">
             <p className="text-blue-100 text-sm font-bold uppercase tracking-widest mb-2">Total Balance</p>
             <h1 className="text-4xl font-black mb-1 flex items-baseline">
                <span className="text-xl mr-2 text-blue-200">Tk.</span>
                {balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
             </h1>
             <p className="text-blue-200 text-xs font-medium">Click to view accounts &rarr;</p>
           </div>
        </Link>

        <div className="flex flex-col gap-3">
            <Link to="/transactions?new=expense" className="w-full py-4 px-6 rounded-2xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-bold text-left border border-gray-100 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-lg transition-all flex justify-between items-center group shadow-sm">
                <span className="flex items-center">
                    Add Expense
                </span>
                <span className="text-gray-300 group-hover:text-blue-500 transition-colors">&rarr;</span>
            </Link>
            
            <Link to="/transactions?new=income" className="w-full py-4 px-6 rounded-2xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-bold text-left border border-gray-100 dark:border-gray-700 hover:border-emerald-500 dark:hover:border-emerald-500 hover:shadow-lg transition-all flex justify-between items-center group shadow-sm">
                <span className="flex items-center">
                    Add Income
                </span>
                <span className="text-gray-300 group-hover:text-emerald-500 transition-colors">&rarr;</span>
            </Link>

            <Link to="/transactions?new=transfer" className="w-full py-4 px-6 rounded-2xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-bold text-left border border-gray-100 dark:border-gray-700 hover:border-amber-500 dark:hover:border-amber-500 hover:shadow-lg transition-all flex justify-between items-center group shadow-sm">
                <span className="flex items-center">
                    Transfer
                </span>
                <span className="text-gray-300 group-hover:text-amber-500 transition-colors">&rarr;</span>
            </Link>
        </div>
      </div>

      <div className="lg:col-span-8">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
            <h2 className="text-2xl font-black text-gray-900 dark:text-white">Recent Transactions</h2>
            <Link to="/transactions" className="px-5 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                View History
            </Link>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-3xl overflow-hidden border border-gray-100 dark:border-gray-700 shadow-xl shadow-gray-200/50 dark:shadow-none">
            {recentTransactions.length === 0 ? (
                <div className="p-12 text-center">
                    <p className="text-gray-500 dark:text-gray-400 font-medium">No transactions recorded yet.</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead className="bg-gray-50/50 dark:bg-gray-700/30 border-b border-gray-100 dark:border-gray-700">
                            <tr>
                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Timestamp</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Description</th>
                                <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-gray-400">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                            {recentTransactions.map(t => (
                                <tr key={t.transaction_id} className="hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors group">
                                    <td className="px-6 py-5 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap tabular-nums font-medium">
                                        {new Date(t.created_at.includes('Z') || t.created_at.includes('+') ? t.created_at : t.created_at + 'Z').toLocaleString('en-GB', { 
                                            day: '2-digit', 
                                            month: '2-digit', 
                                            year: 'numeric', 
                                            hour: '2-digit', 
                                            minute: '2-digit' 
                                        }).replace(/\//g, '-')}
                                    </td>
                                    <td className="px-6 py-5">
                                        <p className="text-sm font-bold text-gray-900 dark:text-white capitalize truncate max-w-[150px] md:max-w-xs">
                                            {t.description || t.transaction_type}
                                        </p>
                                    </td>
                                    <td className="px-6 py-5 text-right whitespace-nowrap">
                                        <span className={`text-sm font-black tabular-nums ${t.transaction_type === 'income' ? 'text-emerald-500' : t.transaction_type === 'expense' ? 'text-red-500' : 'text-amber-500'}`}>
                                            {t.transaction_type === 'income' ? '+' : '-'} Tk. {Number(t.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
