import { SetMetadata } from '@nestjs/common';

export const REQUIRED_CONTEXT_KEY = 'requiredContext';

export const RequireContext = (context: { role?: string; serviceId?: string }) =>
  SetMetadata(REQUIRED_CONTEXT_KEY, context);
