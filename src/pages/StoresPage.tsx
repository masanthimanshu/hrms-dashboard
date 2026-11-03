import { useState, useEffect, type FC, type SubmitEvent } from "react";
import { useNavigate } from "react-router-dom";
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
} from "@mui/material";
import StorefrontRoundedIcon from "@mui/icons-material/StorefrontRounded";
import AddLocationAltRoundedIcon from "@mui/icons-material/AddLocationAltRounded";
import MyLocationRoundedIcon from "@mui/icons-material/MyLocationRounded";
import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded";
import PlaceRoundedIcon from "@mui/icons-material/PlaceRounded";
import RadarRoundedIcon from "@mui/icons-material/RadarRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import {
  apiService,
  hasConfiguredAccountId,
  notify,
  type Store,
  type User,
} from "../services/api";

const inputFieldSx = {
  "& .MuiOutlinedInput-root": { bgcolor: "#f8fafc", borderRadius: 2 },
};

export const StoresPage: FC = () => {
  const navigate = useNavigate();
  const [stores, setStores] = useState<Store[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [storesError, setStoresError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [detectingGps, setDetectingGps] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const hasAccountId = hasConfiguredAccountId;

  const loadData = async () => {
    const [storeRes, userRes] = await Promise.all([
      apiService.getStores(),
      apiService.getUsers(),
    ]);
    setStores(storeRes.data || []);
    setStoresError(storeRes.error || null);
    setUsers(userRes.data || []);
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedStore =
    stores.find((s) => s._id === selectedId) || stores[0] || null;

  const handleCopy = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDetectGPS = () => {
    if (!navigator.geolocation) return;
    setDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude.toFixed(6));
        setLongitude(pos.coords.longitude.toFixed(6));
        setDetectingGps(false);
      },
      () => setDetectingGps(false),
      { timeout: 8000 },
    );
  };

  const handleSubmit = async (e: SubmitEvent) => {
    e.preventDefault();
    if (
      !name.trim() ||
      !address.trim() ||
      !latitude.trim() ||
      !longitude.trim()
    ) {
      setFormError("All fields are required");
      return;
    }
    setFormSubmitting(true);
    setFormError(null);
    const res = await apiService.createStore({
      name,
      address,
      latitude,
      longitude,
    });
    setFormSubmitting(false);
    if (res.success) {
      notify("Workplace location created", "success");
      setName("");
      setAddress("");
      setLatitude("");
      setLongitude("");
      setModalOpen(false);
      loadData();
    } else {
      notify(res.message || "Failed to create store", "error");
      setFormError(res.message || "Failed to create store");
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {storesError && (
        <Alert
          severity="error"
          sx={{ borderRadius: 3, border: "1px solid #fecaca" }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => navigate("/settings")}
            >
              Settings
            </Button>
          }
        >
          {storesError}
        </Alert>
      )}

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Box>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 800,
              color: "#0f172a",
              letterSpacing: "-0.015em",
            }}
          >
            Workplace Locations & Geofence Perimeters
          </Typography>
          <Typography variant="body2" sx={{ color: "#64748b" }}>
            Physical workplace anchors mapped with precise GPS coordinates.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddLocationAltRoundedIcon />}
          onClick={() => setModalOpen(true)}
        >
          Register Workplace
        </Button>
      </Box>

      {stores.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            p: 6,
            borderRadius: 3.5,
            textAlign: "center",
            border: "1px solid #e2e8f0",
            bgcolor: "#ffffff",
          }}
        >
          <StorefrontRoundedIcon
            sx={{ fontSize: 48, color: "#94a3b8", mb: 1.5 }}
          />
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.5 }}>
            No Workplace Locations Found
          </Typography>
          <Typography variant="body2" sx={{ color: "#64748b", mb: 2 }}>
            {!hasAccountId
              ? "Configure credentials in settings."
              : "Register your first branch."}
          </Typography>
          <Button
            variant="contained"
            onClick={() =>
              hasAccountId ? setModalOpen(true) : navigate("/settings")
            }
          >
            {hasAccountId ? "Register First Store" : "Configure Settings"}
          </Button>
        </Paper>
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", lg: "7fr 5fr" },
            gap: 2.5,
          }}
        >
          {/* List of Stores */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {stores.map((store) => {
              const staffCount = users.filter(
                (u) => u.storeId === store._id,
              ).length;
              const isSelected = selectedStore?._id === store._id;
              return (
                <Paper
                  key={store._id}
                  elevation={0}
                  onClick={() => setSelectedId(store._id)}
                  sx={{
                    p: 2.75,
                    cursor: "pointer",
                    borderRadius: 3.5,
                    border: isSelected
                      ? "2px solid #2563eb"
                      : "1px solid #e2e8f0",
                    bgcolor: "#ffffff",
                    boxShadow: isSelected
                      ? "0 8px 20px -4px rgba(37, 99, 235, 0.15)"
                      : "0 1px 3px rgba(0,0,0,0.03)",
                    transition: "all 0.2s ease",
                    "&:hover": {
                      borderColor: isSelected ? "#2563eb" : "#cbd5e1",
                      transform: "translateY(-1px)",
                    },
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      mb: 1,
                    }}
                  >
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 1.5 }}
                    >
                      <Box
                        sx={{
                          p: 1.25,
                          borderRadius: 2,
                          background: isSelected
                            ? "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)"
                            : "#f1f5f9",
                          color: isSelected ? "#fff" : "#334155",
                        }}
                      >
                        <StorefrontRoundedIcon fontSize="small" />
                      </Box>
                      <Box>
                        <Typography
                          variant="subtitle1"
                          sx={{ fontWeight: 800, color: "#0f172a" }}
                        >
                          {store.name}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{ color: "#64748b", fontSize: "0.825rem" }}
                        >
                          {store.address}
                        </Typography>
                      </Box>
                    </Box>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.5,
                        bgcolor: "#f8fafc",
                        px: 1.25,
                        py: 0.5,
                        borderRadius: 2,
                        border: "1px solid #f1f5f9",
                      }}
                    >
                      <PeopleAltRoundedIcon
                        sx={{ fontSize: 16, color: "#64748b" }}
                      />
                      <Typography
                        variant="caption"
                        sx={{ fontWeight: 700, color: "#334155" }}
                      >
                        {staffCount} Staff
                      </Typography>
                    </Box>
                  </Box>

                  <Divider sx={{ my: 1.5 }} />

                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <PlaceRoundedIcon
                        sx={{ fontSize: 16, color: "#2563eb" }}
                      />
                      <Typography
                        variant="caption"
                        sx={{ color: "#475569", fontWeight: 600 }}
                      >
                        LAT {store.latitude} · LNG {store.longitude}
                      </Typography>
                    </Box>
                    <Tooltip title="Copy Store ID">
                      <Button
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopy(store._id);
                        }}
                        startIcon={
                          copiedId === store._id ? (
                            <CheckRoundedIcon
                              sx={{ fontSize: 14, color: "#16a34a" }}
                            />
                          ) : (
                            <ContentCopyRoundedIcon sx={{ fontSize: 14 }} />
                          )
                        }
                        sx={{
                          fontSize: "0.72rem",
                          color: "#64748b",
                          fontWeight: 600,
                        }}
                      >
                        {copiedId === store._id ? "Copied" : "Copy ID"}
                      </Button>
                    </Tooltip>
                  </Box>
                </Paper>
              );
            })}
          </Box>

          {/* Selected Store Radar */}
          {selectedStore && (
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 3.5,
                bgcolor: "#ffffff",
                border: "1px solid #e2e8f0",
                boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                display: "flex",
                flexDirection: "column",
                gap: 2,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Box>
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: 800, color: "#0f172a" }}
                  >
                    Geofence: {selectedStore.name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#64748b" }}>
                    100m perimeter around GPS coordinates
                  </Typography>
                </Box>
                <RadarRoundedIcon sx={{ color: "#2563eb" }} />
              </Box>

              <Divider />

              {/* Radar Visualizer */}
              <Box
                sx={{
                  width: "100%",
                  height: 260,
                  borderRadius: 3,
                  bgcolor: "#090d16",
                  border: "1px solid #1e293b",
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                }}
              >
                <Box
                  sx={{
                    position: "absolute",
                    width: 210,
                    height: 210,
                    borderRadius: "50%",
                    border: "1px dashed rgba(255,255,255,0.15)",
                  }}
                />
                <Box
                  sx={{
                    position: "absolute",
                    width: 140,
                    height: 140,
                    borderRadius: "50%",
                    border: "1px solid rgba(59, 130, 246, 0.45)",
                    bgcolor: "rgba(59, 130, 246, 0.06)",
                  }}
                />
                <Box
                  sx={{
                    position: "absolute",
                    width: 80,
                    height: 80,
                    borderRadius: "50%",
                    border: "1px solid rgba(34, 197, 94, 0.65)",
                    bgcolor: "rgba(34, 197, 94, 0.12)",
                  }}
                />
                <Box
                  sx={{
                    width: 14,
                    height: 14,
                    borderRadius: "50%",
                    bgcolor: "#3b82f6",
                    boxShadow: "0 0 14px #3b82f6",
                  }}
                />
                <Box
                  sx={{
                    position: "absolute",
                    bottom: 12,
                    left: 12,
                    display: "flex",
                    gap: 2,
                    fontSize: "0.7rem",
                    color: "#94a3b8",
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        bgcolor: "#22c55e",
                        boxShadow: "0 0 6px #22c55e",
                      }}
                    />
                    <span>&lt;100m Geofence</span>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        bgcolor: "#f59e0b",
                        boxShadow: "0 0 6px #f59e0b",
                      }}
                    />
                    <span>&gt;100m Flagged</span>
                  </Box>
                </Box>
              </Box>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
                {[
                  { label: "Anchor Latitude:", val: selectedStore.latitude },
                  { label: "Anchor Longitude:", val: selectedStore.longitude },
                  {
                    label: "Assigned Workforce:",
                    val: `${users.filter((u) => u.storeId === selectedStore._id).length} Active Staff`,
                  },
                ].map((row) => (
                  <Box
                    key={row.label}
                    sx={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <Typography variant="body2" sx={{ color: "#64748b" }}>
                      {row.label}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 700, color: "#0f172a" }}
                    >
                      {row.val}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Paper>
          )}
        </Box>
      )}

      {/* Register Modal Dialog */}
      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        maxWidth="sm"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 4, p: 1 } } }}
      >
        <DialogTitle sx={{ fontWeight: 800, letterSpacing: "-0.015em" }}>
          Register Workplace Location
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent
            sx={{ display: "flex", flexDirection: "column", gap: 2 }}
          >
            {formError && (
              <Alert severity="error" sx={{ borderRadius: 2 }}>
                {formError}
              </Alert>
            )}
            <Box>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 600,
                  color: "#334155",
                  mb: 0.75,
                  display: "block",
                }}
              >
                Workplace / Branch Name
              </Typography>
              <TextField
                placeholder="e.g. Austin Regional HQ"
                value={name}
                onChange={(e) => setName(e.target.value)}
                fullWidth
                required
                sx={inputFieldSx}
              />
            </Box>
            <Box>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 600,
                  color: "#334155",
                  mb: 0.75,
                  display: "block",
                }}
              >
                Physical Street Address
              </Typography>
              <TextField
                placeholder="e.g. 500 Congress Ave, Austin, TX"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                fullWidth
                required
                sx={inputFieldSx}
              />
            </Box>
            <Box
              sx={{
                display: "flex",
                gap: 2,
                flexDirection: { xs: "column", sm: "row" },
              }}
            >
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 600,
                    color: "#334155",
                    mb: 0.75,
                    display: "block",
                  }}
                >
                  Latitude
                </Typography>
                <TextField
                  placeholder="e.g. 30.2672"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  fullWidth
                  required
                  sx={inputFieldSx}
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 600,
                    color: "#334155",
                    mb: 0.75,
                    display: "block",
                  }}
                >
                  Longitude
                </Typography>
                <TextField
                  placeholder="e.g. -97.7431"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  fullWidth
                  required
                  sx={inputFieldSx}
                />
              </Box>
            </Box>
            <Button
              variant="outlined"
              size="small"
              onClick={handleDetectGPS}
              disabled={detectingGps}
              startIcon={<MyLocationRoundedIcon />}
              sx={{ alignSelf: "flex-start", borderRadius: 2 }}
            >
              {detectingGps ? "Reading GPS..." : "Use Current GPS"}
            </Button>
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setModalOpen(false)} color="inherit">
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={formSubmitting}>
              {formSubmitting ? "Saving..." : "Save Location"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};
