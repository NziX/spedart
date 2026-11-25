import { activeOnboardingStepState, onboardingDataState } from '@/atoms';
import Image from 'next/image';
import { useRecoilState } from 'recoil';
import ProgressIndicator from '../ProgressIndicator';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';

export default function ArtistJourney() {
    const [, setActiveStep] = useRecoilState(activeOnboardingStepState);
    const [onboardingData, setOnboardingData] = useRecoilState(onboardingDataState);


    return (
        <div className='bg-primary-background rounded-2xl py-16  w-full space-y-10 min-h-[27rem]'>
            <div className='flex items-center justify-between gap-x-6 max-w-5xl mx-auto'>
                <div className='space-y-5'>
                    <h4 className='text-3xl font-semibold text-primary-text'>What’s your artist journey?</h4>
                    <p className='max-w-lg'>Share your story with the world! What inspired you to create art, and what makes your sound unique? This is your chance to let fans know who you are and what drives your passion.</p>
                    <Textarea
                        placeholder='This is what fans will read when they visit your profile – make it memorable!'
                        rows={5}
                        value={onboardingData.journey}
                        onChange={(e) => setOnboardingData({
                            ...onboardingData,
                            journey: e.target.value
                        })}
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
                <ProgressIndicator percentage={66} />
                <div className='flex justify-between items-center'>
                    <Button
                        variant='secondary'
                        onClick={() => setActiveStep('national_id')}
                    >
                        Previous
                    </Button>
                    <Button
                        onClick={() => setActiveStep('profile')}
                    >
                        Save & continue
                    </Button>
                </div>
            </div>
        </div>
    )
}
