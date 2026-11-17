import React from 'react'

interface Props {
    percentage: number;
}
export default function ProgressIndicator({ percentage }: Props) {
    return (
        <div className='w-full bg-gray-300 rounded-lg'>
            <div className='h-2 bg-primary rounded-md' style={{ width: `${percentage}%` }} />
        </div>
    )
}
