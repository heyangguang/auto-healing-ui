import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import GuideDrawer from './GuideDrawer';

jest.mock('@umijs/max', () => ({
  history: { push: jest.fn() },
  useAccess: jest.fn(() => ({})),
}));

const articleA = {
  id: 'quick-a',
  title: '指南 A',
  desc: '说明 A',
  icon: React.createElement('span', null, 'A'),
  category: 'quick',
  markdownFile: '/guides/a.md',
  steps: [
    { title: '步骤 1', desc: 'desc 1', path: '/a/1' },
    { title: '步骤 2', desc: 'desc 2', path: '/a/2' },
  ],
} as any;

const articleB = {
  id: 'quick-b',
  title: '指南 B',
  desc: '说明 B',
  icon: React.createElement('span', null, 'B'),
  category: 'quick',
  markdownFile: '/guides/b.md',
  steps: [{ title: '唯一步骤', desc: 'desc', path: '/b/1' }],
} as any;

describe('GuideDrawer', () => {
  it('resets the current step when switching to another guide article', () => {
    const { rerender } = render(
      React.createElement(GuideDrawer, {
        article: articleA,
        onClose: jest.fn(),
        open: true,
      }),
    );

    fireEvent.click(screen.getByRole('button', { name: /下一步/ }));
    expect(screen.getByText('步骤 2 / 2')).toBeTruthy();

    rerender(
      React.createElement(GuideDrawer, {
        article: articleB,
        onClose: jest.fn(),
        open: true,
      }),
    );

    expect(screen.getByText('步骤 1 / 1')).toBeTruthy();
    expect(screen.getAllByText('唯一步骤')).toHaveLength(2);
  });
});
