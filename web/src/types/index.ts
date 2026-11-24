interface Base {
	_id: string;
	createdAt: string;
	updatedAt: string;
}

export interface Socials {
	facebook?: string;
	instagram?: string;
	twitter?: string;
	youtube?: string;
	website?: string;
}

export interface PaymentInfo {
	momo?: string;
}

export interface IArtist extends Base {
	firstName: string;
	lastName: string;
	stageName: string;
	email: string;
	phoneNumber: string;
	songs: number;
	verified?: boolean;
	profilePicture: string;
	socials?: Socials;
	bio?: string;
	paymentInfo?: PaymentInfo;
	status?: "pending" | "approved" | "rejected";
	rejectionReason?: string;
	reviewedAt?: string;
	isEmailVerified?: boolean;
	isPhoneVerified?: boolean;
	nationalId?: {
		idNumber?: string;
		frontImage?: string;
		backImage?: string;
		submittedAt?: string;
		isVerified?: boolean;
	};
}

export interface IPreRelease extends Base {
	title: string;
	plays: number;
	likes: number;
	id?: number;
	price: number;
	thumbnail: string;
	artists: string[];
}

export interface Art extends Base {
	title: string;
	type: EArtType;
	thumbnail: string;
	song: {
		key: string;
		size: number;
		url: string;
	};
	description?: string;
	pricing: {
		paid: boolean;
		price?: number;
		currency?: ECurrency;
	};
	artist: IArtist;
	likes: number;
	streams: number;
	releaseDate: string;
}

export interface Payment extends Base {
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
	comment?: string;
}

export interface ICustomer extends Base {
	email: string;
	phoneNumber: string;
	fullName: string;
	likedArt?: string[];
}

export enum EArtType {
	SONG = "SONG",
}

export enum ECurrency {
	USD = "USD",
	RWF = "RWF",
}

export enum EArtStatus {
	DRAFT = "DRAFT",
	PUBLISHED = "PUBLISHED",
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

export interface IArtistWithArtCount extends IArtist {
	artCount: number;
}
