import PaymentInformation from "@/components/account-settings/PaymentInformation";
import PersonalInformation from "@/components/account-settings/PersonalInformation";
import Security from "@/components/account-settings/Security";
import SocialMedia from "@/components/account-settings/SocialMedia";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { generatePageTitle } from "@/lib/utils";
import Head from "next/head";

export default function AccountSettings() {
	return (
		<>
			<Head>
				<title>{generatePageTitle("Account Settings")}</title>
			</Head>
			<DashboardLayout>
				<Tabs defaultValue="personalInfo" className="w-full p-4 md:p-6">
					<TabsList className="grid grid-cols-4 w-full">
						<TabsTrigger value="personalInfo">
							Personal Information
						</TabsTrigger>
						<TabsTrigger value="socialMedia">
							Social Media
						</TabsTrigger>
						<TabsTrigger value="payment">
							Payment Information
						</TabsTrigger>
						<TabsTrigger value="security">Security</TabsTrigger>
					</TabsList>
					<Card className="w-full py-4 min-h-[40rem] mt-6 px-4">
						<PersonalInformation />
						<SocialMedia />
						<PaymentInformation />
						<Security />
					</Card>
				</Tabs>
			</DashboardLayout>
		</>
	);
}
