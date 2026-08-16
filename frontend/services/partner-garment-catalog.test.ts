import { AxiosError } from 'axios';

import { api } from '@/lib/api';
import {
  GARMENT_CATALOG_DEFAULT_PAGE_SIZE,
  downloadGarmentTemplate,
} from '@/services/partner-garment-catalog';

jest.mock('@/lib/api', () => ({
  api: {
    get: jest.fn(),
  },
}));

const mockedGet = api.get as jest.Mock;

function mockJsonBlob(payload: object): Blob {
  const json = JSON.stringify(payload);
  return {
    type: 'application/json',
    arrayBuffer: () => Promise.resolve(new TextEncoder().encode(json).buffer),
    text: () => Promise.resolve(json),
  } as unknown as Blob;
}

describe('partner-garment-catalog helpers', () => {
  beforeEach(() => {
    mockedGet.mockReset();
    URL.createObjectURL = jest.fn(() => 'blob:mock');
    URL.revokeObjectURL = jest.fn();
  });

  it('downloadGarmentTemplate saves xlsx blob with content-disposition filename', async () => {
    let capturedAnchor: HTMLAnchorElement | null = null;
    const originalCreateElement = document.createElement.bind(document);
    jest.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      const el = originalCreateElement(tagName);
      if (tagName === 'a') capturedAnchor = el as HTMLAnchorElement;
      return el;
    });

    const blob = new Blob(['xlsx-bytes'], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    mockedGet.mockResolvedValue({
      data: blob,
      headers: {
        'content-type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'content-disposition': 'attachment; filename="garment-catalog-template.xlsx"',
      },
    });

    await downloadGarmentTemplate();

    expect(mockedGet).toHaveBeenCalledWith('/partner/garment-catalog/template', {
      responseType: 'blob',
    });
    const anchor = capturedAnchor as HTMLAnchorElement | null;
    expect(anchor?.download).toBe('garment-catalog-template.xlsx');
    expect(anchor?.href).toBe('blob:mock');
  });

  it('uses pagination standard default page size 10', () => {
    expect(GARMENT_CATALOG_DEFAULT_PAGE_SIZE).toBe(10);
  });

  it('downloadGarmentTemplate throws parsed JSON error from blob response', async () => {
    const blob = mockJsonBlob({ error: { message: 'Partner laundry not found' } });
    mockedGet.mockResolvedValue({
      data: blob,
      headers: { 'content-type': 'application/json' },
    });

    await expect(downloadGarmentTemplate()).rejects.toThrow('Partner laundry not found');
  });

  it('downloadGarmentTemplate throws parsed JSON error from axios blob rejection', async () => {
    const blob = mockJsonBlob({ error: { message: 'Unauthorized' } });
    mockedGet.mockRejectedValue(
      new AxiosError('Request failed', 'ERR_BAD_REQUEST', undefined, undefined, {
        data: blob,
        status: 401,
        statusText: 'Unauthorized',
        headers: {},
        config: {} as never,
      }),
    );

    await expect(downloadGarmentTemplate()).rejects.toThrow('Unauthorized');
  });
});
