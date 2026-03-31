package com.wct.plan;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertEquals;

class WeekDateUtilTest {

    @Test
    void mondayReturnsSameDay() {
        LocalDate monday = LocalDate.of(2026, 3, 30); // Monday
        assertEquals(monday, WeekDateUtil.toMonday(monday));
    }

    @Test
    void wednesdayReturnsMonday() {
        LocalDate wednesday = LocalDate.of(2026, 4, 1); // Wednesday
        LocalDate expected = LocalDate.of(2026, 3, 30); // Monday
        assertEquals(expected, WeekDateUtil.toMonday(wednesday));
    }

    @Test
    void sundayReturnsPreviousMonday() {
        LocalDate sunday = LocalDate.of(2026, 4, 5); // Sunday
        LocalDate expected = LocalDate.of(2026, 3, 30); // Monday
        assertEquals(expected, WeekDateUtil.toMonday(sunday));
    }

    @Test
    void saturdayReturnsPreviousMonday() {
        LocalDate saturday = LocalDate.of(2026, 4, 4); // Saturday
        LocalDate expected = LocalDate.of(2026, 3, 30); // Monday
        assertEquals(expected, WeekDateUtil.toMonday(saturday));
    }

    @Test
    void fridayReturnsPreviousMonday() {
        LocalDate friday = LocalDate.of(2026, 4, 3); // Friday
        LocalDate expected = LocalDate.of(2026, 3, 30); // Monday
        assertEquals(expected, WeekDateUtil.toMonday(friday));
    }

    @Test
    void tuesdayReturnsMonday() {
        LocalDate tuesday = LocalDate.of(2026, 3, 31); // Tuesday
        LocalDate expected = LocalDate.of(2026, 3, 30); // Monday
        assertEquals(expected, WeekDateUtil.toMonday(tuesday));
    }
}
