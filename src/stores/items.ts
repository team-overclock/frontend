import { create } from "zustand";
import { persist } from "zustand/middleware";

import { RETRY_DELAY_MS, sleep } from "@/shared/common";
import type * as schema from "@/shared/schema";
import * as api from "@/lib/api";



const STALE_TIME = 1000 * 60 * 5;

type MaybePromise<T> = T | Promise<T>;

interface ItemState<T> {
	items: T[];
	isError: boolean;
	isLoading: boolean;
	updatedAt: number | null;
	getMap: () => ItemByNameMap<T>;
	fetch: () => Promise<void>;
	clear: () => void;
}

function createItemStore<T extends schema.RegionItem | schema.InfraTypeItem>(
	name: string,
	apiFn: () => MaybePromise<{ items: T[] }>,
) {
	let lastItems: T[] = [];
	let cachedMap: ItemByNameMap<T> = new Map();
	return create<ItemState<T>>()(persist((set, get) => ({
		items: [],
		isError: false,
		isLoading: false,
		updatedAt: null,
		getMap: () => {
			const currentItems = get().items;
			if (lastItems === currentItems) return cachedMap;
			lastItems = currentItems;
			cachedMap = new Map(get().items.map(item => ["id" in item ? item.name : item.label, item]));
			return cachedMap;
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

export type ItemByNameMap<T> = ReadonlyMap<string, T>;

/**
 * 동네 목록을 localStorage에 유지하는 item store.
 */
export const useRegionsStore = createItemStore("item-regions", api.getRegions);

/**
 * 인프라 유형 목록을 localStorage에 유지하는 item store.
 */
export const useInfraTypesStore = createItemStore("item-infra-types", api.getInfraTypes);
