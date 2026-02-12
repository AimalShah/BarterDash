import { Response } from 'express';
import { AppResult } from './result';

/**
 * Helper function to handle Result objects in Express routes
 *
 * @param result The Result object from a service method
 * @param res The Express Response object
 * @param onSuccess Callback function to transform the successful data into a response
 * @param successStatus HTTP status code for success (default: 200)
 */
export const handleResult = <T, R>(
  result: AppResult<T>,
  res: Response,
  onSuccess: (data: T) => R,
  successStatus: number = 200,
) => {
  if (result.isErr()) {
    const error = result.error;
    return res.status(error.statusCode).json({
      success: false,
      error: error.message,
      code: error.code,
      details: error.details,
    });
  }

  const responseData = onSuccess(result.value);
  return res.status(successStatus).json(responseData);
};
