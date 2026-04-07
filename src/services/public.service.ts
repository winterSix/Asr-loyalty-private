export interface LandingStats {
  totalUsers: number;
  totalTransactions: number;
  totalVolumeProcessed: number;
  totalRewardsGiven: number;
  totalWalletFunding: number;
}

class PublicService {
  async getLandingStats(): Promise<LandingStats> {
    // Use the Next.js proxy (/api/*) — avoids a direct browser→backend CORS request
    const res = await fetch('/api/public/stats');
    if (!res.ok) throw new Error('Failed to fetch public stats');
    const data = await res.json();
    const stats = data?.stats ?? data?.data?.stats ?? data;
    return {
      totalUsers: stats?.totalUsers ?? 0,
      totalTransactions: stats?.totalTransactions ?? 0,
      totalVolumeProcessed: stats?.totalVolumeProcessed ?? 0,
      totalRewardsGiven: stats?.totalRewardsGiven ?? 0,
      totalWalletFunding: stats?.totalWalletFunding ?? 0,
    };
  }
}

export const publicService = new PublicService();
