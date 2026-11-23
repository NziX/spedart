import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const pendingPath = path.resolve(process.cwd(), 'data', 'pendingRegistrations.json');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: 'Method Not Allowed' });
  }
  const { name, email } = req.body;
  if (!name || !email) {
    return res.status(400).json({ message: 'Name and email required' });
  }
  const newEntry = { id: uuidv4(), name, email, createdAt: new Date().toISOString() };
  try {
    const data = await fs.readFile(pendingPath, 'utf-8');
    const list = JSON.parse(data);
    list.push(newEntry);
    await fs.writeFile(pendingPath, JSON.stringify(list, null, 2));
  } catch (e) {
    // if file missing or empty, create new array
    await fs.writeFile(pendingPath, JSON.stringify([newEntry], null, 2));
  }
  res.status(200).json({ id: newEntry.id });
}
