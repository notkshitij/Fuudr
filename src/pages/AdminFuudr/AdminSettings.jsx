import { PlatformStatusToggle } from './components/PlatformStatusToggle';

export default function AdminSettings() {
  return (
    <div className="space-y-6 font-outfit">
      <h1 className="text-3xl font-black tracking-tight text-slate-900">Settings</h1>
      <PlatformStatusToggle />
    </div>
  );
}
