import { renderHook, act } from '@testing-library/react';
import { useToast, ToastAction } from './use-toast';

describe('useToast', () => {
  it('should return an empty list of toasts initially', () => {
    const { result } = renderHook(() => useToast());
    expect(result.current.toasts).toEqual([]);
  });

  it('should add a toast when toast() is called', () => {
    const { result } = renderHook(() => useToast());
    act(() => {
      result.current.toast({ title: 'Test Toast' });
    });
    expect(result.current.toasts.length).toBe(1);
    expect(result.current.toasts[0].title).toBe('Test Toast');
  });

  it('should add a toast with optional values when toast() is called', () => {
    const { result } = renderHook(() => useToast());
    act(() => {
      result.current.toast({ title: 'Test Toast', description: 'Test Description', action:{altText: 'Test Alt Text', onClick: ()=>{}} });
    });
    expect(result.current.toasts.length).toBe(1);
    expect(result.current.toasts[0].title).toBe('Test Toast');
    expect(result.current.toasts[0].description).toBe('Test Description');
    expect(result.current.toasts[0].action?.altText).toBe('Test Alt Text');
  });

  it('should update a toast when update() is called', () => {
    const { result } = renderHook(() => useToast());
    act(() => {
      result.current.toast({ title: 'Test Toast', id: 'test-id' });
    });
    act(() => {
      result.current.update('test-id', { description: 'Updated Description' });
    });
    expect(result.current.toasts.length).toBe(1);
    expect(result.current.toasts[0].description).toBe('Updated Description');
  });
  it('should dismiss a toast when dismiss() is called with an ID', () => {
    const { result } = renderHook(() => useToast());
    act(() => {
      result.current.toast({ title: 'Test Toast', id: 'test-id' });
    });
    act(() => {
      result.current.dismiss('test-id');
    });
    expect(result.current.toasts.length).toBe(0);
  });

  it('should dismiss all toasts when dismiss() is called with no ID', () => {
    const { result } = renderHook(() => useToast());
    act(() => {
      result.current.toast({ title: 'Test Toast 1', id: 'test-id-1' });
      result.current.toast({ title: 'Test Toast 2', id: 'test-id-2' });
    });
    act(() => {
      result.current.dismiss();
    });
    expect(result.current.toasts.length).toBe(0);
  });
});