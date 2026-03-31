import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { UserContextProvider, useUserContext } from '../context/UserContext';

const TestConsumer: React.FC = () => {
  const ctx = useUserContext();
  return <div>{ctx.role}</div>;
};

describe('UserContext', () => {
  it('provides context values to children', () => {
    render(
      <UserContextProvider context={{ userId: '1', role: 'IC', teamId: 't1' }}>
        <TestConsumer />
      </UserContextProvider>
    );
    expect(screen.getByText('IC')).toBeDefined();
  });

  it('throws when used outside provider', () => {
    expect(() => render(<TestConsumer />)).toThrow(
      'useUserContext must be used within a UserContextProvider'
    );
  });
});
