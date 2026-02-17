import { AuthRepository } from '../repositories/auth.repository';
import { success, failure, ValidationError } from '../utils/result';
import { supabase } from '../utils/supabase';
import { AuthService } from './auth.service';

jest.mock('../repositories/auth.repository');
jest.mock('../utils/supabase', () => ({
  supabase: {
    auth: {
      admin: {
        getUserById: jest.fn(),
      },
      resetPasswordForEmail: jest.fn(),
      setSession: jest.fn(),
      updateUser: jest.fn(),
    },
  },
}));

describe('AuthService', () => {
  let service: AuthService;
  let repository: jest.Mocked<AuthRepository>;
  let mockGetUserById: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthService();
    repository = (AuthRepository as any).mock.instances[0];
    mockGetUserById = supabase.auth.admin.getUserById as jest.Mock;
  });

  describe('getVerificationStatus', () => {
    const unverifiedProfile = {
      id: 'user_1',
      emailVerified: false,
      updatedAt: new Date('2026-02-17T00:00:00.000Z'),
    } as any;

    it('should use JWT email confirmation first and avoid admin lookup', async () => {
      (repository.getProfile as jest.Mock).mockResolvedValue(
        success(unverifiedProfile),
      );
      (repository.updateProfile as jest.Mock).mockResolvedValue(
        success({ ...unverifiedProfile, emailVerified: true }),
      );

      const result = await service.getVerificationStatus('user_1', {
        emailConfirmedAt: '2026-02-17T10:00:00.000Z',
      });

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual({
        emailVerified: true,
        verifiedAt: '2026-02-17T10:00:00.000Z',
        isSynced: true,
      });
      expect(repository.updateProfile).toHaveBeenCalledWith('user_1', {
        emailVerified: true,
      });
      expect(mockGetUserById).not.toHaveBeenCalled();
    });

    it('should return verified but unsynced when profile does not exist', async () => {
      (repository.getProfile as jest.Mock).mockResolvedValue(success(null));

      const result = await service.getVerificationStatus('user_1', {
        emailConfirmedAt: '2026-02-17T10:00:00.000Z',
      });

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual({
        emailVerified: true,
        verifiedAt: '2026-02-17T10:00:00.000Z',
        isSynced: false,
      });
      expect(repository.updateProfile).not.toHaveBeenCalled();
      expect(mockGetUserById).not.toHaveBeenCalled();
    });

    it('should fallback to Supabase admin when token does not include confirmation', async () => {
      (repository.getProfile as jest.Mock).mockResolvedValue(
        success(unverifiedProfile),
      );
      (repository.updateProfile as jest.Mock).mockResolvedValue(
        success({ ...unverifiedProfile, emailVerified: true }),
      );
      mockGetUserById.mockResolvedValue({
        data: {
          user: {
            email_confirmed_at: '2026-02-17T11:00:00.000Z',
          },
        },
      });

      const result = await service.getVerificationStatus('user_1');

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual({
        emailVerified: true,
        verifiedAt: '2026-02-17T11:00:00.000Z',
        isSynced: true,
      });
      expect(mockGetUserById).toHaveBeenCalledWith('user_1');
      expect(repository.updateProfile).toHaveBeenCalledWith('user_1', {
        emailVerified: true,
      });
    });

    it('should mark status unsynced when DB sync fails', async () => {
      const errorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);
      (repository.getProfile as jest.Mock).mockResolvedValue(
        success(unverifiedProfile),
      );
      (repository.updateProfile as jest.Mock).mockResolvedValue(
        failure(new ValidationError('Failed to update')),
      );

      const result = await service.getVerificationStatus('user_1', {
        emailConfirmedAt: '2026-02-17T12:00:00.000Z',
      });

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual({
        emailVerified: true,
        verifiedAt: '2026-02-17T12:00:00.000Z',
        isSynced: false,
      });

      errorSpy.mockRestore();
    });
  });
});
