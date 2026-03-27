import React from 'react';
import { render, screen } from '@testing-library/react';
import ResizableTitle from './ResizableTitle';

describe('ResizableTitle', () => {
  it('renders a plain header cell when resize is disabled', () => {
    render(
      <table>
        <thead>
          <tr>
            <ResizableTitle>名称</ResizableTitle>
          </tr>
        </thead>
      </table>,
    );

    expect(screen.getByText('名称')).toBeTruthy();
  });
});
