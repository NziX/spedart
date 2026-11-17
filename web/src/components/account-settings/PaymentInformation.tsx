import React, { ElementRef, useRef } from 'react'
import { TabsContent } from '../ui/tabs';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import useAuth from '@/hooks/useAuth';
import { Loader } from 'lucide-react';

export default function PaymentInformation() {
    const { updateProfile, updatingProfile, artist } = useAuth();
    const formRef = useRef<ElementRef<'form'>>(null);
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const mobileMoneyNumber = formData.get('mobileMoneyNumber') as string;
        updateProfile({
            ...artist,
            paymentInfo: {
                ...artist?.paymentInfo,
                momo: mobileMoneyNumber
            }
        });
    }
    return (
        <TabsContent value='payment' className='w-full'>
            <div className='space-y-1 pb-8'>
                <h2 className='text-2xl font-semibold'>Payment Information</h2>
                <p className='text-gray-700'>
                    Specify which mobile money number you would like to receive payments to.
                </p>
            </div>
            <form
                onSubmit={handleSubmit}
                ref={formRef}
                className='grid grid-cols-1 gap-6 max-w-xl'>
                <div className='grid gap-2'>
                    <Label htmlFor='mobileMoneyNumber'>
                        Mobile Money Number
                    </Label>
                    <div className='w-full flex group'>
                        <p className='text-gray-600 h-full rounded-l-md border flex items-center justify-center text-sm px-2'>+250</p>
                        <Input
                            name='mobileMoneyNumber'
                            type='tel'
                            placeholder='Mobile Money Number'
                            className='rounded-l-none border-l-0 focus:outline-none focus:border-none focus:ring-0'
                            maxLength={9}
                            minLength={9}
                            required
                            defaultValue={artist?.paymentInfo?.momo}
                        />
                    </div>
                </div>
                <div className='col-span-full flex items-center pt-5 border-t gap-x-3'>
                    <Button
                        onClick={() => formRef.current?.reset()}
                        type='button'
                        variant={'outline'} className='px-8'>
                        Reset
                    </Button>
                    <Button
                        type='submit'
                        className='px-8 min-w-44'>
                        {
                            updatingProfile ? <Loader
                                className='text-white animate-spin'
                            /> : "Save"
                        }
                    </Button>
                </div>
            </form>
        </TabsContent>
    )
}
