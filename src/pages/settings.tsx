import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { CheckCheckIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { ROUTES } from "@/shared/routes";
import { useLogoutMutation, useUpdatePasswordMutation, useUpdateProfileInfoMutation } from "@/hooks/auth";
import { useServerAuthLayoutContext } from "@/hooks/use-layout-context";
// import { useRegionsStore } from "@/stores/items";
import { getRequestErrorMessage } from "@/lib/request-error";

import { AccountForm, type AccountFormProps, type AccountFormFieldOptions } from "@/components/account-form";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";



/**
 * 설정 섹션에 전달되는 props 타입
 */
interface SectionProps {
	title: string;
	formId: string;
	submitLabel: string;
	fields: AccountFormFieldOptions;
	onSubmit: AccountFormProps["onSubmit"];
	errorMessage?: string;
	isSubmitting?: boolean;
	isSuccess?: boolean;
	className?: string;
}

/**
 * 설정 섹션 컴포넌트
 */
function Section({
	title,
	formId,
	submitLabel,
	fields,
	onSubmit,
	errorMessage,
	isSubmitting = false,
	isSuccess = false,
	className,
}: SectionProps) {
	return (
		<section className={cn("space-y-4", className)}>
			<h2 className="font-semibold text-lg">{title}</h2>
			<AccountForm
				id={formId}
				gap={16}
				onSubmit={onSubmit}
				errorMessage={errorMessage}
				fields={fields}
			/>
			<div className="flex items-center gap-2">
				<Button
					type="submit"
					form={formId}
					variant="default"
					size="lg"
					className="font-bold shadow-md"
					disabled={isSubmitting}
					children={submitLabel}
				/>
				<CheckCheckIcon
					size={16}
					className={cn("text-green-600 transition-opacity", isSuccess ? "opacity-100" : "opacity-0")}
				/>
			</div>
		</section>
	);
}



/**
 * 설정 페이지 컴포넌트
 */
export function SettingsPage() {
	const navigate = useNavigate();
	const logoutMutation = useLogoutMutation();
	const updateProfileInfoMutation = useUpdateProfileInfoMutation();
	const updatePasswordMutation = useUpdatePasswordMutation();
	const { user } = useServerAuthLayoutContext();
	// const regionsStore = useRegionsStore();

	// const regionNames = regionsStore.getMap("name");

	const {
		name: storedName,
		email: storedEmail,

		/// @ts-expect-error: ts(2339)
		regionName: storedRegionName = "",
	} = user;

	const [isInfoSuccess, setIsInfoSuccess] = useState(false);
	const [isPasswordSuccess, setIsPasswordSuccess] = useState(false);
	const [currentPasswordMessage, setCurrentPasswordMessage] = useState("");
	const [passwordConfirmMessage, setPasswordConfirmMessage] = useState("");
	const [infoRequestErrorMessage, setInfoRequestErrorMessage] = useState("");
	const [passwordRequestErrorMessage, setPasswordRequestErrorMessage] = useState("");

	const isInfoSubmitting = updateProfileInfoMutation.isPending;
	const isPasswordSubmitting = updatePasswordMutation.isPending;

	// 성공 표시가 화면에 보이는 시간 (밀리초)
	const SUCCESS_DISPLAY_MS = 1500;
	const infoSuccessTimer = useRef<number | null>(null);
	const passwordSuccessTimer = useRef<number | null>(null);

	// useEffect(() => {
	// 	regionsStore.fetch();
	// }, [regionsStore]);

	useEffect(() => {
		if (isInfoSuccess) {
			if (infoSuccessTimer.current) {
				clearTimeout(infoSuccessTimer.current);
			}
			infoSuccessTimer.current = window.setTimeout(() => {
				setIsInfoSuccess(false);
				infoSuccessTimer.current = null;
			}, SUCCESS_DISPLAY_MS);
		}
		return () => {
			if (infoSuccessTimer.current) {
				clearTimeout(infoSuccessTimer.current);
				infoSuccessTimer.current = null;
			}
		};
	}, [isInfoSuccess]);

	useEffect(() => {
		if (isPasswordSuccess) {
			if (passwordSuccessTimer.current) {
				clearTimeout(passwordSuccessTimer.current);
			}
			passwordSuccessTimer.current = window.setTimeout(() => {
				setIsPasswordSuccess(false);
				passwordSuccessTimer.current = null;
			}, SUCCESS_DISPLAY_MS);
		}
		return () => {
			if (passwordSuccessTimer.current) {
				clearTimeout(passwordSuccessTimer.current);
				passwordSuccessTimer.current = null;
			}
		};
	}, [isPasswordSuccess]);

	const infoFields = useMemo<AccountFormFieldOptions>(() => ({
		name: {
			defaultValue: storedName,
			required: false,
		},
		email: {
			defaultValue: storedEmail,
			formNoValidate: true,
			required: false,
			disabled: true,
		},
		region: {
			defaultValue: storedRegionName ?? "",
			enabled: false,
			required: false,
		},
	}), [storedName, storedEmail, storedRegionName]);

	const passwordFields = useMemo<AccountFormFieldOptions>(() => ({
		currentPassword: {
			defaultValue: "",
			label: "현재 비밀번호",
			formNoValidate: true,
			errorMessage: currentPasswordMessage,
			onChange: () => {
				if (!currentPasswordMessage) return;
				setCurrentPasswordMessage("");
			},
		},
		newPassword: {
			defaultValue: "",
		},
		newPasswordConfirm: {
			defaultValue: "",
			formNoValidate: true,
			errorMessage: passwordConfirmMessage,
			onChange: () => {
				if (!passwordConfirmMessage) return;
				setPasswordConfirmMessage("");
			},
			onClear: () => {
				if (!passwordConfirmMessage) return;
				setPasswordConfirmMessage("");
			},
		},
	}), [currentPasswordMessage, passwordConfirmMessage]);

	const logout = useCallback(async () => {
		logoutMutation.mutate();
		navigate(ROUTES.HOME, { replace: true });
	}, [logoutMutation, navigate]);

 	const handleInfoSubmit = useCallback<AccountFormProps["onSubmit"]>(async (_, formValues) => {
		setInfoRequestErrorMessage("");
		setIsInfoSuccess(false);

		const name = formValues.name.trim() || storedName;
		const region = formValues.region.name.trim() || storedRegionName || "";

		if (
			name === storedName
			&& region === (storedRegionName ?? "")
		) {
			setIsInfoSuccess(true);
			return;
		}

		try {
			await updateProfileInfoMutation.mutateAsync({
				name,
			});
			setIsInfoSuccess(true);
		} catch (error) {
			setInfoRequestErrorMessage(getRequestErrorMessage(error));
		}
	}, [storedName, storedRegionName, updateProfileInfoMutation]);

	const handlePasswordSubmit = useCallback<AccountFormProps["onSubmit"]>(async (_, formValues) => {
		setPasswordRequestErrorMessage("");
		setIsPasswordSuccess(false);

		const currentPassword = formValues.currentPassword.trim();
		const newPassword = formValues.newPassword.trim();
		const newPasswordConfirm = formValues.newPasswordConfirm.trim();

		if (!newPassword && !newPasswordConfirm) {
			return;
		} else if (!currentPassword) {
			setCurrentPasswordMessage("현재 비밀번호를 입력해주세요");
			return;
		} else if (newPassword !== newPasswordConfirm) {
			setPasswordConfirmMessage("비밀번호가 일치하지 않아요");
			return;
		}

		try {
			await updatePasswordMutation.mutateAsync({
				currentPassword,
				newPassword,
			});
			setIsPasswordSuccess(true);
		} catch (error) {
			setPasswordRequestErrorMessage(getRequestErrorMessage(error));
		}
	}, [updatePasswordMutation]);

	return (
		<>
			<Header
				heading="프로필 설정"
				children={<Button
					variant="outline"
					children="로그아웃"
					className="p-4 shadow-md font-bold"
					onClick={logout}
				/>}
			/>

			<main className="flex-1 flex flex-col gap-6 py-6 app-container">
				<Section
					title="사용자 프로필"
					formId="info-form"
					submitLabel="프로필 저장"
					fields={infoFields}
					onSubmit={handleInfoSubmit}
					errorMessage={infoRequestErrorMessage}
					isSubmitting={isInfoSubmitting}
					isSuccess={isInfoSuccess}
				/>
				<Section
					title="비밀번호 변경"
					formId="password-form"
					submitLabel="비밀번호 변경"
					fields={passwordFields}
					onSubmit={handlePasswordSubmit}
					errorMessage={passwordRequestErrorMessage}
					isSubmitting={isPasswordSubmitting}
					isSuccess={isPasswordSuccess}
					className="py-7"
				/>
			</main>
		</>
	);
}
