import MainLayout from '@/components/layouts/MainLayout'
import Head from 'next/head'
import React from 'react'

const sections: {
    title: string,
    content: string
}[] = [
        {
            title: "Our Vision",
            content: "To empower artists and fans alike by creating a platform where music lovers can connect with their favorite artists in new and meaningful ways. We aim to bridge the gap between creators and supporters, making it easier for music to be enjoyed and appreciated."
        },
        {
            title: "Our Mission",
            content: "Our mission is to provide an innovative platform that allows artists to share their unreleased music with dedicated fans, while offering fans a unique opportunity to support their favorite artists. We strive to foster a thriving community that celebrates music and its creators."
        },
        {
            title: "What Sets Us Apart?",
            content: "Our platform offers exclusive early access to unreleased songs, giving fans a unique way to engage with artists. For artists, we provide powerful tools to manage and promote their music effectively, ensuring a smooth and rewarding experience for both creators and listeners."
        },
        {
            title: "Why Trust Us?",
            content: "We are committed to transparency, security, and exceptional user experience. Our platform is built with state-of-the-art technology to ensure that your personal information and transactions are safe. Our dedicated support team is always here to assist you with any questions or issues you may have."
        }
    ]

export default function About() {
    return (
        <>
            <Head>
                <title>About Us - Supported</title>
            </Head>
            <MainLayout>
                <div className='w-full py-20'>
                    <div className='w-full mx-auto max-w-7xl flex flex-col items-center gap-y-8'>
                        <h1 className='text-5xl font-bold text-primary-text'>Who are we?</h1>
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                            {
                                sections.map(section => (
                                    <div
                                        key={section.title}

                                        className='p-4 py-8 space-y-6 bg-[#FEFCFF] rounded-md'
                                    >
                                        <h5 className='text-2xl font-medium'>{section.title}</h5>
                                        <p className='text-gray-600'>{section.content}</p>
                                    </div>
                                ))
                            }
                        </div>
                    </div>
                </div>
            </MainLayout>
        </>
    )
}
