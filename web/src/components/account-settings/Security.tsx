import React, { ElementRef, useRef } from 'react'
import { TabsContent } from '../ui/tabs'
import { Label } from '../ui/label'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import useAuth from '@/hooks/useAuth'
import { notifications } from '@mantine/notifications'
import { Loader } from 'lucide-react'

export default function Security() {
    const { changePassword, changingPassword } = useAuth();
    const formRef = useRef<ElementRef<'form'>>(null);
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        const currentPassword = data.get('currentPassword') as string;
        const newPassword = data.get('newPassword') as string;
        const confirmPassword = data.get('confirmPassword') as string;

        if (newPassword !== confirmPassword) {
            notifications.show({
                message: 'Passwords do not match',
                color: 'red',
                title: 'Error',
            });
            return;
        }
        changePassword(currentPassword, newPassword);

    }
    return (
        <TabsContent value='security' className='w-full'>
            <h2 className='pb-4 text-2xl font-semibold'>Account Security</h2>
            <form
                ref={formRef}
                onSubmit={handleSubmit}
                className='grid grid-cols-1 gap-6 max-w-xl'>
                <div className='grid gap-2'>
                    <Label htmlFor='currentPassword'>
                        Current Password
                    </Label>
                    <Input
                        required
                        minLength={4}
                        name='currentPassword'
                        type='password'
                        placeholder='Current Password'
                    />
                </div>
                <div className='grid gap-2'>
                    <Label htmlFor='newPassword'>
                        New Password
                    </Label>
                    <Input
                        minLength={4}
                        name='newPassword'
                        type='password'
                        placeholder='New Password'
                        required
                    />
                </div>
                <div className='grid gap-2'>
                    <Label htmlFor='confirmPassword'>
                        Confirm Password
                    </Label>
                    <Input
                        minLength={4}
                        name='confirmPassword'
                        type='password'
                        placeholder='Confirm Password'
                        required
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
                        disabled={changingPassword}
                        type='submit'
                        className='px-8 min-w-44'>
                        {changingPassword ? <Loader
                            className='text-white animate-spin'
                        /> : "Update Password"}
                    </Button>
                </div>
            </form>
        </TabsContent>
    )
}
