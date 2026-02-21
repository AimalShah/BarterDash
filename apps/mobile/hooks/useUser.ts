import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/api/queryKeys';
import { usersService } from '@/lib/api/services/users';
import { supabase } from '@/lib/supabase';
import type { UpdateProfilePayload, User } from '@/types';

interface UploadAvatarInput {
  fileUri: string;
  userId?: string;
  fileExt?: string;
  contentType?: string;
}

interface UploadAvatarResult {
  avatarUrl: string;
  profile: User;
}

const currentUserQueryKey = [...queryKeys.user, 'current'] as const;

function resolveFileExtension(fileUri: string, fallback: string = 'jpg') {
  const [pathWithoutQuery] = fileUri.split('?');
  const ext = pathWithoutQuery.split('.').pop()?.toLowerCase();
  return ext && ext.length <= 5 ? ext : fallback;
}

function resolveContentType(fileExt: string, contentType?: string) {
  if (contentType) return contentType;
  if (fileExt === 'jpg') return 'image/jpeg';
  return `image/${fileExt}`;
}

export function useCurrentUser() {
  return useQuery({
    queryKey: currentUserQueryKey,
    queryFn: async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      if (!data.session) return null;
      return usersService.getMe();
    },
    staleTime: 1000 * 60 * 5,
    retry: false,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) => usersService.updateProfile(payload),
    onSuccess: (profile) => {
      queryClient.setQueryData(currentUserQueryKey, profile);
      queryClient.invalidateQueries({ queryKey: queryKeys.user });
    },
  });
}

export function useUploadAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      fileUri,
      userId,
      fileExt,
      contentType,
    }: UploadAvatarInput): Promise<UploadAvatarResult> => {
      const authUserId =
        userId ??
        (await supabase.auth.getUser()).data.user?.id;

      if (!authUserId) {
        throw new Error('Authenticated user is required for avatar upload');
      }

      const fileExtension = fileExt ?? resolveFileExtension(fileUri);
      const filePath = `${authUserId}/${Date.now()}.${fileExtension}`;
      const fileResponse = await fetch(fileUri);

      if (!fileResponse.ok) {
        throw new Error('Failed to read avatar file from device');
      }

      const fileBuffer = await fileResponse.arrayBuffer();
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, fileBuffer, {
          contentType: resolveContentType(fileExtension, contentType),
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from('avatars').getPublicUrl(filePath);

      const profile = await usersService.updateProfile({ avatar_url: publicUrl });
      return { avatarUrl: publicUrl, profile };
    },
    onSuccess: ({ profile }) => {
      queryClient.setQueryData(currentUserQueryKey, profile);
      queryClient.invalidateQueries({ queryKey: queryKeys.user });
    },
  });
}

export function useUser() {
  const currentUserQuery = useCurrentUser();
  const updateProfileMutation = useUpdateProfile();
  const uploadAvatarMutation = useUploadAvatar();

  return {
    user: currentUserQuery.data ?? null,
    currentUserQuery,
    updateProfileMutation,
    uploadAvatarMutation,
    isLoading: currentUserQuery.isLoading,
  };
}

// Backwards-compatible aliases while migrating older imports.
export function useUserQuery() {
  return useCurrentUser();
}

export function useUpdateProfileMutation() {
  return useUpdateProfile();
}

export function useUploadAvatarMutation() {
  return useUploadAvatar();
}
