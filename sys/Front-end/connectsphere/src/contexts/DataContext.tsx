import { createContext, useContext, useState, ReactNode } from 'react';
import type { Recommendation, GroupBuy, Product } from '../types';

interface DataContextType {
  recommendations: Recommendation[];
  groups: GroupBuy[];
  products: Product[];
  setRecommendations: (data: Recommendation[]) => void;
  setGroups: (data: GroupBuy[]) => void;
  setProducts: (data: Product[]) => void;
  clearCache: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [groups, setGroups] = useState<GroupBuy[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const clearCache = () => {
    setRecommendations([]);
    setGroups([]);
    setProducts([]);
  };

  const value: DataContextType = {
    recommendations,
    groups,
    products,
    setRecommendations,
    setGroups,
    setProducts,
    clearCache,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within DataProvider');
  }
  return context;
};
