export type CampusEvent = {
  id: string;
  title: string;
  description: string;
  startsAt: string; // ISO 8601 string
  imageUrl?: string;
  category: 'Academic' | 'Workshop' | 'Sports' | 'Cultural' | 'Career';
  capacity: number;
  registeredCount: number;
  location: {
    name: string;
    latitude: number;
    longitude: number;
  };
};

export type EventRegistration = {
  eventId: string;
  fullName: string;
  email: string;
  studentId: string;
  registeredAt: string;
};

export type UserProfile = {
  name: string;
  email: string;
  program: string;
  faculty: string;
  interests: string[];
  role: 'student' | 'organizer';
};

export type EventFilter = 'all' | 'Academic' | 'Workshop' | 'Sports' | 'Cultural' | 'Career';
