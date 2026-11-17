import React, { ElementRef, useMemo, useRef } from 'react'
import { TabsContent } from '../ui/tabs'
import { Label } from '../ui/label'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import useAuth from '@/hooks/useAuth'
import { socialsPatterns } from '@/lib/utils'
import { notifications } from '@mantine/notifications'
import { Loader } from 'lucide-react'

export default function SocialMedia() {
    const { updatingProfile, updateProfile, artist } = useAuth();

    const formRef = useRef<ElementRef<'form'>>(null);
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        const socials = {
            facebook: data.get('facebook') as string | undefined,
            twitter: data.get('twitter') as string | undefined,
            instagram: data.get('instagram') as string | undefined,
            youtube: data.get('youtube') as string | undefined,
            website: data.get('website') as string | undefined,
        }

        const hasChanged = Object.keys(socials).some(key => {
            const keyTyped = key as keyof typeof socials;
            return socials[keyTyped] !== artist?.socials?.[keyTyped];
        });

        if (!hasChanged) {
            notifications.show({
                title: 'No changes detected',
                message: 'You have not made any changes to your social media information',
                color: 'blue',
            });
            return;
        }

        updateProfile({
            ...artist,
            socials
        });
    }

    return (
        <TabsContent value='socialMedia' className='w-full'>
            <h3 className='pb-4 text-xl font-semibold'>Social Media information</h3>
            <form
                onSubmit={handleSubmit}
                ref={formRef}
                className='space-y-4 max-w-xl'>
                <div className='grid gap-2'>
                    <Label htmlFor='facebook'>
                        Facebook
                    </Label>
                    <Input
                        name='facebook'
                        type='url'
                        placeholder='https://facebook.com/username'
                        defaultValue={artist?.socials?.facebook}
                        pattern={socialsPatterns.facebook.source}

                    />
                </div>
                <div className='grid gap-2'>
                    <Label htmlFor='twitter'>
                        Twitter
                    </Label>
                    <Input
                        name='twitter'
                        type='url'
                        placeholder='https://twitter.com/username'
                        defaultValue={artist?.socials?.twitter}
                        pattern={socialsPatterns.twitter.source}
                    />
                </div>
                <div className='grid gap-2'>
                    <Label htmlFor='instagram'>
                        Instagram
                    </Label>
                    <Input
                        name='instagram'
                        type='url'
                        placeholder='https://instagram.com/username'
                        defaultValue={artist?.socials?.instagram}
                        pattern={socialsPatterns.instagram.source}
                    />
                </div>
                <div className='grid gap-2'>
                    <Label htmlFor='youtube'>
                        Youtube
                    </Label>
                    <Input
                        name='youtube'
                        type='url'
                        placeholder='https://youtube.com/username'
                        defaultValue={artist?.socials?.youtube}
                        pattern={socialsPatterns.youtube.source}
                    />
                </div>
                <div className='grid gap-2'>
                    <Label htmlFor='website'>
                        Website
                    </Label>
                    <Input
                        name='website'
                        type='url'
                        placeholder='https://yourwebsite.com'
                        defaultValue={artist?.socials?.website}
                        pattern={socialsPatterns.website.source}
                    />
                </div>
                <div className='col-span-full flex items-center pt-5 border-t gap-x-3'>
                    <Button
                        type='button'
                        onClick={() => formRef.current?.reset()}
                        variant={'outline'} className='px-8'>
                        Reset
                    </Button>
                    <Button
                        disabled={updatingProfile}
                        type='submit'
                        className='px-8 min-w-44'>
                        {updatingProfile ? <Loader
                            className='text-white animate-spin'
                        /> : "Save"}
                    </Button>
                </div>
            </form>

        </TabsContent>
    )
}
