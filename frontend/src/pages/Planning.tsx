import { useState, useEffect, FC } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../api';

interface Budget {
  budget_id: number;
  category_id: number | null;
  category_name: string | null;
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
  deadline: string;
  created_at: string;
}

interface Account {
  account_id: number;
  account_name: string;
  current_balance: string;
}

const Planning: FC = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const activeTab = searchParams.get('tab') || 'budget';

  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [contributionForm, setContributionForm] = useState({
    accountId: '',
    amount: ''
  });

  const [budgetForm, setBudgetForm] = useState({
    amountLimit: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
  });

  const [goalForm, setGoalForm] = useState({
    goalName: '',
    targetAmount: '',
    deadline: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [budgetsRes, goalsRes, accountsRes] = await Promise.all([
        api.get<Budget[]>('/finance/budgets'),
        api.get<Goal[]>('/finance/goals'),
        api.get<Account[]>('/accounts'),
      ]);
      setBudgets(budgetsRes.data);
      setGoals(goalsRes.data);
      setAccounts(accountsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBudgetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (new Date(budgetForm.startDate) > new Date(budgetForm.endDate)) {
      alert("Start date cannot be after end date.");
      return;
    }
    try {
      await api.post('/finance/budgets', { ...budgetForm, categoryId: null });
      setBudgetForm({ ...budgetForm, amountLimit: '' });
      fetchData();
      alert("Budget set successfully!");
    } catch (err: any) {
      console.error(err);
      alert("Failed to set budget: " + (err.response?.data?.message || err.message));
    }
  };

  const handleGoalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (new Date(goalForm.deadline) < new Date(new Date().setHours(0, 0, 0, 0))) {
      alert("Deadline cannot be in the past.");
      return;
    }
    try {
      await api.post('/finance/goals', goalForm);
      setGoalForm({ goalName: '', targetAmount: '', deadline: new Date().toISOString().split('T')[0] });
      fetchData();
      alert("Goal added successfully!");
    } catch (err: any) {
      console.error(err);
      alert("Failed to add goal: " + (err.response?.data?.message || err.message));
    }
  };

  const deleteBudget = async (id: number) => {
    if (window.confirm('Are you sure you want to remove this budget?')) {
      try {
        await api.delete(`/finance/budgets/${id}`);
        fetchData();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const deleteGoal = async (id: number) => {
    if (window.confirm('Are you sure you want to remove this goal?')) {
      try {
        await api.delete(`/finance/goals/${id}`);
        fetchData();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleContribution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoal || !contributionForm.accountId || !contributionForm.amount) return;

    try {
      await api.post('/finance/goals/add-money', {
        goalId: selectedGoal.financial_goal_id,
        accountId: parseInt(contributionForm.accountId),
        amount: parseFloat(contributionForm.amount)
      });
      alert('Contribution successful!');
      fetchData(); // Refresh data to see updated balance and goal amount
      setSelectedGoal(null);
      setContributionForm({ accountId: '', amount: '' });
    } catch (err: any) {
      console.error(err);
      alert("Failed to contribute: " + (err.response?.data?.message || err.message));
    }
  };

  if (loading) return <div className="text-center py-10 text-gray-500">Loading...</div>;

  const totalBudget = budgets.find(b => b.category_id === null);

  return (
    <div className="space-y-12">
      <section className="space-y-6">
        <h2 className="text-3xl font-black text-gray-900 dark:text-white capitalize">{activeTab} Planning</h2>

        {activeTab === 'budget' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4">
              <div className="card">
                <h4 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-6">Setup Budget</h4>
                <form onSubmit={handleBudgetSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-1">Amount (Tk.)</label>
                    <input
                      type="number"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      value={budgetForm.amountLimit}
                      onChange={e => setBudgetForm({ ...budgetForm, amountLimit: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-1">Start Date</label>
                      <input
                        type="date"
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-xs"
                        value={budgetForm.startDate}
                        onChange={e => setBudgetForm({ ...budgetForm, startDate: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-1">End Date</label>
                      <input
                        type="date"
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-xs"
                        value={budgetForm.endDate}
                        onChange={e => setBudgetForm({ ...budgetForm, endDate: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <button type="submit" className="w-full py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20">
                    {totalBudget ? 'Reset & Set New Budget' : 'Set Budget'}
                  </button>
                </form>
              </div>
            </div>
            <div className="lg:col-span-8">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-2xl">
                <p className="text-blue-100 text-xs font-black uppercase tracking-[0.2em] mb-4">Active Plan</p>
                {totalBudget ? (
                  <div className="flex justify-between items-end">
                    <div>
                      <h1 className="text-5xl font-black">
                        <span className="text-2xl mr-1">Tk.</span>
                        {Number(totalBudget.amount_limit).toLocaleString()}
                      </h1>
                      <div className="mt-4 space-y-1">
                        <p className="text-blue-200 text-[10px] font-bold uppercase">
                          {new Date(totalBudget.start_date).toLocaleDateString()} &mdash; {new Date(totalBudget.end_date).toLocaleDateString()}
                        </p>
                        <p className="text-blue-300 text-[10px] italic opacity-60">
                          Created on {new Date(totalBudget.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteBudget(totalBudget.budget_id)}
                      className="px-6 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-[10px] font-black uppercase border border-white/20"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="py-12 text-center border-2 border-dashed border-white/20 rounded-2xl">
                    <p className="text-blue-200 font-medium italic">No active budget found.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'goal' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4">
              <div className="card">
                <h4 className="text-sm font-black uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400 mb-6">New Saving Goal</h4>
                <form onSubmit={handleGoalSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-1">Purpose</label>
                    <input
                      type="text"
                      placeholder="e.g. Travel Fund"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      value={goalForm.goalName}
                      onChange={e => setGoalForm({ ...goalForm, goalName: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-1">Target Amount (Tk.)</label>
                    <input
                      type="number"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      value={goalForm.targetAmount}
                      onChange={e => setGoalForm({ ...goalForm, targetAmount: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-1">Deadline</label>
                    <input
                      type="date"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      value={goalForm.deadline}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={e => setGoalForm({ ...goalForm, deadline: e.target.value })}
                      required
                    />
                  </div>
                  <button type="submit" className="w-full py-3 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20">
                    Create Goal
                  </button>
                </form>
              </div>
            </div>
            <div className="lg:col-span-8">
              <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 border border-gray-100 dark:border-gray-700 shadow-xl">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-8">Active Goals Tracked</h4>
                {goals.length === 0 ? (
                  <div className="py-16 text-center border-2 border-dashed border-gray-100 dark:border-gray-700 rounded-3xl">
                    <p className="text-gray-400 font-medium italic">No active goals yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {goals.map(goal => (
                      <div key={goal.financial_goal_id} className="p-6 rounded-2xl bg-emerald-50/50 dark:bg-emerald-900/5 border border-emerald-100 dark:border-emerald-800/50 relative group">
                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-2">
                          <button
                            onClick={() => setSelectedGoal(goal)}
                            className="bg-emerald-100 text-emerald-600 hover:bg-emerald-200 px-3 py-1.5 rounded-lg transition-colors text-[10px] font-black uppercase tracking-wider"
                          >
                            Add Money
                          </button>
                          <button onClick={() => deleteGoal(goal.financial_goal_id)} className="bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-500 p-1.5 rounded-lg transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                        <p className="text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2">{goal.goal_name}</p>
                        <h5 className="text-2xl font-black text-gray-900 dark:text-white mb-1">Tk. {Number(goal.target_amount).toLocaleString()}</h5>
                        <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-4">
                          Saved Tk. {Number(goal.current_amount || 0).toLocaleString()} of Tk. {Number(goal.target_amount).toLocaleString()}
                        </p>
                        <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase tracking-widest pt-4 border-t border-emerald-100/50 dark:border-emerald-800/50">
                          <span>Deadline</span>
                          <span className="text-gray-700 dark:text-gray-300">{new Date(goal.deadline).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </section>

      {selectedGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-md shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden transform transition-all scale-100">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
              <div>
                <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tighter">Add Money</h3>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{selectedGoal.goal_name}</p>
              </div>
              <button onClick={() => setSelectedGoal(null)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-500">
                &times;
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex justify-between items-center p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/30">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-800 dark:text-emerald-200">More Required</p>
                  <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                    Tk. {Math.max(0, parseFloat(selectedGoal.target_amount) - parseFloat(selectedGoal.current_amount || '0')).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Target</p>
                  <p className="text-sm font-bold text-gray-600 dark:text-gray-400">Tk. {Number(selectedGoal.target_amount).toLocaleString()}</p>
                </div>
              </div>

              <form onSubmit={handleContribution} className="space-y-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-1">Pay From Account</label>
                  <select
                    value={contributionForm.accountId}
                    onChange={e => setContributionForm({ ...contributionForm, accountId: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    required
                  >
                    <option value="">Select Account</option>
                    {accounts.map(acc => (
                      <option key={acc.account_id} value={acc.account_id}>
                        {acc.account_name} (Tk. {Number(acc.current_balance).toLocaleString()})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-1">Amount</label>
                  <input
                    type="number"
                    value={contributionForm.amount}
                    onChange={e => setContributionForm({ ...contributionForm, amount: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder="0.00"
                    required
                    min="1"
                  />
                </div>
                <button type="submit" className="w-full py-3 rounded-xl bg-emerald-500 text-white font-black uppercase tracking-wider hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20">
                  Confirm Contribution
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Planning;
