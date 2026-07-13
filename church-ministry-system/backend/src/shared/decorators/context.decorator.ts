import { SetMetadata } from '@nestjs/common';

export const REQUIRED_CONTEXT_KEY = 'requiredContext';

export const RequireContext = (ctx: { role?: string; scope?: string }) =>
  SetMetadata(REQUIRED_CONTEXT_KEY, ctx);

export const REQUIRED_SCOPE_KEY = 'requiredScope';

export const Scope = (...scopes: string[]) =>
  SetMetadata(REQUIRED_SCOPE_KEY, scopes);
