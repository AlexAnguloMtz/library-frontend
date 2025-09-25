import React, { useState } from 'react';
import { IconButton, Tooltip } from '@mui/material';
import { ContentCopy } from '@mui/icons-material';

interface CopyToClipboardProps {
  text: string;
  size?: 'small' | 'medium' | 'large';
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
        size={size} 
        onClick={handleCopy}
        sx={sx}
      >
        <ContentCopy fontSize={size} />
      </IconButton>
    </Tooltip>
  );
};
