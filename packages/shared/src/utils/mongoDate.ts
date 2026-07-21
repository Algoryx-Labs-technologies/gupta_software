import { z } from 'zod';

/** Earliest date MongoDB $dateToString supports (year 1). */
export const MONGO_MIN_DATE = new Date(Date.UTC(1, 0, 1));

/** Latest date MongoDB $dateToString supports (year 9999). */
export const MONGO_MAX_DATE = new Date(Date.UTC(9999, 11, 31, 23, 59, 59, 999));

export function isMongoSafeDate(value: Date): boolean {
  const time = value.getTime();
  return (
    !Number.isNaN(time) &&
    time >= MONGO_MIN_DATE.getTime() &&
    time <= MONGO_MAX_DATE.getTime()
  );
}

export const mongoSafeDateSchema = z.coerce
  .date()
  .refine(isMongoSafeDate, { message: 'Date must be between year 1 and 9999' });

export type MongoBillDateMatch = {
  $type: 'date';
  $gte: Date;
  $lte: Date;
};

/**
 * Builds a billDate filter safe for MongoDB date operators (including $dateToString).
 * Merges optional caller bounds with the supported year range.
 */
export function buildMongoSafeBillDateMatch(
  existing?: { $gte?: Date; $lte?: Date },
): MongoBillDateMatch {
  let gte = MONGO_MIN_DATE;
  let lte = MONGO_MAX_DATE;

  if (existing?.$gte) {
    gte = existing.$gte > MONGO_MIN_DATE ? existing.$gte : MONGO_MIN_DATE;
  }
  if (existing?.$lte) {
    lte = existing.$lte < MONGO_MAX_DATE ? existing.$lte : MONGO_MAX_DATE;
  }

  return { $type: 'date', $gte: gte, $lte: lte };
}
