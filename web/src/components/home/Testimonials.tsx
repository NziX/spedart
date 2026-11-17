import Image from 'next/image';
import { AiFillQuestionCircle } from 'react-icons/ai';
import { FaQuoteLeft } from 'react-icons/fa6';


const testimonials: {
    content: string;
    postedBy: {
        name: string;
        role: string;
        image: string;
    }
}[] = [
        {
            content: "I love how this platform allows me to connect directly with artists I admire. The early access to unreleased songs is a game-changer for fans who want to support their favorites.",
            postedBy: {
                name: "Taylor M.",
                role: "Music enthusiast",
                image: "/testimonials/taylor.png"
            }
        },
        {
            content: "As a fan, being able to support my favorite artists and get exclusive content is amazing. It feels great to be part of their journey and get a sneak peek of their new music!",
            postedBy: {
                name: "Alex R.",
                role: "Music enthusiast",
                image: "/testimonials/alex.png"
            }
        },
        {
            content: "From the artist’s perspective, this platform provides an invaluable way to reach out to fans and get early support. It’s been a fantastic experience!",
            postedBy: {
                name: "Riley K.",
                role: "Music Producer",
                image: "/testimonials/riley.png"
            }
        }
    ]
export default function Testimonials() {
    return (
        <div className='w-full px-4 md:px-6 my-24'>
            <div className='w-full mx-auto max-w-7xl flex flex-col items-center gap-y-5'>
                <div className='flex items-center gap-x-2'>
                    <AiFillQuestionCircle className='text-2xl text-primary' />
                    <p>What are others saying about us?</p>
                </div>
                <h3 className='text-primary-text text-4xl font-semibold max-w-2xl text-center'>Discover the experiences of our community</h3>
                <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5'>
                    {
                        testimonials.map(testimonial => (
                            <div
                                key={testimonial.postedBy.name}
                                className='bg-[#FEFAFF] rounded-md p-5 space-y-4'
                            >
                                <FaQuoteLeft className='text-3xl' />
                                <p>I love how this platform allows me to connect directly with artists I admire. The early access to unreleased songs is a game-changer for fans who want to support their favorites.</p>
                                <div className='flex items-center gap-x-2'>
                                    <Image src={testimonial.postedBy.image} alt={testimonial.postedBy.name} width={40} height={40} />
                                    <p>{testimonial.postedBy.name} , {testimonial.postedBy.role}</p>
                                </div>
                            </div>
                        ))
                    }
                </div>
            </div>
        </div>
    )
}
