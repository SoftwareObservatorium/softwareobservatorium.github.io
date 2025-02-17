import React, { useEffect } from 'react';
import ColorModeToggle from '@theme-original/ColorModeToggle';
import type ColorModeToggleType from '@theme/ColorModeToggle';
import type {WrapperProps} from '@docusaurus/types';
import { useColorScheme } from '@mui/material/styles';

type Props = WrapperProps<typeof ColorModeToggleType>;

export default function ColorModeToggleWrapper(props: Props): JSX.Element {
  // MUI color mode setting
  const { setMode } = useColorScheme();

  // "value" holds the color theme. Either "light" or "dark"
  const { value } = props;

  // change mode based on "value" prop
  // "dark" or "light" are also used for MUI
  useEffect(() => {
    setMode(value);
  }, [value]);

  return (
    <>
      <ColorModeToggle {...props} />
    </>
  );
}
