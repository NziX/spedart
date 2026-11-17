import { showShareProfileState, showShareSongModalState } from '@/atoms';
import { notifications } from '@mantine/notifications';
import { useMemo } from 'react';
import { FiFacebook, FiTwitter } from 'react-icons/fi';
import { useRecoilState } from 'recoil';
import ModalLayout from '../ModalLayout';
import { Button } from '../ui/button';


const socials = [
    { label: "facebook", icon: FiFacebook },
    { label: "twitter", icon: FiTwitter },
] as const

export default function ShareProfileModal() {
    const [show, setShow] = useRecoilState(showShareProfileState);

    const artistLink = useMemo(() => {
        if (!show?.artistId) return "";
        return `https://spedart.com/artists/${show.artistId}`;
    }, [show?.artistId]);

    const socialLinks = useMemo(() => {
        if (!show?.artistId) return [];
        return socials.map(({ label, icon: Icon }) => {
            return {
                label,
                Icon,
                link: label === 'facebook' ? `https://www.facebook.com/sharer/sharer.php?u=${artistLink}` :
                    label === 'twitter' ? `https://twitter.com/intent/tweet?url=${artistLink}` : ''
            }
        })
    }, [show?.artistId, artistLink]);

    const handleCopyLink = () => {
        navigator.clipboard.writeText(artistLink);
        notifications.show({
            title: "Link copied",
            message: "Link copied to clipboard",
            color: "blue",
        });
    }


    return (
        <ModalLayout
            open={Boolean(show?.show)}
            onClose={() => setShow(null)}
        >
            <div className='py-2 border-b mb-5'>
                <h3 className='font-semibold text-lg text-gray-700'>Share your profile</h3>
            </div>
            <div className='flex flex-col gap-y-4 space-y-5 mb-10'>
                <div className='w-full p-2 border rounded-sm bg-gray-100 flex items-center gap-4'>
                    <input type='text' value={artistLink} readOnly className='flex-1 bg-transparent border-none outline-none' />
                    <button onClick={handleCopyLink} className='p-2 bg-primary rounded-sm text-white'>Copy</button>
                </div>
                <div className='w-full flex items-center gap-x-3'>
                    {socialLinks.map(({ label, Icon, link }) => (
                        <a key={label} href={link} target='_blank' rel='noreferrer' className='p-2 bg-gray-100 rounded-full'>
                            <Icon className='text-2xl text-gray-700' />
                        </a>
                    ))}
                </div>
            </div>
            <Button onClick={() => setShow(null)} className='w-full' variant={'outline'}>Close</Button>
        </ModalLayout>
    )
}
