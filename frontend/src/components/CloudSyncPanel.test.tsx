import { beforeEach, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CloudSyncPanel from './CloudSyncPanel';
beforeEach(() => localStorage.clear());
it('shows an unlinked state without claiming an active sync', () => {
  render(<MemoryRouter><CloudSyncPanel /></MemoryRouter>);
  expect(screen.getByText('غير مرتبط')).toBeTruthy();
  expect(screen.queryByText('نشطة تلقائياً')).toBeNull();
  expect(screen.queryByText('آخر مزامنة ناجحة')).toBeNull();
});
it('rejects a server secret and only enables login after saving a public project key', () => {
  render(<MemoryRouter><CloudSyncPanel /></MemoryRouter>);
  fireEvent.change(screen.getByLabelText('عنوان مشروع Supabase'), { target: { value: 'https://example.supabase.co' } });
  fireEvent.change(screen.getByLabelText('Publishable key'), { target: { value: 'sb_secret_do_not_publish' } });
  fireEvent.click(screen.getByRole('button', { name: 'حفظ إعداد المشروع' }));
  expect(screen.getByRole('alert').textContent).toContain('المفتاح السري');
  expect(localStorage.getItem('masar-cloud-config')).toBeNull();
  fireEvent.change(screen.getByLabelText('Publishable key'), { target: { value: 'sb_publishable_public_test_value' } });
  fireEvent.click(screen.getByRole('button', { name: 'حفظ إعداد المشروع' }));
  expect(screen.getByRole('button', { name: 'تسجيل الدخول' })).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'ابدأ ببيانات هذا الجهاز' })).toBeNull();
});
