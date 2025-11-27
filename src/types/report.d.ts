export interface Badge {
  id: string;
  title: string;
  subtitle: string;
  icon: string; // Path to the badge icon
  status: 'achieved' | 'pending' | 'locked';
  achievedAt: string | null;
}
