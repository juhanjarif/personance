import { useState, useEffect, FC } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api';

interface Account {
  account_id: number;
  account_name: string;
}

interface Category {
  category_id: number;
  category_name: string;
}

interface Transaction {
  transaction_id: number;
  created_at: string;
  description: string;
  category_name: string;
  account_name: string;
  amount: string;
  transaction_type: 'income' | 'expense' | 'transfer';
  transaction_date: string; // Added for budget check
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
  created_at: string;
}

const Transactions: FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    accountId: '',
    categoryId: '',
    amount: '',
    type: 'expense',
    typeId: 2,
    description: '',
    toAccountId: ''
  });

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    fetchTransactions();
    fetchAccounts();
    fetchCategories();

    const params = new URLSearchParams(location.search);
    const newType = params.get('new');
    if (newType && ['income', 'expense', 'transfer'].includes(newType)) {
        const typeMap: Record<string, number> = { 'income': 1, 'expense': 2, 'transfer': 3 };
        setShowForm(true);
        setFormData(prev => ({ ...prev, type: newType, typeId: typeMap[newType] }));
        navigate('/transactions', { replace: true });
    }
  }, [location.search]);

  const fetchTransactions = async () => {
    try {
      const res = await api.get<Transaction[]>('/transactions');
      setTransactions(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAccounts = async () => {
      try {
          const res = await api.get<Account[]>('/accounts');
          setAccounts(res.data);
      } catch (err) { console.error(err); }
  }

  const fetchCategories = async () => {
      try {
          const res = await api.get<Category[]>('/finance/categories');
          setCategories(res.data);
      } catch (err) { console.error(err); }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Budget check for expenses
    if (formData.type === 'expense') {
        try {
            const budgetsRes = await api.get<Budget[]>('/finance/budgets');
            const totalBudget = budgetsRes.data.find(b => b.category_id === null);
            
            if (totalBudget) {
              const bCreated = new Date(totalBudget.created_at);
              const bStart = new Date(totalBudget.start_date);
              const bEnd = new Date(totalBudget.end_date);
              const today = new Date();

              // Only check if today is within the budget period
              if (today >= bStart && today <= bEnd) {
                const txRes = await api.get<Transaction[]>('/transactions');
                const spentSoFar = txRes.data
                  .filter(t => {
                    const tDate = new Date(t.created_at); // Assuming transaction_date is stored in created_at for simplicity, or add a new field
                    const tCreated = new Date(t.created_at);
                    return t.transaction_type === 'expense' && 
                           tDate >= bStart && 
                           tDate <= bEnd && 
                           tCreated >= bCreated;
                  })
                  .reduce((sum, t) => sum + parseFloat(t.amount), 0);

                if (spentSoFar + parseFloat(formData.amount) > parseFloat(totalBudget.amount_limit)) {
                    if (!window.confirm(`This expense exceeds your budget (Tk. ${totalBudget.amount_limit}). Proceed anyway?`)) {
                        return;
                    }
                    const adjust = window.confirm("Limit reached. Would you like to adjust your budget now? (Cancel to remove budget entirely)");
                    if (adjust) {
                        navigate('/planning');
                        return;
                    } else {
                        await api.delete(`/finance/budgets/${totalBudget.budget_id}`);
                    }
                }
              }
            }
        } catch (err) { console.error(err); }
    }

    try {
      await api.post('/transactions', formData); 
      setShowForm(false);
      setFormData({
        accountId: '',
        categoryId: '',
        amount: '',
        type: 'expense',
        typeId: 2,
        description: '',
        toAccountId: ''
      });
      fetchTransactions();
      checkForGoalMet();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Error creating transaction.');
    }
  };

  const checkForGoalMet = async () => {
    try {
      const [goalsRes, txRes] = await Promise.all([
        api.get<Goal[]>('/finance/goals'),
        api.get<Transaction[]>('/transactions')
      ]);
      
      for (const goal of goalsRes.data) {
        const goalCreated = new Date(goal.created_at);
        const goalTxs = txRes.data.filter(t => new Date(t.created_at) >= goalCreated);
        
        const goalProgressBalance = goalTxs.reduce((sum, t) => {
            if (t.transaction_type === 'income') return sum + parseFloat(t.amount);
            if (t.transaction_type === 'expense') return sum - parseFloat(t.amount);
            return sum;
        }, 0);

        if (goalProgressBalance >= parseFloat(goal.target_amount) - 0.01) {
          // Immediately delete so it doesn't trigger again on next poll/action
          await api.delete(`/finance/goals/${goal.financial_goal_id}`);
          
          alert(`Congratulations! You've met your goal: ${goal.goal_name}`);
          
          fetchTransactions();
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Transactions</h2>
        <button 
          className="btn btn-primary" 
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancel' : 'Add Transaction'}
        </button>
      </div>

      {showForm && (
        <div className="card max-w-2xl mx-auto">
          <h3 className="text-lg font-semibold mb-6 text-gray-800 dark:text-white">New Transaction</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2 flex p-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <button 
                  type="button"
                  onClick={() => setFormData({...formData, type: 'expense', typeId: 2})}
                  className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${formData.typeId === 2 ? 'bg-white dark:bg-gray-600 text-red-500 shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
                >
                  Expense
                </button>
                <button 
                  type="button"
                  onClick={() => setFormData({...formData, type: 'income', typeId: 1})}
                  className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${formData.typeId === 1 ? 'bg-white dark:bg-gray-600 text-emerald-500 shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
                >
                  Income
                </button>
                <button 
                  type="button"
                  onClick={() => setFormData({...formData, type: 'transfer', typeId: 3})}
                  className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${formData.typeId === 3 ? 'bg-white dark:bg-gray-600 text-blue-500 shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
                >
                  Transfer
                </button>
            </div>
            
            <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Account</label>
                <select 
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.accountId} 
                  onChange={(e) => setFormData({...formData, accountId: e.target.value})} 
                  required
                >
                    <option value="">Select Account</option>
                    {accounts.map(a => <option key={a.account_id} value={a.account_id}>{a.account_name}</option>)}
                </select>
            </div>

            <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Category</label>
                <select 
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.categoryId} 
                  onChange={(e) => setFormData({...formData, categoryId: e.target.value})} 
                  required
                >
                    <option value="">Select Category</option>
                    {categories.map(c => <option key={c.category_id} value={c.category_id}>{c.category_name}</option>)}
                </select>
            </div>

            {formData.type === 'transfer' && (
                <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">To Account</label>
                    <select 
                      className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                      value={formData.toAccountId} 
                      onChange={(e) => setFormData({...formData, toAccountId: e.target.value})} 
                      required
                    >
                        <option value="">Select Account</option>
                        {accounts.filter(a => String(a.account_id) !== formData.accountId).map(a => <option key={a.account_id} value={a.account_id}>{a.account_name}</option>)}
                    </select>
                </div>
            )}

            <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Amount</label>
                <input 
                  type="number" 
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.amount} 
                  onChange={(e) => setFormData({...formData, amount: e.target.value})} 
                  required 
                />
            </div>

             <div className="md:col-span-2 space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Description</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.description} 
                  onChange={(e) => setFormData({...formData, description: e.target.value})} 
                />
            </div>
            
            <button type="submit" className="md:col-span-2 btn btn-primary py-3 text-base">Submit Transaction</button>
          </form>
        </div>
      )}

      <div className="card p-0 overflow-hidden border-none shadow-lg">
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
                    <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Description</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Category</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Account</th>
                        <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Amount</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {transactions.map(t => (
                        <tr key={t.transaction_id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                            <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">
                                {new Date(t.created_at.includes('Z') || t.created_at.includes('+') ? t.created_at : t.created_at + 'Z').toLocaleString('en-GB', { 
                                    day: '2-digit', 
                                    month: '2-digit', 
                                    year: 'numeric', 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                }).replace(/\//g, '-')}
                            </td>
                            <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white capitalize">
                                {t.description || t.transaction_type}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                                    {t.category_name || 'Uncategorized'}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">{t.account_name}</td>
                            <td className={`px-6 py-4 text-sm text-right font-black whitespace-nowrap ${t.transaction_type === 'income' ? 'text-emerald-500' : t.transaction_type === 'expense' ? 'text-red-500' : 'text-blue-500'}`}>
                                {t.transaction_type === 'income' ? '+' : '-'} Tk. {Number(t.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

export default Transactions;
