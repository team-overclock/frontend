import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";



export type OnboardingPriceKey = "purchase" | "jeonse";
export type OnboardingPriceUnit = string; // e.g. "억 원", "만 원"
export type OnboardingPriceRange = [number, number];
export interface OnboardingPriceSelection {
	enabled: boolean;
	range: OnboardingPriceRange;
	unit: OnboardingPriceUnit;
}
export type OnboardingPriceState = Record<OnboardingPriceKey, OnboardingPriceSelection>;

interface OnboardingPayload {
	preferredArea?: string;
	infraTitles?: string[];
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
	preferredArea: undefined,
	infraTitles: undefined,
	priceState: undefined,
	set: ({
		preferredArea,
		infraTitles,
		priceState,
	}) => set({
		preferredArea,
		infraTitles,
		priceState,
	}),
	reset: () => set({
		preferredArea: undefined,
		infraTitles: undefined,
		priceState: undefined,
	}),
}), {
	name: "onboarding-storage",
	storage: createJSONStorage(() => sessionStorage),
}));
