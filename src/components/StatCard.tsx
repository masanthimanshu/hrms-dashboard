/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Paper, Box, Typography } from '@mui/material';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    text: string;
    isPositive?: boolean;
  };
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  onClick,
}) => {
  return (
    <Paper
      elevation={1}
      onClick={onClick}
      sx={{
        p: 2.5,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.15s ease, border-color 0.15s ease',
        '&:hover': onClick
          ? {
              transform: 'translateY(-2px)',
              borderColor: '#cbd5e1',
            }
          : undefined,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.5 }}>
        <Typography
          variant="caption"
          sx={{
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            color: '#64748b',
            fontSize: '0.75rem',
          }}
        >
          {title}
        </Typography>
        {icon && (
          <Box
            sx={{
              p: 1,
              borderRadius: 1.5,
              bgcolor: '#f1f5f9',
              color: '#334155',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {icon}
          </Box>
        )}
      </Box>

      <Box>
        <Typography
          variant="h4"
          className="tabular-nums font-mono-numbers"
          sx={{
            fontWeight: 700,
            color: '#0f172a',
            fontSize: { xs: '1.75rem', sm: '2rem' },
            lineHeight: 1.1,
            mb: 0.5,
          }}
        >
          {value}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          {trend && (
            <Typography
              variant="caption"
              className="tabular-nums"
              sx={{
                fontWeight: 600,
                color: trend.isPositive ? '#16a34a' : '#d97706',
                fontSize: '0.78rem',
              }}
            >
              {trend.text}
            </Typography>
          )}
          {trend && subtitle && (
            <Typography variant="caption" sx={{ color: '#cbd5e1' }} aria-hidden="true">
              ·
            </Typography>
          )}
          {subtitle && (
            <Typography
              variant="caption"
              sx={{
                color: '#64748b',
                fontSize: '0.78rem',
              }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>
      </Box>
    </Paper>
  );
};
