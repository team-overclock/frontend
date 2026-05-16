import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import type { PriceKey, PriceUnit } from "@/shared/enum";
import type * as schema from "@/shared/schema";



export type OnboardingPriceKey = PriceKey;
export type OnboardingPriceRange = [min: number, max: number];
export interface OnboardingPriceSelection {
	/**
	 * 가격 범위가 활성화되어 있는지 여부
	 */
	enabled: boolean;

	/**
	 * 가격 범위
	 */
	range: OnboardingPriceRange;

	/**
	 * 가격 단위
	 */
	unit: PriceUnit;
}

/**
 * 가격 유형별 범위 상태
 */
export type OnboardingPriceState = Record<PriceKey, OnboardingPriceSelection>;

/**
 * 사용자 선호 데이터
 */
export interface OnboardingPayload {
	region?: schema.Item;
	infraTypes?: schema.Item[];
	priceState?: OnboardingPriceState;
}

export interface OnboardingState extends OnboardingPayload {
	set: (payload: OnboardingPayload) => void;
	reset: () => void;
}

/**
 * 온보딩 페이지 상태 저장용 세션 스토리지
 */
export const useOnboardingStore = create<OnboardingState>()(persist(set => ({
	region: undefined,
	infraTypes: undefined,
	priceState: undefined,
	set: ({
		region,
		infraTypes,
		priceState,
	}) => set({
		region,
		infraTypes,
		priceState,
	}),
	reset: () => set({
		region: undefined,
		infraTypes: undefined,
		priceState: undefined,
	}),
}), {
	name: "onboarding-storage",
	storage: createJSONStorage(() => sessionStorage),
}));
