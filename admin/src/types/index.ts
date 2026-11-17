interface Base {
	_id: string;
	createdAt: string;
	updatedAt: string;
}

export interface Artist extends Base {
	firstName: string;
	lastName: string;
	email: string;
	phoneNumber: string;
	bio?: string;
	profilePicture: string;
	isVerified: boolean;
	isBlocked: boolean;
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

export enum EArtType {
	SONG,
}

export enum ECurrency {
	USD,
	RWF,
}

export enum EArtStatus {
	AVAILABLE = "AVAILABLE",
	SOLD = "SOLD",
}

export enum EPaymentType {
	SUPPORT = "SUPPORT",
	PURCHASE = "PURCHASE",
}

export enum EPaymentStatus {
	PENDING = "PENDING",
	RECEIVED = "RECEIVED",
	PAID = "PAID",
}
