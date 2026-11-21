import { useState } from 'react';
import axios from '@/lib/axios.config';
import { useRouter } from 'next/router';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [idFile, setIdFile] = useState<File | null>(null);
  const [photo, setPhoto] = useState<string>(''); // base64 image from webcam
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const startCamera = async () => {
    const video = document.createElement('video');
    video.autoplay = true;
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
    // Show video in a temporary element (could be improved with a modal)
    const modal = document.createElement('div');
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.background = 'rgba(0,0,0,0.8)';
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.appendChild(video);
    const captureBtn = document.createElement('button');
    captureBtn.textContent = 'Capture';
    captureBtn.style.position = 'absolute';
    captureBtn.style.bottom = '20px';
    captureBtn.style.padding = '10px 20px';
    modal.appendChild(captureBtn);
    document.body.appendChild(modal);

    captureBtn.onclick = () => {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg');
      setPhoto(dataUrl);
      // stop all tracks
      stream.getTracks().forEach(t => t.stop());
      document.body.removeChild(modal);
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idFile || !photo) {
      alert('Please upload ID document and take a face photo');
      return;
    }
    setLoading(true);
    const formData = new FormData();
    formData.append('name', name);
    formData.append('email', email);
    formData.append('password', password);
    formData.append('idDocument', idFile);
    formData.append('facePhoto', photo);
    try {
      await axios.post('/api/auth/register', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      alert('Registration submitted – verification pending');
      router.push('/login');
    } catch (err) {
      console.error(err);
      alert('Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 border rounded">
      <h1 className="text-2xl mb-4">Get Started as an Artist</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Full Name"
          value={name}
          onChange={e => setName(e.target.value)}
          required
          className="w-full p-2 border rounded"
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          className="w-full p-2 border rounded"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          className="w-full p-2 border rounded"
        />
        <label className="block">
          ID Document (PDF, JPG, PNG)
          <input
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            onChange={e => setIdFile(e.target.files?.[0] ?? null)}
            required
            className="w-full p-2 border rounded mt-1"
          />
        </label>
        <div>
          {photo ? (
            <img src={photo} alt="Face" className="w-32 h-32 object-cover rounded" />
          ) : (
            <button type="button" onClick={startCamera} className="p-2 bg-blue-600 text-white rounded">
              Capture Face Photo
            </button>
          )}
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full p-2 bg-green-600 text-white rounded"
        >
          {loading ? 'Submitting...' : 'Register'}
        </button>
      </form>
    </div>
  );
}
