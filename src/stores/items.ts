import { create } from "zustand";
import { persist } from "zustand/middleware";

import type * as schema from "@/shared/schema";
import * as api from "@/lib/api";



const STALE_TIME = 1000 * 60 * 5;

type MaybePromise<T> = T | Promise<T>;

interface ItemState {
	items: schema.Item[];
	isError: boolean;
	isLoading: boolean;
	updatedAt: number | null;
	getMap: () => ItemByNameMap;
	fetch: () => Promise<void>;
	clear: () => void;
}

function createItemStore(
	name: string,
	apiFn: () => MaybePromise<schema.GetItemsOutput>,
) {
	let lastItems: schema.Item[] = [];
	let cachedMap: ItemByNameMap = new Map();
	return create<ItemState>()(persist((set, get) => ({
		items: [],
		isError: false,
		isLoading: false,
		updatedAt: null,
		getMap: () => {
			const currentItems = get().items;
			if (lastItems === currentItems) return cachedMap;
			lastItems = currentItems;
			cachedMap = new Map(get().items.map(item => [item.name, item]));
			return cachedMap;
		},
		fetch: async () => {
			const { items, isLoading, updatedAt} = get();
			if (isLoading) return;

			const isStale = items.length === 0 || !updatedAt || (Date.now() - updatedAt > STALE_TIME);
			if (!isStale) return;

			set({ isError: false, isLoading: true });
			try {
				const { items } = await apiFn();
				set({
					items,
					updatedAt: Date.now(),
					isLoading: false,
				});
			} catch {
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

export type ItemByNameMap = ReadonlyMap<string, schema.Item>;

/**
 * 동네 목록을 localStorage에 유지하는 item store.
 */
export const useRegionsStore = createItemStore("item-regions", api.getRegions);

/**
 * 인프라 유형 목록을 localStorage에 유지하는 item store.
 */
export const useInfraTypesStore = createItemStore("item-infra-types", api.getInfraTypes);
