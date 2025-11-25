/**
 * Metadata Service
 * Fetches dynamic configuration data from backend
 * Replaces hardcoded constants
 */

import apiService from './api';

export interface BudgetRange {
  value: string;
  label: string;
  description: string;
}

export interface ExperienceLevel {
  value: string;
  label: string;
  description: string;
}

export interface GroupSize {
  value: string;
  label: string;
  description: string;
}

export interface ParticipationFrequency {
  value: string;
  label: string;
  description: string;
}

export interface MetadataResponse {
  categories: string[];
  locations: string[];
  budget_ranges: BudgetRange[];
  experience_levels: ExperienceLevel[];
  group_sizes: GroupSize[];
  participation_frequencies: ParticipationFrequency[];
}

class MetadataService {
  private cache: MetadataResponse | null = null;
  private cacheExpiry: number = 0;
  private readonly CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

  /**
   * Get all metadata (categories, locations, etc.)
   * Uses caching to avoid frequent API calls
   */
  async getAllMetadata(): Promise<MetadataResponse> {
    const now = Date.now();

    // Return cached data if still valid
    if (this.cache && now < this.cacheExpiry) {
      return this.cache;
    }

    try {
      const response = await apiService.get<MetadataResponse>('/metadata/metadata');
      this.cache = response;
      this.cacheExpiry = now + this.CACHE_DURATION;
      return response;
    } catch (error) {
      console.error('Failed to fetch metadata:', error);
      
      // Return fallback data if API fails
      return this.getFallbackMetadata();
    }
  }

  /**
   * Get categories only
   */
  async getCategories(): Promise<string[]> {
    try {
      const response = await apiService.get<{ categories: string[] }>('/metadata/categories');
      return response.categories;
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      const metadata = await this.getAllMetadata();
      return metadata.categories;
    }
  }

  /**
   * Get locations only
   */
  async getLocations(): Promise<string[]> {
    try {
      const response = await apiService.get<{ locations: string[] }>('/metadata/locations');
      return response.locations;
    } catch (error) {
      console.error('Failed to fetch locations:', error);
      const metadata = await this.getAllMetadata();
      return metadata.locations;
    }
  }

  /**
   * Clear cache (useful when data is updated)
   */
  clearCache() {
    this.cache = null;
    this.cacheExpiry = 0;
  }

  /**
   * Fallback data if API is unavailable
   * Ensures app still works offline or during backend issues
   */
  private getFallbackMetadata(): MetadataResponse {
    return {
      categories: [
        'Vegetables',
        'Fruits',
        'Grains',
        'Legumes',
        'Dairy',
        'Meat',
        'Poultry',
        'Seafood',
        'Baked Goods',
        'Beverages',
        'Spices',
        'Snacks'
      ],
      locations: [
        'Mbare',
        'Harare CBD',
        'Chitungwiza',
        'Epworth',
        'Glen View',
        'Highfield',
        'Kuwadzana',
        'Warren Park'
      ],
      budget_ranges: [
        { value: 'low', label: 'Low', description: 'Under $50/month' },
        { value: 'medium', label: 'Medium', description: '$50 - $150/month' },
        { value: 'high', label: 'High', description: 'Over $150/month' }
      ],
      experience_levels: [
        { value: 'beginner', label: 'Beginner', description: 'New to group buying' },
        { value: 'intermediate', label: 'Intermediate', description: 'Some experience' },
        { value: 'advanced', label: 'Advanced', description: 'Very experienced' }
      ],
      group_sizes: [
        { value: 'small', label: 'Small', description: '5-15 people' },
        { value: 'medium', label: 'Medium', description: '15-50 people' },
        { value: 'large', label: 'Large', description: '50+ people' }
      ],
      participation_frequencies: [
        { value: 'occasional', label: 'Occasional', description: 'Few times a year' },
        { value: 'regular', label: 'Regular', description: 'Monthly' },
        { value: 'frequent', label: 'Frequent', description: 'Weekly' }
      ]
    };
  }
}

export default new MetadataService();

