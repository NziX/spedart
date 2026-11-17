/* eslint-disable react-hooks/exhaustive-deps */
import axios from "@/lib/axios.config";
import { IAdmin } from "@/types";
import { notifications } from "@mantine/notifications";
import { useRouter } from "next/router";
import React, { createContext, useContext, useEffect, useState } from "react";

interface IAuthContext {
	admin: IAdmin | null;
	login: (email: string, password: string) => void;
	loggingIn: boolean;
	signingUp: boolean;
	logout: (hideNotification?: boolean) => void;
	initialLoading: boolean;
	signup: (
		admin: {
			email: string;
			password: string;
			username: string;
		},
		callback?: () => void
	) => void;
}

const AuthContext = createContext<IAuthContext | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [loggingIn, setLoggingIn] = useState(false);
	const [signingUp, setSigningUp] = useState(false);
	const router = useRouter();
	const [initialLoading, setInitialLoading] = useState(true);
	const [admin, setAdmin] = useState<IAdmin | null>(null);

	const verifyCurrentUser = async () => {
		try {
			const { data } = await axios.get(`/admin/me`);
			setAdmin(data.admin);
		} catch (error) {
			console.log(error);
			logout(true);
		} finally {
			setInitialLoading(false);
		}
	};

	useEffect(() => {
		const token = localStorage.getItem("sptAdToken");

		if (token) {
			// check if user is valid json
			if (token === "undefined") {
				router.push("/");
				return;
			}
			verifyCurrentUser();
		} else {
			if (router.pathname.includes("/dashboard")) {
				router.push("/");
			}
			setTimeout(() => {
				setInitialLoading(false);
			}, 200);
		}
	}, []);

	const login = async (email: string, password: string) => {
		setLoggingIn(true);
		try {
			const { data } = await axios.post("/admin/login", {
				email,
				password,
			});
			notifications.show({
				message: "Login successful",
				color: "teal",
			});
			localStorage.setItem("sptAdToken", data?.token);
			setAdmin(data.admin);
			router.push("/dashboard");
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
			setLoggingIn(false);
		}
	};

	const signup = async (
		admin: {
			email: string;
			password: string;
			username: string;
		},
		callback?: () => void
	) => {
		setSigningUp(true);
		try {
			const { data } = await axios.post("/admin/signup", admin);
			notifications.show({
				message: "Signup successful",
				color: "teal",
			});
			callback && callback();
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
			setSigningUp(false);
		}
	};

	const logout = (hideNotification?: boolean) => {
		localStorage.removeItem("sptAdToken");
		setAdmin(null);
		if (!hideNotification) {
			notifications.show({
				message: "Logged out successfully",
				color: "teal",
			});
		}
		router.push("/");
	};

	return (
		<AuthContext.Provider
			value={{
				admin,
				login,
				loggingIn,
				logout,
				signup,
				signingUp,
				initialLoading,
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
