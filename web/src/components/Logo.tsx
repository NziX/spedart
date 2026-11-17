import { useRouter } from 'next/router'
import React from 'react'

interface LogoProps {
    link?: boolean
}


export default function Logo({ link }: LogoProps) {
    const router = useRouter();
    return (
        <div role={link ? "button" : ""}
            onClick={link ? () => router.push("/") : () => { }}
            className='flex font-semibold text-xl'>
            <span>Sped</span>
            <span className='text-primary'>Art</span>
        </div>
    )
}
