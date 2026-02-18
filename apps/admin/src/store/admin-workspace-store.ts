import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { AdminActivity } from '@/types/admin';

interface AdminWorkspaceStore {
  applicationId: string;
  reportId: string;
  refundId: string;
  orderId: string;
  recentActivity: AdminActivity[];
  setApplicationId: (value: string) => void;
  setReportId: (value: string) => void;
  setRefundId: (value: string) => void;
  setOrderId: (value: string) => void;
  pushActivity: (activity: Omit<AdminActivity, 'id' | 'at'>) => void;
  clearActivity: () => void;
}

export const useAdminWorkspaceStore = create<AdminWorkspaceStore>()(
  persist(
    (set) => ({
      applicationId: '',
      reportId: '',
      refundId: '',
      orderId: '',
      recentActivity: [],

      setApplicationId: (applicationId) => set({ applicationId }),
      setReportId: (reportId) => set({ reportId }),
      setRefundId: (refundId) => set({ refundId }),
      setOrderId: (orderId) => set({ orderId }),

      pushActivity: (activity) =>
        set((state) => {
          const next: AdminActivity = {
            ...activity,
            id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
            at: new Date().toISOString(),
          };

          return {
            recentActivity: [next, ...state.recentActivity].slice(0, 12),
          };
        }),

      clearActivity: () => set({ recentActivity: [] }),
    }),
    {
      name: 'barterdash-admin-workspace',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        applicationId: state.applicationId,
        reportId: state.reportId,
        refundId: state.refundId,
        orderId: state.orderId,
        recentActivity: state.recentActivity,
      }),
    },
  ),
);
