/* eslint-disable react-hooks/exhaustive-deps */
import { IArtist, ICustomer } from "@/types";
import React, { useState, useEffect, createContext, useContext } from "react";
import axios from "@/lib/axios.config";
import { useRouter } from "next/router";
import { notifications } from "@mantine/notifications";
import { useRecoilState } from "recoil";
import {
	activeOnboardingStepState,
	activeResetPasswordStepState,
	onboardingDataState,
	verificationState,
} from "@/atoms";
import { UIDHASH } from "@/lib/constants";

interface IAuthContext {
	artist: IArtist | null;
	customer: ICustomer | null;
	login: (email: string, password: string) => void;
	loggingIn: boolean;
	signingUp: boolean;
	sendResetCode: (email: string) => void;
	setNewPassword: (password: string) => void;
	settingNewPassword: boolean;
	sendingResetCode: boolean;
	verifyCode: (code: string) => void;
	verifyingCode: boolean;
	completeProfile: ({ journey, profilePicture }: { journey: string; profilePicture: string }) => void;
	completingProfile: boolean;
	logout: (hideNotification?: boolean) => void;
	signup: (
		artist: Partial<IArtist> & {
			password: string;
		}
	) => void;
	initialLoading: boolean;
	changePassword: (oldPassword: string, newPassword: string) => void;
	changingPassword: boolean;
	updateProfile: (artist: Partial<IArtist>) => void;
	updatingProfile: boolean;
	refetchCustomer: () => void;
}

const AuthContext = createContext<IAuthContext | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [artist, setArtist] = useState<IArtist | null>(null);
	const [loggingIn, setLoggingIn] = useState(false);
	const [signingUp, setSigningUp] = useState(false);
	const router = useRouter();
	const [_, setActiveOnboardingStep] = useRecoilState(
		activeOnboardingStepState
	);
	const [completingProfile, setCompletingProfile] = useState(false);
	const [onboardingData, setOnboardingData] =
		useRecoilState(onboardingDataState);
	const [verificationData, setVerificationData] =
		useRecoilState(verificationState);
	const [sendingResetCode, setSendingResetCode] = useState(false);
	const [__, setActiveResetPasswordStep] = useRecoilState(
		activeResetPasswordStepState
	);
	const [verifyingCode, setVerifyingCode] = useState(false);
	const [settingNewPassword, setSettingNewPassword] = useState(false);
	const [initialLoading, setInitialLoading] = useState(true);
	const [changingPassword, setChangingPassword] = useState(false);
	const [updatingProfile, setUpdatingProfile] = useState(false);
	const [customer, setCustomer] = useState<ICustomer | null>(null);

	const verifyCurrentUser = async () => {
		try {
			const { data } = await axios.get(`/artists/me`);
			setArtist(data.artist);
		} catch (error: any) {
			console.log(error);
			if (error?.response?.status === 403) {
				notifications.show({
					message:
						error?.response?.data?.message ??
						"Your account is awaiting admin approval.",
					color: "red",
				});
			}
			logout(true);
		} finally {
			setInitialLoading(false);
		}
	};

	const verifyCurrentCustomer = async () => {
		try {
			const storedCustomer = localStorage.getItem("customer");
			if (storedCustomer) {
				const customer = JSON.parse(storedCustomer) as ICustomer;
				const { data } = await axios.get(
					`/customers/${customer?.phoneNumber}`
				);
				setCustomer(data?.customer);
				return;
			}
		} catch (error) {
			console.log(error);
		}
	};

	useEffect(() => {
		const token = localStorage.getItem("sptToken");
		verifyCurrentCustomer();
		if (token) {
			if (token === "undefined") {
				router.push("/login");
				return;
			}
			verifyCurrentUser();
		} else {
			if (router.pathname.includes("/dashboard")) {
				router.push("/login");
			}
			setTimeout(() => {
				setInitialLoading(false);
			}, 200);
		}
	}, []);

	const login = async (email: string, password: string) => {
		setLoggingIn(true);
		try {
			const { data } = await axios.post("/artists/login", {
				email,
				password,
			});
			notifications.show({
				message: "Login successful",
				color: "teal",
			});
			setArtist(data.artist);
			localStorage.setItem(UIDHASH, JSON.stringify(data.artist));
			localStorage.setItem("sptToken", data?.token);
			router.push("/dashboard");
		} catch (error: any) {
			console.log(error);
			if (error?.response?.data?.requiresVerification) {
				const { email: userEmail, phoneNumber, isEmailVerified, message } = error.response.data;
				const vData = {
					email: userEmail || email,
					phoneNumber: phoneNumber || "",
					isEmailVerified: !!isEmailVerified,
					isPhoneVerified: true,
				};
				setVerificationData(vData);
				localStorage.setItem("pendingVerification", JSON.stringify(vData));
				setActiveOnboardingStep("verification");
				notifications.show({
					title: "Email Verification Required",
					message: message || "Please verify your email address to complete account setup.",
					color: "yellow",
				});
				router.push("/onboarding");
				return;
			}
			if (
				error?.response?.status === 400 ||
				error?.response?.status === 403
			) {
				notifications.show({
					message:
						error?.response?.data?.message ?? "An error occurred",
					color: "red",
				});
			} else {
				notifications.show({
					message: "An error occurred",
					color: "red",
				});
			}
		} finally {
			setLoggingIn(false);
		}
	};

	const signup = async (artist: Partial<IArtist> & { password: string }) => {
		setSigningUp(true);
		try {
			const { data } = await axios.post("/artists/signup", {
				...artist,
			});
			notifications.show({
				title: "Registration Received",
				message:
					data?.message || "Please verify your email address.",
				color: "teal",
			});
			setArtist(data.artist);
			const vData = {
				email: data.artist?.email || artist.email || "",
				phoneNumber: data.artist?.phoneNumber || artist.phoneNumber || "",
				isEmailVerified: !!data.artist?.isEmailVerified,
				isPhoneVerified: true,
			};
			setVerificationData(vData);
			localStorage.setItem("pendingVerification", JSON.stringify(vData));
			if (data?.token) {
				localStorage.setItem("sptToken", data.token);
			}
			setTimeout(() => {
				setActiveOnboardingStep("verification");
			}, 300);
		} catch (error: any) {
			console.log(error);
			notifications.show({
				message:
					error?.response?.data?.message ?? "An error occurred",
				color: "red",
			});
		} finally {
			setSigningUp(false);
		}
	};

	const completeProfile = async ({
		journey,
		profilePicture,
	}: {
		journey: string;
		profilePicture: string;
	}) => {
		setCompletingProfile(true);
		const activeEmail =
			artist?.email ||
			verificationData.email ||
			(typeof window !== "undefined"
				? JSON.parse(localStorage.getItem("pendingVerification") || "{}")?.email || ""
				: "");

		try {
			const { data } = await axios.post(`/artists/complete-profile`, {
				email: activeEmail,
				bio: journey,
				profilePicture,
			});
			notifications.show({
				title: "All Requirements Submitted!",
				message: "Your application is complete and has been submitted for administrator review.",
				color: "teal",
			});
			if (data?.artist) {
				setArtist(data.artist);
				localStorage.setItem(UIDHASH, JSON.stringify(data.artist));
			}
			setOnboardingData({});
			setActiveOnboardingStep("awaiting_approval");
		} catch (error: any) {
			console.log(error);
			notifications.show({
				message:
					error?.response?.data?.message ?? "An error occurred while submitting your profile",
				color: "red",
			});
		} finally {
			setCompletingProfile(false);
		}
	};

	const sendResetCode = async (email: string) => {
		setSendingResetCode(true);
		try {
			const { data } = await axios.post(
				"/artists/send-verification-code",
				{ email }
			);
			notifications.show({
				message: "Reset code sent successfully",
				color: "teal",
			});
			setArtist(data.artist);

			setActiveResetPasswordStep("code");
		} catch (error: any) {
			console.log(error);
			if (error?.response?.status === 404) {
				notifications.show({
					message:
						error?.response?.data?.message ?? "An error occurred",
					color: "red",
				});
			} else {
				notifications.show({
					message: "An error occurred",
					color: "red",
				});
			}
		} finally {
			setSendingResetCode(false);
		}
	};

	const logout = (hideNotification?: boolean) => {
		localStorage.removeItem(UIDHASH);
		localStorage.removeItem("sptToken");
		setArtist(null);
		if (!hideNotification) {
			notifications.show({
				message: "Logged out successfully",
				color: "teal",
			});
		}
		router.push("/login");
	};

	const refetchCustomer = async () => {
		verifyCurrentCustomer();
	};

	const verifyCode = async (code: string) => {
		setVerifyingCode(true);
		try {
			const { data } = await axios.post(
				`/artists/verify-code`,
				{ code }
			);
			notifications.show({
				message: "Code verified successfully",
				color: "teal",
			});
			setArtist(data.artist);
			setActiveResetPasswordStep("password");
		} catch (error: any) {
			console.log(error);
			if (error?.response?.status === 400) {
				notifications.show({
					message:
						error?.response?.data?.message ?? "An error occurred",
					color: "red",
				});
			} else {
				notifications.show({
					message: "An error occurred",
					color: "red",
				});
			}
		} finally {
			setVerifyingCode(false);
		}
	};

	const setNewPassword = async (password: string) => {
		setSettingNewPassword(true);
		try {
			const { data } = await axios.post(
				`/artists/reset-password`,
				{ password }
			);
			notifications.show({
				message: "Password reset successfully",
				color: "teal",
			});
			setArtist(data.artist);
			router.push("/login");
		} catch (error: any) {
			console.log(error);
			if (error?.response?.status === 400) {
				notifications.show({
					message:
						error?.response?.data?.message ?? "An error occurred",
					color: "red",
				});
			} else {
				notifications.show({
					message: "An error occurred",
					color: "red",
				});
			}
		} finally {
			setSettingNewPassword(false);
		}
	};

	const changePassword = async (oldPassword: string, newPassword: string) => {
		setChangingPassword(true);
		try {
			await axios.put(`/artists/change-password`, {
				oldPassword,
				newPassword,
			});
			notifications.show({
				message: "Password changed successfully",
				color: "teal",
			});
		} catch (error: any) {
			console.log(error);
			if (error?.response?.status === 400) {
				notifications.show({
					message:
						error?.response?.data?.message ?? "An error occurred",
					color: "red",
				});
			} else {
				notifications.show({
					message: "An error occurred",
					color: "red",
				});
			}
		} finally {
			setChangingPassword(false);
		}
	};

	const updateProfile = async (artist: Partial<IArtist>) => {
		setUpdatingProfile(true);
		try {
			const { data } = await axios.put(`/artists`, {
				...artist,
			});
			notifications.show({
				message: "Profile updated successfully",
				color: "teal",
			});
			setArtist(data.artist);
			localStorage.setItem(UIDHASH, JSON.stringify(data.artist));
		} catch (error: any) {
			console.log(error);
			if (error?.response?.status === 400) {
				notifications.show({
					message:
						error?.response?.data?.message ?? "An error occurred",
					color: "red",
				});
			} else {
				notifications.show({
					message: "An error occurred",
					color: "red",
				});
			}
		} finally {
			setUpdatingProfile(false);
		}
	};

	return (
		<AuthContext.Provider
			value={{
				artist,
				login,
				loggingIn,
				logout,
				signup,
				refetchCustomer,
				signingUp,
				completeProfile,
				completingProfile,
				sendingResetCode,
				sendResetCode,
				verifyCode,
				verifyingCode,
				setNewPassword,
				settingNewPassword,
				initialLoading,
				changePassword,
				changingPassword,
				updateProfile,
				updatingProfile,
				customer,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
}

export default function useAuth() {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
}
