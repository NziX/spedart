import { promises as fs } from 'fs';
import path from 'path';

const pendingPath = path.resolve(process.cwd(), 'data', 'pendingRegistrations.json');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ message: 'Method Not Allowed' });
  }
  try {
    const data = await fs.readFile(pendingPath, 'utf-8');
    const list = JSON.parse(data);
    res.status(200).json(list);
  } catch (e) {
    // If file missing or empty, return empty array
    res.status(200).json([]);
  }
}
