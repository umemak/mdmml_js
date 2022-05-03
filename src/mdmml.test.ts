import { atoi } from "./mdmml";

test('number', function () {
    expect(atoi("1", 2)).toBe(1);
});

test('not number', function () {
    expect(atoi("a", 2)).toBe(2);
});
