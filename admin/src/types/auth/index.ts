import { z } from "zod";

export const loginSchema = z.object({
	email: z
		.string({
			message: "Email is require",
		})
		.email({
			message: "has to be valid email",
		}),
	password: z.string({
		message: "Password is required",
	}),
});

export const signUpSchema = loginSchema.extend({
	username: z.string({
		message: "Username is required",
	}),
});

export type TSignUpFields = z.infer<typeof signUpSchema>;
export type TLoginFields = z.infer<typeof loginSchema>;
