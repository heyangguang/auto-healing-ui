import dayjs, { type Dayjs } from 'dayjs';

type DateLike = string | number | Date | Dayjs;

export function toDayRangeStartISO(value: DateLike) {
    return dayjs(value).startOf('day').toISOString();
}

export function toDayRangeEndISO(value: DateLike) {
    return dayjs(value).endOf('day').toISOString();
}

export function toInclusiveDateRangeISO(range?: [DateLike, DateLike] | DateLike[]) {
    if (!Array.isArray(range) || range.length !== 2) return {};
    const [from, to] = range;
    return {
        ...(from ? { from: toDayRangeStartISO(from) } : {}),
        ...(to ? { to: toDayRangeEndISO(to) } : {}),
    };
}
