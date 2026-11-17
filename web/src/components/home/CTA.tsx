import Link from 'next/link'
import React from 'react'
import { Button } from '../ui/button'

export default function CTA() {
    return (
        <div className='w-full px-4 md:px-6 my-10'>
            <div className='w-full mx-auto max-w-7xl bg-[#060008] rounded-[32px] flex flex-col items-center py-16  gap-y-8 text-white'>
                <h3 className='text-4xl text-center max-w-3xl'>Get Ready to Explore  Music and Support Your Favorite Artists!</h3>
                <p className='text-center max-w-2xl'>Excited to start? Discover unreleased tracks, support 100+ artists, and dive into the music you love. Join now!</p>
                <Link href={'/pre-releases'}>
                    <Button>
                        Get Started
                    </Button>
                </Link>
            </div>
        </div>
    )
}
