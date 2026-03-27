import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import dayjs from 'dayjs';
import WorkbenchScheduleCard from './WorkbenchScheduleCard';

const styles = {
  card: 'card',
  cardBody: 'cardBody',
  cardHeader: 'cardHeader',
  cardLink: 'cardLink',
  cardTitle: 'cardTitle',
  cardTitleIcon: 'cardTitleIcon',
  calendarWrap: 'calendarWrap',
  scheduleTaskItem: 'scheduleTaskItem',
  scheduleTaskName: 'scheduleTaskName',
  scheduleTaskTime: 'scheduleTaskTime',
};

describe('WorkbenchScheduleCard', () => {
  it('provides explicit month navigation controls in a controlled calendar header', () => {
    const onMonthChange = jest.fn();
    const Wrapper = () => {
      const [calendarMonth, setCalendarMonth] = React.useState(dayjs('2026-03-01'));
      return (
        <WorkbenchScheduleCard
          accessDisabled={false}
          calendarMonth={calendarMonth}
          mergeScheduleTasks={() => []}
          onMonthChange={(date) => {
            setCalendarMonth(date);
            onMonthChange(date);
          }}
          onOpenSchedules={jest.fn()}
          onSelectDate={jest.fn()}
          scheduleData={{}}
          selectedDate="2026-03-01"
          styles={styles}
        />
      );
    };

    render(<Wrapper />);

    expect(screen.getByText('2026年 3月')).toBeTruthy();

    fireEvent.click(screen.getByLabelText('上个月'));
    expect(screen.getByText('2026年 2月')).toBeTruthy();
    fireEvent.click(screen.getByLabelText('下个月'));
    expect(screen.getByText('2026年 3月')).toBeTruthy();

    expect(onMonthChange).toHaveBeenNthCalledWith(1, dayjs('2026-02-01'));
    expect(onMonthChange).toHaveBeenNthCalledWith(2, dayjs('2026-03-01'));
  });

  it('keeps the selected calendar cell in sync with the selected date', () => {
    const { container, rerender } = render(
      <WorkbenchScheduleCard
        accessDisabled={false}
        calendarMonth={dayjs('2026-03-01')}
        mergeScheduleTasks={() => []}
        onMonthChange={jest.fn()}
        onOpenSchedules={jest.fn()}
        onSelectDate={jest.fn()}
        scheduleData={{}}
        selectedDate="2026-03-01"
        styles={styles}
      />,
    );

    expect(container.querySelector('.ant-picker-cell-selected .ant-picker-calendar-date-value')?.textContent).toBe('01');

    rerender(
      <WorkbenchScheduleCard
        accessDisabled={false}
        calendarMonth={dayjs('2026-03-01')}
        mergeScheduleTasks={() => []}
        onMonthChange={jest.fn()}
        onOpenSchedules={jest.fn()}
        onSelectDate={jest.fn()}
        scheduleData={{}}
        selectedDate="2026-03-15"
        styles={styles}
      />,
    );

    expect(container.querySelector('.ant-picker-cell-selected .ant-picker-calendar-date-value')?.textContent).toBe('15');
  });
});
