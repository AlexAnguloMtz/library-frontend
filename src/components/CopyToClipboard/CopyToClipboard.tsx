import React, { useState } from 'react';
import { IconButton, Tooltip } from '@mui/material';
import { ContentCopy } from '@mui/icons-material';

interface CopyToClipboardProps {
  text: string;
  size?: 'small' | 'medium' | 'large' | 'tiny';
  sx?: object;
}

export const CopyToClipboard: React.FC<CopyToClipboardProps> = ({ 
  text, 
  size = 'small', 
  sx = {} 
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); 
    } catch (error) {
      console.error('Failed to copy text: ', error);
    }
  };

  return (
    <Tooltip 
      title={copied ? "Copiado al portapapeles" : "Copiar al portapapeles"}
      arrow
      open={copied}
      disableHoverListener
      disableFocusListener
      disableTouchListener
    >
      <IconButton 
        size={size === 'tiny' ? 'small' : size} 
        onClick={handleCopy}
        sx={{
          ...sx,
          ...(size === 'tiny' && {
            width: 16,
            height: 16,
            minWidth: 16,
            padding: 0
          })
        }}
      >
        <ContentCopy fontSize={size === 'tiny' ? 'inherit' : size} sx={size === 'tiny' ? { fontSize: 12 } : {}} />
      </IconButton>
    </Tooltip>
  );
};
