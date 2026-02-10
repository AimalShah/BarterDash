import { db, profiles } from '../db';
import { eq } from 'drizzle-orm';
import {
  AppResult,
  success,
  failure,
  ValidationError,
  ForbiddenError,
} from '../utils/result';

export class AgeVerificationService {
  private readonly MIN_AGE = 13;
  private readonly GUARDIAN_MIN_AGE = 13;
  private readonly GUARDIAN_MAX_AGE = 17;

  private calculateAge(dateOfBirth: Date): number {
    const today = new Date();
    let age = today.getFullYear() - dateOfBirth.getFullYear();
    const monthDiff = today.getMonth() - dateOfBirth.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())
    ) {
      age--;
    }
    return age;
  }

  async verifyAge(
    userId: string,
    dateOfBirth: Date,
    guardianConsent?: {
      consentDocumentUrl: string;
      guardianName: string;
      guardianRelationship: string;
    },
  ): Promise<
    AppResult<{ eligible: boolean; requiresGuardian: boolean; age: number }>
  > {
    try {
      const age = this.calculateAge(dateOfBirth);

      if (age < this.MIN_AGE) {
        return failure(
          new ForbiddenError(
            `You must be at least ${this.MIN_AGE} years old to sell.`,
          ),
        );
      }

      const requiresGuardian =
        age >= this.GUARDIAN_MIN_AGE && age <= this.GUARDIAN_MAX_AGE;

      if (requiresGuardian && !guardianConsent) {
        return failure(
          new ValidationError(
            'Guardian consent required for sellers under 18.',
          ),
        );
      }

      await db
        .update(profiles)
        .set({
          dateOfBirth,
          ageVerified: true,
          guardianConsent: requiresGuardian ? true : false,
          guardianConsentDocument: requiresGuardian
            ? guardianConsent?.consentDocumentUrl
            : null,
          updatedAt: new Date(),
        })
        .where(eq(profiles.id, userId));

      return success({ eligible: true, requiresGuardian, age });
    } catch (error) {
      return failure(new ValidationError('Failed to verify age'));
    }
  }

  async isAgeVerified(userId: string): Promise<AppResult<boolean>> {
    try {
      const user = await db.query.profiles.findFirst({
        where: eq(profiles.id, userId),
        columns: { ageVerified: true, dateOfBirth: true },
      });

      if (!user) return failure(new ValidationError('User not found'));

      if (user.dateOfBirth && !user.ageVerified) {
        const age = this.calculateAge(user.dateOfBirth);
        if (age >= this.MIN_AGE) {
          await db
            .update(profiles)
            .set({ ageVerified: true })
            .where(eq(profiles.id, userId));
          return success(true);
        }
      }

      return success(user.ageVerified ?? false);
    } catch (error) {
      return failure(new ValidationError('Failed to check age verification'));
    }
  }

  async validateSellerEligibility(
    userId: string,
  ): Promise<AppResult<{ eligible: boolean; message: string }>> {
    const ageCheck = await this.isAgeVerified(userId);
    if (ageCheck.isErr()) return failure(ageCheck.error);

    if (!ageCheck.value) {
      return success({
        eligible: false,
        message: 'Age verification required before applying to sell.',
      });
    }

    return success({
      eligible: true,
      message: 'Age verified. Proceed with seller application.',
    });
  }
}

export const ageVerificationService = new AgeVerificationService();
