import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { InfraTitle, PriceKey, PriceUnit } from "@/shared/enum";



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
interface OnboardingPayload {
	preferredArea?: string;
	infraTitles?: InfraTitle[];
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
