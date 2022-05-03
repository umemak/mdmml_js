import { atoi } from "./mdmml";

test('atoi: number', function () {
    expect(atoi("1", 2)).toBe(1);
});

test('atoi: not number', function () {
    expect(atoi("a", 2)).toBe(2);
});
