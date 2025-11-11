import apiService from '../api';

// Simple fetch mock
const originalFetch = global.fetch;

describe('apiService', () => {
  beforeAll(() => {
    global.fetch = jest.fn();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  test('markOrderShipped calls correct endpoint', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Order marked as shipped' })
    });

    const res = await apiService.markOrderShipped(123, { tracking_number: 'T123' });
    expect(res.message).toBe('Order marked as shipped');
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/supplier/orders/123/ship'), expect.any(Object));
  });

  test('markOrderDelivered calls correct endpoint', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Order marked as delivered' })
    });

    const res = await apiService.markOrderDelivered(123, {});
    expect(res.message).toBe('Order marked as delivered');
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/supplier/orders/123/deliver'), expect.any(Object));
  });
});
