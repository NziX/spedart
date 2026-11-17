import useAuth from '@/hooks/useAuth';
import Link from 'next/link';
import { FormEvent } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Loader } from 'lucide-react';
import { notifications } from '@mantine/notifications';

export default function Registration() {
    const { signingUp, signup } = useAuth();

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);

        const firstName = form.get('firstName') as string;
        const lastName = form.get('lastName') as string;
        const stageName = form.get('stageName') as string;
        const email = form.get('email') as string;
        const phoneNumber = form.get('phoneNumber') as string;
        const password = form.get("password") as string;

        const agreed_to_terms = form.get('agreed_to_terms') as string;
        if (agreed_to_terms !== 'on') {
            notifications.show({
                message: 'You must agree to the terms of service to continue',
                color: 'red'
            })
            return;
        }
        signup({ firstName, lastName, stageName, email, phoneNumber, password });
    }

    return (
        <div
            className='bg-[#FEFAFF] rounded-2xl w-full flex flex-col items-center space-y-7 px-4 py-12'
        >
            <h2 className='text-2xl font-semibold'>Sign up for supported</h2>
            <p className='max-w-lg text-center'>Join now to share your art, upload pre-releases, and connect with fans who support you!</p>
            <form
                onSubmit={handleSubmit}
                className='w-full max-w-xl mx-auto space-y-6 pt-4 flex flex-col items-center'
            >
                <div className='grid gap-2 grid-cols-1 sm:grid-cols-2 w-full'>
                    <div className='grid gap-2'>
                        <Label htmlFor='firstName'>First Name</Label>
                        <Input
                            name='firstName'
                            placeholder='First Name'
                            required
                        />
                    </div>
                    <div className='grid gap-2'>
                        <Label htmlFor='lastName'>Last Name</Label>
                        <Input
                            name='lastName'
                            placeholder='Last Name'
                            required
                        />
                    </div>
                </div>
                <div className='grid gap-2 w-full'>
                    <Label htmlFor='stageName'>Stage Name</Label>
                    <Input
                        name='stageName'
                        placeholder='Your Stage Name or Artist Name'
                        minLength={2}
                        required
                    />
                </div>
                <div className='grid gap-2 w-full'>
                    <Label htmlFor='email'>Email</Label>
                    <Input
                        type='email'
                        name='email'
                        placeholder='Your email'
                        required
                    />
                </div>
                <div className='grid gap-2 w-full'>
                    <Label htmlFor='phoneNumber'>Phone Number</Label>
                    <Input
                        type='tel'
                        name='phoneNumber'
                        placeholder='Your phone number'
                        required
                    />
                </div>
                <div className='grid gap-2 w-full'>
                    <Label htmlFor='password'>Password</Label>
                    <Input
                        type='password'
                        name='password'
                        minLength={4}
                        required
                        placeholder='Choose password'
                    />
                </div>
                <div className='w-full flex items-center gap-x-2 pb-8'>
                    <Input
                        type='checkbox'
                        name='agreed_to_terms'
                        required
                        className='w-5 h-5'
                    />
                    <p>Yes, I understand and agree to the {" "}
                        <Link href='/agreement'>
                            <span className='text-primary'>SpedArt&apos;s User Agreement</span>
                        </Link>
                    </p>
                </div>
                <Button
                    type='submit'
                    disabled={signingUp}
                    className='px-10 min-w-44'>
                    {signingUp ? <Loader
                        color='white'
                        className='animate-spin'
                    /> : "Create my account"}
                </Button>
                <div>
                    <span>Already have an account? </span>
                    <Link className='text-primary' href={'/login'}>
                        Login
                    </Link>
                </div>
            </form>
        </div>
    )
}
