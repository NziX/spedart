import { promises as fs } from 'fs';
import path from 'path';

const pendingPath = path.resolve(process.cwd(), 'data', 'pendingRegistrations.json');
const approvedPath = path.resolve(process.cwd(), 'data', 'approvedArtists.json');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: 'Method Not Allowed' });
  }
  const { id } = req.body;
  if (!id) {
    return res.status(400).json({ message: 'ID required' });
  }
  try {
    const pendingData = await fs.readFile(pendingPath, 'utf-8');
    const pendingList = JSON.parse(pendingData);
    const index = pendingList.findIndex((item) => item.id === id);
    if (index === -1) {
      return res.status(404).json({ message: 'Registration not found' });
    }
    const [artist] = pendingList.splice(index, 1);
    await fs.writeFile(pendingPath, JSON.stringify(pendingList, null, 2));
    // add to approved list
    let approvedList = [];
    try {
      const approvedData = await fs.readFile(approvedPath, 'utf-8');
      approvedList = JSON.parse(approvedData);
    } catch (e) {
      // ignore, will create new file
    }
    approvedList.push({ ...artist, approvedAt: new Date().toISOString() });
    await fs.writeFile(approvedPath, JSON.stringify(approvedList, null, 2));
    res.status(200).json({ message: 'Artist approved' });
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
}
