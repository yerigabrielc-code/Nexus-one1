import { AsyncLocalStorage } from 'node:async_hooks';

export interface TenantStore {
  tenantId: string;
  userId: string;
  permissions: string[];
}

export const tenantStorage = new AsyncLocalStorage<TenantStore>();

export const currentStore = (): TenantStore | undefined => tenantStorage.getStore();
export const currentTenantId = (): string | undefined => tenantStorage.getStore()?.tenantId;
export const currentUserId = (): string | undefined => tenantStorage.getStore()?.userId;
