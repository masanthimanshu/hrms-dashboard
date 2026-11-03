/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Alert,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import AddLocationAltRoundedIcon from '@mui/icons-material/AddLocationAltRounded';
import MyLocationRoundedIcon from '@mui/icons-material/MyLocationRounded';
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded';
import PlaceRoundedIcon from '@mui/icons-material/PlaceRounded';
import RadarRoundedIcon from '@mui/icons-material/RadarRounded';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import KeyRoundedIcon from '@mui/icons-material/KeyRounded';
import { useHrms } from '../context/HrmsContext';
import { Store } from '../types';

export const StoresPage: React.FC = () => {
  const navigate = useNavigate();
  const { stores, users, createStore, isLoading, storesError, hasAccountId } = useHrms();

  const [selectedStore, setSelectedStore] = useState<Store | null>(stores[0] || null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Sync selectedStore if stores change
  React.useEffect(() => {
    if (!selectedStore && stores.length > 0) {
      setSelectedStore(stores[0]);
    } else if (selectedStore && !stores.some((s) => s._id === selectedStore._id)) {
      setSelectedStore(stores[0] || null);
    }
  }, [stores, selectedStore]);

  // New store form state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [detectingGps, setDetectingGps] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setFormError('Geolocation is not supported by your browser.');
      return;
    }
    setDetectingGps(true);
    setFormError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude.toFixed(6));
        setLongitude(pos.coords.longitude.toFixed(6));
        setDetectingGps(false);
      },
      (err) => {
        setFormError(`Unable to retrieve GPS coordinates: ${err.message}`);
        setDetectingGps(false);
      },
      { timeout: 10000 }
    );
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Please enter a location name');
      return;
    }
    if (!address.trim()) {
      setFormError('Please enter the street address');
      return;
    }
    if (!latitude.trim() || !longitude.trim()) {
      setFormError('Please provide valid latitude and longitude GPS coordinates');
      return;
    }

    setFormSubmitting(true);
    setFormError(null);
    try {
      const res = await createStore({
        name: name.trim(),
        address: address.trim(),
        latitude: latitude.trim(),
        longitude: longitude.trim(),
      });
      if (res.success) {
        setName('');
        setAddress('');
        setLatitude('');
        setLongitude('');
        setCreateModalOpen(false);
      } else {
        setFormError(res.message || 'Failed to register location on live backend');
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Error submitting location');
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Top Banner or Error Alert */}
      {storesError && (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => navigate('/settings')}>
              Settings
            </Button>
          }
          sx={{ borderRadius: 2 }}
        >
          {storesError}
        </Alert>
      )}

      {/* Top Action Bar */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a' }}>
            Workplace Locations & Geofence Perimeters
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            Physical workplace anchors mapped with precise GPS coordinates.
          </Typography>
        </Box>

        <Button
          variant="contained"
          color="primary"
          startIcon={<AddLocationAltRoundedIcon />}
          onClick={() => setCreateModalOpen(true)}
          sx={{ bgcolor: '#0f172a' }}
        >
          Register New Workplace
        </Button>
      </Box>

      {/* Main Grid: Stores List + Geofence Radar */}
      {stores.length === 0 ? (
        <Paper
          elevation={1}
          sx={{
            p: 6,
            borderRadius: 3,
            textAlign: 'center',
            bgcolor: '#ffffff',
          }}
        >
          <StorefrontRoundedIcon sx={{ fontSize: 48, color: '#94a3b8', mb: 1.5 }} />
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a', mb: 0.5 }}>
            No Workplace Locations Found
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', maxWidth: 450, mx: 'auto', mb: 2 }}>
            {!hasAccountId
              ? 'Please configure your ACCOUNT_ID key in secrets to connect to live store records.'
              : 'Register your first physical branch or office to establish geofencing rules for shift check-ins.'}
          </Typography>
          {!hasAccountId ? (
            <Button
              variant="contained"
              onClick={() => navigate('/settings')}
              startIcon={<KeyRoundedIcon />}
              sx={{ bgcolor: '#0f172a' }}
            >
              Configure Account Key
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={() => setCreateModalOpen(true)}
              startIcon={<AddLocationAltRoundedIcon />}
              sx={{ bgcolor: '#0f172a' }}
            >
              Register First Store
            </Button>
          )}
        </Paper>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: '7fr 5fr' },
            gap: 2.5,
          }}
        >
          {/* Left Column: Stores List */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {stores.map((store) => {
              const assignedStaff = users.filter((u) => u.storeId === store._id);
              const isSelected = selectedStore?._id === store._id;

              return (
                <Paper
                  key={store._id}
                  elevation={1}
                  onClick={() => setSelectedStore(store)}
                  sx={{
                    p: 2.5,
                    cursor: 'pointer',
                    borderRadius: 2.5,
                    border: isSelected ? '2px solid #2563eb' : '1px solid #e2e8f0',
                    bgcolor: isSelected ? '#f8fafc' : '#ffffff',
                    transition: 'all 0.15s ease',
                    '&:hover': {
                      borderColor: isSelected ? '#2563eb' : '#cbd5e1',
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box
                        sx={{
                          p: 1.25,
                          borderRadius: 2,
                          bgcolor: isSelected ? '#2563eb' : '#f1f5f9',
                          color: isSelected ? '#ffffff' : '#334155',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <StorefrontRoundedIcon fontSize="small" />
                      </Box>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a' }}>
                          {store.name}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.825rem' }}>
                          {store.address}
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <PeopleAltRoundedIcon sx={{ fontSize: 16, color: '#64748b' }} />
                      <Typography variant="caption" className="tabular-nums" sx={{ fontWeight: 700, color: '#334155' }}>
                        {assignedStaff.length} Staff
                      </Typography>
                    </Box>
                  </Box>

                  <Divider sx={{ my: 1.5 }} />

                  <Box
                    sx={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 1.5,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PlaceRoundedIcon sx={{ fontSize: 16, color: '#2563eb' }} />
                      <Typography
                        variant="caption"
                        className="font-mono-numbers"
                        sx={{ color: '#475569', fontSize: '0.78rem' }}
                      >
                        LAT {store.latitude} · LNG {store.longitude}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Tooltip title="Copy Store ID">
                        <Button
                          size="small"
                          variant="text"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopy(store._id, store._id);
                          }}
                          startIcon={
                            copiedId === store._id ? (
                              <CheckRoundedIcon sx={{ fontSize: 14, color: '#16a34a' }} />
                            ) : (
                              <ContentCopyRoundedIcon sx={{ fontSize: 14 }} />
                            )
                          }
                          sx={{ fontSize: '0.72rem', color: '#64748b', p: 0.5 }}
                        >
                          {copiedId === store._id ? 'Copied' : 'Copy ID'}
                        </Button>
                      </Tooltip>
                    </Box>
                  </Box>
                </Paper>
              );
            })}
          </Box>

          {/* Right Column: Geofence Radar Preview */}
          {selectedStore && (
            <Paper
              elevation={1}
              sx={{
                p: 3,
                borderRadius: 3,
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                height: 'fit-content',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a' }}>
                    Geofence Anchor: {selectedStore.name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748b' }}>
                    Visualizing 100m perimeter around GPS coordinates
                  </Typography>
                </Box>
                <RadarRoundedIcon sx={{ color: '#2563eb' }} />
              </Box>

              <Divider />

              {/* Radar Coordinate Representation */}
              <Box
                sx={{
                  width: '100%',
                  height: 260,
                  borderRadius: 2,
                  bgcolor: '#0f172a',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  border: '1px solid #1e293b',
                }}
              >
                {/* Concentric Geofence Rings */}
                <Box
                  sx={{
                    position: 'absolute',
                    width: 210,
                    height: 210,
                    borderRadius: '50%',
                    border: '1px dashed rgba(255,255,255,0.15)',
                  }}
                />
                <Box
                  sx={{
                    position: 'absolute',
                    width: 150,
                    height: 150,
                    borderRadius: '50%',
                    border: '1px solid rgba(59, 130, 246, 0.4)',
                    bgcolor: 'rgba(59, 130, 246, 0.05)',
                  }}
                />
                <Box
                  sx={{
                    position: 'absolute',
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    border: '1px solid rgba(34, 197, 94, 0.6)',
                    bgcolor: 'rgba(34, 197, 94, 0.12)',
                  }}
                />

                {/* Center Anchor Point */}
                <Box
                  sx={{
                    width: 14,
                    height: 14,
                    borderRadius: '50%',
                    bgcolor: '#3b82f6',
                    boxShadow: '0 0 12px #3b82f6',
                    zIndex: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: '#ffffff' }} />
                </Box>

                {/* Legend in Radar */}
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 12,
                    left: 12,
                    display: 'flex',
                    gap: 1.5,
                    fontSize: '0.68rem',
                    color: '#94a3b8',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#22c55e' }} />
                    <span>&lt;100m Geofence</span>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#f59e0b' }} />
                    <span>&gt;100m Out of Bounds</span>
                  </Box>
                </Box>
              </Box>

              {/* Store Details */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" sx={{ color: '#64748b' }}>
                    Anchor Latitude:
                  </Typography>
                  <Typography variant="body2" className="font-mono-numbers" sx={{ fontWeight: 600, color: '#0f172a' }}>
                    {selectedStore.latitude}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" sx={{ color: '#64748b' }}>
                    Anchor Longitude:
                  </Typography>
                  <Typography variant="body2" className="font-mono-numbers" sx={{ fontWeight: 600, color: '#0f172a' }}>
                    {selectedStore.longitude}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" sx={{ color: '#64748b' }}>
                    Assigned Workforce:
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#0f172a' }}>
                    {users.filter((u) => u.storeId === selectedStore._id).length} Active Staff
                  </Typography>
                </Box>
              </Box>
            </Paper>
          )}
        </Box>
      )}

      {/* Register Workplace Modal */}
      <Dialog
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        maxWidth="sm"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 3 } } }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
          Register Workplace Location
        </DialogTitle>
        <form onSubmit={handleFormSubmit}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <Alert severity="info" sx={{ bgcolor: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe' }}>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                Live GPS Anchor Point
              </Typography>
              <Typography variant="caption" sx={{ color: '#1e3a8a', display: 'block' }}>
                This location is persisted directly into MongoDB via <code>POST /account/store/create</code>.
                When employees clock in, their GPS coordinates are measured against these exact coordinates.
              </Typography>
            </Alert>

            {formError && <Alert severity="error">{formError}</Alert>}

            <TextField
              label="Workplace / Branch Name"
              placeholder="e.g. Austin Regional HQ"
              value={name}
              onChange={(e) => setName(e.target.value)}
              fullWidth
              required
            />

            <TextField
              label="Physical Street Address"
              placeholder="e.g. 500 Congress Ave, Austin, TX 78701"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              fullWidth
              required
            />

            <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
              <TextField
                label="Latitude"
                placeholder="e.g. 30.2672"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                fullWidth
                required
              />
              <TextField
                label="Longitude"
                placeholder="e.g. -97.7431"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                fullWidth
                required
              />
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Button
                variant="outlined"
                size="small"
                onClick={handleDetectLocation}
                disabled={detectingGps}
                startIcon={
                  detectingGps ? (
                    <CircularProgress size={14} />
                  ) : (
                    <MyLocationRoundedIcon sx={{ fontSize: 16 }} />
                  )
                }
                sx={{ borderColor: '#cbd5e1', color: '#334155', alignSelf: 'flex-start' }}
              >
                {detectingGps ? 'Reading Device GPS...' : 'Use My Current GPS Position'}
              </Button>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2.5, pt: 1 }}>
            <Button onClick={() => setCreateModalOpen(false)} color="inherit">
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={formSubmitting}
              sx={{ bgcolor: '#0f172a' }}
            >
              {formSubmitting ? 'Registering...' : 'Save Location'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};
