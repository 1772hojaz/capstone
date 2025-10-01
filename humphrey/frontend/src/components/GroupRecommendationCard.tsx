import React, { useState } from 'react';
import { Card, CardContent, CardActions, Typography, Button, Box, Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import { People, TrendingDown, Schedule } from '@mui/icons-material';
import { groupsAPI } from '../services/api';

interface Props {
  recommendation: any;
  onJoin: () => void;
}

export default function GroupRecommendationCard({ recommendation, onJoin }: Props) {
  const [openDialog, setOpenDialog] = useState(false);
  const [quantity, setQuantity] = useState(10);
  const [joining, setJoining] = useState(false);

  const handleJoin = async () => {
    if (!recommendation.group?.id) return;
    setJoining(true);
    try {
      await groupsAPI.join(recommendation.group.id, quantity);
      setOpenDialog(false);
      onJoin();
    } catch (error) {
      console.error('Failed to join group:', error);
    } finally {
      setJoining(false);
    }
  };

  const discount = recommendation.group?.discount_percentage || recommendation.discount_percentage || 0;
  const members = recommendation.group?.current_members || recommendation.potential_members || 0;

  return (
    <>
      <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <CardContent sx={{ flexGrow: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Chip label={recommendation.recommendation_type === 'join_group' ? 'Join Group' : 'New Opportunity'} color="primary" size="small" />
            <Chip icon={<TrendingDown />} label={`${discount.toFixed(0)}% OFF`} color="success" size="small" />
          </Box>
          <Typography variant="h6" gutterBottom>{recommendation.product_name}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{recommendation.explanation}</Typography>
          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <People fontSize="small" color="action" />
              <Typography variant="body2">{members} traders</Typography>
            </Box>
            {recommendation.group?.deadline && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Schedule fontSize="small" color="action" />
                <Typography variant="body2">{new Date(recommendation.group.deadline).toLocaleDateString()}</Typography>
              </Box>
            )}
          </Box>
        </CardContent>
        <CardActions>
          <Button fullWidth variant="contained" onClick={() => setOpenDialog(true)} disabled={recommendation.recommendation_type === 'new_group'}>
            {recommendation.recommendation_type === 'join_group' ? 'Join Group' : 'Coming Soon'}
          </Button>
        </CardActions>
      </Card>
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Join {recommendation.product_name} Group</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>{recommendation.explanation}</Typography>
          <TextField fullWidth type="number" label="Quantity to Commit" value={quantity} onChange={(e) => setQuantity(parseInt(e.target.value))} margin="normal" inputProps={{ min: 1 }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleJoin} variant="contained" disabled={joining}>{joining ? 'Joining...' : 'Confirm'}</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
