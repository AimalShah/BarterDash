import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { bulkUpdateAdminUsers, listAdminUsers, updateAdminUser } from '@/features/users/api';
import { getApiErrorMessage } from '@/lib/api-client';
import { formatDateTime, toLabel } from '@/lib/format';
import { useAdminWorkspaceStore } from '@/store/admin-workspace-store';
import type { AdminUserRecord } from '@/types/admin';

const PAGE_SIZE = 12;

export function UsersPage() {
  const pushActivity = useAdminWorkspaceStore((state) => state.pushActivity);

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'USER' | 'SELLER' | 'ADMIN'>('ALL');
  const [accountStatusFilter, setAccountStatusFilter] = useState<
    'ALL' | 'active' | 'suspended' | 'banned' | 'under_review'
  >('ALL');

  const [selectedUser, setSelectedUser] = useState<AdminUserRecord | null>(null);
  const [draft, setDraft] = useState<{
    isAdmin: boolean;
    isSeller: boolean;
    accountStatus: 'active' | 'suspended' | 'banned' | 'under_review';
  } | null>(null);

  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [bulkActionOpen, setBulkActionOpen] = useState(false);
  const [bulkDraft, setBulkDraft] = useState<{
    accountStatus: 'active' | 'suspended' | 'banned' | 'under_review';
    isAdmin?: boolean;
    isSeller?: boolean;
  }>({ accountStatus: 'active' });

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const listQuery = useQuery({
    queryKey: ['admin-users', page, searchQuery, roleFilter, accountStatusFilter],
    queryFn: () =>
      listAdminUsers({
        page,
        limit: PAGE_SIZE,
        query: searchQuery || undefined,
        role: roleFilter === 'ALL' ? undefined : roleFilter,
        accountStatus:
          accountStatusFilter === 'ALL' ? undefined : accountStatusFilter,
      }),
    placeholderData: (previous) => previous,
  });

  const updateMutation = useMutation({
    mutationFn: updateAdminUser,
    onSuccess: (data) => {
      setFeedback({ type: 'success', text: `Updated ${data.username}` });
      setSelectedUser(data);
      setDraft({
        isAdmin: data.isAdmin,
        isSeller: data.isSeller,
        accountStatus: data.accountStatus,
      });
      listQuery.refetch();
      pushActivity({
        area: 'users',
        action: 'update_user',
        targetId: data.id,
        outcome: 'success',
      });
    },
    onError: (error) => {
      setFeedback({ type: 'error', text: getApiErrorMessage(error) });
      pushActivity({
        area: 'users',
        action: 'update_user',
        targetId: selectedUser?.id || 'unknown',
        outcome: 'error',
      });
    },
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: bulkUpdateAdminUsers,
    onSuccess: (data) => {
      setFeedback({ type: 'success', text: `Updated ${data.updatedCount} users (${data.failedCount} failed)` });
      setSelectedUserIds(new Set());
      setBulkActionOpen(false);
      listQuery.refetch();
      pushActivity({
        area: 'users',
        action: 'bulk_update_users',
        targetId: 'multiple',
        outcome: 'success',
      });
    },
    onError: (error) => {
      setFeedback({ type: 'error', text: getApiErrorMessage(error) });
      pushActivity({
        area: 'users',
        action: 'bulk_update_users',
        targetId: 'multiple',
        outcome: 'error',
      });
    },
  });

  useEffect(() => {
    if (!selectedUser) {
      setDraft(null);
      return;
    }

    setDraft({
      isAdmin: selectedUser.isAdmin,
      isSeller: selectedUser.isSeller,
      accountStatus: selectedUser.accountStatus,
    });
  }, [selectedUser]);

  return (
    <div className="space-y-4 animate-fade-in">
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>
            Search, filter, and manage user role/status from admin dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-4">
            <Input
              placeholder="Search username or full name"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />

            <select
              value={roleFilter}
              onChange={(event) => {
                setPage(1);
                setRoleFilter(
                  event.target.value as 'ALL' | 'USER' | 'SELLER' | 'ADMIN',
                );
              }}
              className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
            >
              <option value="ALL">All Roles</option>
              <option value="USER">User</option>
              <option value="SELLER">Seller</option>
              <option value="ADMIN">Admin</option>
            </select>

            <select
              value={accountStatusFilter}
              onChange={(event) => {
                setPage(1);
                setAccountStatusFilter(
                  event.target.value as
                    | 'ALL'
                    | 'active'
                    | 'suspended'
                    | 'banned'
                    | 'under_review',
                );
              }}
              className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
            >
              <option value="ALL">All Account Statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="banned">Banned</option>
              <option value="under_review">Under Review</option>
            </select>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setPage(1);
                  setSearchQuery(searchInput.trim());
                }}
              >
                Search
              </Button>
              <Button variant="ghost" className="flex-1" onClick={() => listQuery.refetch()}>
                Refresh
              </Button>
            </div>
          </div>

          {listQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading users...</p>
          ) : listQuery.isError ? (
            <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
              {getApiErrorMessage(listQuery.error)}
            </p>
          ) : (
            <>
              {selectedUserIds.size > 0 && (
                <div className="flex items-center gap-3 rounded-lg border border-border/80 bg-secondary/30 p-3">
                  <span className="text-sm font-medium">{selectedUserIds.size} selected</span>
                  <div className="flex-1" />
                  <Button size="sm" variant="outline" onClick={() => setBulkActionOpen(true)}>
                    Bulk Actions
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setSelectedUserIds(new Set())}>
                    Clear
                  </Button>
                </div>
              )}

              <div className="overflow-auto rounded-xl border border-border/80">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-secondary/60 text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2">
                        <input
                          type="checkbox"
                          checked={
                            (listQuery.data?.items.length ?? 0) > 0 &&
                            listQuery.data!.items.every((item) => selectedUserIds.has(item.id))
                          }
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedUserIds(new Set(listQuery.data?.items.map((i) => i.id) || []));
                            } else {
                              setSelectedUserIds(new Set());
                            }
                          }}
                        />
                      </th>
                      <th className="px-3 py-2">User</th>
                      <th className="px-3 py-2">Role Flags</th>
                      <th className="px-3 py-2">Account Status</th>
                      <th className="px-3 py-2">Onboarded</th>
                      <th className="px-3 py-2">Updated</th>
                      <th className="px-3 py-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {listQuery.data?.items.length ? (
                      listQuery.data.items.map((item) => (
                        <tr key={item.id} className="border-t border-border/70">
                          <td className="px-3 py-2">
                            <input
                              type="checkbox"
                              checked={selectedUserIds.has(item.id)}
                              onChange={(e) => {
                                const newSet = new Set(selectedUserIds);
                                if (e.target.checked) {
                                  newSet.add(item.id);
                                } else {
                                  newSet.delete(item.id);
                                }
                                setSelectedUserIds(newSet);
                              }}
                            />
                          </td>
                          <td className="px-3 py-2">
                            <p className="font-medium">{item.username}</p>
                            <p className="text-xs text-muted-foreground">{item.fullName || 'N/A'}</p>
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex flex-wrap gap-2">
                              <Badge variant={item.isAdmin ? 'danger' : 'neutral'}>
                                Admin: {item.isAdmin ? 'Yes' : 'No'}
                              </Badge>
                              <Badge variant={item.isSeller ? 'default' : 'neutral'}>
                                Seller: {item.isSeller ? 'Yes' : 'No'}
                              </Badge>
                            </div>
                          </td>
                          <td className="px-3 py-2">
                            <Badge variant="warning">{toLabel(item.accountStatus)}</Badge>
                          </td>
                          <td className="px-3 py-2">{item.onboarded ? 'Yes' : 'No'}</td>
                          <td className="px-3 py-2">{formatDateTime(item.updatedAt)}</td>
                          <td className="px-3 py-2">
                            <Button size="sm" variant="ghost" onClick={() => setSelectedUser(item)}>
                              Manage
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="px-3 py-3 text-muted-foreground" colSpan={7}>
                          No users found.
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

          {bulkActionOpen && (
            <div className="rounded-lg border border-border/80 bg-secondary/30 p-4">
              <h4 className="mb-3 text-sm font-medium">Bulk Update {selectedUserIds.size} Users</h4>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Account Status</Label>
                  <select
                    value={bulkDraft.accountStatus}
                    onChange={(e) =>
                      setBulkDraft((current) => ({
                        ...current,
                        accountStatus: e.target.value as
                          | 'active'
                          | 'suspended'
                          | 'banned'
                          | 'under_review',
                      }))
                    }
                    className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                  >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                    <option value="banned">Banned</option>
                    <option value="under_review">Under Review</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Admin Access</Label>
                  <select
                    value={bulkDraft.isAdmin === undefined ? '' : String(bulkDraft.isAdmin)}
                    onChange={(e) =>
                      setBulkDraft((current) => ({
                        ...current,
                        isAdmin:
                          e.target.value === '' ? undefined : e.target.value === 'true',
                      }))
                    }
                    className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                  >
                    <option value="">No Change</option>
                    <option value="true">Grant</option>
                    <option value="false">Revoke</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Seller Access</Label>
                  <select
                    value={bulkDraft.isSeller === undefined ? '' : String(bulkDraft.isSeller)}
                    onChange={(e) =>
                      setBulkDraft((current) => ({
                        ...current,
                        isSeller:
                          e.target.value === '' ? undefined : e.target.value === 'true',
                      }))
                    }
                    className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                  >
                    <option value="">No Change</option>
                    <option value="true">Grant</option>
                    <option value="false">Revoke</option>
                  </select>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Button
                  disabled={bulkUpdateMutation.isPending}
                  onClick={() =>
                    bulkUpdateMutation.mutate({
                      userIds: Array.from(selectedUserIds),
                      accountStatus: bulkDraft.accountStatus,
                      isAdmin: bulkDraft.isAdmin,
                      isSeller: bulkDraft.isSeller,
                    })
                  }
                >
                  Apply to {selectedUserIds.size} Users
                </Button>
                <Button variant="ghost" onClick={() => setBulkActionOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>User Editor</CardTitle>
          <CardDescription>
            Update role flags and account status for selected user.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!selectedUser || !draft ? (
            <p className="text-sm text-muted-foreground">
              Select a user from the table above to manage access and status.
            </p>
          ) : (
            <>
              <div className="rounded-xl border border-border/80 bg-background/60 p-3 text-sm">
                <p>
                  <span className="font-semibold">Username:</span> {selectedUser.username}
                </p>
                <p>
                  <span className="font-semibold">User ID:</span>{' '}
                  <span className="font-mono text-xs">{selectedUser.id}</span>
                </p>
                <p>
                  <span className="font-semibold">Email Verified:</span>{' '}
                  {selectedUser.emailVerified ? 'Yes' : 'No'}
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={draft.isAdmin}
                    onChange={(event) =>
                      setDraft((current) =>
                        current
                          ? {
                              ...current,
                              isAdmin: event.target.checked,
                            }
                          : current,
                      )
                    }
                  />
                  Admin Access
                </label>

                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={draft.isSeller}
                    onChange={(event) =>
                      setDraft((current) =>
                        current
                          ? {
                              ...current,
                              isSeller: event.target.checked,
                            }
                          : current,
                      )
                    }
                  />
                  Seller Access
                </label>

                <div className="space-y-2">
                  <Label htmlFor="user-account-status">Account Status</Label>
                  <select
                    id="user-account-status"
                    value={draft.accountStatus}
                    onChange={(event) =>
                      setDraft((current) =>
                        current
                          ? {
                              ...current,
                              accountStatus: event.target.value as
                                | 'active'
                                | 'suspended'
                                | 'banned'
                                | 'under_review',
                            }
                          : current,
                      )
                    }
                    className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                  >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                    <option value="banned">Banned</option>
                    <option value="under_review">Under Review</option>
                  </select>
                </div>
              </div>

              {feedback ? (
                <p
                  className={`rounded-lg px-3 py-2 text-sm ${
                    feedback.type === 'success'
                      ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-700'
                      : 'border border-danger/30 bg-danger/10 text-danger'
                  }`}
                >
                  {feedback.text}
                </p>
              ) : null}

              <Button
                disabled={updateMutation.isPending}
                onClick={() =>
                  updateMutation.mutate({
                    userId: selectedUser.id,
                    isAdmin: draft.isAdmin,
                    isSeller: draft.isSeller,
                    accountStatus: draft.accountStatus,
                  })
                }
              >
                Save User Changes
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
