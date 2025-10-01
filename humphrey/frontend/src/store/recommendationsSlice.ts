import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Recommendation {
  id: string;
  product_name: string;
  recommendation_type: string;
  score: number;
  explanation: string;
  group?: any;
}

interface RecommendationsState {
  items: Recommendation[];
  isLoading: boolean;
}

const initialState: RecommendationsState = {
  items: [],
  isLoading: false,
};

const recommendationsSlice = createSlice({
  name: 'recommendations',
  initialState,
  reducers: {
    setRecommendations: (state, action: PayloadAction<Recommendation[]>) => {
      state.items = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
});

export const { setRecommendations, setLoading } = recommendationsSlice.actions;
export default recommendationsSlice.reducer;
