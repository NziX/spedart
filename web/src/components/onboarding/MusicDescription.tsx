import { activeOnboardingStepState } from '@/atoms'
import Image from 'next/image';
import React, { useState } from 'react'
import { useRecoilState } from 'recoil'
import { Textarea } from '../ui/textarea';
import ProgressIndicator from '../ProgressIndicator';
import { Button } from '../ui/button';

export default function MusicDescription() {
    const [, setActiveStep] = useRecoilState(activeOnboardingStepState);
    const [description, setDescription] = useState("");

    return (
        <div className='bg-primary-background rounded-2xl py-16  w-full space-y-10 min-h-[27rem]'>
            <div className='flex items-center justify-between gap-x-6 max-w-5xl mx-auto'>
                <div className='space-y-5'>
                    <h4 className='text-3xl font-semibold text-primary-text'>How would you describe your music?</h4>
                    <p className='max-w-lg'>Tell us about your music style or genre. It helps us understand what kind of sound you bring to the table.</p>
                    <Textarea
                        placeholder='Type here'
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </div>
                <Image
                    src={"/question-mark.png"}
                    alt='question mark'
                    width={250}
                    height={250}
                />
            </div>
            <div className='w-full space-y-4 md:px-6 lg:px-10'>
                <ProgressIndicator percentage={25} />
                <div className='flex justify-between items-center'>
                    <Button
                        variant={'secondary'}
                        onClick={() => setActiveStep("registration")}
                    >
                        Previous
                    </Button>
                    <Button
                        onClick={() => setActiveStep("artist_journey")}
                    >
                        Save & continue
                    </Button>
                </div>
            </div>
        </div>
    )
}
