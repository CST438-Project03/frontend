import React from 'react';
import { MantineProvider } from '@mantine/core';
import { Slot } from 'expo-router';

export default function RootLayout() {
  return (
    <MantineProvider
      theme={{
        colorScheme: 'dark', // Use dark mode
      }}
    >
      <Slot />
    </MantineProvider>
  );
}
