import { describe, it, expect } from 'vitest';
import React from 'react';
import { render } from '@testing-library/react';
import { useApi } from '../../context/ApiContext';

function Consumer(): null {
  useApi();
  return null;
}

describe('useApi', () => {
  it('throws when used outside ApiProvider', () => {
    expect(() => {
      render(<Consumer />);
    }).toThrow('useApi must be used within an ApiProvider');
  });
});
