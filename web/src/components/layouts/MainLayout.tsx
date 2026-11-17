import React from 'react'
import Navbar from '../Navbar'
import Footer from '../Footer'

export default function MainLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className='min-h-screen'>
            <Navbar />
            {children}
            <Footer />
        </div>
    )
}
