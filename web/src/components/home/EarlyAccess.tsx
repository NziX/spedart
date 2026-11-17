import { Card } from "@/components/ui/card"
import { song } from '@/lib/constants'
import Image from 'next/image'
import Link from 'next/link'
import { AiFillQuestionCircle } from 'react-icons/ai'
import { Button } from '../ui/button'

export default function EarlyAccess() {
    return (
        <div className='w-full px-4 md:px-6'>
            <div className='w-full mx-auto max-w-7xl flex justify-between gap-x-6'>
                <div className="space-y-4 w-1/2 shrink-0">
                    <div className='flex items-center gap-x-2'>
                        <AiFillQuestionCircle className='text-xl text-primary' />
                        <p>Did you know you can hear songs before they&apos;re out?</p>
                    </div>
                    <h3 className='font-semibold text-4xl text-primary-text max-w-lg'>
                        Get Early Access to New Music
                    </h3>
                    <p className='max-w-xl pb-10'>Support your favorite artists by getting exclusive access to their unreleased songs for just a few dollars. Be the first to listen and help bring their music to life!</p>
                    <Link
                        href={'/pre-release'}
                    >
                        <Button>
                            Explore all songs
                        </Button>
                    </Link>
                </div>
                <SongsCarousel />
            </div>
        </div>
    )
}

const SongsCarousel = () => {
    return (
        // <Carousel
        //     opts={{
        //         align: "start",
        //     }}
        //     className="w-full max-w-[45rem]"
        // >
        <div
            className='flex max-w-4xl overflew-hidden'
        >
            {Array(3).fill(song).map((s, index) => (
                <div key={index} >
                    <div className="p-1">
                        <Card className="relative rounded-xl">
                            <Image
                                src={s.thumbnail}
                                alt={song.title}
                                width={400}
                                height={600}
                            />
                            <div className="absolute bottom-4 left-4 rounded-full text-sm bg-black/50 text-white px-4 py-2 font-semibold">
                                {song.artists.join("&")}
                            </div>
                        </Card>
                    </div>
                </div>
            ))}
        </div>
        // <CarouselPrevious />
        // <CarouselNext />
        // </Carousel>
    )
}
