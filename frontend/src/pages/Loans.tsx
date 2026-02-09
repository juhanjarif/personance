import React, { useState, useEffect } from 'react';
import api from '../api';

interface Loan {
    loan_id: number;
    purpose: string;
    principal_amount: string;
    interest_rate: string;
    interest_type: 'simple' | 'compound' | 'emi';
    payment_frequency: 'monthly' | 'quarterly' | 'half-yearly' | 'yearly';
    return_frequency: 'MONTHLY' | 'QUARTERLY' | 'HALF-YEARLY' | 'YEARLY';
    start_date: string;
    grace_period_months: number;
    notes: string;
    status: 'active' | 'closed';
    created_at: string;
    paid_amount: string;
    due_date: string;
    total_repayment_amount: string;
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
        purpose: '',
        principalAmount: '',
        interestRate: '',
        interestType: '' as any,
        returnFrequency: '' as any,
        gracePeriodMonths: 0,
        dueDate: ''
    });

    const [calculations, setCalculations] = useState({
        totalRepayment: 0,
        nextInstallment: 0
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
        const dueDate = new Date(form.dueDate);
        const startDate = new Date();

        if (isNaN(dueDate.getTime()) || P <= 0 || !form.interestType || !form.returnFrequency) {
            setCalculations({ totalRepayment: 0, nextInstallment: 0 });
            return;
        }

        const diffTime = Math.abs(dueDate.getTime() - startDate.getTime());
        const diffMonths = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30.44)));
        const T = diffMonths / 12;

        let totalAmount = 0;

        if (form.interestType === 'simple') {
            totalAmount = P * (1 + (R / 100) * T);
        } else if (form.interestType === 'compound') {
            const n = 12; // Compounded monthly
            totalAmount = P * Math.pow((1 + (R / 100) / n), n * T);
        } else if (form.interestType === 'emi') {
            const rPerMonth = (R / 100) / 12;
            const nMonths = diffMonths;
            if (nMonths > 0 && rPerMonth > 0) {
                const emi = (P * rPerMonth * Math.pow(1 + rPerMonth, nMonths)) / (Math.pow(1 + rPerMonth, nMonths) - 1);
                totalAmount = emi * nMonths;
            } else {
                totalAmount = P;
            }
        }

        const effectiveMonths = Math.max(1, diffMonths - form.gracePeriodMonths);
        let frequencyFactor = 1;
        switch (form.returnFrequency) {
            case 'QUARTERLY': frequencyFactor = 3; break;
            case 'HALF-YEARLY': frequencyFactor = 6; break;
            case 'YEARLY': frequencyFactor = 12; break;
            default: frequencyFactor = 1;
        }

        const totalInstallments = Math.max(1, effectiveMonths / frequencyFactor);
        const nextInstallment = totalAmount / totalInstallments;

        setCalculations({
            totalRepayment: isNaN(totalAmount) ? 0 : totalAmount,
            nextInstallment: isNaN(nextInstallment) ? 0 : nextInstallment
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                ...form,
                paymentFrequency: form.returnFrequency.toLowerCase(), // for backward compatibility
                startDate: new Date().toISOString().split('T')[0],
                totalRepaymentAmount: calculations.totalRepayment
            };
            await api.post('/loans', payload);
            fetchLoans();
            alert('Loan added successfully');
            setForm({
                purpose: '',
                principalAmount: '',
                interestRate: '',
                interestType: '' as any,
                returnFrequency: '' as any,
                gracePeriodMonths: 0,
                dueDate: ''
            });
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
                <h2 className="text-3xl font-black text-gray-900 dark:text-white">Loan Management</h2>
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
                        <div className="absolute top-0 left-0 w-full h-2"></div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-1">Loan Purpose</label>
                                <input
                                    type="text"
                                    value={form.purpose}
                                    onChange={e => setForm({ ...form, purpose: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                    placeholder="e.g. Home, Car"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-1">Principal Amount (Tk.)</label>
                                <input
                                    type="number"
                                    value={form.principalAmount}
                                    onChange={e => setForm({ ...form, principalAmount: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                    placeholder="0.00"
                                    required
                                />
                                {form.principalAmount && (
                                    <p className="text-[14px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mt-1 text-right">
                                        TK. {Number(form.principalAmount).toLocaleString()}
                                    </p>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-1">Interest Rate (%)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={form.interestRate}
                                        onChange={e => setForm({ ...form, interestRate: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-1">Type</label>
                                    <select
                                        value={form.interestType}
                                        onChange={e => setForm({ ...form, interestType: e.target.value as any })}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                        required
                                    >
                                        <option value="" disabled hidden>Choose an option</option>
                                        <option value="simple">Simple</option>
                                        <option value="compound">Compound</option>
                                        <option value="emi">EMI</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-1">Return Frequency</label>
                                    <select
                                        value={form.returnFrequency}
                                        onChange={e => setForm({ ...form, returnFrequency: e.target.value as any })}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                        required
                                    >
                                        <option value="" disabled hidden>Choose an option</option>
                                        <option value="MONTHLY">Monthly</option>
                                        <option value="QUARTERLY">Quarterly</option>
                                        <option value="HALF-YEARLY">Half Yearly</option>
                                        <option value="YEARLY">Yearly</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-1">Grace Period (Months)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={form.gracePeriodMonths}
                                        onChange={e => setForm({ ...form, gracePeriodMonths: parseInt(e.target.value) || 0 })}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-1">Due Date</label>
                                <input
                                    type="date"
                                    value={form.dueDate}
                                    min={new Date().toISOString().split('T')[0]}
                                    onChange={e => setForm({ ...form, dueDate: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                    required
                                />
                            </div>

                            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs font-bold text-amber-800 dark:text-amber-200 uppercase">Est. Total Repayment</span>
                                    <span className="text-lg font-black text-amber-600 dark:text-amber-400">Tk. {calculations.totalRepayment.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-amber-700/60 dark:text-amber-300/60 uppercase">Next Installment Amount</span>
                                    <span className="text-xs font-bold text-amber-600/80 dark:text-amber-400/80">Tk. {calculations.nextInstallment.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
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
                            <p className="text-gray-400 font-medium italic">No loans found.</p>
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
                                            <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">{loan.purpose}</h3>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-baseline flex-wrap">
                                            <span className="text-sm font-bold text-gray-400 mr-2">Due</span>
                                            <span className="text-2xl font-black text-gray-900 dark:text-white mr-2">
                                                Tk. {Math.max(0, parseFloat(loan.total_repayment_amount || loan.principal_amount) - parseFloat(loan.paid_amount || '0')).toLocaleString()}
                                            </span>
                                            <span className="text-xs font-bold text-gray-400">
                                                of Tk. {Number(loan.total_repayment_amount || loan.principal_amount).toLocaleString()}
                                            </span>
                                        </div>

                                        <div className="p-3 rounded-xl bg-white/50 dark:bg-gray-900/30 border border-gray-100/50 dark:border-gray-800/30">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-[10px] font-black uppercase text-gray-400">Next Installment</span>
                                                <span className="text-sm font-black text-amber-600 dark:text-amber-400">
                                                    Tk. {(() => {
                                                        const paid = parseFloat(loan.paid_amount || '0');
                                                        const remaining = Math.max(0, parseFloat(loan.total_repayment_amount || loan.principal_amount) - paid);
                                                        if (remaining <= 0) return '0';

                                                        const start = new Date(loan.created_at || loan.start_date);
                                                        const due = new Date(loan.due_date || (new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000)));
                                                        const today = new Date();
                                                        const monthsLeft = Math.max(1, Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30.44)));

                                                        let freq = 1;
                                                        const rf = (loan.return_frequency || 'MONTHLY').toUpperCase();
                                                        if (rf === 'QUARTERLY') freq = 3;
                                                        else if (rf === 'HALF-YEARLY') freq = 6;
                                                        else if (rf === 'YEARLY') freq = 12;

                                                        const remainingInstallments = Math.max(1, monthsLeft / freq);
                                                        return Math.ceil(remaining / remainingInstallments).toLocaleString();
                                                    })()}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center text-[10px] font-bold text-gray-500">
                                                <span className="uppercase">Due Date</span>
                                                <span>
                                                    {(() => {
                                                        const start = new Date(loan.created_at || loan.start_date);
                                                        const graceDays = (loan.grace_period_months || 0) * 30;
                                                        let freqDays = 30;
                                                        const rf = (loan.return_frequency || 'MONTHLY').toUpperCase();
                                                        if (rf === 'QUARTERLY') freqDays = 90;
                                                        else if (rf === 'HALF-YEARLY') freqDays = 180;
                                                        else if (rf === 'YEARLY') freqDays = 365;

                                                        const total = parseFloat(loan.total_repayment_amount || loan.principal_amount);
                                                        const paid = parseFloat(loan.paid_amount || '0');

                                                        const instSize = (() => {
                                                            const s = new Date(loan.created_at || loan.start_date);
                                                            const d = new Date(loan.due_date || (new Date(s.getTime() + 30 * 24 * 60 * 60 * 1000)));
                                                            const tm = Math.max(1, Math.ceil((d.getTime() - s.getTime()) / (1000 * 60 * 60 * 24 * 30.44)));
                                                            const em = Math.max(1, tm - (loan.grace_period_months || 0));
                                                            let f = 1;
                                                            if (rf === 'QUARTERLY') f = 3;
                                                            else if (rf === 'HALF-YEARLY') f = 6;
                                                            else if (rf === 'YEARLY') f = 12;
                                                            const ti = Math.max(1, em / f);
                                                            return total / ti;
                                                        })();

                                                        const installmentsPaid = Math.floor(paid / (instSize || 1));
                                                        const nextInstIndex = installmentsPaid + 1;

                                                        const nextDate = new Date(start);
                                                        nextDate.setDate(nextDate.getDate() + graceDays + (nextInstIndex * freqDays));

                                                        const finalDue = new Date(loan.due_date || nextDate);
                                                        return (nextDate > finalDue ? finalDue : nextDate).toLocaleDateString();
                                                    })()}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="mt-4">
                                            <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 mb-1 px-0.5">
                                                <span className="uppercase tracking-widest">Progress</span>
                                                <span>{Math.round(Math.min(100, Math.max(0, (parseFloat(loan.paid_amount || '0') / parseFloat(loan.total_repayment_amount || loan.principal_amount)) * 100)))}%</span>
                                            </div>
                                            <div className="h-2.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden shadow-inner">
                                                <div
                                                    className={`h-full shadow-lg transition-all duration-1000 ease-out ${loan.status === 'active' ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-gray-400'}`}
                                                    style={{ width: `${Math.min(100, Math.max(0, (parseFloat(loan.paid_amount || '0') / parseFloat(loan.total_repayment_amount || loan.principal_amount)) * 100))}%` }}
                                                ></div>
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
                                <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tighter">{selectedLoan.purpose}</h3>
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
                                        Tk. {Math.max(0, parseFloat(selectedLoan.total_repayment_amount || selectedLoan.principal_amount) - parseFloat(selectedLoan.paid_amount || '0')).toLocaleString()}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total</p>
                                    <p className="text-sm font-bold text-gray-600 dark:text-gray-400">Tk. {Number(selectedLoan.total_repayment_amount || selectedLoan.principal_amount).toLocaleString()}</p>
                                </div>
                            </div>

                            <form onSubmit={handleRepayment} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-1">Pay From Account</label>
                                    <select
                                        value={selectedAccountId}
                                        onChange={e => setSelectedAccountId(parseInt(e.target.value))}
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
                                    <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-1">Repayment Amount</label>
                                    <input
                                        type="number"
                                        value={paymentAmount}
                                        onChange={e => setPaymentAmount(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                        placeholder="0.00"
                                        required
                                        min="1"
                                        max={Math.max(0, parseFloat(selectedLoan.total_repayment_amount || selectedLoan.principal_amount) - parseFloat(selectedLoan.paid_amount || '0'))}
                                    />
                                    {paymentAmount && (
                                        <p className="text-xs font-bold text-amber-600 dark:text-amber-400 mt-1 text-right">
                                            Tk. {Number(paymentAmount).toLocaleString()}
                                        </p>
                                    )}
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
