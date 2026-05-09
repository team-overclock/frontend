import { useCallback, useMemo, useState } from "react";
import { CheckCheckIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { useUpdatePasswordMutation, useUpdateProfileInfoMutation } from "@/hooks/auth";
import { useAuthStore } from "@/stores/auth";
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
	const updateProfileInfoMutation = useUpdateProfileInfoMutation();
	const updatePasswordMutation = useUpdatePasswordMutation();
	const {
		name: storedName = "",
		email: storedEmail = "",
		preferredArea: storedPreferredArea = "",
		set: setProfile,
	} = useAuthStore();

	const [isInfoSuccess, setIsInfoSuccess] = useState(false);
	const [isPasswordSuccess, setIsPasswordSuccess] = useState(false);
	const [currentPasswordMessage, setCurrentPasswordMessage] = useState("");
	const [passwordConfirmMessage, setPasswordConfirmMessage] = useState("");
	const [infoRequestErrorMessage, setInfoRequestErrorMessage] = useState("");
	const [passwordRequestErrorMessage, setPasswordRequestErrorMessage] = useState("");

	const isInfoSubmitting = updateProfileInfoMutation.isPending;
	const isPasswordSubmitting = updatePasswordMutation.isPending;

	const infoFields = useMemo<AccountFormFieldOptions>(() => ({
		name: {
			defaultValue: storedName,
			required: false,
		},
		email: {
			defaultValue: storedEmail,
			formNoValidate: true,
			disabled: true,
		},
		preferredArea: {
			defaultValue: storedPreferredArea,
			required: false,
		},
	}), [storedName, storedEmail, storedPreferredArea]);

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
			required: false,
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

 	const handleInfoSubmit = useCallback<AccountFormProps["onSubmit"]>(async (_, formValues) => {
		setInfoRequestErrorMessage("");
		setIsInfoSuccess(false);

		const name = formValues.name.trim() || storedName;
		const preferredArea = formValues.preferredArea.trim() || storedPreferredArea;

		if (
			name === storedName
			&& preferredArea === storedPreferredArea
		) {
			setIsInfoSuccess(true);
			return;
		}

		try {
			const updatedProfile = await updateProfileInfoMutation.mutateAsync({
				name,
				preferredArea,
			});

			setProfile({
				name: updatedProfile.name,
				email: updatedProfile.email,
				preferredArea: updatedProfile.preferredArea,
			});
			setIsInfoSuccess(true);
		} catch (error) {
			setInfoRequestErrorMessage(getRequestErrorMessage(error));
		}
	}, [storedName, storedPreferredArea, setProfile, updateProfileInfoMutation]);

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
			const response = await updatePasswordMutation.mutateAsync({
				currentPassword,
				newPassword,
			});
			if (!response.isSuccess) {
				setPasswordRequestErrorMessage("비밀번호 변경에 실패했어요.");
				return;
			}
			setIsPasswordSuccess(true);
		} catch (error) {
			setPasswordRequestErrorMessage(getRequestErrorMessage(error));
		}
	}, [updatePasswordMutation]);

	return (
		<>
			<Header
				heading="프로필 설정"
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
