import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DateRange } from 'react-day-picker';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { getAdminAnalyticsOverview } from '@/features/analytics/api';
import { getApiErrorMessage } from '@/lib/api-client';
import { formatCurrency, toLabel } from '@/lib/format';
import type { AdminAnalyticsOverview } from '@/types/admin';

const LOOKBACK_OPTIONS = [7, 30, 90] as const;
const CHART_COLORS = ['#0f766e', '#f97316', '#dc2626', '#0284c7', '#6366f1'];
const compactNumberFormatter = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

function safeNumber(value: unknown): number {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function formatCompactNumber(value: number): string {
  return compactNumberFormatter.format(value);
}

function escapeCsvValue(value: string | number): string {
  const text = String(value ?? '');
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function getDateStamp() {
  return new Date().toISOString().slice(0, 10);
}

function downloadFile(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function createAnalyticsCsv(data: AdminAnalyticsOverview): string {
  const rows: Array<[string, string, string | number]> = [
    ['Snapshot', 'Total Users', data.snapshot.totalUsers],
    ['Snapshot', 'Total Sellers', data.snapshot.totalSellers],
    ['Snapshot', 'Total Admins', data.snapshot.totalAdmins],
    ['Snapshot', 'Active Users', data.snapshot.activeUsers],
    ['Snapshot', 'Suspended Users', data.snapshot.suspendedUsers],
    ['Snapshot', 'Banned Users', data.snapshot.bannedUsers],
    ['Snapshot', 'Pending Seller Applications', data.snapshot.pendingSellerApplications],
    ['Snapshot', 'Pending Reports', data.snapshot.pendingReports],
    ['Snapshot', 'Pending Refunds', data.snapshot.pendingRefunds],
    ['Snapshot', 'Disputed Escrows', data.snapshot.disputedEscrows],
    ['Snapshot', 'Live Streams', data.snapshot.liveStreams],
    ['Financials', 'Delivered Revenue', safeNumber(data.financials.deliveredOrderRevenue)],
    ['Financials', 'Held Escrow Amount', safeNumber(data.financials.heldEscrowAmount)],
    ['Financials', 'Disputed Escrow Amount', safeNumber(data.financials.disputedEscrowAmount)],
    ['Financials', 'Refunded Escrow Amount', safeNumber(data.financials.refundedEscrowAmount)],
    ['Trends', 'Lookback Days', data.trends.lookbackDays],
    ['Trends', 'Signups', data.trends.signups],
    ['Trends', 'Orders', data.trends.orders],
    ['Trends', 'Order Revenue', safeNumber(data.trends.orderRevenue)],
    ['Trends', 'Refund Requests', data.trends.refundRequests],
    ['Trends', 'Disputes Created', data.trends.disputesCreated],
  ];

  data.breakdowns.userStatus.forEach((item) =>
    rows.push(['Breakdown: User Status', toLabel(item.status), item.total]),
  );
  data.breakdowns.reportStatus.forEach((item) =>
    rows.push(['Breakdown: Report Status', toLabel(item.status), item.total]),
  );
  data.breakdowns.refundStatus.forEach((item) =>
    rows.push(['Breakdown: Refund Status', toLabel(item.status), item.total]),
  );
  data.breakdowns.disputeStatus.forEach((item) =>
    rows.push(['Breakdown: Dispute Status', toLabel(item.status), item.total]),
  );

  const csvRows = [
    ['Section', 'Metric', 'Value'],
    ...rows.map(([section, metric, value]) => [section, metric, String(value)]),
  ];
  return csvRows.map((row) => row.map(escapeCsvValue).join(',')).join('\n');
}

function exportAnalyticsCsv(data: AdminAnalyticsOverview, lookbackDays: number) {
  const csv = createAnalyticsCsv(data);
  downloadFile(
    `admin-analytics-${lookbackDays}d-${getDateStamp()}.csv`,
    new Blob([csv], { type: 'text/csv;charset=utf-8' }),
  );
}

async function exportAnalyticsPdf(data: AdminAnalyticsOverview, lookbackDays: number) {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ]);

  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const createdAt = new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date());
  const docWithTable = doc as unknown as { lastAutoTable?: { finalY: number } };

  doc.setFontSize(18);
  doc.text('BarterDash Admin Analytics', 40, 48);
  doc.setFontSize(11);
  doc.text(`Window: ${lookbackDays} days`, 40, 68);
  doc.text(`Generated: ${createdAt}`, 40, 84);

  autoTable(doc, {
    startY: 104,
    head: [['Snapshot KPI', 'Value']],
    body: [
      ['Total Users', String(data.snapshot.totalUsers)],
      ['Total Sellers', String(data.snapshot.totalSellers)],
      ['Total Admins', String(data.snapshot.totalAdmins)],
      ['Pending Seller Applications', String(data.snapshot.pendingSellerApplications)],
      ['Pending Reports', String(data.snapshot.pendingReports)],
      ['Pending Refunds', String(data.snapshot.pendingRefunds)],
      ['Disputed Escrows', String(data.snapshot.disputedEscrows)],
      ['Live Streams', String(data.snapshot.liveStreams)],
    ],
    styles: { fontSize: 9 },
    headStyles: { fillColor: [15, 118, 110] },
  });

  autoTable(doc, {
    startY: (docWithTable.lastAutoTable?.finalY || 104) + 16,
    head: [['Financial KPI', 'Value']],
    body: [
      ['Delivered Revenue', formatCurrency(data.financials.deliveredOrderRevenue)],
      ['Held Escrow', formatCurrency(data.financials.heldEscrowAmount)],
      ['Disputed Amount', formatCurrency(data.financials.disputedEscrowAmount)],
      ['Refunded Escrow', formatCurrency(data.financials.refundedEscrowAmount)],
      ['Lookback Revenue', formatCurrency(data.trends.orderRevenue)],
    ],
    styles: { fontSize: 9 },
    headStyles: { fillColor: [249, 115, 22] },
  });

  autoTable(doc, {
    startY: (docWithTable.lastAutoTable?.finalY || 104) + 16,
    head: [['Breakdown', 'Status', 'Total']],
    body: [
      ...data.breakdowns.userStatus.map((item) => [
        'User Status',
        toLabel(item.status),
        String(item.total),
      ]),
      ...data.breakdowns.reportStatus.map((item) => [
        'Report Status',
        toLabel(item.status),
        String(item.total),
      ]),
      ...data.breakdowns.refundStatus.map((item) => [
        'Refund Status',
        toLabel(item.status),
        String(item.total),
      ]),
      ...data.breakdowns.disputeStatus.map((item) => [
        'Dispute Status',
        toLabel(item.status),
        String(item.total),
      ]),
    ],
    styles: { fontSize: 8 },
    headStyles: { fillColor: [2, 132, 199] },
  });

  doc.save(`admin-analytics-${lookbackDays}d-${getDateStamp()}.pdf`);
}

function StatCard(props: {
  title: string;
  value: string;
  hint?: string;
  badge?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{props.title}</CardDescription>
        <CardTitle>{props.value}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {props.badge ? <Badge variant="neutral">{props.badge}</Badge> : null}
        {props.hint ? <p className="text-xs text-muted-foreground">{props.hint}</p> : null}
      </CardContent>
    </Card>
  );
}

export function AnalyticsPage() {
  const [lookbackDays, setLookbackDays] = useState<(typeof LOOKBACK_OPTIONS)[number]>(30);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [useCustomRange, setUseCustomRange] = useState(false);
  const [isExportingCsv, setIsExportingCsv] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const query = useQuery({
    queryKey: ['admin-analytics-overview', lookbackDays, dateRange, useCustomRange],
    queryFn: () => {
      if (useCustomRange && dateRange?.from && dateRange?.to) {
        return getAdminAnalyticsOverview({
          startDate: dateRange.from.toISOString(),
          endDate: dateRange.to.toISOString(),
        });
      }
      return getAdminAnalyticsOverview({ lookbackDays });
    },
  });

  const moderationBacklogData = useMemo(() => {
    if (!query.data) {
      return [];
    }

    return [
      { name: 'Seller Apps', total: query.data.snapshot.pendingSellerApplications },
      { name: 'Reports', total: query.data.snapshot.pendingReports },
      { name: 'Refunds', total: query.data.snapshot.pendingRefunds },
      { name: 'Disputes', total: query.data.snapshot.disputedEscrows },
    ];
  }, [query.data]);

  const trendCountsData = useMemo(() => {
    if (!query.data) {
      return [];
    }

    return [
      { name: 'Signups', total: query.data.trends.signups },
      { name: 'Orders', total: query.data.trends.orders },
      { name: 'Refund Req', total: query.data.trends.refundRequests },
      { name: 'Disputes', total: query.data.trends.disputesCreated },
    ];
  }, [query.data]);

  const financialCompositionData = useMemo(() => {
    if (!query.data) {
      return [];
    }

    return [
      {
        name: 'Delivered Revenue',
        value: safeNumber(query.data.financials.deliveredOrderRevenue),
      },
      {
        name: 'Held Escrow',
        value: safeNumber(query.data.financials.heldEscrowAmount),
      },
      {
        name: 'Disputed Amount',
        value: safeNumber(query.data.financials.disputedEscrowAmount),
      },
      {
        name: 'Refunded Escrow',
        value: safeNumber(query.data.financials.refundedEscrowAmount),
      },
    ];
  }, [query.data]);

  const totalFinancialValue = useMemo(
    () => financialCompositionData.reduce((sum, item) => sum + item.value, 0),
    [financialCompositionData],
  );

  const handleCsvExport = () => {
    if (!query.data || isExportingCsv) {
      return;
    }

    setIsExportingCsv(true);
    try {
      exportAnalyticsCsv(query.data, lookbackDays);
    } finally {
      setIsExportingCsv(false);
    }
  };

  const handlePdfExport = async () => {
    if (!query.data || isExportingPdf) {
      return;
    }

    setIsExportingPdf(true);
    try {
      await exportAnalyticsPdf(query.data, lookbackDays);
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <Card>
        <CardHeader>
          <CardTitle>Platform Analytics</CardTitle>
          <CardDescription>
            Core admin metrics, financial health, and moderation pressure.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Lookback:</span>
              {LOOKBACK_OPTIONS.map((option) => (
                <Button
                  key={option}
                  size="sm"
                  variant={!useCustomRange && lookbackDays === option ? 'default' : 'outline'}
                  onClick={() => {
                    setUseCustomRange(false);
                    setLookbackDays(option);
                  }}
                >
                  {option}d
                </Button>
              ))}
              <Button
                size="sm"
                variant={useCustomRange ? 'default' : 'outline'}
                onClick={() => setUseCustomRange(true)}
              >
                Custom
              </Button>
            </div>
            
            {useCustomRange && (
              <DateRangePicker
                date={dateRange}
                onDateChange={setDateRange}
                align="start"
              />
            )}
            
            <Button variant="ghost" size="sm" onClick={() => query.refetch()}>
              Refresh
            </Button>
            <div className="ml-auto flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!query.data || query.isLoading || isExportingCsv}
                onClick={handleCsvExport}
              >
                {isExportingCsv ? 'Exporting CSV...' : 'Export CSV'}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={!query.data || query.isLoading || isExportingPdf}
                onClick={handlePdfExport}
              >
                {isExportingPdf ? 'Exporting PDF...' : 'Export PDF'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {query.isLoading ? (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            Loading analytics...
          </CardContent>
        </Card>
      ) : query.isError ? (
        <Card>
          <CardContent className="pt-6">
            <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
              {getApiErrorMessage(query.error)}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Total Users"
              value={String(query.data?.snapshot.totalUsers || 0)}
              hint="All registered accounts"
              badge={`Admins ${query.data?.snapshot.totalAdmins || 0}`}
            />
            <StatCard
              title="Total Sellers"
              value={String(query.data?.snapshot.totalSellers || 0)}
              hint="Profiles with seller access"
              badge={`Live streams ${query.data?.snapshot.liveStreams || 0}`}
            />
            <StatCard
              title="Pending Moderation"
              value={String(
                (query.data?.snapshot.pendingReports || 0) +
                  (query.data?.snapshot.pendingRefunds || 0) +
                  (query.data?.snapshot.pendingSellerApplications || 0),
              )}
              hint="Apps + reports + refunds"
            />
            <StatCard
              title="Disputed Escrows"
              value={String(query.data?.snapshot.disputedEscrows || 0)}
              hint="Claims requiring action"
            />
          </section>

          <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Delivered Revenue"
              value={formatCurrency(query.data?.financials.deliveredOrderRevenue || 0)}
            />
            <StatCard
              title="Held Escrow"
              value={formatCurrency(query.data?.financials.heldEscrowAmount || 0)}
            />
            <StatCard
              title="Disputed Amount"
              value={formatCurrency(query.data?.financials.disputedEscrowAmount || 0)}
            />
            <StatCard
              title="Refunded Escrow"
              value={formatCurrency(query.data?.financials.refundedEscrowAmount || 0)}
            />
          </section>

          <section className="grid gap-4 xl:grid-cols-3">
            <Card className="xl:col-span-2">
              <CardHeader>
                <CardTitle>Moderation Backlog</CardTitle>
                <CardDescription>Current queue pressure by workflow area</CardDescription>
              </CardHeader>
              <CardContent className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={moderationBacklogData} margin={{ left: 8, right: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#d3ddd8" />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} />
                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                    <Tooltip formatter={(value) => [String(value), 'Items']} />
                    <Bar dataKey="total" radius={[6, 6, 0, 0]} fill="#0f766e" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Financial Composition</CardTitle>
                <CardDescription>Distribution across escrow and revenue buckets</CardDescription>
              </CardHeader>
              <CardContent className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={financialCompositionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={54}
                      outerRadius={84}
                      paddingAngle={2}
                      dataKey="value"
                      nameKey="name"
                      label={({ percent = 0 }) => `${(percent * 100).toFixed(0)}%`}
                    >
                      {financialCompositionData.map((entry, index) => (
                        <Cell
                          key={entry.name}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
                <p className="mt-2 text-xs text-muted-foreground">
                  Total tracked value: {formatCurrency(totalFinancialValue)}
                </p>
              </CardContent>
            </Card>
          </section>

          <section>
            <Card>
              <CardHeader>
                <CardTitle>Trend KPI Chart ({query.data?.trends.lookbackDays}d)</CardTitle>
                <CardDescription>
                  Signup, order, refund-request, and dispute volume in selected window
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trendCountsData} margin={{ left: 8, right: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#d3ddd8" />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} />
                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                    <Tooltip formatter={(value) => [String(value), 'Count']} />
                    <Bar dataKey="total" radius={[6, 6, 0, 0]} fill="#f97316" />
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-3 rounded-lg border border-border/70 bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
                  Lookback revenue: {formatCurrency(query.data?.trends.orderRevenue || 0)}
                </div>
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-4 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Trend Window ({query.data?.trends.lookbackDays}d)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>
                  Signups: <strong>{query.data?.trends.signups || 0}</strong>
                </p>
                <p>
                  Orders: <strong>{query.data?.trends.orders || 0}</strong>
                </p>
                <p>
                  Order Revenue:{' '}
                  <strong>{formatCurrency(query.data?.trends.orderRevenue || 0)}</strong>
                </p>
                <p>
                  Refund Requests: <strong>{query.data?.trends.refundRequests || 0}</strong>
                </p>
                <p>
                  Disputes Created: <strong>{query.data?.trends.disputesCreated || 0}</strong>
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>User Status Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {query.data?.breakdowns.userStatus.map((item) => (
                  <div key={item.status} className="flex items-center justify-between">
                    <span>{toLabel(item.status)}</span>
                    <Badge variant="neutral">{item.total}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-4 xl:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Report Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {query.data?.breakdowns.reportStatus.map((item) => (
                  <div key={item.status} className="flex items-center justify-between">
                    <span>{toLabel(item.status)}</span>
                    <Badge variant="neutral">{item.total}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Refund Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {query.data?.breakdowns.refundStatus.map((item) => (
                  <div key={item.status} className="flex items-center justify-between">
                    <span>{toLabel(item.status)}</span>
                    <Badge variant="neutral">{item.total}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Escrow Dispute Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {query.data?.breakdowns.disputeStatus.map((item) => (
                  <div key={item.status} className="flex items-center justify-between">
                    <span>{toLabel(item.status)}</span>
                    <Badge variant="neutral">{item.total}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>At-a-Glance KPI Ratios</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span>Seller share</span>
                  <Badge variant="neutral">
                    {query.data?.snapshot.totalUsers
                      ? `${Math.round(
                          (query.data.snapshot.totalSellers / query.data.snapshot.totalUsers) * 100,
                        )}%`
                      : '0%'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Admin share</span>
                  <Badge variant="neutral">
                    {query.data?.snapshot.totalUsers
                      ? `${Math.round(
                          (query.data.snapshot.totalAdmins / query.data.snapshot.totalUsers) * 100,
                        )}%`
                      : '0%'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Moderation queue</span>
                  <Badge variant="neutral">
                    {formatCompactNumber(
                      (query.data?.snapshot.pendingSellerApplications || 0) +
                        (query.data?.snapshot.pendingReports || 0) +
                        (query.data?.snapshot.pendingRefunds || 0) +
                        (query.data?.snapshot.disputedEscrows || 0),
                    )}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Escrow held/disputed ratio</span>
                  <Badge variant="neutral">
                    {query.data?.financials.disputedEscrowAmount
                      ? `${(
                          safeNumber(query.data.financials.heldEscrowAmount) /
                          safeNumber(query.data.financials.disputedEscrowAmount)
                        ).toFixed(2)}x`
                      : 'N/A'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </section>
        </>
      )}
    </div>
  );
}
