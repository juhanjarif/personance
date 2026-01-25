import React, { useState, useEffect } from 'react';
import api from '../api';

interface Loan {
    loan_id: number;
    lender_name: string;
    purpose: string;
    principal_amount: string;
    interest_rate: string;
    interest_type: 'simple' | 'compound' | 'emi';
    payment_frequency: 'monthly' | 'quarterly';
    start_date: string;
    due_date: string;
    grace_period_months: number;
    notes: string;
    status: 'active' | 'closed';
    created_at: string;
}

const Loans = () => {
    const [loans, setLoans] = useState<Loan[]>([]);
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
        hasGracePeriod: false,
        gracePeriodMonths: 0,
        notes: ''
    });

    const [calculations, setCalculations] = useState({
        totalRepayment: 0,
        interestAmount: 0,
        nextPaymentInterest: 0
    });

    useEffect(() => {
        fetchLoans();
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

            if (form.hasGracePeriod && form.gracePeriodMonths > 0) {
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
            const n = form.paymentFrequency === 'monthly' ? 12 : 4;
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
        if (form.paymentFrequency === 'monthly') {
            nextPaymentInt = (totalAmount - P) / (T * 12 || 1);
            if (form.interestType === 'simple') nextPaymentInt = (P * (R / 100)) / 12;
        } else {
            nextPaymentInt = (totalAmount - P) / (T * 4 || 1);
            if (form.interestType === 'simple') nextPaymentInt = (P * (R / 100)) / 4;
        }

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

    const handleDelete = async (id: number) => {
        if (window.confirm("Are you sure?")) {
            try {
                await api.delete(`/loans/${id}`);
                fetchLoans();
            } catch (err) { console.error(err); }
        }
    };

    const toggleStatus = async (loan: Loan) => {
        const newStatus = loan.status === 'active' ? 'closed' : 'active';
        try {
            await api.patch(`/loans/${loan.loan_id}/status`, { status: newStatus });
            fetchLoans();
        } catch (err) { console.error(err); }
    }

    const filteredLoans = loans.filter(l => filterStatus === 'all' || l.status === filterStatus);

    return (
        <div className="space-y-8">
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
                                    <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-1">Interest Rate (%)</label>
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
                                    <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-1">Payment Freq.</label>
                                    <select
                                        value={form.paymentFrequency}
                                        onChange={e => setForm({ ...form, paymentFrequency: e.target.value as any })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none"
                                    >
                                        <option value="monthly">Monthly</option>
                                        <option value="quarterly">Quarterly</option>
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
                                <div className="flex flex-col justify-end">
                                    <label className="flex items-center space-x-2 cursor-pointer mb-2">
                                        <input
                                            type="checkbox"
                                            checked={form.hasGracePeriod}
                                            onChange={e => setForm({ ...form, hasGracePeriod: e.target.checked })}
                                            className="form-checkbox text-amber-500 rounded focus:ring-amber-400"
                                        />
                                        <span className="text-xs font-bold text-gray-600 dark:text-gray-300">Grace Period?</span>
                                    </label>
                                    <input
                                        type="number"
                                        placeholder="Months"
                                        value={form.gracePeriodMonths}
                                        disabled={!form.hasGracePeriod}
                                        onChange={e => setForm({ ...form, gracePeriodMonths: parseInt(e.target.value) })}
                                        className={`w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm transition-all outline-none ${!form.hasGracePeriod ? 'blur-sm opacity-50 cursor-not-allowed' : 'focus:ring-2 focus:ring-amber-400'}`}
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
                                <div key={loan.loan_id} className={`p-6 rounded-2xl border transition-all relative group ${loan.status === 'active' ? 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 shadow-xl shadow-gray-200/50 dark:shadow-none' : 'bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-800 opacity-75'}`}>
                                    <div className="absolute top-4 right-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => toggleStatus(loan)} className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 text-xs font-bold">
                                            {loan.status === 'active' ? 'Mark Closed' : 'Mark Active'}
                                        </button>
                                        <button onClick={() => handleDelete(loan.loan_id)} className="p-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100">
                                            &times;
                                        </button>
                                    </div>

                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <span className={`inline-block px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest mb-2 ${loan.status === 'active' ? 'bg-amber-100 text-amber-700' : 'bg-gray-200 text-gray-500'}`}>
                                                {loan.status}
                                            </span>
                                            <h3 className="text-xl font-black text-gray-900 dark:text-white">{loan.purpose}</h3>
                                            <p className="text-xs text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">{loan.lender_name}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-baseline">
                                            <span className="text-sm font-bold text-gray-400 mr-2">Due</span>
                                            <span className="text-3xl font-black text-gray-900 dark:text-white">
                                                Tk. {Number(loan.principal_amount).toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center py-3 border-t border-gray-100 dark:border-gray-700">
                                            <div>
                                                <p className="text-[10px] uppercase font-black text-gray-400">Interest</p>
                                                <p className="text-sm font-bold text-amber-600 dark:text-amber-500">{loan.interest_rate}% <span className="text-[10px] text-gray-400">({loan.interest_type})</span></p>
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
        </div>
    );
};

export default Loans;
