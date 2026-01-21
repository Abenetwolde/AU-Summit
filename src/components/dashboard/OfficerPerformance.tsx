import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { TrendingUp, Clock, CheckCircle, XCircle, User as UserIcon, Building2 } from 'lucide-react';
import { OfficerPerformanceResponse } from '@/store/services/api';

interface OfficerPerformanceProps {
    data: OfficerPerformanceResponse | undefined;
    isLoading: boolean;
    viewMode?: 'officer' | 'organization';
}

const Card = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
    <div className={`bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden ${className}`}>
        {children}
    </div>
);

export const OfficerPerformance: React.FC<OfficerPerformanceProps> = ({ data, isLoading, viewMode = 'officer' }) => {
    if (isLoading) {
        return (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-pulse">
                <div className="lg:col-span-2 h-[400px] bg-slate-100 rounded-2xl"></div>
                <div className="h-[400px] bg-slate-100 rounded-2xl"></div>
            </div>
        );
    }

    const hasData = viewMode === 'officer'
        ? (data?.officers && data.officers.length > 0)
        : (data?.organizations && data.organizations.length > 0);

    if (!data || !hasData) {
        return (
            <Card className="p-12 flex flex-col items-center justify-center text-center">
                <div className="p-4 bg-slate-50 rounded-full mb-4 text-slate-400">
                    {viewMode === 'officer' ? <UserIcon className="h-10 w-10" /> : <Building2 className="h-10 w-10" />}
                </div>
                <h3 className="text-lg font-bold text-slate-800">No {viewMode === 'officer' ? 'Officer' : 'Organization'} Activity Yet</h3>
                <p className="text-slate-500 max-w-sm">
                    KPI data will appear here once {viewMode === 'officer' ? 'officers' : 'organizations'} start processing applications within the selected timeframe.
                </p>
            </Card>
        );
    }

    const formatMinutes = (minutes: number) => {
        if (minutes < 60) return `${Math.round(minutes)}m`;
        const h = Math.floor(minutes / 60);
        const m = Math.round(minutes % 60);
        return `${h}h ${m}m`;
    };

    const items = viewMode === 'officer' ? data.officers : data.organizations;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Throughput Chart */}
                <Card className="lg:col-span-2 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-slate-800">Processing Throughput</h3>
                            <p className="text-sm text-slate-500">Daily number of processed applications</p>
                        </div>
                        <div className="text-right">
                            <p className="text-2xl font-bold text-blue-600">{data.totalProcessedGlobal}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Actions</p>
                        </div>
                    </div>

                    <div className="h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data.throughputTrend}>
                                <defs>
                                    <linearGradient id="colorThroughput" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="date"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12, fill: '#64748b' }}
                                    tickFormatter={(val) => new Date(val).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12, fill: '#64748b' }}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    labelFormatter={(val) => new Date(val).toLocaleDateString('en-US', { dateStyle: 'long' })}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="count"
                                    stroke="#3b82f6"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorThroughput)"
                                    dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* Efficiency Summary */}
                <Card className="p-6 bg-slate-900 text-white border-0 shadow-lg shadow-slate-900/10">
                    <h3 className="text-lg font-bold mb-6">Efficiency Leaderboard</h3>
                    <div className="space-y-4">
                        {[...items].sort((a, b) => b.successRate - a.successRate).slice(0, 5).map((item, i) => (
                            <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-xs border border-blue-500/30">
                                        #{i + 1}
                                    </div>
                                    <div className="max-w-[120px]">
                                        <p className="text-sm font-bold text-white truncate">{item.name}</p>
                                        <p className="text-[10px] text-slate-400 font-medium truncate">
                                            {viewMode === 'officer' ? (item as any).role : 'Organization Unit'}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold text-emerald-400">{item.successRate}%</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Success</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            {/* Detailed Table */}
            <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-slate-800">
                        {viewMode === 'officer' ? 'Officer' : 'Organization'} Performance Details
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-50">
                                <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    {viewMode === 'officer' ? 'Officer' : 'Organization'}
                                </th>
                                <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Stats</th>
                                <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Throughput</th>
                                <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Success Rate</th>
                                <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Avg. Time</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {items.map((item) => (
                                <tr key={item.id} className="group hover:bg-slate-50/50 transition-colors">
                                    <td className="py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                                                {viewMode === 'officer' ? <UserIcon className="h-5 w-5" /> : <Building2 className="h-5 w-5" />}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-800">{item.name}</p>
                                                {viewMode === 'officer' && (
                                                    <p className="text-xs text-slate-500">{(item as any).organization}</p>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-4">
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-1.5 cursor-help" title="Approved">
                                                <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                                                <span className="text-sm font-bold text-slate-700">{item.approved}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 cursor-help" title="Rejected">
                                                <XCircle className="h-3.5 w-3.5 text-red-500" />
                                                <span className="text-sm font-bold text-slate-700">{item.rejected}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-4 text-center">
                                        <div className="inline-flex items-center px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold">
                                            {item.totalProcessed} apps
                                        </div>
                                    </td>
                                    <td className="py-4 text-right">
                                        <div className="w-full max-w-[120px] ml-auto">
                                            <div className="flex items-center justify-between mb-1.5">
                                                <span className="text-xs font-bold text-slate-700">{item.successRate}%</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full transition-all duration-500 ${item.successRate > 80 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                                                    style={{ width: `${item.successRate}%` }}
                                                />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-4 text-right">
                                        <div className="flex items-center justify-end gap-1.5">
                                            <Clock className="h-3.5 w-3.5 text-slate-400" />
                                            <span className="text-sm font-bold text-slate-700">{formatMinutes(item.avgDecisionTimeMinutes)}</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};
