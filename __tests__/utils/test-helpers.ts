/**
 * Test Helpers
 * 
 * Utility functions for testing ONCA financial operations.
 */

export const mockSupabaseClient = () => ({
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
});

export const mockAuthSession = (userId: string = 'test_user_1', orgId: string = 'test_org_1') => ({
    user: {
        id: userId,
        email: 'test@example.com',
    },
    org_id: orgId,
});

export const expectValidationError = (fn: () => any, expectedMessage?: string) => {
    expect(fn).toThrow();
    if (expectedMessage) {
        expect(fn).toThrow(expectedMessage);
    }
};

export const roundToTwoDecimals = (num: number): number => {
    return Math.round(num * 100) / 100;
};
