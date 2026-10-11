import { useState, useEffect, useCallback } from 'react';
import { api, OverviewMetrics } from '../lib/api';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  MousePointerClick,
  Link as LinkIcon,
  Laptop,
  Compass,
  Globe2,
  Calendar,
  Info,
  Loader2,
} from 'lucide-react';

const NORDIC_PALETTE = ['#244A42', '#3A7D6F', '#A8B9A5', '#76928C', '#DCE7ED'];

export default function AnalyticsPage() {
  const [range, setRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [overview, setOverview] = useState<OverviewMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOverview = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.getOverview(range);
      setOverview(res.overview);
    } catch (err) {
      console.error('Failed to load analytics', err);
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  return (
    <div className="space-y-8 py-6 max-w-5xl mx-auto">
      {/* Header and Filter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-nordic-charcoal dark:text-nordic-dark-text">
            Click Analytics
          </h1>
          <p className="text-sm text-nordic-slate">
            Aggregate performance for links created under your account.
          </p>
        </div>

        {/* Range Selector */}
        <div className="inline-flex rounded-xl border border-nordic-border dark:border-nordic-dark-border bg-nordic-surface dark:bg-nordic-dark-surface p-1 shadow-sm">
          {(['7d', '30d', '90d', 'all'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                range === r
                  ? 'bg-nordic-pine text-white shadow-xs'
                  : 'text-nordic-slate hover:text-nordic-charcoal dark:hover:text-nordic-dark-text'
              }`}
            >
              {r === '7d' ? '7 Days' : r === '30d' ? '30 Days' : r === '90d' ? '90 Days' : 'All Time'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="bg-nordic-surface dark:bg-nordic-dark-surface border border-nordic-border dark:border-nordic-dark-border rounded-2xl p-16 text-center text-nordic-slate flex items-center justify-center space-x-2">
          <Loader2 className="w-5 h-5 animate-spin text-nordic-pine dark:text-nordic-sage" />
          <span>Aggregating analytics data...</span>
        </div>
      ) : !overview || overview.totalClicks === 0 ? (
        <div className="bg-nordic-surface dark:bg-nordic-dark-surface border border-nordic-border dark:border-nordic-dark-border rounded-2xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-nordic-mist/50 dark:bg-nordic-dark-border mx-auto flex items-center justify-center text-nordic-pine dark:text-nordic-sage">
            <Calendar className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-nordic-charcoal dark:text-nordic-dark-text">
            No click activity for this period
          </h3>
          <p className="text-xs text-nordic-slate max-w-sm mx-auto">
            {overview?.totalLinks === 0
              ? 'You have not created any short links yet. Head to the Links tab to create one.'
              : 'Share your short links to begin seeing real-time click trends and referrer breakdowns.'}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Key Metric Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="bg-nordic-surface dark:bg-nordic-dark-surface border border-nordic-border dark:border-nordic-dark-border rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between text-nordic-slate text-xs font-semibold uppercase tracking-wider mb-2">
                <span>Total Period Clicks</span>
                <MousePointerClick className="w-4 h-4 text-nordic-pine dark:text-nordic-sage" />
              </div>
              <div className="text-3xl font-extrabold text-nordic-charcoal dark:text-nordic-dark-text">
                {overview.totalClicks}
              </div>
            </div>

            <div className="bg-nordic-surface dark:bg-nordic-dark-surface border border-nordic-border dark:border-nordic-dark-border rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between text-nordic-slate text-xs font-semibold uppercase tracking-wider mb-2">
                <span>Total Active Links</span>
                <LinkIcon className="w-4 h-4 text-nordic-pine dark:text-nordic-sage" />
              </div>
              <div className="text-3xl font-extrabold text-nordic-charcoal dark:text-nordic-dark-text">
                {overview.activeLinks}
              </div>
            </div>

            <div className="bg-nordic-surface dark:bg-nordic-dark-surface border border-nordic-border dark:border-nordic-dark-border rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between text-nordic-slate text-xs font-semibold uppercase tracking-wider mb-2">
                <span>Avg Clicks / Link</span>
                <Globe2 className="w-4 h-4 text-nordic-pine dark:text-nordic-sage" />
              </div>
              <div className="text-3xl font-extrabold text-nordic-charcoal dark:text-nordic-dark-text">
                {overview.totalLinks > 0 ? (overview.totalClicks / overview.totalLinks).toFixed(1) : 0}
              </div>
            </div>
          </div>

          {/* Click Trends Chart */}
          <div className="bg-nordic-surface dark:bg-nordic-dark-surface border border-nordic-border dark:border-nordic-dark-border rounded-2xl p-6 shadow-sm">
            <h2 className="text-base font-bold text-nordic-charcoal dark:text-nordic-dark-text mb-1">
              Click Volume Over Time
            </h2>
            <p className="text-xs text-nordic-slate mb-6">Daily click events across all active short links</p>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={overview.clicksTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="clickGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#244A42" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#244A42" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="#94A3B8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderColor: '#E2E8F0',
                      borderRadius: '12px',
                      fontSize: '12px',
                      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="clicks"
                    stroke="#244A42"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#clickGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Device & Referrer Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Devices */}
            <div className="bg-nordic-surface dark:bg-nordic-dark-surface border border-nordic-border dark:border-nordic-dark-border rounded-2xl p-6 shadow-sm">
              <div className="flex items-center space-x-2 mb-4">
                <Laptop className="w-4 h-4 text-nordic-pine dark:text-nordic-sage" />
                <h2 className="text-base font-bold text-nordic-charcoal dark:text-nordic-dark-text">Device Breakdown</h2>
              </div>

              {overview.deviceBreakdown.length > 0 ? (
                <div className="flex flex-col items-center">
                  <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={overview.deviceBreakdown}
                          dataKey="count"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={70}
                          paddingAngle={4}
                        >
                          {overview.deviceBreakdown.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={NORDIC_PALETTE[index % NORDIC_PALETTE.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-wrap justify-center gap-4 text-xs pt-2">
                    {overview.deviceBreakdown.map((item, index) => (
                      <div key={item.name} className="flex items-center space-x-1.5">
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: NORDIC_PALETTE[index % NORDIC_PALETTE.length] }}
                        />
                        <span className="capitalize text-nordic-charcoal dark:text-nordic-dark-text font-medium">
                          {item.name}
                        </span>
                        <span className="text-nordic-slate">({item.count})</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-nordic-slate">No device category data available.</p>
              )}
            </div>

            {/* Referrers */}
            <div className="bg-nordic-surface dark:bg-nordic-dark-surface border border-nordic-border dark:border-nordic-dark-border rounded-2xl p-6 shadow-sm">
              <div className="flex items-center space-x-2 mb-4">
                <Compass className="w-4 h-4 text-nordic-pine dark:text-nordic-sage" />
                <h2 className="text-base font-bold text-nordic-charcoal dark:text-nordic-dark-text">Top Referrers</h2>
              </div>

              {overview.referrerBreakdown.length > 0 ? (
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={overview.referrerBreakdown}
                      layout="vertical"
                      margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
                    >
                      <XAxis type="number" fontSize={11} tickLine={false} allowDecimals={false} />
                      <YAxis dataKey="name" type="category" fontSize={11} tickLine={false} width={80} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#244A42" radius={[0, 8, 8, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-xs text-nordic-slate">No referrer data recorded.</p>
              )}
            </div>
          </div>

          {/* Privacy Note */}
          <div className="p-4 rounded-2xl bg-nordic-mist/30 dark:bg-nordic-dark-border/40 border border-nordic-border dark:border-nordic-dark-border flex items-start space-x-3 text-xs text-nordic-slate">
            <Info className="w-4 h-4 text-nordic-pine dark:text-nordic-sage flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-nordic-charcoal dark:text-nordic-dark-text">Privacy-conscious metrics: </span>
              ShortURL records aggregated click counts, coarse device types, and referrer hostnames without storing persistent IP addresses, invasive fingerprinting, or tracking cookie identifiers across the web.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
