import MainLayout from "@/components/layouts/MainLayout";
import Head from "next/head";

const agreementContent = {
    title: "Artist Agreement",
    sections: [
        {
            title: "Introduction",
            content: [
                "SpedArt is a platform designed to assist, primarily but not limited to, uprising artists in showcasing their art and receiving direct support from their audience. The Client, through this platform, can share content and allow audiences to support their work without disclosing private information. The Client can also submit art for paid consumption by supporters."
            ]
        },
        {
            title: "Definitions",
            content: [
                {
                    title: "Client : ",
                    content: "Refers to anyone with an account on our platform who has agreed to the terms and conditions. This may include artists, companies, or individuals seeking support.",
                    type: "definition"
                },
                {
                    title: "Support : ",
                    content: "Refers to monetary donations or payments made to the Client via the Supported Artist platform.",
                    type: "definition"
                }
            ]
        },
        {
            title: "Personal Data and Privacy",
            content: [
                "SpedArt is committed to protecting the privacy and security of the Client’s personal data.",
                "Personal data will be collected and used solely for providing services, kept confidential, and disclosed only when required by law.",
                "Clients have the right to access, correct, restrict, or request deletion of their data.",
                "SpedArt will ensure appropriate security measures are in place and notify the Client in the event of a data breach.",
                "Data will be retained only as long as necessary or required by applicable regulations."
            ]
        },
        {
            title: "Copyright Ownership",
            content: [
                "All content (e.g., sound recordings, artist names, song names, stems, artwork) uploaded by the Client remains fully owned and copyrighted by the Client.",
                "If the content is licensed from a third party, the Client is responsible for obtaining proper legal permissions to upload such content.",
                "SpedArt will not be held liable for unauthorized uploads."
            ]
        },
        {
            title: "Fees",
            content: [
                {
                    title: "No sign-up fee is required. Supported Artist will deduct the following percentages from the support received:",
                    type: "list",
                    items: [
                        "8% for support under 10,000 RWF",
                        "7% for support between 10,001 RWF and 100,000 RWF",
                        "6% for support between 100,001 RWF and 1,000,000 RWF",
                        "5% for support over 1,000,001 RWF",
                        "Payments to the Client will be made after the mentioned deductions, and Supported Artist will not retain the Client's money beyond the necessary time for processing."
                    ]
                },
                "Payments to the Client will be made after the mentioned deductions, and Supported Artist will not retain the Client's money beyond the necessary time for processing."
            ]
        },
        {
            title: "Client Notifications",
            content: [
                "Supported Artist will provide notifications for every transaction on the Client’s account. In case of any confusion, the Client can request a full history of their account movements.",
                "Any updates to the platform’s terms and conditions will be communicated to the Client via email."
            ]
        },
        {
            title: "Termination and Dispute Resolution",
            content: [
                "Termination: A client may terminate this agreement at any time due to personal reasons or when they don’t feel satiated by the service provided. Terminating the agreement results to cancel of the account that will have been opened in the names of the client.",
                "Dispute Resolution: Any disputes arising under this agreement will be resolved through mediation or arbitration by the competent authorities in Rwanda, such as the Rwanda Arbitration Centre or other recognized bodies in accordance with Rwandan law."
            ]
        },
        {
            title: "Governing Law",
            content: [
                "This Agreement is governed by the laws of the Republic of Rwanda, including:",
                "Law No. 66/2018 of 30/08/2018 regulating labor.",
                "Law No. 45/2011 of 25/11/2011 governing contracts.",
                "Law No. 058/2024 on Protection of Personal Data and Privacy.",
                "All disputes will be subject to the jurisdiction of the competent courts and arbitration bodies in Rwanda."
            ]
        },
        {
            title: "Other Important Provisions",
            content: [
                "Parental Advisory: If the Client uploads explicit content, they must mark it as such when submitting.",
                "IN WITNESS WHEREOF, the parties hereto have executed this Agreement as of the date of acceptance by the Client."
            ]
        }
    ]
};


export default function ArtistAgreement() {
    return (
        <MainLayout>
            <Head>
                <title>Artist Agreement - SpedArt</title>
            </Head>
            <div className="container mx-auto px-4 sm:px-8 md:px-12">
                <h1 className="text-3xl font-semibold text-center my-8">{agreementContent.title}</h1>
                <div className="grid grid-cols-1 gap-4">
                    {agreementContent.sections.map((section, idx) => (
                        <div key={idx} className="bg-white p-4 space-y-3">
                            <h2 className="text-xl font-semibold">{idx + 1}. {section.title}</h2>
                            <ul className="list-disc ml-2 space-y-2">
                                {section.content.map((subSection, subIdx) => (

                                    typeof subSection === "string" ? (
                                        <p key={subIdx}>{idx + 1}.{subIdx + 1}. {subSection}</p>
                                    ) : subSection.type === "definition" ? (
                                        <p>
                                            <strong className="pr-1">{idx + 1}.{subIdx + 1}.{subSection.title}</strong>
                                            {/* @ts-ignore */}
                                            {subSection.content}
                                        </p>
                                    ) :
                                        subSection.type === "list" && (
                                            <div>
                                                <p>{idx + 1}.{subIdx + 1}. {subSection.title}</p>
                                                {/* @ts-ignore */}
                                                {subSection.items.map((item, itemIdx) => (
                                                    <div key={itemIdx} className="ml-4 py-1">
                                                        <li>{item}</li>
                                                    </div>
                                                ))}
                                            </div>

                                        )

                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>
        </MainLayout>
    )
}