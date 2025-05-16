import React, { useState } from 'react';
import {
  Box, FormControl, InputLabel, Select, MenuItem, Checkbox, Chip,
  IconButton, Popover, ToggleButtonGroup, ToggleButton, TextField, Stack, Typography
} from '@mui/material';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import TuneIcon from '@mui/icons-material/Tune';
import { MetricSelection } from './clustering';

const OBJECTIVE_ICONS: Record<0 | 1, React.ReactNode> = {
  0: <ArrowDropDownIcon fontSize="small" titleAccess="Minimize" />,
  1: <ArrowDropUpIcon fontSize="small" titleAccess="Maximize" />,
};

// PROPS: metrics = array of available metric ids (strings)
// selectedMetrics = value array
// setSelectedMetrics = handler
export function MetricMultiSelect({
  metrics,
  selectedMetrics,
  setSelectedMetrics,
}: {
  metrics: string[];
  selectedMetrics: MetricSelection[];
  setSelectedMetrics: (s: MetricSelection[]) => void
}) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [editMetricId, setEditMetricId] = useState<string | null>(null);
  const editingMetric = selectedMetrics.find(m => m.id === editMetricId);

  const handleChipEdit = (metricId: string, ev: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(ev.currentTarget);
    setEditMetricId(metricId);
    ev.stopPropagation();
  };

  // Called on Chip's delete (X) click
  const handleChipDelete = (metricId: string) => {
    setSelectedMetrics(selectedMetrics.filter(sel => sel.id !== metricId));
  };

  // Called when metric selected/deselected in dropdown
  const handleSelectChange = (e: any) => {
    const newIds = e.target.value as string[];
    // Sync up selectedMetrics with newIds (add default for new ones)
    let next: MetricSelection[] = [];
    newIds.forEach((id, idx) => {
      const prev = selectedMetrics.find(s => s.id === id);
      next.push(
        prev ?? { id, objective: 0, priority: idx + 1 }
      );
    });
    setSelectedMetrics(next);
  };

  // ---- Popover handlers
  const handlePopoverClose = () => {
    setAnchorEl(null);
    setEditMetricId(null);
  };
  const handleObjectiveChange = (_: any, value: 0 | 1 | null) => {
    if (editMetricId && value !== null) {
      setSelectedMetrics(selectedMetrics.map(m =>
        m.id === editMetricId ? { ...m, objective: value } : m
      ));
    }
  };
  const handlePriorityChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
    if (editMetricId) {
      let newPriority = Number(ev.target.value);
      newPriority = !newPriority || newPriority < 1 ? 1 : newPriority;
      setSelectedMetrics(selectedMetrics.map(m =>
        m.id === editMetricId ? { ...m, priority: newPriority } : m
      ));
    }
  };

  return (
    <>
      <FormControl sx={{ minWidth: 260 }}>
        <InputLabel>Select Metrics for Ranking</InputLabel>
        <Select
          multiple
          value={selectedMetrics.map(m => m.id)}
          label="Select Metrics for Ranking"
          onChange={handleSelectChange}
          renderValue={selected =>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {(selected as string[]).map(id => {
                const metric = selectedMetrics.find(m => m.id === id)!;
                return (
                  <Chip
                    key={id}
                    label={
                      <span>
                        {metric.id}&nbsp;
                        {OBJECTIVE_ICONS[metric.objective]}
                        <sup style={{ marginLeft: 2, fontSize: '0.8em' }}>#
                          {metric.priority}
                        </sup>
                        <IconButton
                          aria-label="Edit"
                          size="small"
                          color="default"
                          onClick={e => handleChipEdit(metric.id, e)}
                          style={{ marginLeft: 2, padding: 2 }}
                        >
                          <TuneIcon fontSize="inherit" />
                        </IconButton>
                      </span>
                    }
                    size="small"
                    onDelete={() => handleChipDelete(id)}
                  />
                );
              })}
            </Box>
          }
        >
          {metrics.map(m => (
            <MenuItem key={m} value={m}>
              <Checkbox checked={!!selectedMetrics.find(sel => sel.id === m)} />
              {m}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <Popover
        open={!!editingMetric}
        onClose={handlePopoverClose}
        anchorEl={anchorEl}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {editingMetric && (
          <Box sx={{ p: 2, minWidth: 180 }}>
            <Typography fontWeight="bold" mb={1}>{editingMetric.id}</Typography>
            <Stack direction="row" alignItems="center" spacing={1} mb={1}>
              <span>Objective:</span>
              <ToggleButtonGroup
                exclusive
                value={editingMetric.objective}
                size="small"
                onChange={(_, v) => { if (v != null) handleObjectiveChange(_, v as 0 | 1); }}
                sx={{ borderRadius: 1 }}
              >
                <ToggleButton value={1}><ArrowDropDownIcon fontSize="small" />Minimize</ToggleButton>
                <ToggleButton value={-1}><ArrowDropUpIcon fontSize="small" />Maximize</ToggleButton>
              </ToggleButtonGroup>
            </Stack>
            <Stack direction="row" alignItems="center" spacing={1}>
              <span>Priority:</span>
              <TextField
                size="small"
                type="number"
                inputProps={{ min: 1, style: { width: 50 } }}
                value={editingMetric.priority}
                onChange={handlePriorityChange}
              />
            </Stack>
          </Box>
        )}
      </Popover>
    </>
  );
}