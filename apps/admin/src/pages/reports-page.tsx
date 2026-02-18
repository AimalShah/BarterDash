import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { fetchReport, listAdminReports, resolveReport } from '@/features/reports/api';
import { getApiErrorMessage } from '@/lib/api-client';
import { formatDateTime, toLabel } from '@/lib/format';
import { useAdminWorkspaceStore } from '@/store/admin-workspace-store';
import type { ReportRecord } from '@/types/admin';

const PAGE_SIZE = 10;
const REPORT_FILTERS = ['all', 'pending', 'reviewing', 'resolved', 'dismissed'] as const;

export function ReportsPage() {
  const reportId = useAdminWorkspaceStore((state) => state.reportId);
  const setReportId = useAdminWorkspaceStore((state) => state.setReportId);
  const pushActivity = useAdminWorkspaceStore((state) => state.pushActivity);

  const [report, setReport] = useState<ReportRecord | null>(null);
  const [status, setStatus] = useState<'resolved' | 'dismissed'>('resolved');
  const [reviewNotes, setReviewNotes] = useState('');
  const [actionTaken, setActionTaken] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<(typeof REPORT_FILTERS)[number]>('all');

  const listQuery = useQuery({
    queryKey: ['admin-reports', page, statusFilter],
    queryFn: () =>
      listAdminReports({
        page,
        limit: PAGE_SIZE,
        statuses: statusFilter === 'all' ? undefined : [statusFilter],
      }),
    placeholderData: (previous) => previous,
  });

  const loadMutation = useMutation({
    mutationFn: fetchReport,
    onSuccess: (data) => {
      setReport(data);
      setFeedback({ type: 'success', text: 'Report loaded' });
    },
    onError: (error) => {
      setReport(null);
      setFeedback({ type: 'error', text: getApiErrorMessage(error) });
    },
  });

  const resolveMutation = useMutation({
    mutationFn: resolveReport,
    onSuccess: (message) => {
      setFeedback({ type: 'success', text: message });
      listQuery.refetch();
      pushActivity({
        area: 'reports',
        action: `set ${status}`,
        targetId: reportId,
        outcome: 'success',
      });
    },
    onError: (error) => {
      setFeedback({ type: 'error', text: getApiErrorMessage(error) });
      pushActivity({
        area: 'reports',
        action: `set ${status}`,
        targetId: reportId,
        outcome: 'error',
      });
    },
  });

  const hasReportId = reportId.trim().length > 0;
  const isBusy = listQuery.isFetching || loadMutation.isPending || resolveMutation.isPending;

  return (
    <div className="space-y-4 animate-fade-in">
      <Card>
        <CardHeader>
          <CardTitle>Report Queue</CardTitle>
          <CardDescription>
            Paginated moderation list backed by `/reports` admin endpoint.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Label htmlFor="report-status-filter">Status</Label>
            <select
              id="report-status-filter"
              value={statusFilter}
              onChange={(event) => {
                setPage(1);
                setStatusFilter(event.target.value as (typeof REPORT_FILTERS)[number]);
              }}
              className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
            >
              {REPORT_FILTERS.map((item) => (
                <option key={item} value={item}>
                  {toLabel(item)}
                </option>
              ))}
            </select>
            <Button variant="outline" size="sm" onClick={() => listQuery.refetch()}>
              Refresh
            </Button>
          </div>

          {listQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading reports...</p>
          ) : listQuery.isError ? (
            <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
              {getApiErrorMessage(listQuery.error)}
            </p>
          ) : (
            <>
              <div className="overflow-auto rounded-xl border border-border/80">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-secondary/60 text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2">Report</th>
                      <th className="px-3 py-2">Type</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2">Created</th>
                      <th className="px-3 py-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {listQuery.data?.items.length ? (
                      listQuery.data.items.map((item) => (
                        <tr key={item.id} className="border-t border-border/70">
                          <td className="px-3 py-2 font-mono text-xs">{item.id}</td>
                          <td className="px-3 py-2">{toLabel(String(item.reportType || 'unknown'))}</td>
                          <td className="px-3 py-2">
                            <Badge variant="neutral">{toLabel(String(item.status || 'pending'))}</Badge>
                          </td>
                          <td className="px-3 py-2">{formatDateTime(item.createdAt)}</td>
                          <td className="px-3 py-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setReportId(item.id);
                                loadMutation.mutate(item.id);
                              }}
                            >
                              Open
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="px-3 py-3 text-muted-foreground" colSpan={5}>
                          No reports found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between text-sm">
                <p className="text-muted-foreground">
                  Page {listQuery.data?.pagination.page || 1} of{' '}
                  {listQuery.data?.pagination.totalPages || 1} ({listQuery.data?.pagination.total || 0}{' '}
                  total)
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={(listQuery.data?.pagination.page || 1) <= 1}
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!listQuery.data?.pagination.hasNextPage}
                    onClick={() => setPage((current) => current + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1.05fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Report Moderation</CardTitle>
            <CardDescription>
              Fetch an existing report by ID, then resolve or dismiss with notes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="report-id">Report ID</Label>
              <Input
                id="report-id"
                placeholder="UUID"
                value={reportId}
                onChange={(event) => setReportId(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="report-status">Moderation Decision</Label>
              <select
                id="report-status"
                value={status}
                onChange={(event) => setStatus(event.target.value as 'resolved' | 'dismissed')}
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
              >
                <option value="resolved">Resolved</option>
                <option value="dismissed">Dismissed</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="review-notes">Review Notes</Label>
              <Textarea
                id="review-notes"
                placeholder="Internal moderation notes"
                value={reviewNotes}
                onChange={(event) => setReviewNotes(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="action-taken">Action Taken</Label>
              <Input
                id="action-taken"
                placeholder="e.g. warning_sent"
                value={actionTaken}
                onChange={(event) => setActionTaken(event.target.value)}
              />
            </div>

            {feedback ? (
              <div
                className={`rounded-lg px-3 py-2 text-sm ${
                  feedback.type === 'success'
                    ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-700'
                    : 'border border-danger/30 bg-danger/10 text-danger'
                }`}
              >
                {feedback.text}
              </div>
            ) : null}

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                disabled={!hasReportId || isBusy}
                onClick={() => loadMutation.mutate(reportId)}
              >
                Load report
              </Button>
              <Button
                disabled={!hasReportId || isBusy}
                onClick={() =>
                  resolveMutation.mutate({
                    reportId,
                    status,
                    reviewNotes,
                    actionTaken,
                  })
                }
              >
                Submit moderation decision
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Report Details</CardTitle>
            <CardDescription>Loaded from `/reports/:id`.</CardDescription>
          </CardHeader>
          <CardContent>
            {!report ? (
              <p className="text-sm text-muted-foreground">No report loaded yet.</p>
            ) : (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="warning">{toLabel(String(report.status || 'pending'))}</Badge>
                  <Badge variant="neutral">{toLabel(String(report.reportType || 'unspecified'))}</Badge>
                </div>

                <div className="rounded-xl border border-border/80 bg-background/60 p-3 text-sm">
                  <p className="font-semibold">Description</p>
                  <p className="text-muted-foreground">{String(report.description || 'N/A')}</p>
                </div>

                <div className="rounded-xl border border-border/80 bg-background/60 p-3 text-sm">
                  <p>
                    <span className="font-semibold">Reported by:</span>{' '}
                    {String(report.reporterId || 'N/A')}
                  </p>
                  <p>
                    <span className="font-semibold">Resolved at:</span>{' '}
                    {formatDateTime(report.resolvedAt)}
                  </p>
                </div>

                <details className="rounded-xl border border-border/80 bg-background/60 p-3">
                  <summary className="cursor-pointer text-sm font-medium">Raw payload</summary>
                  <pre className="mt-2 overflow-auto text-xs text-muted-foreground">
                    {JSON.stringify(report, null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
