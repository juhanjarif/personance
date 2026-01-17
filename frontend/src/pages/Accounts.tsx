import React, { useState, useEffect } from 'react';
import api from '../api';

interface Account {
  account_id: number;
  account_name: string;
  account_type_id: number;
  type_name: string;
  current_balance: string;
}

const Accounts = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [formData, setFormData] = useState({
    accountName: '',
    accountTypeId: 1, 
    initialBalance: ''
  });
  const [editName, setEditName] = useState('');

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const res = await api.get<Account[]>('/accounts');
      setAccounts(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/accounts', formData);
      setShowForm(false);
      setFormData({ accountName: '', accountTypeId: 1, initialBalance: '' });
      fetchAccounts();
    } catch (err) {
      console.error(err);
    }
  };

  const startEditing = (acc: Account) => {
      setEditingAccount(acc);
      setEditName(acc.account_name);
  };

  const cancelEditing = () => {
      setEditingAccount(null);
      setEditName('');
  };

  const handleUpdate = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!editingAccount) return;
      try {
          await api.put(`/accounts/${editingAccount.account_id}`, { accountName: editName });
          setEditingAccount(null);
          setEditName('');
          fetchAccounts();
      } catch (err) {
          console.error(err);
      }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Accounts</h2>
        <button 
          className="btn btn-primary" 
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancel' : 'Add Account'}
        </button>
      </div>

      {showForm && (
        <div className="card max-w-lg mx-auto">
          <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">New Account</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Account Name</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  value={formData.accountName} 
                  onChange={(e) => setFormData({...formData, accountName: e.target.value})} 
                  required 
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Account Type</label>
                <select 
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  value={formData.accountTypeId} 
                  onChange={(e) => setFormData({...formData, accountTypeId: parseInt(e.target.value)})}
                >
                    <option value="1">Bank</option>
                    <option value="2">Mobile Wallet</option>
                    <option value="3">Cash</option>
                </select>
            </div>
             <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Initial Balance</label>
                <input 
                  type="number" 
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  value={formData.initialBalance} 
                  onChange={(e) => setFormData({...formData, initialBalance: e.target.value})} 
                />
            </div>
            <button type="submit" className="w-full btn btn-primary py-3">Create Account</button>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts.map(acc => {
          const borderClass = 
            acc.account_type_id === 1 ? 'border-blue-500' : 
            acc.account_type_id === 2 ? 'border-emerald-500' : 
            'border-amber-500';
          
          const textClass = 
            acc.account_type_id === 1 ? 'text-blue-500' : 
            acc.account_type_id === 2 ? 'text-emerald-500' : 
            'text-amber-500';

          return (
            <div key={acc.account_id} className={`card flex flex-col justify-between h-48 border-l-4 ${borderClass} hover:shadow-lg transition-shadow bg-white dark:bg-gray-800`}>
              <div>
                  <div className="flex justify-between items-start mb-4">
                      {editingAccount?.account_id === acc.account_id ? (
                          <form onSubmit={handleUpdate} className="flex gap-2 flex-1 items-center">
                              <input 
                                  type="text" 
                                  value={editName} 
                                  onChange={(e) => setEditName(e.target.value)} 
                                  autoFocus
                                  className="flex-1 px-2 py-1 text-sm border border-blue-500 rounded bg-transparent text-gray-900 dark:text-white outline-none"
                              />
                              <button type="submit" className="p-1 text-blue-500 hover:text-blue-600 cursor-pointer">✓</button>
                              <button type="button" onClick={cancelEditing} className="p-1 text-gray-400 cursor-pointer">✕</button>
                          </form>
                      ) : (
                          <>
                              <h3 className="font-bold text-gray-900 dark:text-white text-lg truncate flex-1">{acc.account_name}</h3>
                              <div className="flex items-center gap-2">
                                  <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">{acc.type_name}</span>
                                  <button 
                                    onClick={() => startEditing(acc)} 
                                    className="px-2 py-1 text-[10px] font-bold text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors cursor-pointer"
                                    title="Edit Name"
                                  >
                                    Edit
                                  </button>
                              </div>
                          </>
                      )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Current Balance</p>
              </div>
              <p className="text-3xl font-black text-gray-900 dark:text-white">
                <span className={`text-lg font-bold mr-1 ${textClass}`}>Tk.</span>
                {Number(acc.current_balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Accounts;
