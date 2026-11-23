import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import TableWrapper from '@/components/tables/TableWrapper';
import { Column } from '@/components/tables/Table';
import axios from '@/lib/axios.config';
import useSWR from 'swr';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface PendingArtist {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

const columns: Column<PendingArtist>[] = [
  { title: 'Name', key: 'name' },
  { title: 'Email', key: 'email' },
  { title: 'Submitted', key: 'createdAt', Element: ({ row }) => (
    <span>{new Date(row.createdAt).toLocaleString()}</span>
  ) },
  {
    title: 'Actions',
    key: 'actions',
    Element: ({ row }) => <ApproveButton artistId={row.id} />,
  },
];

function ApproveButton({ artistId }: { artistId: string }) {
  const [status, setStatus] = useState('');
  const handleApprove = async () => {
    setStatus('Approving…');
    try {
      await axios.post('/api/artists/approve', { id: artistId });
      setStatus('Approved');
      // trigger SWR revalidation by mutating cache (handled in page)
    } catch (e) {
      setStatus('Error');
    }
  };
  return (
    <Button onClick={handleApprove} disabled={status === 'Approving…'}>
      {status || 'Approve'}
    </Button>
  );
}

export default function PendingArtists() {
  const { data: pending, error, mutate, isLoading } = useSWR('/api/artists/pending', async (url) => {
    const { data } = await axios.get(url);
    return data as PendingArtist[];
  });

  // Revalidate after an approval
  const revalidate = () => mutate();

  // Wrap approve to also revalidate list
  const handleApprove = async (id: string) => {
    await axios.post('/api/artists/approve', { id });
    revalidate();
  };

  return (
    <DashboardLayout>
      <TableWrapper
        title="Pending Artist Registrations"
        description="Approve new artists after review"
        columns={columns}
        data={pending ?? []}
        loading={isLoading}
      />
    </DashboardLayout>
  );
}
