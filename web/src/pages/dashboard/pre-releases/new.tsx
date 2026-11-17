import DashboardLayout from '@/components/layouts/DashboardLayout';
import AddOrEditPreRelease from '@/components/pre-release/AddOrEditPreRelease';
import Head from 'next/head';

export default function NewPreRelease() {

    return (
        <>
            <Head>
                <title>{"New Pre-release"}</title>
            </Head>
            <DashboardLayout>
                <AddOrEditPreRelease
                    action="add"
                />
            </DashboardLayout>
        </>
    )
}
