import { hookstate, useHookstate } from '@hookstate/core';

const loadingState = hookstate(false)

export const useLoading = () => {
  return useHookstate(loadingState)
}
