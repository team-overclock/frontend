import { create } from "zustand";
import { persist } from "zustand/middleware";

import { RETRY_DELAY_MS, sleep } from "@/shared/common";
import * as api from "@/lib/api";



const STALE_TIME = 1000 * 60 * 5;

type MaybePromise<T> = T | Promise<T>;

interface ItemState<T> {
	items: T[];
	isError: boolean;
	isLoading: boolean;
	updatedAt: number | null;
	getMap: <K extends keyof T>(key: K) => ReadonlyMap<T[K], T>;
	fetch: () => Promise<void>;
	clear: () => void;
}

function createItemStore<T>(
	name: string,
	apiFn: () => MaybePromise<{ items: T[] }>,
) {
	const lastItems: Partial<Record<keyof T, T[]>> = {};
	const cachedMap: Partial<Record<keyof T, ReadonlyMap<T[keyof T], T>>> = {};
	return create<ItemState<T>>()(persist((set, get) => ({
		items: [],
		isError: false,
		isLoading: false,
		updatedAt: null,

		// @ts-expect-error: ts(2322)
		getMap: (key) => {
			const currentItems = get().items;
			if (lastItems[key] === currentItems) return cachedMap[key];
			lastItems[key] = currentItems;
			cachedMap[key] = new Map(get().items.map(item => [item[key], item]));
			return cachedMap[key];
		},
		fetch: async () => {
			const { items, isLoading, updatedAt } = get();
			if (isLoading) return;
			const now = Date.now();

			const isStale = items.length === 0 || !updatedAt || (now - updatedAt > STALE_TIME);
			if (!isStale) return;

			set({ isError: false, isLoading: true });
			try {
				const { items } = await apiFn();
				set({
					items,
					updatedAt: now,
					isLoading: false,
				});
			} catch {
				await sleep(RETRY_DELAY_MS);
				set({ isError: true, isLoading: false });
			}
		},
		clear: () => set({
			items: [],
			isError: false,
			isLoading: false,
			updatedAt: null,
		}),
	}), {
		name: name,
		partialize: ({
			items,
			updatedAt,
		}) => ({
			items,
			updatedAt,
		}),
	}));
}

/**
 * 동네 목록을 localStorage에 유지하는 item store.
 */
export const useRegionsStore = createItemStore("item-regions", api.getRegions);

/**
 * 인프라 유형 목록을 localStorage에 유지하는 item store.
 */
export const useInfraTypesStore = createItemStore("item-infra-types", api.getInfraTypes);

/**
 * 학군 유형 목록을 localStorage에 유지하는 item store.
 */
export const useSchoolDistrictTypesStore = createItemStore("item-school-district-types", api.getSchoolDistrictTypes);

/**
 * 고등학교 목록을 localStorage에 유지하는 item store.
 */
export const useHighSchoolsStore = createItemStore("item-high-schools", api.getHighSchools);
