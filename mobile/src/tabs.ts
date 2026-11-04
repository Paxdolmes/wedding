export const tabs = [
  { id: 'home', label: 'Home', icon: 'M4 11 12 4l8 7v8a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1z' },
  { id: 'seat', label: 'My seat', icon: 'M12 3a4 4 0 1 1 0 8 4 4 0 0 1 0-8zM4 21c0-4 3.6-7 8-7s8 3 8 7' },
  { id: 'camera', label: 'Camera', icon: 'M4 8h3l2-3h6l2 3h3v11H4zM12 10.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z' },
  { id: 'music', label: 'Music', icon: 'M9 18V5l11-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM20 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0z' },
  { id: 'games', label: 'Predictions', icon: 'M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4' },
] as const
export type Tab = typeof tabs[number]['id'] | 'host'
export const isTab = (value: string | null): value is Tab => value === 'host' || tabs.some(tab => tab.id === value)
