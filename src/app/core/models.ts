export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'all_levels';
export type MatchStatus = 'draft' | 'open' | 'full' | 'completed' | 'cancelled';
export interface Profile { id: string; firstName: string; lastName: string; avatarUrl?: string; location?: string; biography?: string; skillLevel: SkillLevel; preferredSports: string[]; averageRating: number; ratingCount: number; lastActiveAt?: string; status: 'active' | 'deactivated'; }
export interface MatchSummary { id: string; title: string; sport: string; location: string; startsAt: string; skillLevel: SkillLevel; participantCount: number; maxPlayers: number; status: MatchStatus; hostName: string; hostAvatarUrl?: string; coverUrl?: string; }
export interface MatchFilters { query?: string; sport?: string; location?: string; skillLevel?: string; date?: string; status?: string; hostId?: string; sort?: 'soonest' | 'newest'; page: number; pageSize: number; }
