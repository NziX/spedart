interface Base {
	_id: string;
	createdAt: string;
	updatedAt: string;
}

export interface Artist extends Base {
	firstName: string;
	lastName: string;
	stageName?: string;
	email: string;
	phoneNumber: string;
	bio?: string;
	profilePicture: string;
	isVerified: boolean;
	isBlocked: boolean;
	status: "pending" | "approved" | "rejected";
	rejectionReason?: string;
	reviewedAt?: string;
	isEmailVerified?: boolean;
	isPhoneVerified?: boolean;
	nationalId?: {
		idNumber?: string;
		frontImage?: string;
		backImage?: string;
		liveFacePhoto?: string;
		faceVerifiedAt?: string;
		submittedAt?: string;
		isVerified?: boolean;
	};
	balance?: number;
	pendingWithdrawal?: boolean;
	reviewedBy?: {
		_id: string;
		username: string;
		email: string;
	};
}

export interface IAdmin extends Base {
	username: string;
	email: string;
	role: string;
}

export interface IContactMessage extends Base {
	name: string;
	email: string;
	message: string;
}

export interface Art extends Base {
	title: string;
	artist: Artist;
	type: EArtType;
	thumbnail: string;
	content: string;
	description?: string;
	pricing: {
		paid: boolean;
		price?: number;
		currency?: ECurrency;
	};
	status: EArtStatus;
	likes: number;
	streams: number;
}

export interface Payment extends Base {
	artist: Artist;
	art?: Art;
	providedBy?: {
		name: string;
		email: string;
		phoneNumber: string;
	};
	type: EPaymentType;
	status: EPaymentStatus;
	currency: ECurrency;
	amount: number;
}

export enum ECurrency {
	RWF = "RWF",
	USD = "USD",
}

export enum EPaymentType {
	SUPPORT = "SUPPORT",
	PURCHASE = "PURCHASE",
}

export enum EPaymentStatus {
	PENDING = "PENDING",
	SUCCESS = "SUCCESS",
	FAILED = "FAILED",
	PAID = "PAID",
	RECEIVED = "RECEIVED",
}

export enum EArtType {
	MUSIC = "MUSIC",
	POETRY = "POETRY",
	COMEDY = "COMEDY",
	PODCAST = "PODCAST",
}

export enum EArtStatus {
	ACTIVE = "ACTIVE",
	INACTIVE = "INACTIVE",
}
