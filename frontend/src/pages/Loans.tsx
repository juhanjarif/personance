import React, { useState, useEffect } from 'react';
import api from '../api';

interface Loan {
    loan_id: number;
    lender_name: string;
    purpose: string;
    principal_amount: string;
    interest_rate: string;
    interest_type: 'simple' | 'compound' | 'emi';
    payment_frequency: 'monthly' | 'quarterly' | 'half-yearly' | 'yearly';
    start_date: string;
    due_date: string;
    grace_period_months: number;
    notes: string;
    status: 'active' | 'closed';
    created_at: string;
    paid_amount: string;
}

interface Account {
    account_id: number;
    account_name: string;
    current_balance: string;
}

const Loans = () => {
    const [loans, setLoans] = useState<Loan[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'closed'>('active');

    const [form, setForm] = useState({
        lenderName: '',
        purpose: '',
        principalAmount: '',
        interestRate: '',
        interestType: 'simple',
        paymentFrequency: 'monthly',
        startDate: new Date().toISOString().split('T')[0],
        dueDate: '',
        gracePeriodMonths: 0,
        notes: ''
    });

    const [calculations, setCalculations] = useState({
        totalRepayment: 0,
        interestAmount: 0,
        nextPaymentInterest: 0
    });

    const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [selectedAccountId, setSelectedAccountId] = useState<number | ''>('');

    useEffect(() => {
        fetchLoans();
        fetchAccounts();
    }, []);

    useEffect(() => {
        calculateLoan();
    }, [form]);

    const fetchLoans = async () => {
        try {
            const res = await api.get<Loan[]>('/loans');
            setLoans(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchAccounts = async () => {
        try {
            const res = await api.get<Account[]>('/accounts');
            setAccounts(res.data);
        } catch (err) { console.error(err); }
    };

    const calculateLoan = () => {
        const P = parseFloat(form.principalAmount) || 0;
        const R = parseFloat(form.interestRate) || 0;

        let T = 0;
        if (form.startDate && form.dueDate) {
            const start = new Date(form.startDate);
            const end = new Date(form.dueDate);
            const diffTime = Math.abs(end.getTime() - start.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            T = diffDays / 365;

            if (form.gracePeriodMonths > 0) {
                const graceYears = form.gracePeriodMonths / 12;
                T = Math.max(0, T - graceYears);
            }
        }

        let totalAmount = 0;
        let interest = 0;

        if (form.interestType === 'simple') {
            interest = P * (R / 100) * T;
            totalAmount = P + interest;
        } else if (form.interestType === 'compound') {
            const n = form.paymentFrequency === 'monthly' ? 12 : (form.paymentFrequency === 'quarterly' ? 4 : (form.paymentFrequency === 'half-yearly' ? 2 : 1));
            totalAmount = P * Math.pow((1 + (R / 100) / n), n * T);
            interest = totalAmount - P;
        } else if (form.interestType === 'emi') {
            const rPerMonth = (R / 100) / 12;
            const nMonths = T * 12;
            if (nMonths > 0 && rPerMonth > 0) {
                const emi = (P * rPerMonth * Math.pow(1 + rPerMonth, nMonths)) / (Math.pow(1 + rPerMonth, nMonths) - 1);
                totalAmount = emi * nMonths;
                interest = totalAmount - P;
            } else {
                totalAmount = P;
            }
        }

        let nextPaymentInt = 0;
        let freqDivisor = 12;
        switch (form.paymentFrequency) {
            case 'quarterly': freqDivisor = 4; break;
            case 'half-yearly': freqDivisor = 2; break;
            case 'yearly': freqDivisor = 1; break;
            default: freqDivisor = 12;
        }

        nextPaymentInt = (totalAmount - P) / (T * freqDivisor || 1);
        if (form.interestType === 'simple') nextPaymentInt = (P * (R / 100)) / freqDivisor;


        setCalculations({
            totalRepayment: isNaN(totalAmount) ? 0 : totalAmount,
            interestAmount: isNaN(interest) ? 0 : interest,
            nextPaymentInterest: isNaN(nextPaymentInt) ? 0 : nextPaymentInt
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/loans', form);
            fetchLoans();
            alert('Loan added successfully');
            setForm({ ...form, principalAmount: '', purpose: '', notes: '' });
        } catch (err) {
            console.error(err);
            alert('Failed to add loan');
        }
    };

    const handleDelete = async (id: number, e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm("Are you sure?")) {
            try {
                await api.delete(`/loans/${id}`);
                fetchLoans();
            } catch (err) { console.error(err); }
        }
    };

    const toggleStatus = async () => {
        if (!selectedLoan) return;
        const newStatus = selectedLoan.status === 'active' ? 'closed' : 'active';
        try {
            await api.patch(`/loans/${selectedLoan.loan_id}/status`, { status: newStatus });
            fetchLoans();
            setSelectedLoan(null);
        } catch (err) { console.error(err); }
    }

    const handleRepayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedLoan || !selectedAccountId || !paymentAmount) return;

        try {
            await api.post('/loans/repay', {
                loanId: selectedLoan.loan_id,
                accountId: selectedAccountId,
                amount: parseFloat(paymentAmount)
            });
            alert('Repayment successful!');
            fetchLoans();
            fetchAccounts();
            setSelectedLoan(null);
            setPaymentAmount('');
            setSelectedAccountId('');
        } catch (err: any) {
            console.error(err);
            const errorMessage = err.response?.data?.message || 'Repayment failed';
            alert('Error: ' + errorMessage);
        }
    };

    const filteredLoans = loans.filter(l => filterStatus === 'all' || l.status === filterStatus);

    return (
        <div className="space-y-8 relative">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-black text-gray-900 dark:text-white">Loans Management</h2>
                <div className="flex space-x-2">
                    {(['active', 'closed', 'all'] as const).map(status => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${filterStatus === status
                                ? 'bg-amber-400 text-amber-900 shadow-lg shadow-amber-400/30'
                                : 'bg-white dark:bg-gray-800 text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                                }`}
                        >
                            {status}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-4">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 border border-amber-100 dark:border-amber-900/20 shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-300 to-yellow-500"></div>
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-1">Sector (Purpose)</label>
                                    <input
                                        type="text"
                                        value={form.purpose}
                                        onChange={e => setForm({ ...form, purpose: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none"
                                        placeholder="e.g. Home, Car"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-1">Lender</label>
                                    <input
                                        type="text"
                                        value={form.lenderName}
                                        onChange={e => setForm({ ...form, lenderName: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none"
                                        placeholder="Bank/Person"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-1">Principal Amount</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-2.5 text-gray-400 font-bold">Tk.</span>
                                    <input
                                        type="number"
                                        value={form.principalAmount}
                                        onChange={e => setForm({ ...form, principalAmount: e.target.value })}
                                        className="w-full pl-12 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm font-bold focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none"
                                        placeholder="0.00"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-1">Monthly Interest Rate (%)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={form.interestRate}
                                        onChange={e => setForm({ ...form, interestRate: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-1">Type</label>
                                    <select
                                        value={form.interestType}
                                        onChange={e => setForm({ ...form, interestType: e.target.value as any })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none"
                                    >
                                        <option value="simple">Simple</option>
                                        <option value="compound">Compound</option>
                                        <option value="emi">EMI</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-1">Payment Frequency</label>
                                    <select
                                        value={form.paymentFrequency}
                                        onChange={e => setForm({ ...form, paymentFrequency: e.target.value as any })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none"
                                    >
                                        <option value="monthly">Monthly</option>
                                        <option value="quarterly">Quarterly</option>
                                        <option value="half-yearly">Half Yearly</option>
                                        <option value="yearly">Yearly</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-1">Start Date</label>
                                    <input
                                        type="date"
                                        value={form.startDate}
                                        onChange={e => setForm({ ...form, startDate: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-1">Due Date</label>
                                    <input
                                        type="date"
                                        value={form.dueDate}
                                        onChange={e => setForm({ ...form, dueDate: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-1">Grace Period (Months)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={form.gracePeriodMonths}
                                        onChange={e => setForm({ ...form, gracePeriodMonths: Math.max(0, parseInt(e.target.value) || 0) })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-1">Notes (Optional)</label>
                                <textarea
                                    value={form.notes}
                                    onChange={e => setForm({ ...form, notes: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none h-20 resize-none"
                                ></textarea>
                            </div>

                            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs font-bold text-amber-800 dark:text-amber-200 uppercase">Est. Total Repayment</span>
                                    <span className="text-lg font-black text-amber-600 dark:text-amber-400">Tk. {calculations.totalRepayment.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-amber-700/60 dark:text-amber-300/60 uppercase">Next {form.paymentFrequency} Interest</span>
                                    <span className="text-xs font-bold text-amber-600/80 dark:text-amber-400/80">Tk. {calculations.nextPaymentInterest.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                                </div>
                            </div>

                            <button type="submit" className="w-full py-3.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-amber-900 font-black uppercase tracking-wider shadow-lg shadow-amber-400/20 transition-all transform hover:-translate-y-0.5">
                                Add Loan
                            </button>
                        </form>
                    </div>
                </div>

                <div className="lg:col-span-8 space-y-4">
                    {loading ? (
                        <div className="h-64 flex flex-col items-center justify-center text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-amber-400"></div>
                            <p className="mt-4 text-gray-400 font-bold uppercase tracking-widest text-xs">Loading Loans...</p>
                        </div>
                    ) : filteredLoans.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center p-10 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-3xl">
                            <p className="text-gray-400 font-medium italic">No loans found under this category.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {filteredLoans.map(loan => (
                                <div
                                    key={loan.loan_id}
                                    onClick={() => setSelectedLoan(loan)}
                                    className={`p-6 rounded-2xl border transition-all relative group cursor-pointer hover:-translate-y-1 ${loan.status === 'active'
                                        ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/30'
                                        : 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30'
                                        }`}
                                >
                                    <div className="absolute top-4 right-4 z-10 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setSelectedLoan(loan); }}
                                            className="px-3 py-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-wider hover:bg-emerald-200 transition-colors"
                                        >
                                            Pay
                                        </button>
                                        <button
                                            onClick={(e) => handleDelete(loan.loan_id, e)}
                                            className="px-3 py-1.5 rounded-lg bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 text-[10px] font-black uppercase tracking-wider hover:bg-red-200 transition-colors"
                                        >
                                            Delete
                                        </button>
                                    </div>

                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <span className={`inline-block px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest mb-2 ${loan.status === 'active' ? 'bg-emerald-200 text-emerald-800' : 'bg-red-200 text-red-800'}`}>
                                                {loan.status}
                                            </span>
                                            <h3 className="text-xl font-black text-gray-900 dark:text-white">{loan.purpose}</h3>
                                            <p className="text-xs text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">{loan.lender_name}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-baseline flex-wrap">
                                            <span className="text-sm font-bold text-gray-400 mr-2">Due</span>
                                            <span className="text-2xl font-black text-gray-900 dark:text-white mr-2">
                                                Tk. {Math.max(0, parseFloat(loan.principal_amount) - parseFloat(loan.paid_amount || '0')).toLocaleString()}
                                            </span>
                                            <span className="text-xs font-bold text-gray-400">
                                                of Tk. {Number(loan.principal_amount).toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center py-3 border-t border-gray-200/50 dark:border-gray-700/50">
                                            <div>
                                                <p className="text-[10px] uppercase font-black text-gray-400">Interest</p>
                                                <p className="text-sm font-bold text-gray-700 dark:text-gray-300">{loan.interest_rate}% <span className="text-[10px] text-gray-400">({loan.interest_type})</span></p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] uppercase font-black text-gray-400">Freq.</p>
                                                <p className="text-sm font-bold text-gray-700 dark:text-gray-300 capitalize">{loan.payment_frequency}</p>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="text-[10px] uppercase font-black text-gray-400">Taken</p>
                                                <p className="text-xs font-bold text-gray-600 dark:text-gray-400">{new Date(loan.start_date).toLocaleDateString()}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] uppercase font-black text-gray-400">Due</p>
                                                <p className="text-xs font-bold text-gray-600 dark:text-gray-400">{new Date(loan.due_date).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {selectedLoan && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-md shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden transform transition-all scale-100">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
                            <div>
                                <h3 className="text-lg font-black text-gray-900 dark:text-white">{selectedLoan.purpose} Loan</h3>
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">{selectedLoan.lender_name}</p>
                            </div>
                            <button onClick={() => setSelectedLoan(null)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-500">
                                &times;
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="flex justify-between items-center p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-800 dark:text-amber-200">Current Due</p>
                                    <p className="text-2xl font-black text-amber-600 dark:text-amber-400">
                                        Tk. {Math.max(0, parseFloat(selectedLoan.principal_amount) - parseFloat(selectedLoan.paid_amount || '0')).toLocaleString()}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total</p>
                                    <p className="text-sm font-bold text-gray-600 dark:text-gray-400">Tk. {Number(selectedLoan.principal_amount).toLocaleString()}</p>
                                </div>
                            </div>

                            <form onSubmit={handleRepayment} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-1">Pay From Account</label>
                                    <select
                                        value={selectedAccountId}
                                        onChange={e => setSelectedAccountId(parseInt(e.target.value))}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm focus:ring-2 focus:ring-amber-400 outline-none"
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
                                    <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-1">Repayment Amount</label>
                                    <input
                                        type="number"
                                        value={paymentAmount}
                                        onChange={e => setPaymentAmount(e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm focus:ring-2 focus:ring-amber-400 outline-none font-bold"
                                        placeholder="0.00"
                                        required
                                        min="1"
                                        max={Math.max(0, parseFloat(selectedLoan.principal_amount) - parseFloat(selectedLoan.paid_amount || '0'))}
                                    />
                                </div>
                                <button type="submit" className="w-full py-3 rounded-xl bg-amber-400 text-amber-900 font-black uppercase tracking-wider hover:bg-amber-500 transition-colors shadow-lg shadow-amber-400/20">
                                    Process Payment
                                </button>
                            </form>

                            <div className="border-t border-gray-100 dark:border-gray-700 pt-6">
                                <button
                                    onClick={toggleStatus}
                                    className="w-full py-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-bold uppercase tracking-wider hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-xs"
                                >
                                    {selectedLoan.status === 'active' ? 'Mark Loan as Closed' : 'Re-activate Loan'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Loans;
